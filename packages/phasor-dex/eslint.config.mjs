import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // Disable overly strict React Compiler rules
      // The setMounted(true) pattern is valid for hydration fixes
      'react-hooks/set-state-in-effect': 'off',
      // Date.now() in useMemo is a common pattern for time-based calculations
      'react-hooks/purity': 'off',
      // Manual memoization preservation is often too strict
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
  ]),
])

export default eslintConfig
