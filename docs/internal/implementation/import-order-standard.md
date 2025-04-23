# Import Order Standard for Reduct

This document outlines the standard order for imports in the Reduct codebase.

## Import Order

All imports should be organized in the following order, with a blank line between each group:

1. **External Libraries**: Third-party dependencies
2. **Internal Shared Types**: Types from the shared-types package
3. **Local Imports**: Imports from the same package

## Example

```typescript
// 1. External libraries first
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

// 2. Internal shared types
import { DataType } from '@reduct/shared-types/data-structures';
import { AcceleratorTier } from '@reduct/shared-types/wasm/accelerator';

// 3. Local imports from the same package
import { detectDataType } from '../type-detection';
import { createOptimizedList } from './factory';
```

## Additional Guidelines

- Imports within each group should be alphabetically ordered when possible
- Use specific imports rather than wildcard imports
- Use absolute paths for imports from other packages
- Use relative paths for imports within the same package

## Benefits

Following this standard provides several benefits:

1. **Improved Readability**: Makes it easier to understand dependencies at a glance
2. **Better Maintainability**: Makes it easier to update dependencies
3. **Reduced Merge Conflicts**: Consistent ordering reduces the chance of merge conflicts
4. **Easier Code Reviews**: Reviewers can quickly identify new dependencies
