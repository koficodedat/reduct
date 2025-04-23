/**
 * Script to run WebAssembly benchmarks and generate charts
 */

import { runInputSizeBenchmarks } from './runners/input-size-benchmark-runner';
import { DataTypeCategory, InputSizeCategory } from './suites/wasm-optimization/input-size-benchmark';
import { generateCharts } from './visualization/chart-generator';

/**
 * Run WebAssembly benchmarks and generate charts
 */
async function runWasmBenchmarks(): Promise<void> {
  console.log('Running WebAssembly benchmarks...');

  // Run benchmarks for common array operations
  await runInputSizeBenchmarks({
    operations: ['map', 'filter', 'reduce', 'sort', 'find'],
    sizeCategories: [
      InputSizeCategory.TINY,
      InputSizeCategory.SMALL,
      InputSizeCategory.MEDIUM
    ],
    dataTypeCategories: [
      DataTypeCategory.NUMBER,
      DataTypeCategory.STRING
    ],
    iterations: 50,
    warmupIterations: 5
  });

  console.log('Generating charts...');

  // Generate charts from benchmark results
  generateCharts();

  console.log('WebAssembly benchmarks completed');
}

/**
 * Run the script from the command line
 */
if (require.main === module) {
  runWasmBenchmarks()
    .then(() => console.log('Done'))
    .catch(error => console.error('Error:', error));
}
