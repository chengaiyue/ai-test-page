// ESLint 9 flat config。
// 覆盖范围：全部 TS/TSX 源码（pages + components）与根目录 scripts/build 配置。
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  // 全局忽略：产物、依赖、缓存
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.d.ts',
    ],
  },
  // 基础：JS 推荐规则（scripts/*.mjs、build/*.mjs）
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // Node 环境：根目录脚本与构建配置
  {
    files: ['scripts/**/*.mjs', 'build/**/*.mjs', 'vitest.config.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // 测试文件：允许非导出变量、宽松未使用规则
  {
    files: ['**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  // Prettier 兜底：关掉所有与格式化冲突的规则
  prettier,
)
