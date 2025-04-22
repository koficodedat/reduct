# WebAssembly Integration Guide

This guide explains how to integrate the `@reduct/wasm` package into your own code and packages.

## Table of Contents

- [Basic Integration](#basic-integration)
- [Using Tiered Accelerators](#using-tiered-accelerators)
- [Creating Custom Accelerators](#creating-custom-accelerators)
- [Integrating with Data Structures](#integrating-with-data-structures)
- [Error Handling and Fallbacks](#error-handling-and-fallbacks)
- [Testing WebAssembly Code](#testing-webassembly-code)
- [Deployment Considerations](#deployment-considerations)

## Basic Integration

### Installation

First, install the package:

```bash
npm install @reduct/wasm
```

### Feature Detection

Always check if WebAssembly is supported before using WebAssembly features:

```typescript
import { isWebAssemblySupported } from '@reduct/wasm';

if (isWebAssemblySupported()) {
  // Use WebAssembly accelerators
} else {
  // Fall back to JavaScript implementations
}
```

### Using Accelerators

The simplest way to use WebAssembly acceleration is through the `getAccelerator` function:

```typescript
import { getAccelerator } from '@reduct/wasm';

// Get an accelerator for array sorting
const sortAccelerator = getAccelerator<number[], number[]>(
  'data-structures',
  'array',
  'sort'
);

// Check if the accelerator is available
if (sortAccelerator.isAvailable()) {
  // Use the accelerator
  const sortedArray = sortAccelerator.execute([3, 1, 4, 1, 5, 9, 2, 6]);
} else {
  // Fall back to JavaScript
  const sortedArray = [3, 1, 4, 1, 5, 9, 2, 6].sort();
}
```

## Using Tiered Accelerators

Tiered accelerators automatically select the most efficient implementation based on input characteristics:

```typescript
import { TieredSortAccelerator, AcceleratorTier, TieringStrategy } from '@reduct/wasm';

// Create a sort accelerator with default options
const sortAccelerator = new TieredSortAccelerator();

// Sort an array - automatically uses the most efficient implementation
const sortedArray = sortAccelerator.execute([3, 1, 4, 1, 5, 9, 2, 6]);

// Create a sort accelerator with custom options
const customSortAccelerator = new TieredSortAccelerator({
  // Force a specific tier (optional)
  forceTier: AcceleratorTier.HIGH_VALUE,

  // Set custom thresholds (optional)
  thresholds: {
    // Use WebAssembly for arrays larger than 1000 elements
    wasmThreshold: 1000
  },

  // Set a custom tiering strategy (optional)
  tieringStrategy: TieringStrategy.SIZE_BASED
});

// Sort an array using the configured accelerator
const customSortedArray = customSortAccelerator.execute([3, 1, 4, 1, 5, 9, 2, 6]);
```

### Available Tiered Accelerators

The package includes several pre-built tiered accelerators:

- `TieredSortAccelerator`: For array sorting
- `TieredMapAccelerator`: For array mapping
- `TieredFilterAccelerator`: For array filtering
- `TieredReduceAccelerator`: For array reduction

### Monitoring Performance

You can monitor the performance of tiered accelerators:

```typescript
import { TieredSortAccelerator } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator();

// After running some operations...
const stats = sortAccelerator.getPerformanceStats();

console.log('Tier usage:', stats.tierUsage);
console.log('Average execution time:', stats.averageExecutionTime);
console.log('Input size distribution:', stats.inputSizeDistribution);
```

## Creating Custom Accelerators

You can create custom accelerators for your own operations:

### Using BaseAccelerator

```typescript
import { BaseAccelerator, AcceleratorTier } from '@reduct/wasm';

class CustomAccelerator extends BaseAccelerator<number[], number[]> {
  constructor(options) {
    super('custom', 'array', 'operation', options);
  }

  // Implement the JavaScript version
  protected jsImplementation(input: number[]): number[] {
    // JavaScript implementation
    return input.map(x => x * 2);
  }

  // Implement the WebAssembly version
  protected wasmImplementation(input: number[]): number[] {
    // WebAssembly implementation
    // This would typically use a WebAssembly module
    return input.map(x => x * 2);
  }

  // Customize tier determination (optional)
  determineTier(input: number[]): AcceleratorTier {
    if (input.length < 100) {
      return AcceleratorTier.JS_PREFERRED;
    } else if (input.length < 1000) {
      return AcceleratorTier.CONDITIONAL;
    } else {
      return AcceleratorTier.HIGH_VALUE;
    }
  }
}
```

### Using HybridAccelerator

For complex operations, you can use the hybrid approach:

```typescript
import { HybridAcceleratorFactory } from '@reduct/wasm';

const customAccelerator = HybridAcceleratorFactory.create(
  'custom',
  'array',
  'operation',
  {
    // Preprocess in JavaScript
    preprocess: (input) => {
      // Convert input to a format suitable for WebAssembly
      return input;
    },

    // Core processing (can be WebAssembly or JavaScript)
    process: (data) => {
      // Process the data
      return data.map(x => x * 2);
    },

    // Postprocess in JavaScript
    postprocess: (result) => {
      // Convert result back to the desired format
      return result;
    },

    // JavaScript fallback implementation
    jsImplementation: (input) => {
      // Pure JavaScript implementation
      return input.map(x => x * 2);
    }
  }
);
```

## Integrating with Data Structures

The `@reduct/wasm` package is designed to work seamlessly with Reduct data structures:

### Example with List

```typescript
import { TieredMapAccelerator } from '@reduct/wasm';
import { List } from '@reduct/data-structures';

// Create a map accelerator
const mapAccelerator = new TieredMapAccelerator();

// Create a list
const list = List.of(1, 2, 3, 4, 5);

// Map the list using the accelerator
const mappedArray = mapAccelerator.execute(list.toArray(), x => x * 2);

// Create a new list from the result
const mappedList = List.from(mappedArray);
```

### Example with PersistentVector

```typescript
import { TieredFilterAccelerator } from '@reduct/wasm';
import { PersistentVector } from '@reduct/persistent';

// Create a filter accelerator
const filterAccelerator = new TieredFilterAccelerator();

// Create a persistent vector
const vector = PersistentVector.from([1, 2, 3, 4, 5]);

// Filter the vector using the accelerator
const filteredArray = filterAccelerator.execute(vector.toArray(), x => x % 2 === 0);

// Create a new vector from the result
const filteredVector = PersistentVector.from(filteredArray);
```

## Error Handling and Fallbacks

Always implement proper error handling and fallbacks when using WebAssembly:

```typescript
import { TieredSortAccelerator, isWebAssemblySupported } from '@reduct/wasm';

function sortArray(array) {
  try {
    // Check if WebAssembly is supported
    if (isWebAssemblySupported()) {
      const sortAccelerator = new TieredSortAccelerator();
      return sortAccelerator.execute(array);
    } else {
      // Fall back to JavaScript
      return [...array].sort();
    }
  } catch (error) {
    console.error('Error using WebAssembly accelerator:', error);
    // Fall back to JavaScript
    return [...array].sort();
  }
}
```

## Testing WebAssembly Code

Testing WebAssembly code requires special considerations:

### Unit Testing

```typescript
import { TieredSortAccelerator, AcceleratorTier } from '@reduct/wasm';
import { describe, it, expect } from 'vitest';

describe('TieredSortAccelerator', () => {
  it('should sort an array', () => {
    const sortAccelerator = new TieredSortAccelerator();
    const input = [3, 1, 4, 1, 5, 9, 2, 6];
    const expected = [1, 1, 2, 3, 4, 5, 6, 9];
    const result = sortAccelerator.execute(input);
    expect(result).toEqual(expected);
  });

  it('should use JavaScript for small arrays', () => {
    const sortAccelerator = new TieredSortAccelerator();
    const input = [3, 1, 4];

    // Mock the determineTier method to verify it returns JS_PREFERRED
    const determineTierSpy = vi.spyOn(sortAccelerator, 'determineTier');

    sortAccelerator.execute(input);

    expect(determineTierSpy).toHaveBeenCalledWith(input);
    expect(determineTierSpy).toHaveReturnedWith(AcceleratorTier.JS_PREFERRED);
  });
});
```

### Integration Testing

```typescript
import { TieredSortAccelerator } from '@reduct/wasm';
import { List } from '@reduct/data-structures';
import { describe, it, expect } from 'vitest';

describe('Integration with List', () => {
  it('should work with List data structure', () => {
    const sortAccelerator = new TieredSortAccelerator();
    const list = List.of(3, 1, 4, 1, 5, 9, 2, 6);

    const sortedArray = sortAccelerator.execute(list.toArray());
    const sortedList = List.from(sortedArray);

    expect(sortedList.get(0)).toBe(1);
    expect(sortedList.get(1)).toBe(1);
    expect(sortedList.get(2)).toBe(2);
    // ...
  });
});
```

### Performance Testing

```typescript
import { benchmark } from '@reduct/wasm';
import { describe, it, expect } from 'vitest';

describe('Performance', () => {
  it('should be faster than JavaScript for large arrays', () => {
    const jsImplementation = (input) => [...input].sort();
    const wasmAccelerator = new TieredSortAccelerator({
      forceTier: AcceleratorTier.HIGH_VALUE
    });

    // Create a large array
    const input = Array.from({ length: 10000 }, () => Math.random());

    const result = benchmark(
      jsImplementation,
      wasmAccelerator,
      input,
      { iterations: 10 }
    );

    // WebAssembly should be faster (speedup > 1)
    expect(result.speedup).toBeGreaterThan(1);
  });
});
```

## Deployment Considerations

When deploying applications that use WebAssembly, consider these factors:

### File Size

WebAssembly modules add to your bundle size. Optimize your bundles:

```javascript
// webpack.config.js
module.exports = {
  // ...
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        wasm: {
          test: /\.wasm$/,
          name: 'wasm',
          chunks: 'all'
        }
      }
    }
  }
};
```

### Cross-Origin Isolation

Some WebAssembly features (like SharedArrayBuffer) require cross-origin isolation:

```javascript
// server.js
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
```

### Browser Support

Ensure you have appropriate fallbacks for browsers that don't support WebAssembly:

```typescript
import { isWebAssemblySupported } from '@reduct/wasm';

if (isWebAssemblySupported()) {
  // Use WebAssembly accelerators
} else {
  // Use JavaScript implementations
}
```

### Worker Threads

For CPU-intensive operations, consider using worker threads:

```typescript
// main.js
const worker = new Worker('worker.js');

worker.postMessage({ array: [3, 1, 4, 1, 5, 9, 2, 6] });

worker.onmessage = (event) => {
  console.log('Sorted array:', event.data);
};

// worker.js
import { TieredSortAccelerator } from '@reduct/wasm';

self.onmessage = (event) => {
  const sortAccelerator = new TieredSortAccelerator();
  const sortedArray = sortAccelerator.execute(event.data.array);
  self.postMessage(sortedArray);
};
```
