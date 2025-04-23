module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: 'tsconfig.json',
      tsconfigRootDir: __dirname,
      sourceType: 'module',
      ecmaVersion: 2020,
    },
    plugins: ['@typescript-eslint/eslint-plugin', 'import'],
    extends: [
      'plugin:@typescript-eslint/recommended',
      'plugin:import/errors',
      'plugin:import/warnings',
      'plugin:import/typescript',
    ],
    root: true,
    env: {
      node: true,
      browser: true,
      es2020: true,
    },
    ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules', 'coverage'],
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      // Import order rules
      'import/order': ['error', {
        'groups': [
          'builtin',    // Node.js built-in modules
          'external',   // External libraries
          'internal',   // Internal shared types
          'parent',     // Parent directory imports
          'sibling',    // Same directory imports
          'index',      // Index imports
          'object',     // Object imports
          'type'        // Type imports
        ],
        'pathGroups': [
          {
            'pattern': '@reduct/shared-types/**',
            'group': 'internal',
            'position': 'before'
          }
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        },
        'warnOnUnassignedImports': true
      }],
      'import/no-duplicates': 'error',
      // Prettier rules removed
    },
};