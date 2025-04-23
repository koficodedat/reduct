# Import Order Enforcement in Reduct

This document explains how import order is enforced in the Reduct codebase using ESLint rules.

## Import Order Standard

All imports in the Reduct codebase should follow this order:

1. **External Libraries**: Third-party dependencies (Node.js built-ins, npm packages)
2. **Internal Shared Types**: Types from the shared-types package
3. **Local Imports**: Imports from the same package (parent directories, same directory)

## ESLint Configuration

We use the `eslint-plugin-import` package to enforce our import order standard. The configuration is defined in the root `.eslintrc.js` file:

```javascript
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
}]
```

## Example of Correct Import Order

```typescript
// External libraries first
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

// Internal shared types
import { DataType } from '@reduct/shared-types/data-structures';
import { AcceleratorTier } from '@reduct/shared-types/wasm/accelerator';

// Local imports from the same package
import { detectDataType } from '../type-detection';
import { createOptimizedList } from './factory';
```

## Checking Import Order

To check if your imports follow the standard:

```bash
npm run lint:imports:check
```

This will list all files that don't follow our import order standard.

## Fixing Import Order

To automatically fix import order issues:

```bash
npm run lint:imports
```

This will reorder imports in all files to follow our standard.

## Benefits

Following a consistent import order provides several benefits:

1. **Improved Readability**: Makes it easier to understand dependencies at a glance
2. **Enhanced Maintainability**: Consistent ordering makes it easier to update dependencies
3. **Reduced Cognitive Load**: Developers can quickly understand the structure of imports
4. **Reduced Merge Conflicts**: Consistent ordering reduces the chance of merge conflicts
5. **Easier Code Reviews**: Reviewers can quickly identify new dependencies

## IDE Integration

Most modern IDEs (VS Code, WebStorm, etc.) can be configured to automatically fix ESLint issues on save. This makes it easy to maintain the correct import order without manual intervention.

For VS Code, add this to your settings.json:

```json
"editor.codeActionsOnSave": {
  "source.fixAll.eslint": true
}
```

## Troubleshooting

If you encounter issues with the import order rules:

1. Make sure you have the latest dependencies installed: `npm install`
2. Check if your IDE ESLint plugin is properly configured
3. Try running the fix command manually: `npm run lint:imports`
