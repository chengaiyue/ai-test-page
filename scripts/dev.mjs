#!/usr/bin/env node
// 交互式选择一个页面并启动 Vite dev server（自动打开浏览器）。
//
// 用法：
//   pnpm dev:page                       交互菜单选择页面
//   pnpm dev:page upload                按关键字（包名/目录名）直接启动
//   pnpm dev:page upload --skip-build   跳过启动前的组件构建（dist 已存在时更快）
//   pnpm dev:page upload --no-open      启动但不自动打开浏览器
import { spawn, spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const argv = process.argv.slice(2)
const keywords = argv.filter((a) => !a.startsWith('-'))
const skipBuild = argv.includes('--skip-build')
const noOpen = argv.includes('--no-open')

if (argv.includes('-h') || argv.includes('--help')) {
  console.log(`用法:
  pnpm dev:page                  交互菜单选择要启动的页面
  pnpm dev:page <关键字>          按包名/目录名直接启动，如 pnpm dev:page upload
  pnpm dev:page <关键字> --skip-build   跳过启动前的组件构建
  pnpm dev:page <关键字> --no-open      不自动打开浏览器`)
  process.exit(0)
}

// ---------- 发现 pages/* 下可启动的页面 ----------
function loadPages() {
  const pagesDir = join(root, 'pages')
  const pages = []
  for (const entry of readdirSync(pagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const pkgPath = join(pagesDir, entry.name, 'package.json')
    if (!existsSync(pkgPath)) continue
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    if (pkg.scripts?.dev) {
      pages.push({ name: pkg.name, label: `pages/${entry.name}` })
    }
  }
  return pages
}

const pages = loadPages()
if (!pages.length) {
  console.error('✗ pages/ 下没有可启动的页面')
  process.exit(1)
}

// ---------- 交互（行队列，兼容管道输入） ----------
const rl = createInterface({ input: process.stdin, output: process.stdout })
const lineQueue = []
const waiters = []
rl.on('line', (line) => {
  const v = line.trim()
  if (waiters.length) waiters.shift()(v)
  else lineQueue.push(v)
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

let page
if (keywords.length) {
  page = pages.find(
    (p) =>
      keywords.some((k) => p.name.includes(k)) ||
      keywords.some((k) => p.label.includes(k)),
  )
  if (!page) {
    console.error(`✗ 没有匹配 "${keywords.join(' ')}" 的页面，可选：${pages.map((p) => p.label).join(', ')}`)
    process.exit(1)
  }
} else {
  console.log('请选择要启动的页面：')
  pages.forEach((p, i) => console.log(`  ${i + 1}) ${p.name.padEnd(22)} ${p.label}`))
  const raw = await ask('> ')
  page = pages[Number(raw) - 1]
  if (!page) {
    console.log('无效选择，退出。')
    process.exit(1)
  }
}
rl.close()

// ---------- 启动前先构建组件（页面依赖组件 dist 产物） ----------
if (!skipBuild) {
  console.log('▶ 构建 components ...')
  const r = spawnSync('pnpm', ['--filter', './components/*', 'build'], {
    stdio: 'inherit',
    cwd: root,
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

// ---------- 启动该页面的 Vite dev server ----------
const viteArgs = [
  '--filter', page.name, 'exec', 'vite',
  '--config', resolve(root, 'build/vite.page.mjs'),
]
if (!noOpen) viteArgs.push('--open')

console.log(`\n▶ 启动 ${page.name}（${page.label}）...\n`)
const child = spawn('pnpm', viteArgs, { stdio: 'inherit', cwd: root })

const shutdown = () => {
  if (!child.killed) child.kill('SIGTERM')
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
child.on('exit', (code) => process.exit(code ?? 0))
