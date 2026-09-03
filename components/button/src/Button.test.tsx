import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('默认渲染 default 变体', () => {
    render(<Button>默认按钮</Button>)
    const btn = screen.getByRole('button', { name: '默认按钮' })
    expect(btn).toHaveClass('ai-btn')
    expect(btn).toHaveClass('ai-btn--default')
    // 原生 type 兜底，避免按钮在表单内误触发 submit
    expect(btn).toHaveAttribute('type', 'button')
  })

  it('variant="primary" 渲染 primary 类名', () => {
    render(<Button variant="primary">主要按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('ai-btn--primary')
  })

  it('透传原生属性并合并外部 className', () => {
    render(
      <Button className="my-btn" disabled data-testid="target">
        按钮
      </Button>,
    )
    const btn = screen.getByTestId('target')
    expect(btn).toBeDisabled()
    expect(btn).toHaveClass('ai-btn', 'my-btn')
  })

  it('点击时触发 onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>点我</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
