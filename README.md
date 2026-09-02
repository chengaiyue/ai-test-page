# ai-test-page

React + TypeScript 前端 monorepo，基于 **pnpm workspaces** 管理。

- `pages/` —— 页面应用（Vite + React），不发布
- `components/` —— 公共组件，**每个组件是一个独立 package，可独立构建、独立版本、独立发包**

## 目录结构

```
.
├── pnpm-workspace.yaml        # workspace 声明：pages/* 与 components/*
├── tsconfig.base.json         # 各包共享的 TS 基础配置
├── package.json               # 根工程（private），统一编排脚本
├── components/
│   ├── button/                # @ai-test/button（独立发包）
│   │   ├── src/               #   Button.tsx / button.css / index.ts
│   │   ├── tsup.config.ts     #   构建配置（ESM + CJS + d.ts + CSS）
│   │   └── package.json       #   exports/main/module/types + peerDeps(react)
│   └── input/                 # @ai-test/input（独立发包，结构同上）
└── pages/
    └── playground/            # @ai-test/playground（Vite 应用，private）
        └── src/               # 通过 workspace:* 依赖消费组件包
```

## 环境要求

- Node >= 18
- pnpm >= 7（`npm i -g pnpm`）

## 快速开始

```bash
pnpm install          # 安装全部依赖并链接 workspace 包

pnpm build:components # 先构建组件包（产物在各包 dist/）
pnpm dev              # 启动 pages 开发服务（Vite，默认 http://localhost:5173）
```

> 说明：pages 通过 `workspace:*` 引用组件包的**构建产物**（dist）。
> 联调组件时可开监听构建：`pnpm --filter @ai-test/button dev`，
> 组件源码改动会实时重建 dist，页面自动刷新。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm build` | 构建所有包（组件 + 页面） |
| `pnpm build:components` | 只构建 components 下所有组件 |
| `pnpm build:pages` | 只构建 pages 下所有应用 |
| `pnpm dev` | 先构建组件，再并行启动各包 dev |
| `pnpm --filter <pkg> <script>` | 对单个包执行脚本 |

## 在 pages 中使用组件

```tsx
import { Button } from '@ai-test/button'
import '@ai-test/button/style.css' // 组件样式由组件包以独立产物提供

<Button variant="primary">按钮</Button>
```

依赖写法（pages 的 package.json）：

```json
{
  "dependencies": {
    "@ai-test/button": "workspace:*"
  }
}
```

`workspace:*` 在本地自动软链到 `components/button`；发布 pages 或打包时
pnpm 会自动替换为组件包的实际版本号。

## 新增一个组件包

1. 复制 `components/button` 为 `components/<name>`，改包名（如 `@ai-test/<name>`）
2. 编写 `src/` 下的组件代码，从 `src/index.ts` 导出
3. 在使用方 package.json 中加 `"@ai-test/<name>": "workspace:*"`，执行 `pnpm install`
4. `pnpm --filter @ai-test/<name> build`

组件包约定：

- **构建工具**：tsup（esbuild），产物为 ESM + CJS + `.d.ts` + 独立 CSS
- **react / react-dom**：声明为 `peerDependencies`，不打进产物
- **exports**：`.` 导出组件，`./style.css` 导出样式；`files: ["dist"]` 保证只发布产物

## 发布组件包

```bash
# 1. 更新版本号
pnpm --filter @ai-test/button version patch   # 或 minor / major

# 2. 发布（prepublishOnly 会自动先 build）
pnpm --filter @ai-test/button publish
```

发包前可本地校验包内容：

```bash
pnpm -C components/button pack
tar -tzf ai-test-button-*.tgz   # 应只包含 package.json / README.md / dist
```

> 若发布到私有 registry，在各组件包 package.json 中配置
> `"publishConfig": { "registry": "https://your-registry/" }`。
