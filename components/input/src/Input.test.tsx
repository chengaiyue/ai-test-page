import '@testing-library/jest-dom/vitest'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('默认渲染基础类名，不带大尺寸修饰符', () => {
    render(<Input placeholder="请输入" />)
    const input = screen.getByPlaceholderText('请输入')
    expect(input).toHaveClass('ai-input')
    expect(input).not.toHaveClass('ai-input--lg')
  })

  it('size="lg" 渲染大尺寸类名', () => {
    render(<Input size="lg" placeholder="大输入框" />)
    expect(screen.getByPlaceholderText('大输入框')).toHaveClass('ai-input--lg')
  })

  it('透传 disabled 等原生属性', () => {
    render(<Input disabled placeholder="禁用" />)
    expect(screen.getByPlaceholderText('禁用')).toBeDisabled()
  })
})
