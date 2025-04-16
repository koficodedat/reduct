# @reduct/benchmark

Benchmarking infrastructure for the Reduct library.

## Features

- Performance benchmarking for data structures and algorithms
- Complexity analysis tools
- Visualization utilities
- Comparative benchmarks
- Exportable results

## Installation

```bash
npm install @reduct/benchmark
# or
yarn add @reduct/benchmark
```

## Usage

```typescript
import { runListBenchmark, formatResults } from '@reduct/benchmark';
import { List } from '@reduct/data-structures';

// Run benchmarks
const results = runListBenchmark({
  name: 'List Operations',
  implementations: {
    'Reduct List': List,
    'Native Array': Array
  },
  operations: ['append', 'prepend', 'get', 'map', 'filter'],
  sizes: [100, 1000, 10000]
});

// Format and display results
console.log(formatResults(results));

// Export results
saveResultsToCSV(results, 'list-benchmark-results.csv');
```

## Documentation

For detailed documentation, see the [API documentation](https://reduct.dev/docs/api/benchmark).
