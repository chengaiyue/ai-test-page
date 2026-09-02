// 所有 components/* 组件包共用的 Rollup 构建配置。
// 通过 `rollup -c ../../build/rollup.component.mjs` 在各组件目录下执行，
// 输入/输出/tsconfig 路径均以执行时的 cwd（组件包目录）为基准，无需各包再写配置。
import { resolve } from 'node:path'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import postcss from 'rollup-plugin-postcss'

const pkgDir = process.cwd()

export default {
  input: resolve(pkgDir, 'src/index.ts'),
  // react / react-dom 由宿主提供，不打进产物
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  output: [
    {
      file: resolve(pkgDir, 'dist/index.js'),
      format: 'esm',
      sourcemap: true,
    },
    {
      file: resolve(pkgDir, 'dist/index.cjs'),
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    // SCSS -> 抽取为独立的 dist/index.css
    postcss({
      extract: 'index.css',
      use: ['sass'],
      sourceMap: true,
    }),
    // TS/TSX 转译 + 生成 .d.ts（声明文件输出到各包 dist/）。
    // 组件库特有的 emit 选项在此声明，tsconfig 全仓共用一份（tsconfig.base.json）。
    typescript({
      tsconfig: resolve(pkgDir, 'tsconfig.json'),
      compilerOptions: {
        noEmit: false,
        declaration: true,
        emitDeclarationOnly: true,
        outDir: resolve(pkgDir, 'dist'),
        rootDir: resolve(pkgDir, 'src'),
      },
    }),
  ],
}
