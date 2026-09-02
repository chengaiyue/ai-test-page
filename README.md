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
    ├── playground/              # @ai-test/playground（组件演示页）
    │   ├── index.html
    │   ├── src/                 # 页面源码 + app.scss，以 workspace:* 消费组件
    │   ├── tsconfig.json        # 薄壳：{ "extends": "../../tsconfig.base.json" }
    │   └── package.json         # 声明 workspace 组件依赖
    └── upload/                  # @ai-test/upload-page（antd 文件上传页）
        ├── index.html
        └── src/                 # App.tsx：Upload.Dragger 选文件 + 确定提交
```

> 页面统一用 **antd** 构建 UI（antd / @ant-design/icons 已在根 devDependencies 统一管理，
> React 19 下页面入口先 `import '@ant-design/v5-patch-for-react-19'`）。

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

**通用依赖统一放在根 `package.json`，子包不再重复声明**；按是否进入运行时产物分类：

- 根 **`dependencies`（运行时，会被 import / 打进产物）**：
  `react`、`react-dom`、`antd`、`@ant-design/icons`、`@ant-design/v5-patch-for-react-19`
- 根 **`devDependencies`（仅构建/开发时需要）**：
  构建工具链 `rollup` 及插件、`vite`、`@vitejs/plugin-react`、`typescript`、`tslib`、
  样式编译 `sass`、类型 `@types/react`、`@types/react-dom`

子包只声明**各自特有**的依赖：

- **组件包**：只保留 `peerDependencies`（react/react-dom，作为发布元数据告知宿主），
  不写 `dependencies`/`devDependencies`——工具链与 react 都由根提供
- **页面包**：`dependencies` 里写 `"@ai-test/xxx": "workspace:*"`（引用自研组件）；
  antd / react 等通用库直接用根提供的，无需在子包声明

> 说明：react / antd 这类运行时库放根 `dependencies` 而非 `devDependencies`，
> 语义上它们是应用运行所需，不是构建工具。根包本身 `private` 不发布，
> 靠 pnpm 提升让各子包解析到；组件发布时 react 仍是 peerDependency，不会打进产物。
> 生产环境只安装 dependencies（`pnpm install --prod`）即可运行，工具链不进运行时。

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
2. 加 `package.json`（参考现有页面，scripts 引用根 vite 配置）；
   用到自研组件时 `dependencies` 写 `"@ai-test/xxx": "workspace:*"`，
   antd 等通用库无需在子包声明（根已统一提供）
3. 加 `tsconfig.json`：`{ "extends": "../../tsconfig.base.json", "include": ["src"] }`
4. `pnpm install && pnpm --filter <包名> dev`

## 文件上传页（pages/upload）

`@ai-test/upload-page` 用 antd 的 `Upload.Dragger` 实现：点击/拖拽多选文件 →
列表展示（可移除/清空）→ 点击**确定**用 `FormData + fetch` 统一 POST 到后端。

关键实现：

- `beforeUpload` 返回 `false`，阻止 antd 选择后立即上传，改为手动点确定提交
- 提交字段名 `files`（多文件，`multipart/form-data`），后端按此接收
- React 19 下入口先 `import '@ant-design/v5-patch-for-react-19'`

**对接你的后端**——修改 `pages/upload/src/App.tsx` 顶部的地址：

```ts
const UPLOAD_URL = '/api/upload'   // 改成你的上传接口
```

- 同域/走网关：保持相对路径即可。
- 独立后端（跨域）：在 `build/vite.page.mjs` 的 dev 配置里加代理，
  前端仍用相对路径，由 Vite 转发，规避跨域：

  ```js
  server: {
    proxy: {
      '/api': { target: 'http://your-backend:8080', changeOrigin: true },
    },
  }
  ```

- 生产环境由部署侧网关/nginx 做同样的转发。

启动：`pnpm --filter @ai-test/upload-page dev`（默认 http://localhost:5173）。

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
