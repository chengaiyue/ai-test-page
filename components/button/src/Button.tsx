import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './button.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮风格 */
  variant?: 'primary' | 'default'
  children?: ReactNode
}

export function Button({
  variant = 'default',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const cls = `ai-btn ai-btn--${variant}${className ? ` ${className}` : ''}`
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  )
}
