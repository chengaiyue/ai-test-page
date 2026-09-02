import { Button } from '@ai-test/button'
import { Input } from '@ai-test/input'

export default function App() {
  return (
    <div
      style={{
        maxWidth: 640,
        margin: '48px auto',
        padding: '0 16px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <h1>Monorepo Playground</h1>
      <p style={{ color: '#666' }}>
        pages 应用通过 workspace 依赖消费 components 下独立发包的组件：
      </p>

      <h2>@ai-test/button</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Button
          variant="primary"
          onClick={() => alert('点击了主要按钮')}
        >
          主要按钮
        </Button>
        <Button>默认按钮</Button>
        <Button disabled>禁用按钮</Button>
      </div>

      <h2>@ai-test/input</h2>
      <div style={{ display: 'flex', gap: 12 }}>
        <Input placeholder="默认尺寸输入框" style={{ width: 200 }} />
        <Input size="lg" placeholder="大尺寸输入框" style={{ width: 200 }} />
        <Input placeholder="禁用状态" disabled style={{ width: 200 }} />
      </div>
    </div>
  )
}
