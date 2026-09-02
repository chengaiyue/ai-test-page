# @ai-test/input

React Input 公共组件，monorepo 中独立构建、独立发包。

## 使用

```tsx
import { Input } from '@ai-test/input'
import '@ai-test/input/style.css'

export default function Demo() {
  return <Input placeholder="请输入内容" size="lg" />
}
```

## 开发

```bash
# 监听构建（dist 实时更新，pages 应用可直接联调）
pnpm --filter @ai-test/input dev

# 一次性构建
pnpm --filter @ai-test/input build
```

## 发布

```bash
pnpm --filter @ai-test/input build
pnpm --filter @ai-test/input publish
```
