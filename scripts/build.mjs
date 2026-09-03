#!/usr/bin/env node
// 选择性构建脚本：
//   1. 交互菜单 / 关键字筛选要构建的包（组件或页面）
//   2. 基于 workspace 依赖图分析影响面：
//      - 构建页面时，自动带上它依赖的组件（保证 dist 最新）
//      - 构建组件时，反查依赖它的页面/组件，提示是否连带构建
//
// 用法：
//   node scripts/build.mjs                交互式菜单选择
//   node scripts/build.mjs button         按关键字预选（包名或目录名模糊匹配）
//   node scripts/build.mjs button -y      预选并自动连带下游受影响包，无需确认
//   node scripts/build.mjs button --no-downstream   只构建所选，不连带下游
import { createInterface } from 'node:readline'
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const argv = process.argv.slice(2)
const keywords = argv.filter((a) => !a.startsWith('-'))
const autoYes = argv.includes('-y') || argv.includes('--yes')
const noDownstream = argv.includes('--no-downstream')

if (argv.includes('-h') || argv.includes('--help')) {
  console.log(`用法:
  pnpm build:select                  交互式菜单选择构建范围
  pnpm build:select <关键字...>       按包名/目录名模糊预选，如 pnpm build:select button
  pnpm build:select <关键字> -y       预选并自动连带构建受影响的下游包
  pnpm build:select <关键字> --no-downstream   只构建所选，不连带下游`)
  process.exit(0)
}

// ---------- 发现 workspace 包 ----------
function loadPackages() {
  const wsText = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')
  // 解析 "- 'pages/*'" 形式的 glob（仅支持 group/* 一层）
  const globs = [
    ...wsText.matchAll(/^\s*-\s*['"]?([^'"\n#]+?)['"]?\s*$/gm),
  ].map((m) => m[1])

  const pkgs = []
  for (const glob of globs) {
    const [group] = glob.split('/')
    const groupDir = join(root, group)
    if (!existsSync(groupDir)) continue
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const dir = join(groupDir, entry.name)
      const pkgJsonPath = join(dir, 'package.json')
      if (!existsSync(pkgJsonPath)) continue
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
      pkgs.push({
        name: pkg.name,
        dir,
        category: group,
        label: relative(root, dir),
        hasBuild: Boolean(pkg.scripts?.build),
        depNames: Object.keys(pkg.dependencies || {}),
      })
    }
  }
  return pkgs.filter((p) => p.hasBuild)
}

const packages = loadPackages()
const byName = new Map(packages.map((p) => [p.name, p]))

// ---------- 依赖图 ----------
/** 该包依赖的 workspace 包（直接） */
function workspaceDeps(pkg) {
  return pkg.depNames.filter((d) => byName.has(d))
}

/** 传递闭包：该包（构建前）需要先构建的 workspace 依赖 */
function closureDeps(pkg) {
  const result = new Set()
  const walk = (p) => {
    for (const depName of workspaceDeps(p)) {
      if (!result.has(depName)) {
        result.add(depName)
        walk(byName.get(depName))
      }
    }
  }
  walk(pkg)
  return result
}

/** 传递闭包：workspace 中依赖该包的所有下游包（受影响面） */
function closureDependents(name) {
  const result = new Set()
  const walk = (n) => {
    for (const p of packages) {
      if (p.depNames.includes(n) && !result.has(p.name)) {
        result.add(p.name)
        walk(p.name)
      }
    }
  }
  walk(name)
  return result
}

/** 拓扑排序：被依赖者在前（组件先于页面） */
function topoSort(names) {
  const set = new Set(names)
  const sorted = []
  const visited = new Set()
  const visit = (name) => {
    if (visited.has(name)) return
    visited.add(name)
    for (const dep of workspaceDeps(byName.get(name))) {
      if (set.has(dep)) visit(dep)
    }
    sorted.push(name)
  }
  for (const name of set) visit(name)
  return sorted
}

// ---------- 交互 ----------
// 用行队列封装 readline：管道输入（如 printf '4\n1\n' | node ...）时，
// 多个 line 事件可能在 question 注册前就到达，直接 rl.question 会丢行。
const rl = createInterface({ input: process.stdin, output: process.stdout })
const lineQueue = []
const waiters = []
rl.on('line', (line) => {
  const value = line.trim()
  if (waiters.length) waiters.shift()(value)
  else lineQueue.push(value)
})
rl.on('close', () => {
  while (waiters.length) waiters.shift()('')
})
const ask = (q) =>
  new Promise((res) => {
    process.stdout.write(q)
    if (lineQueue.length) res(lineQueue.shift())
    else waiters.push(res)
  })

function listPackages() {
  const groups = ['components', 'pages']
  let i = 0
  const numbered = []
  for (const group of groups) {
    const list = packages.filter((p) => p.category === group)
    if (!list.length) continue
    console.log(`\n${group}/`)
    for (const p of list) {
      i += 1
      numbered.push({ index: i, pkg: p })
      console.log(`  ${i}) ${p.name.padEnd(22)} ${p.label}`)
    }
  }
  return numbered
}

async function chooseTargets() {
  if (keywords.length) {
    const matched = packages.filter(
      (p) =>
        keywords.some((k) => p.name.includes(k)) ||
        keywords.some((k) => p.label.includes(k)),
    )
    if (!matched.length) {
      console.error(`✗ 没有匹配 "${keywords.join(' ')}" 的包`)
      process.exit(1)
    }
    return matched
  }

  console.log('请选择构建范围：')
  console.log('  1) 全部构建')
  console.log('  2) 仅 components（全部组件）')
  console.log('  3) 仅 pages（全部页面）')
  console.log('  4) 手动选择包')
  const scope = await ask('> ')

  if (scope === '1') return packages
  if (scope === '2') return packages.filter((p) => p.category === 'components')
  if (scope === '3') return packages.filter((p) => p.category === 'pages')
  if (scope === '4') {
    const numbered = listPackages()
    const raw = await ask('\n输入序号（逗号分隔，如 1,3），回车取消：')
    const picks = raw
      .split(/[,，\s]+/)
      .filter(Boolean)
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n))
    const chosen = picks
      .map((n) => numbered.find((item) => item.index === n)?.pkg)
      .filter(Boolean)
    if (!chosen.length) {
      console.log('未选择任何包，退出。')
      process.exit(0)
    }
    return chosen
  }
  console.log('无效选择，退出。')
  process.exit(1)
}

// ---------- 主流程 ----------
const targets = await chooseTargets()

// 1) 页面依赖的组件：必须先构建，自动加入计划
const plan = new Map() // name -> reason
for (const p of targets) plan.set(p.name, '所选包')
for (const p of targets) {
  for (const depName of closureDeps(p)) {
    if (!plan.has(depName)) plan.set(depName, `被 ${p.name} 依赖，需先构建`)
  }
}

// 2) 组件变动的下游影响：反查依赖者，询问是否连带
const downstream = new Set()
for (const p of targets) {
  for (const d of closureDependents(p.name)) downstream.add(d)
}
for (const name of plan.keys()) downstream.delete(name)

if (downstream.size && !noDownstream) {
  console.log('\n⚠ 依赖影响分析：')
  for (const name of downstream) {
    console.log(`  · ${name} 依赖了所选组件，可能受影响`)
  }
  const include = autoYes
    ? 'Y'
    : await ask('\n是否连带构建以上受影响的包？(Y=是 / n=否)：')
  if (autoYes || ['', 'y', 'Y'].includes(include)) {
    for (const name of downstream) {
      if (!plan.has(name)) plan.set(name, '下游受影响包')
    }
  }
}
rl.close()

const ordered = topoSort([...plan.keys()])

console.log('\n构建计划（按依赖顺序）：')
for (const name of ordered) {
  const p = byName.get(name)
  console.log(`  ▸ ${name.padEnd(22)} [${p.category}]  (${plan.get(name)})`)
}

// 注意：--filter 必须放在 run 之前，否则会被透传给各包的构建脚本
const result = spawnSync(
  'pnpm',
  ['-r', ...ordered.flatMap((n) => ['--filter', n]), 'run', 'build'],
  { stdio: 'inherit', cwd: root },
)
process.exit(result.status ?? 1)
