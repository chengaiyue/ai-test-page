# @ai-test/button

React Button 公共组件，monorepo 中独立构建、独立发包。

## 使用

```tsx
import { Button } from '@ai-test/button'
import '@ai-test/button/style.css'

export default function Demo() {
  return (
    <>
      <Button variant="primary">主要按钮</Button>
      <Button>默认按钮</Button>
    </>
  )
}
```

## 开发

```bash
# 监听构建（dist 实时更新，pages 应用可直接联调）
pnpm --filter @ai-test/button dev

# 一次性构建
pnpm --filter @ai-test/button build
```

## 发布

```bash
pnpm --filter @ai-test/button build
pnpm --filter @ai-test/button publish
# 发布前会自动执行 prepublishOnly -> pnpm build
```
