import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  // react / react-dom 由宿主提供，不打进产物
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  target: 'es2020',
})
