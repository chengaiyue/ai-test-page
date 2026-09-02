# ai-test-page

React + TypeScript 前端 monorepo，基于 **pnpm workspaces** 管理。

- `pages/` —— 页面应用（**Vite** 打包 + React），不发布
- `components/` —— 公共组件（**Rollup** 打包，样式用 **SCSS**），**每个组件是一个独立 package，可独立构建、独立版本、独立发包**

设计原则：**配置与通用依赖统一收敛到根目录**，子包只保留自身源码和薄薄的描述文件。

## 目录结构

```
.
├── pnpm-workspace.yaml          # workspace 声明：pages/* 与 components/*
├── package.json                 # 根工程（private）：统一脚本 + 全部通用依赖
├── tsconfig.base.json           # 唯一的 TS 配置，所有子包都 extends 它
├── build/
│   ├── rollup.component.mjs     # 所有 components/* 共用的 Rollup 构建配置
│   └── vite.page.mjs            # 所有 pages/* 共用的 Vite 配置
├── scripts/
│   └── build.mjs                # 选择性构建：交互/关键字选包 + 依赖影响面分析
├── components/
│   ├── button/                  # @ai-test/button（独立发包）
│   │   ├── src/                 #   Button.tsx / button.scss / index.ts
│   │   ├── tsconfig.json        #   薄壳：{ "extends": "../../tsconfig.base.json" }
│   │   └── package.json         #   包元信息 + peerDeps（react），无本地 devDeps
│   └── input/                   # @ai-test/input（结构同上）
└── pages/
    └── playground/              # @ai-test/playground（Vite 应用，private）
        ├── index.html
        ├── src/                 # 页面源码 + app.scss，以 workspace:* 消费组件
        ├── tsconfig.json        # 薄壳：{ "extends": "../../tsconfig.base.json" }
        └── package.json         # 仅声明 workspace 组件依赖
```

子包脚本通过相对路径引用根目录的共享配置：

```jsonc
// components/xxx/package.json
"scripts": {
  "build": "rollup -c ../../build/rollup.component.mjs",
  "dev":   "rollup -c ../../build/rollup.component.mjs -w"
}

// pages/xxx/package.json
"scripts": {
  "dev":   "vite --config ../../build/vite.page.mjs",
  "build": "tsc --noEmit && vite build --config ../../build/vite.page.mjs"
}
```

共享构建配置按**执行时 cwd**（即子包目录）解析入口/输出，所以一份配置即可服务所有同类型子包，无需复制。

## 依赖管理约定

**通用依赖全部放在根 `package.json` 的 `devDependencies`**，子包不再重复声明：

- 运行时基础库：`react`、`react-dom`（根提供，子包通过 pnpm 提升直接可用）
- 类型：`@types/react`、`@types/react-dom`
- 构建工具链：`rollup` 及插件、`vite`、`@vitejs/plugin-react`、`typescript`、`tslib`
- 样式：`sass`

子包只声明**各自特有**的依赖：

- **组件包**：只保留 `peerDependencies`（react/react-dom，作为发布元数据告知宿主），
  不写 `dependencies`/`devDependencies`——工具链与 react 都来自根
- **页面包**：`dependencies` 里写 `"@ai-test/xxx": "workspace:*"`（组件间引用）

> react 放在根 devDependencies 而非各包：组件库需要 react 做类型/peer 解析，
> 页面需要 react 做运行时，一处声明全仓共享；发布时 react 仍是 peerDependency，不会打进产物。

## 环境要求

- Node >= 18
- pnpm >= 7（`npm i -g pnpm`）

## 快速开始

```bash
pnpm install          # 安装全部依赖并链接 workspace 包

pnpm build:components # 先构建组件包（产物在各包 dist/）
pnpm dev              # 启动 pages 开发服务（Vite，默认 http://localhost:5173）
```

> pages 通过 `workspace:*` 引用组件包的**构建产物**（dist）。
> 联调组件时开监听构建：`pnpm --filter @ai-test/button dev`，
> 组件源码改动实时重建 dist，页面自动刷新。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm build` | 构建所有包（组件 + 页面） |
| `pnpm build:select` | **交互式选择**构建哪些包，并分析依赖影响面（见下） |
| `pnpm build:components` | 只构建 components 下所有组件 |
| `pnpm build:pages` | 只构建 pages 下所有应用 |
| `pnpm dev` | 先构建组件，再并行启动各包 dev |
| `pnpm --filter <pkg> <script>` | 对单个包执行脚本 |

### 选择性构建 & 依赖影响分析

`pnpm build:select`（底层 `scripts/build.mjs`）解决「改了一个组件，该构建谁」：

```bash
pnpm build:select                # 弹出菜单：全部 / 仅组件 / 仅页面 / 手动勾选
pnpm build:select button         # 按关键字预选包（匹配包名或目录名）
pnpm build:select button -y      # 预选并自动连带构建受影响的下游包，无需逐项确认
pnpm build:select button --no-downstream   # 只构建所选，不连带下游
```

脚本读取 workspace 依赖图，自动处理两件事：

1. **向上补依赖**：构建页面时，自动把它依赖的组件加入计划并排在前面
   （保证页面拿到最新组件产物）。
2. **向下找影响**：构建组件时，反查所有依赖它的页面/组件并列出，
   询问是否连带构建（`-y` 自动连带）。

最终按**拓扑顺序**（被依赖者在前）执行构建。例如改了 button：

```
⚠ 依赖影响分析：
  · @ai-test/playground 依赖了所选组件，可能受影响
构建计划（按依赖顺序）：
  ▸ @ai-test/button     [components]  (所选包)
  ▸ @ai-test/playground [pages]       (下游受影响包)
```

## 在 pages 中使用组件

```tsx
import { Button } from '@ai-test/button'
import '@ai-test/button/style.css' // 组件样式由组件包以独立产物提供
import './app.scss'                // 页面自己的 SCSS，Vite 直接编译

<Button variant="primary">按钮</Button>
```

## 新增一个组件包

无需写任何构建配置，只需：

1. 建目录 `components/<name>/src/`，写组件代码并从 `src/index.ts` 导出（样式用 `.scss`）
2. 加 `package.json`：包名 `@ai-test/<name>`、`exports`/`files` 等元信息、
   `peerDependencies`（react），scripts 直接复制现有组件（引用根 rollup 配置）
3. 加 `tsconfig.json`：内容为 `{ "extends": "../../tsconfig.base.json", "include": ["src"] }`
4. 使用方 package.json 加 `"@ai-test/<name>": "workspace:*"`，执行 `pnpm install`
5. `pnpm --filter @ai-test/<name> build`

组件包构建约定（由根 `build/rollup.component.mjs` 统一保证）：

- Rollup 产出 ESM + CJS + `.d.ts` + sourcemap
- `rollup-plugin-postcss` + `sass` 把 SCSS 编译抽取为独立 `dist/index.css`
- react/react-dom external，不打进产物
- 发布物是编译后的纯 CSS，消费方无需配 sass

## 新增一个页面

1. 建目录 `pages/<name>/`，放 `index.html` 和 `src/`
2. 加 `package.json`（复制 playground，scripts 引用根 vite 配置），
   `dependencies` 写需要的 `"@ai-test/xxx": "workspace:*"`
3. 加 `tsconfig.json`：`{ "extends": "../../tsconfig.base.json", "include": ["src"] }`
4. `pnpm install && pnpm --filter <包名> dev`

## 发布组件包

```bash
# 1. 更新版本号
pnpm --filter @ai-test/button version patch   # 或 minor / major

# 2. 发布（prepublishOnly 会自动先 build）
pnpm --filter @ai-test/button publish
```

发包前本地校验包内容：

```bash
pnpm -C components/button pack
tar -tzf ai-test-button-*.tgz   # 应只包含 package.json / README.md / dist
```

> 若发布到私有 registry，在各组件包 package.json 中配置
> `"publishConfig": { "registry": "https://your-registry/" }`。
