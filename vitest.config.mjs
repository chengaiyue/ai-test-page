// 根 Vitest 配置：组件单元测试（jsdom + Testing Library）。
// 测试文件与源码同目录（src/*.test.tsx），pnpm test 在根目录运行。
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // 开启全局 API：@testing-library/react 依赖全局 afterEach 做自动卸载清理
    globals: true,
    include: ['components/**/*.test.{ts,tsx}', 'pages/**/*.test.{ts,tsx}'],
  },
})
