// 所有 pages/* 页面应用共用的 Vite 配置。
// 通过 `vite --config ../../build/vite.page.mjs` 在各页面目录下执行，
// Vite 的 root 默认取执行时 cwd（页面目录），index.html / src 均按页面目录解析。
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
