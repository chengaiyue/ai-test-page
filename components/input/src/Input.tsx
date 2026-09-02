import type { InputHTMLAttributes } from 'react'
import './input.scss'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 输入框尺寸（原生 size 为 number，这里覆盖为语义化尺寸） */
  size?: 'md' | 'lg'
}

export function Input({ size = 'md', className = '', ...rest }: InputProps) {
  const cls = `ai-input${size === 'lg' ? ' ai-input--lg' : ''}${
    className ? ` ${className}` : ''
  }`
  return <input className={cls} {...rest} />
}
