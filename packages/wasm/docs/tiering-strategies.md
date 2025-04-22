# Tiering Strategies

This document explains the tiering strategies available in the `@reduct/wasm` package and how to use them effectively.

## Table of Contents

- [Overview](#overview)
- [Accelerator Tiers](#accelerator-tiers)
- [Available Strategies](#available-strategies)
  - [Size-Based Strategy](#size-based-strategy)
  - [Complexity-Based Strategy](#complexity-based-strategy)
  - [Adaptive Strategy](#adaptive-strategy)
  - [Frequency-Based Strategy](#frequency-based-strategy)
- [Custom Strategies](#custom-strategies)
- [Combining Strategies](#combining-strategies)
- [Monitoring and Tuning](#monitoring-and-tuning)

## Overview

Tiering strategies determine when to use JavaScript versus WebAssembly for a given operation. The goal is to automatically select the most efficient implementation based on input characteristics and runtime conditions.

## Accelerator Tiers

The `@reduct/wasm` package defines three tiers of acceleration:

- **JS_PREFERRED**: JavaScript is preferred for this input. This is typically used for small inputs or simple operations where the overhead of WebAssembly would outweigh its benefits.

- **CONDITIONAL**: The choice between JavaScript and WebAssembly depends on runtime conditions. This tier is used when the performance characteristics are not clear-cut and may depend on factors like browser implementation or hardware.

- **HIGH_VALUE**: WebAssembly is preferred for this input. This is typically used for large inputs or complex operations where WebAssembly provides significant performance benefits.

## Available Strategies

### Size-Based Strategy

The size-based strategy selects the tier based on the size of the input. This is the simplest and most common strategy.

```typescript
import { TieredSortAccelerator, TieringStrategy } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: TieringStrategy.SIZE_BASED,
  thresholds: {
    // Use JavaScript for arrays smaller than 100 elements
    jsThreshold: 100,
    
    // Use WebAssembly for arrays larger than 1000 elements
    wasmThreshold: 1000
    
    // For arrays between 100 and 1000 elements, use CONDITIONAL tier
  }
});
```

**When to use**: This strategy works well for operations where the performance characteristics are primarily determined by the input size, such as sorting, mapping, and filtering.

**Default thresholds**:
- `jsThreshold`: 100 elements
- `wasmThreshold`: 1000 elements

### Complexity-Based Strategy

The complexity-based strategy analyzes the complexity of the operation and input to determine the appropriate tier. It considers factors like data type, homogeneity, and operation complexity.

```typescript
import { TieredSortAccelerator, TieringStrategy } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: TieringStrategy.COMPLEXITY_BASED,
  complexityOptions: {
    // Weights for different complexity factors
    sizeWeight: 0.5,
    typeWeight: 0.3,
    homogeneityWeight: 0.2,
    
    // Thresholds for complexity scores
    jsComplexityThreshold: 3,
    wasmComplexityThreshold: 7
  }
});
```

**When to use**: This strategy works well for operations with varying complexity, such as operations on heterogeneous data or operations with complex callbacks.

**Default thresholds**:
- `jsComplexityThreshold`: 3
- `wasmComplexityThreshold`: 7

### Adaptive Strategy

The adaptive strategy dynamically adjusts thresholds based on runtime performance measurements. It periodically samples the performance of different tiers and adjusts the thresholds accordingly.

```typescript
import { TieredSortAccelerator, TieringStrategy } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: TieringStrategy.ADAPTIVE,
  adaptiveOptions: {
    // Sample every 100 calls
    samplingInterval: 100,
    
    // Adjust thresholds by 10% each time
    adaptationRate: 0.1,
    
    // Minimum number of samples before adaptation
    minSamples: 10,
    
    // Initial thresholds
    initialJsThreshold: 100,
    initialWasmThreshold: 1000
  }
});
```

**When to use**: This strategy works well for environments with varying performance characteristics, such as applications that run on different browsers or devices.

**Default options**:
- `samplingInterval`: 100
- `adaptationRate`: 0.1
- `minSamples`: 10
- `initialJsThreshold`: 100
- `initialWasmThreshold`: 1000

### Frequency-Based Strategy

The frequency-based strategy optimizes based on call frequency, caching results for frequent calls and using more aggressive optimization for frequently called operations.

```typescript
import { TieredSortAccelerator, TieringStrategy } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: TieringStrategy.FREQUENCY_BASED,
  frequencyOptions: {
    // Cache up to 100 results
    cacheSize: 100,
    
    // Consider calls frequent after 10 occurrences
    frequencyThreshold: 10,
    
    // Time window for frequency detection (ms)
    timeWindow: 60000,
    
    // Use WebAssembly for frequent calls regardless of size
    useWasmForFrequentCalls: true
  }
});
```

**When to use**: This strategy works well for operations that are called repeatedly with the same inputs, such as operations in tight loops or operations on the same data structure.

**Default options**:
- `cacheSize`: 100
- `frequencyThreshold`: 10
- `timeWindow`: 60000 (1 minute)
- `useWasmForFrequentCalls`: true

## Custom Strategies

You can create custom tiering strategies by implementing the `TieringStrategy` interface:

```typescript
import { BaseAccelerator, AcceleratorTier } from '@reduct/wasm';

class CustomTieringStrategy {
  determineTier(input: any, accelerator: BaseAccelerator<any, any>): AcceleratorTier {
    // Custom logic to determine the tier
    if (/* condition */) {
      return AcceleratorTier.JS_PREFERRED;
    } else if (/* condition */) {
      return AcceleratorTier.CONDITIONAL;
    } else {
      return AcceleratorTier.HIGH_VALUE;
    }
  }
}

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: new CustomTieringStrategy()
});
```

## Combining Strategies

You can combine multiple strategies to create a more sophisticated tiering approach:

```typescript
import { TieredSortAccelerator, TieringStrategy, AcceleratorTier } from '@reduct/wasm';

class CombinedStrategy {
  private sizeStrategy: SizeBasedStrategy;
  private frequencyStrategy: FrequencyBasedStrategy;
  
  constructor() {
    this.sizeStrategy = new SizeBasedStrategy({
      jsThreshold: 100,
      wasmThreshold: 1000
    });
    
    this.frequencyStrategy = new FrequencyBasedStrategy({
      cacheSize: 100,
      frequencyThreshold: 10
    });
  }
  
  determineTier(input: any, accelerator: BaseAccelerator<any, any>): AcceleratorTier {
    // Check if the call is frequent
    const frequencyTier = this.frequencyStrategy.determineTier(input, accelerator);
    
    if (frequencyTier === AcceleratorTier.HIGH_VALUE) {
      // If the call is frequent, use the frequency strategy
      return frequencyTier;
    } else {
      // Otherwise, use the size strategy
      return this.sizeStrategy.determineTier(input, accelerator);
    }
  }
}

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: new CombinedStrategy()
});
```

## Monitoring and Tuning

To optimize your tiering strategies, monitor the performance statistics and adjust the thresholds accordingly:

```typescript
import { TieredSortAccelerator } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator();

// After running some operations...
const stats = sortAccelerator.getPerformanceStats();

console.log('Tier usage:', stats.tierUsage);
console.log('Average execution time:', stats.averageExecutionTime);
console.log('Input size distribution:', stats.inputSizeDistribution);

// If JavaScript is faster for most inputs, increase the wasmThreshold
if (stats.averageExecutionTime.JS_PREFERRED < stats.averageExecutionTime.HIGH_VALUE) {
  sortAccelerator.setThresholds({
    wasmThreshold: sortAccelerator.getThresholds().wasmThreshold * 1.5
  });
}

// If WebAssembly is faster for most inputs, decrease the jsThreshold
if (stats.averageExecutionTime.HIGH_VALUE < stats.averageExecutionTime.JS_PREFERRED) {
  sortAccelerator.setThresholds({
    jsThreshold: sortAccelerator.getThresholds().jsThreshold * 0.5
  });
}
```

You can also use the browser-based benchmark runner to test different tiering strategies across various browsers and devices:

```bash
# Start the benchmark server
npm run benchmark:server

# Open http://localhost:3000 in different browsers to run benchmarks
# View results at http://localhost:3000/dashboard
```

Based on the benchmark results, you can create browser-specific or device-specific tiering strategies:

```typescript
import { TieredSortAccelerator, TieringStrategy } from '@reduct/wasm';

// Detect browser
const isChrome = navigator.userAgent.includes('Chrome');
const isFirefox = navigator.userAgent.includes('Firefox');
const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');

// Set browser-specific thresholds
const jsThreshold = isChrome ? 50 : (isFirefox ? 80 : 100);
const wasmThreshold = isChrome ? 500 : (isFirefox ? 800 : 1000);

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: TieringStrategy.SIZE_BASED,
  thresholds: {
    jsThreshold,
    wasmThreshold
  }
});
```
