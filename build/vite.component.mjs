// 所有 components/* 组件包共用的 Vite library mode 构建配置。
// 通过 `vite build --config ../../build/vite.component.mjs` 在各组件目录下执行，
// root/入口/输出均以执行时的 cwd（组件包目录）为基准，无需各包再写配置。
//
// 产物契约（与原 rollup 方案保持一致，pages 消费方无感知）：
//   dist/index.js     ESM（sourcemap）
//   dist/index.cjs    CJS named exports（sourcemap）
//   dist/index.css    SCSS 编译抽取的纯 CSS（sourcemap）
//   dist/*.d.ts       由 vite-plugin-dts 生成的类型声明
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const pkgDir = process.cwd()

export default defineConfig({
  plugins: [
    // 类型声明：从 TS 源码生成 .d.ts 到 dist/（rollup 方案靠 tsc emit，此处等价替代）
    dts({
      outDir: 'dist',
      // 声明文件里 SCSS 导入保持原样（与原 tsc emit 行为一致）
      originalFileName: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(pkgDir, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    // react / react-dom 由宿主提供，不打进产物
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        // es 格式 named export 无需配置；cjs 需要 exports: 'named' 等价物：
        // Vite 的 cjs 输出默认 named exports（生成 exports.xxx = ...），与原 rollup 一致
        assetFileNames: (assetInfo) =>
          assetInfo.names.some((n) => n.endsWith('.css'))
            ? 'index.css'
            : (assetInfo.names[0] ?? 'asset'),
      },
    },
    sourcemap: true,
    // sourcemap 是发布物的一部分（原 rollup 方案同样产出 .map），关掉压缩让产物可读、与原方案对齐
    minify: false,
    // 组件库产物不做 chunk 拆分，保持单文件
    cssCodeSplit: false,
  },
})
