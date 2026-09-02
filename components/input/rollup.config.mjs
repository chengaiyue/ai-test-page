import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import postcss from 'rollup-plugin-postcss'

export default {
  input: 'src/index.ts',
  // react / react-dom 由宿主提供，不打进产物
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  output: [
    {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    // SCSS -> 抽取为独立的 dist/index.css
    postcss({
      extract: 'index.css',
      use: ['sass'],
      sourceMap: true,
    }),
    // TS/TSX 转译 + 生成 .d.ts（JS 交给 rollup 打包，仅产出声明文件）
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
}
