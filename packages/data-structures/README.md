# @reduct/data-structures

Immutable data structures for the Reduct library.

## Features

- Immutable List with multiple optimized implementations
- Lazy evaluation for efficient operation chains
- Structural sharing for performance
- WebAssembly acceleration for numeric operations
- Specialized implementations for different data types
- Signal processing with WebAssembly acceleration
- Matrix operations with WebAssembly acceleration

## Installation

```bash
npm install @reduct/data-structures
# or
yarn add @reduct/data-structures
```

## Usage

```typescript
import { List, numericList, stringList, objectList } from '@reduct/data-structures';

// Basic List example
const list = List.of(1, 2, 3);
const newList = list.append(4).prepend(0);
console.log(newList.toArray()); // [0, 1, 2, 3, 4]

// Specialized list examples
const numbers = numericList([1, 2, 3, 4, 5]);
const sum = numbers.sum();
const avg = numbers.average();

const strings = stringList(['apple', 'banana', 'cherry']);
const joined = strings.join(', ');

const objects = objectList([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
]);
const names = objects.pluck('name').toArray(); // ['Alice', 'Bob', 'Charlie']
```

## WebAssembly Acceleration

The library automatically uses WebAssembly acceleration for numeric operations when available:

```typescript
import { numericList, WasmNumericList, isWebAssemblySupported } from '@reduct/data-structures';

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a list of numbers
const numbers = numericList([1, 2, 3, 4, 5]);

// Operations will automatically use WebAssembly when appropriate
const doubled = numbers.map(x => x * 2);
const filtered = numbers.filter(x => x > 2);
const sum = numbers.sum();
const avg = numbers.average();
const median = numbers.median();
const stdDev = numbers.standardDeviation();

// You can also use the WebAssembly-accelerated implementation directly
const wasmList = new WasmNumericList([1, 2, 3, 4, 5]);
const sortedList = wasmList.sort();
const percentile = wasmList.percentile(0.5); // 50th percentile
```

## Additional Features

### Signal Processing

```typescript
import { WasmSignalProcessor } from '@reduct/data-structures';

const processor = new WasmSignalProcessor();

// Fast Fourier Transform (FFT)
const signal = [1, 0, 1, 0, 1, 0, 1, 0];
const fft = processor.fft(signal);

// Inverse FFT
const ifft = processor.ifft(fft);

// Convolution
const signal1 = [1, 2, 3, 4];
const signal2 = [0.5, 0.5];
const convolved = processor.convolve(signal1, signal2);
```

### Matrix Operations

```typescript
import { WasmNumericMatrix } from '@reduct/data-structures';

// Create matrices
const matrixA = WasmNumericMatrix.from([
  [1, 2, 3],
  [4, 5, 6]
]);

const matrixB = WasmNumericMatrix.from([
  [7, 8],
  [9, 10],
  [11, 12]
]);

// Matrix multiplication
const result = matrixA.multiply(matrixB);
console.log(result.toArray());
// [[58, 64], [139, 154]]
```

## Documentation

For detailed documentation, see the [API documentation](https://reduct.dev/docs/api/data-structures).
