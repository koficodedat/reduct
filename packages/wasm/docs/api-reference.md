# WebAssembly Package API Reference

This document provides a detailed reference for the `@reduct/wasm` package API.

## Table of Contents

- [Core API](#core-api)
  - [isWebAssemblySupported](#iswebassemblysupported)
  - [getAccelerator](#getaccelerator)
  - [Accelerator Interface](#accelerator-interface)
- [Tiered Optimization API](#tiered-optimization-api)
  - [AcceleratorTier](#acceleratortier)
  - [TieringStrategy](#tieringstrategy)
  - [BaseAccelerator](#baseaccelerator)
  - [TieredSortAccelerator](#tieredsortaccelerator)
  - [TieredMapAccelerator](#tieredmapaccelerator)
  - [TieredFilterAccelerator](#tieredfilteraccelerator)
  - [TieredReduceAccelerator](#tieredreduceaccelerator)
- [Hybrid Acceleration API](#hybrid-acceleration-api)
  - [HybridAccelerator](#hybridaccelerator)
  - [HybridAcceleratorFactory](#hybridacceleratorfactory)
  - [HybridAcceleratorManager](#hybridacceleratormanager)
  - [HybridStringAccelerator](#hybridstringaccelerator)
- [Frequency Detection API](#frequency-detection-api)
  - [FrequencyDetector](#frequencydetector)
  - [FrequencyAwareAccelerator](#frequencyawareaccelerator)
  - [FrequencyAwareAcceleratorFactory](#frequencyawareacceleratorfactory)
  - [FrequencyAwareAcceleratorManager](#frequencyawareacceleratormanager)
- [Memory Management API](#memory-management-api)
  - [WasmMemoryPool](#wasmmemorypool)
  - [getTypedArrayView](#gettypedarrayview)
- [Benchmarking API](#benchmarking-api)
  - [benchmark](#benchmark)
  - [formatBenchmarkResult](#formatbenchmarkresult)

## Core API

### isWebAssemblySupported

Checks if WebAssembly is supported in the current environment.

```typescript
function isWebAssemblySupported(): boolean;
```

**Returns:**
- `true` if WebAssembly is supported
- `false` otherwise

**Example:**
```typescript
import { isWebAssemblySupported } from '@reduct/wasm';

if (isWebAssemblySupported()) {
  console.log('WebAssembly is supported');
} else {
  console.log('WebAssembly is not supported');
}
```

### getAccelerator

Gets an accelerator for a specific operation.

```typescript
function getAccelerator<T, R>(
  domain: string,
  type: string,
  operation: string,
  options?: AcceleratorOptions
): Accelerator<T, R>;
```

**Parameters:**
- `domain`: The domain of the operation (e.g., 'data-structures')
- `type`: The type of the operation (e.g., 'list')
- `operation`: The operation name (e.g., 'map')
- `options`: Optional configuration options

**Returns:**
- An accelerator for the specified operation

**Example:**
```typescript
import { getAccelerator } from '@reduct/wasm';

const mapAccelerator = getAccelerator<number[], number[]>(
  'data-structures',
  'list',
  'map'
);

const result = mapAccelerator.execute({
  data: [1, 2, 3],
  fn: x => x * 2
});
```

### Accelerator Interface

Interface for WebAssembly accelerators.

```typescript
interface Accelerator<T, R> {
  execute(input: T): R;
  isAvailable(): boolean;
  getPerformanceProfile(): PerformanceProfile;
}
```

**Methods:**
- `execute(input: T): R`: Executes the accelerated operation
- `isAvailable(): boolean`: Checks if the accelerator is available
- `getPerformanceProfile(): PerformanceProfile`: Gets performance characteristics

## Tiered Optimization API

### AcceleratorTier

Enum representing different tiers of acceleration.

```typescript
enum AcceleratorTier {
  JS_PREFERRED = 'JS_PREFERRED',   // JavaScript is preferred
  CONDITIONAL = 'CONDITIONAL',     // Conditional based on input
  HIGH_VALUE = 'HIGH_VALUE'        // WebAssembly is preferred
}
```

### TieringStrategy

Enum representing different strategies for tier selection.

```typescript
enum TieringStrategy {
  SIZE_BASED = 'SIZE_BASED',           // Based on input size
  COMPLEXITY_BASED = 'COMPLEXITY_BASED', // Based on operation complexity
  ADAPTIVE = 'ADAPTIVE',               // Adapts based on runtime performance
  FREQUENCY_BASED = 'FREQUENCY_BASED'  // Based on call frequency
}
```

### BaseAccelerator

Abstract base class for tiered accelerators.

```typescript
abstract class BaseAccelerator<T, R> implements Accelerator<T, R> {
  constructor(
    domain: string,
    type: string,
    operation: string,
    options?: AcceleratorOptions
  );
  
  execute(input: T): R;
  determineTier(input: T): AcceleratorTier;
  executeWithTier(input: T, tier: AcceleratorTier): R;
  isAvailable(): boolean;
  getPerformanceProfile(): PerformanceProfile;
  getPerformanceStats(): AcceleratorPerformanceStats;
}
```

**Methods:**
- `execute(input: T): R`: Executes the operation with automatic tier selection
- `determineTier(input: T): AcceleratorTier`: Determines the appropriate tier for the input
- `executeWithTier(input: T, tier: AcceleratorTier): R`: Executes the operation with a specific tier
- `isAvailable(): boolean`: Checks if the accelerator is available
- `getPerformanceProfile(): PerformanceProfile`: Gets performance characteristics
- `getPerformanceStats(): AcceleratorPerformanceStats`: Gets detailed performance statistics

### TieredSortAccelerator

Accelerator for array sorting operations.

```typescript
class TieredSortAccelerator extends BaseAccelerator<number[], number[]> {
  constructor(options?: AcceleratorOptions);
  execute(input: number[]): number[];
}
```

**Example:**
```typescript
import { TieredSortAccelerator } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator();
const sortedArray = sortAccelerator.execute([3, 1, 4, 1, 5, 9, 2, 6]);
```

### TieredMapAccelerator

Accelerator for array mapping operations.

```typescript
class TieredMapAccelerator extends BaseAccelerator<[number[], (x: number) => number], number[]> {
  constructor(options?: AcceleratorOptions);
  execute(input: number[], mapFn: (x: number) => number): number[];
}
```

**Example:**
```typescript
import { TieredMapAccelerator } from '@reduct/wasm';

const mapAccelerator = new TieredMapAccelerator();
const result = mapAccelerator.execute([1, 2, 3, 4, 5], x => x * 2);
```

### TieredFilterAccelerator

Accelerator for array filtering operations.

```typescript
class TieredFilterAccelerator extends BaseAccelerator<[number[], (x: number) => boolean], number[]> {
  constructor(options?: AcceleratorOptions);
  execute(input: number[], filterFn: (x: number) => boolean): number[];
}
```

**Example:**
```typescript
import { TieredFilterAccelerator } from '@reduct/wasm';

const filterAccelerator = new TieredFilterAccelerator();
const result = filterAccelerator.execute([1, 2, 3, 4, 5], x => x % 2 === 0);
```

### TieredReduceAccelerator

Accelerator for array reduction operations.

```typescript
class TieredReduceAccelerator extends BaseAccelerator<[number[], (acc: number, x: number) => number, number], number> {
  constructor(options?: AcceleratorOptions);
  execute(input: number[], reduceFn: (acc: number, x: number) => number, initialValue: number): number;
}
```

**Example:**
```typescript
import { TieredReduceAccelerator } from '@reduct/wasm';

const reduceAccelerator = new TieredReduceAccelerator();
const result = reduceAccelerator.execute([1, 2, 3, 4, 5], (acc, x) => acc + x, 0);
```

## Hybrid Acceleration API

### HybridAccelerator

Abstract base class for hybrid accelerators that combine JavaScript and WebAssembly.

```typescript
abstract class HybridAccelerator<T, R> extends BaseAccelerator<T, R> {
  constructor(
    domain: string,
    type: string,
    operation: string,
    options?: HybridAcceleratorOptions<T, R>
  );
  
  execute(input: T): R;
  preprocess(input: T): any;
  process(data: any): any;
  postprocess(result: any): R;
}
```

**Methods:**
- `execute(input: T): R`: Executes the operation with hybrid approach
- `preprocess(input: T): any`: Preprocesses the input (JavaScript)
- `process(data: any): any`: Processes the data (WebAssembly or JavaScript)
- `postprocess(result: any): R`: Postprocesses the result (JavaScript)

### HybridAcceleratorFactory

Factory for creating hybrid accelerators.

```typescript
class HybridAcceleratorFactory {
  static create<T, R>(
    domain: string,
    type: string,
    operation: string,
    implementation: HybridImplementation<T, R>,
    options?: AcceleratorOptions
  ): HybridAccelerator<T, R>;
}
```

**Methods:**
- `create<T, R>(...): HybridAccelerator<T, R>`: Creates a hybrid accelerator

### HybridAcceleratorManager

Manager for hybrid accelerators.

```typescript
class HybridAcceleratorManager {
  static getInstance(): HybridAcceleratorManager;
  getAccelerator<T, R>(
    domain: string,
    type: string,
    operation: string,
    options?: AcceleratorOptions
  ): HybridAccelerator<T, R>;
}
```

**Methods:**
- `getInstance(): HybridAcceleratorManager`: Gets the singleton instance
- `getAccelerator<T, R>(...): HybridAccelerator<T, R>`: Gets a hybrid accelerator

### HybridStringAccelerator

Accelerator for string operations using a hybrid approach.

```typescript
class HybridStringAccelerator extends HybridAccelerator<StringSearchInput, StringSearchResult> {
  constructor(options?: AcceleratorOptions);
  execute(input: StringSearchInput): StringSearchResult;
}
```

**Example:**
```typescript
import { HybridStringAccelerator } from '@reduct/wasm';

const stringAccelerator = new HybridStringAccelerator();
const result = stringAccelerator.execute({
  text: 'hello world',
  pattern: 'world',
  findAll: true
});
```

## Frequency Detection API

### FrequencyDetector

Detects frequently called operations.

```typescript
class FrequencyDetector {
  constructor(options?: FrequencyDetectorOptions);
  recordCall(key: string, input: any): void;
  isFrequentCall(key: string, input: any): boolean;
  getCallCount(key: string): number;
  getFrequentInputs(key: string): any[];
  reset(): void;
}
```

**Methods:**
- `recordCall(key: string, input: any): void`: Records a call
- `isFrequentCall(key: string, input: any): boolean`: Checks if a call is frequent
- `getCallCount(key: string): number`: Gets the call count for a key
- `getFrequentInputs(key: string): any[]`: Gets frequent inputs for a key
- `reset(): void`: Resets the detector

### FrequencyAwareAccelerator

Accelerator that optimizes based on call frequency.

```typescript
class FrequencyAwareAccelerator<T, R> extends BaseAccelerator<T, R> {
  constructor(
    domain: string,
    type: string,
    operation: string,
    options?: FrequencyAwareAcceleratorOptions
  );
  
  execute(input: T): R;
  determineTier(input: T): AcceleratorTier;
}
```

**Methods:**
- `execute(input: T): R`: Executes the operation with frequency awareness
- `determineTier(input: T): AcceleratorTier`: Determines the tier based on frequency

### FrequencyAwareAcceleratorFactory

Factory for creating frequency-aware accelerators.

```typescript
class FrequencyAwareAcceleratorFactory {
  static create<T, R>(
    domain: string,
    type: string,
    operation: string,
    options?: AcceleratorOptions
  ): FrequencyAwareAccelerator<T, R>;
}
```

**Methods:**
- `create<T, R>(...): FrequencyAwareAccelerator<T, R>`: Creates a frequency-aware accelerator

### FrequencyAwareAcceleratorManager

Manager for frequency-aware accelerators.

```typescript
class FrequencyAwareAcceleratorManager {
  static getInstance(): FrequencyAwareAcceleratorManager;
  getAccelerator<T, R>(
    domain: string,
    type: string,
    operation: string,
    options?: AcceleratorOptions
  ): FrequencyAwareAccelerator<T, R>;
}
```

**Methods:**
- `getInstance(): FrequencyAwareAcceleratorManager`: Gets the singleton instance
- `getAccelerator<T, R>(...): FrequencyAwareAccelerator<T, R>`: Gets a frequency-aware accelerator

## Memory Management API

### WasmMemoryPool

Pool for managing WebAssembly memory instances.

```typescript
class WasmMemoryPool {
  constructor(options?: WasmMemoryPoolOptions);
  getMemory(minBytes: number): WebAssembly.Memory;
  releaseMemory(memory: WebAssembly.Memory): void;
  getTypedArrayView<T extends ArrayBufferView>(
    memory: WebAssembly.Memory,
    type: new (buffer: ArrayBuffer, byteOffset?: number, length?: number) => T,
    byteOffset?: number,
    length?: number
  ): T;
}
```

**Methods:**
- `getMemory(minBytes: number): WebAssembly.Memory`: Gets a memory instance
- `releaseMemory(memory: WebAssembly.Memory): void`: Releases a memory instance
- `getTypedArrayView<T>(...): T`: Gets a typed array view of a memory instance

### getTypedArrayView

Gets a typed array view of a WebAssembly memory instance.

```typescript
function getTypedArrayView<T extends ArrayBufferView>(
  memory: WebAssembly.Memory,
  type: new (buffer: ArrayBuffer, byteOffset?: number, length?: number) => T,
  byteOffset?: number,
  length?: number
): T;
```

**Parameters:**
- `memory`: The WebAssembly memory instance
- `type`: The typed array constructor
- `byteOffset`: Optional byte offset
- `length`: Optional length

**Returns:**
- A typed array view of the memory instance

## Benchmarking API

### benchmark

Benchmarks JavaScript and WebAssembly implementations.

```typescript
function benchmark<T, R>(
  jsImplementation: (input: T) => R,
  wasmAccelerator: Accelerator<T, R>,
  input: T,
  options?: BenchmarkOptions
): BenchmarkResult;
```

**Parameters:**
- `jsImplementation`: The JavaScript implementation
- `wasmAccelerator`: The WebAssembly accelerator
- `input`: The input data
- `options`: Optional benchmark options

**Returns:**
- A benchmark result object

**Example:**
```typescript
import { benchmark } from '@reduct/wasm';

const jsImplementation = (input: number[]) => input.map(x => x * 2);
const wasmAccelerator = getAccelerator<number[], number[]>(
  'data-structures',
  'list',
  'map'
);

const result = benchmark(
  jsImplementation,
  wasmAccelerator,
  [1, 2, 3, 4, 5]
);

console.log(`JavaScript time: ${result.jsTime}ms`);
console.log(`WebAssembly time: ${result.wasmTime}ms`);
console.log(`Speedup: ${result.speedup}x`);
```

### formatBenchmarkResult

Formats a benchmark result as a string.

```typescript
function formatBenchmarkResult(result: BenchmarkResult): string;
```

**Parameters:**
- `result`: The benchmark result

**Returns:**
- A formatted string representation of the result
