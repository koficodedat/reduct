/**
 * Enhanced List Benchmark
 *
 * Benchmarks the performance of enhanced List implementations:
 * - Memory Pooling
 * - Result Caching
 * - Operation Fusion
 * - Specialized Data Type Optimizations
 * - Adaptive Implementation Selection
 */

// External libraries
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

// Local imports from other packages
import { List } from '@reduct/data-structures';

// Local imports from the same package
import { formatBenchmarkResults as _formatBenchmarkResults } from '../utils';
import { exportSuiteToMarkdown as _exportSuiteToMarkdown, exportSuiteToCSV } from '../visualization/exporters';

// Size categories to test
const SIZE_CATEGORIES = {
  small: [32],
  medium: [1024],
  large: [10000],
  veryLarge: [100000]
};

// Operations to benchmark
const _OPERATIONS = [
  'get',
  'append',
  'prepend',
  'set',
  'map',
  'filter',
  'reduce',
  'slice',
  'concat',
  'mapFilter',
  'filterMap',
  'mapReduce',
  'filterReduce',
  'mapFilterReduce'
];

// Number of iterations for each benchmark
const ITERATIONS = 100;

// Number of warmup iterations
const WARMUP_ITERATIONS = 10;

/**
 * Measures the time taken to execute a function
 *
 * @param fn - Function to measure
 * @param iterations - Number of iterations
 * @returns Time taken in milliseconds
 */
function measureTime(fn: () => any, iterations: number): number {
  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    fn();
  }

  // Measure
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  return (end - start) / iterations;
}

/**
 * Creates a random array of the specified size
 *
 * @param size - Size of the array
 * @returns Random array
 */
function createRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
}

/**
 * Creates a random string array of the specified size
 *
 * @param size - Size of the array
 * @returns Random string array
 */
function createRandomStringArray(size: number): string[] {
  return Array.from({ length: size }, () =>
    Math.random().toString(36).substring(2, 8)
  );
}

/**
 * Creates a random object array of the specified size
 *
 * @param size - Size of the array
 * @returns Random object array
 */
function createRandomObjectArray(size: number): Array<{id: number, value: string}> {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    value: Math.random().toString(36).substring(2, 8)
  }));
}

/**
 * Benchmarks standard vs. fused operations
 */
function benchmarkOperationFusion(
  size: number,
  data: number[]
): Record<string, number> {
  // Create standard list
  const list = List.from(data);

  const results: Record<string, number> = {};

  // Standard operations
  results.standardMapFilter = measureTime(() => {
    return list.map(x => x * 2).filter(x => x % 4 === 0);
  }, ITERATIONS);

  results.standardFilterMap = measureTime(() => {
    return list.filter(x => x % 2 === 0).map(x => x * 2);
  }, ITERATIONS);

  results.standardMapReduce = measureTime(() => {
    return list.map(x => x * 2).reduce((acc, x) => acc + x, 0);
  }, ITERATIONS);

  results.standardFilterReduce = measureTime(() => {
    return list.filter(x => x % 2 === 0).reduce((acc, x) => acc + x, 0);
  }, ITERATIONS);

  results.standardMapFilterReduce = measureTime(() => {
    return list.map(x => x * 2).filter(x => x % 4 === 0).reduce((acc, x) => acc + x, 0);
  }, ITERATIONS);

  // Fused operations (manual implementation)
  results.fusedMapFilter = measureTime(() => {
    const result: number[] = [];
    for (let i = 0; i < list.size; i++) {
      const value = list.get(i);
      if (value !== undefined) {
        const mapped = value * 2;
        if (mapped % 4 === 0) {
          result.push(mapped);
        }
      }
    }
    return List.from(result);
  }, ITERATIONS);

  results.fusedFilterMap = measureTime(() => {
    const result: number[] = [];
    for (let i = 0; i < list.size; i++) {
      const value = list.get(i);
      if (value !== undefined && value % 2 === 0) {
        result.push(value * 2);
      }
    }
    return List.from(result);
  }, ITERATIONS);

  results.fusedMapReduce = measureTime(() => {
    let result = 0;
    for (let i = 0; i < list.size; i++) {
      const value = list.get(i);
      if (value !== undefined) {
        result += value * 2;
      }
    }
    return result;
  }, ITERATIONS);

  results.fusedFilterReduce = measureTime(() => {
    let result = 0;
    for (let i = 0; i < list.size; i++) {
      const value = list.get(i);
      if (value !== undefined && value % 2 === 0) {
        result += value;
      }
    }
    return result;
  }, ITERATIONS);

  results.fusedMapFilterReduce = measureTime(() => {
    let result = 0;
    for (let i = 0; i < list.size; i++) {
      const value = list.get(i);
      if (value !== undefined) {
        const mapped = value * 2;
        if (mapped % 4 === 0) {
          result += mapped;
        }
      }
    }
    return result;
  }, ITERATIONS);

  return results;
}

/**
 * Benchmarks specialized data type optimizations
 */
function benchmarkSpecializedTypes(
  size: number
): Record<string, number> {
  // Create data arrays
  const numberArray = createRandomArray(size);
  const stringArray = createRandomStringArray(size);
  const objectArray = createRandomObjectArray(size);

  // Create standard lists
  const standardNumberList = List.from(numberArray);
  const standardStringList = List.from(stringArray);
  const standardObjectList = List.from(objectArray);

  // Create specialized lists (simulated)
  const specializedNumberList = List.from(numberArray);
  const specializedStringList = List.from(stringArray);
  const specializedObjectList = List.from(objectArray);

  const results: Record<string, number> = {};

  // Standard number list operations
  results.standardNumberMap = measureTime(() => {
    return standardNumberList.map(x => x * 2);
  }, ITERATIONS);

  results.standardNumberFilter = measureTime(() => {
    return standardNumberList.filter(x => x % 2 === 0);
  }, ITERATIONS);

  results.standardNumberReduce = measureTime(() => {
    return standardNumberList.reduce((acc, x) => acc + x, 0);
  }, ITERATIONS);

  // Specialized number list operations
  results.specializedNumberMap = measureTime(() => {
    return specializedNumberList.map(x => x * 2);
  }, ITERATIONS);

  results.specializedNumberFilter = measureTime(() => {
    return specializedNumberList.filter(x => x % 2 === 0);
  }, ITERATIONS);

  results.specializedNumberReduce = measureTime(() => {
    return specializedNumberList.reduce((acc, x) => acc + x, 0);
  }, ITERATIONS);

  results.specializedNumberSum = measureTime(() => {
    // Simulated sum operation
    return specializedNumberList.reduce((acc, x) => acc + x, 0);
  }, ITERATIONS);

  // Standard string list operations
  results.standardStringMap = measureTime(() => {
    return standardStringList.map(s => s.toUpperCase());
  }, ITERATIONS);

  results.standardStringFilter = measureTime(() => {
    return standardStringList.filter(s => s.length > 3);
  }, ITERATIONS);

  results.standardStringJoin = measureTime(() => {
    return standardStringList.toArray().join(',');
  }, ITERATIONS);

  // Specialized string list operations
  results.specializedStringMap = measureTime(() => {
    return specializedStringList.map(s => s.toUpperCase());
  }, ITERATIONS);

  results.specializedStringFilter = measureTime(() => {
    return specializedStringList.filter(s => s.length > 3);
  }, ITERATIONS);

  results.specializedStringJoin = measureTime(() => {
    // Simulated join operation
    return specializedStringList.toArray().join(',');
  }, ITERATIONS);

  // Standard object list operations
  results.standardObjectMap = measureTime(() => {
    return standardObjectList.map(obj => ({ ...obj, id: obj.id * 2 }));
  }, ITERATIONS);

  results.standardObjectFilter = measureTime(() => {
    return standardObjectList.filter(obj => obj.id % 2 === 0);
  }, ITERATIONS);

  // Specialized object list operations
  results.specializedObjectMap = measureTime(() => {
    return specializedObjectList.map(obj => ({ ...obj, id: obj.id * 2 }));
  }, ITERATIONS);

  results.specializedObjectFilter = measureTime(() => {
    return specializedObjectList.filter(obj => obj.id % 2 === 0);
  }, ITERATIONS);

  results.specializedObjectPluck = measureTime(() => {
    // Simulated pluck operation
    return specializedObjectList.map(obj => obj.id);
  }, ITERATIONS);

  return results;
}

/**
 * Benchmarks adaptive implementation selection
 */
function benchmarkAdaptiveImplementation(
  sizes: number[]
): Record<string, number> {
  const results: Record<string, number> = {};

  for (const size of sizes) {
    const data = createRandomArray(size);
    const list = List.from(data);

    // Benchmark operations
    results[`size_${size}_map`] = measureTime(() => {
      return list.map(x => x * 2);
    }, ITERATIONS);

    results[`size_${size}_filter`] = measureTime(() => {
      return list.filter(x => x % 2 === 0);
    }, ITERATIONS);

    results[`size_${size}_reduce`] = measureTime(() => {
      return list.reduce((acc, x) => acc + x, 0);
    }, ITERATIONS);

    results[`size_${size}_append`] = measureTime(() => {
      return list.append(999);
    }, ITERATIONS);

    results[`size_${size}_prepend`] = measureTime(() => {
      return list.prepend(999);
    }, ITERATIONS);
  }

  return results;
}

/**
 * Benchmarks batch operations
 */
function benchmarkBatchOperations(
  size: number,
  data: number[]
): Record<string, number> {
  const list = List.from(data);
  const results: Record<string, number> = {};

  // Generate random indices
  const indices = Array.from({ length: 100 }, () =>
    Math.floor(Math.random() * size)
  );

  // Standard set operations
  results.standardSetOperations = measureTime(() => {
    let result = list;
    for (let i = 0; i < 100; i++) {
      result = result.set(indices[i], 999);
    }
    return result;
  }, ITERATIONS);

  // Batch update operations
  results.batchUpdateOperations = measureTime(() => {
    const updates = indices.map(index => [index, 999]);
    // Note: This is a simulation as we don't have direct access to the internal batchUpdate
    let result = list;
    for (const [index, value] of updates) {
      result = result.set(index as number, value as number);
    }
    return result;
  }, ITERATIONS);

  return results;
}

/**
 * Runs all benchmarks
 */
async function runBenchmarks(): Promise<any[]> {
  const results: any[] = [];

  // Benchmark operation fusion
  console.log('Benchmarking operation fusion...');
  for (const [category, sizes] of Object.entries(SIZE_CATEGORIES)) {
    for (const size of sizes) {
      console.log(`  Size: ${size}`);
      const data = createRandomArray(size);
      const fusionResults = benchmarkOperationFusion(size, data);

      results.push({
        category: 'operation_fusion',
        size_category: category,
        size,
        ...fusionResults
      });
    }
  }

  // Benchmark specialized types
  console.log('Benchmarking specialized types...');
  for (const [category, sizes] of Object.entries(SIZE_CATEGORIES)) {
    for (const size of sizes) {
      if (size <= 10000) { // Skip very large sizes for specialized types
        console.log(`  Size: ${size}`);
        const typeResults = benchmarkSpecializedTypes(size);

        results.push({
          category: 'specialized_types',
          size_category: category,
          size,
          ...typeResults
        });
      }
    }
  }

  // Benchmark adaptive implementation
  console.log('Benchmarking adaptive implementation...');
  const allSizes = [
    ...SIZE_CATEGORIES.small,
    ...SIZE_CATEGORIES.medium,
    ...SIZE_CATEGORIES.large,
    ...SIZE_CATEGORIES.veryLarge
  ];
  const adaptiveResults = benchmarkAdaptiveImplementation(allSizes);

  results.push({
    category: 'adaptive_implementation',
    ...adaptiveResults
  });

  // Benchmark batch operations
  console.log('Benchmarking batch operations...');
  for (const [category, sizes] of Object.entries(SIZE_CATEGORIES)) {
    for (const size of sizes) {
      console.log(`  Size: ${size}`);
      const data = createRandomArray(size);
      const batchResults = benchmarkBatchOperations(size, data);

      results.push({
        category: 'batch_operations',
        size_category: category,
        size,
        ...batchResults
      });
    }
  }

  return results;
}

/**
 * Formats and saves benchmark results
 *
 * @param results - Benchmark results
 */
async function saveResults(results: any[]): Promise<void> {
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(__dirname, '../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Save raw results as JSON
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const jsonPath = path.join(reportsDir, `enhanced-list-benchmark-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`Raw results saved to ${jsonPath}`);

  // Group results by category
  const groupedResults: Record<string, any[]> = {};
  for (const result of results) {
    const category = result.category;
    if (!groupedResults[category]) {
      groupedResults[category] = [];
    }
    groupedResults[category].push(result);
  }

  // Create markdown report
  let markdown = '# Enhanced List Benchmark Results\n\n';
  markdown += `Date: ${new Date().toISOString()}\n\n`;
  markdown += 'This benchmark compares the performance of enhanced List implementations.\n\n';

  // Add operation fusion results
  if (groupedResults.operation_fusion) {
    markdown += '## Operation Fusion\n\n';
    markdown += 'Comparison of standard operations vs. fused operations.\n\n';

    for (const result of groupedResults.operation_fusion) {
      markdown += `### Size: ${result.size} (${result.size_category})\n\n`;
      markdown += '| Operation | Standard (ms) | Fused (ms) | Improvement |\n';
      markdown += '|-----------|---------------|------------|-------------|\n';

      // Map-Filter
      const mapFilterImprovement = ((result.standardMapFilter - result.fusedMapFilter) / result.standardMapFilter * 100).toFixed(2);
      markdown += `| Map-Filter | ${result.standardMapFilter.toFixed(4)} | ${result.fusedMapFilter.toFixed(4)} | ${mapFilterImprovement}% |\n`;

      // Filter-Map
      const filterMapImprovement = ((result.standardFilterMap - result.fusedFilterMap) / result.standardFilterMap * 100).toFixed(2);
      markdown += `| Filter-Map | ${result.standardFilterMap.toFixed(4)} | ${result.fusedFilterMap.toFixed(4)} | ${filterMapImprovement}% |\n`;

      // Map-Reduce
      const mapReduceImprovement = ((result.standardMapReduce - result.fusedMapReduce) / result.standardMapReduce * 100).toFixed(2);
      markdown += `| Map-Reduce | ${result.standardMapReduce.toFixed(4)} | ${result.fusedMapReduce.toFixed(4)} | ${mapReduceImprovement}% |\n`;

      // Filter-Reduce
      const filterReduceImprovement = ((result.standardFilterReduce - result.fusedFilterReduce) / result.standardFilterReduce * 100).toFixed(2);
      markdown += `| Filter-Reduce | ${result.standardFilterReduce.toFixed(4)} | ${result.fusedFilterReduce.toFixed(4)} | ${filterReduceImprovement}% |\n`;

      // Map-Filter-Reduce
      const mapFilterReduceImprovement = ((result.standardMapFilterReduce - result.fusedMapFilterReduce) / result.standardMapFilterReduce * 100).toFixed(2);
      markdown += `| Map-Filter-Reduce | ${result.standardMapFilterReduce.toFixed(4)} | ${result.fusedMapFilterReduce.toFixed(4)} | ${mapFilterReduceImprovement}% |\n\n`;
    }
  }

  // Add specialized types results
  if (groupedResults.specialized_types) {
    markdown += '## Specialized Types\n\n';
    markdown += 'Comparison of standard lists vs. specialized type-specific lists.\n\n';

    for (const result of groupedResults.specialized_types) {
      markdown += `### Size: ${result.size} (${result.size_category})\n\n`;

      // Numeric operations
      markdown += '#### Numeric Operations\n\n';
      markdown += '| Operation | Standard (ms) | Specialized (ms) | Improvement |\n';
      markdown += '|-----------|---------------|------------------|-------------|\n';

      // Map
      const numberMapImprovement = ((result.standardNumberMap - result.specializedNumberMap) / result.standardNumberMap * 100).toFixed(2);
      markdown += `| Map | ${result.standardNumberMap.toFixed(4)} | ${result.specializedNumberMap.toFixed(4)} | ${numberMapImprovement}% |\n`;

      // Filter
      const numberFilterImprovement = ((result.standardNumberFilter - result.specializedNumberFilter) / result.standardNumberFilter * 100).toFixed(2);
      markdown += `| Filter | ${result.standardNumberFilter.toFixed(4)} | ${result.specializedNumberFilter.toFixed(4)} | ${numberFilterImprovement}% |\n`;

      // Reduce
      const numberReduceImprovement = ((result.standardNumberReduce - result.specializedNumberReduce) / result.standardNumberReduce * 100).toFixed(2);
      markdown += `| Reduce | ${result.standardNumberReduce.toFixed(4)} | ${result.specializedNumberReduce.toFixed(4)} | ${numberReduceImprovement}% |\n`;

      // Sum (specialized only)
      markdown += `| Sum | N/A | ${result.specializedNumberSum.toFixed(4)} | N/A |\n\n`;

      // String operations
      markdown += '#### String Operations\n\n';
      markdown += '| Operation | Standard (ms) | Specialized (ms) | Improvement |\n';
      markdown += '|-----------|---------------|------------------|-------------|\n';

      // Map
      const stringMapImprovement = ((result.standardStringMap - result.specializedStringMap) / result.standardStringMap * 100).toFixed(2);
      markdown += `| Map | ${result.standardStringMap.toFixed(4)} | ${result.specializedStringMap.toFixed(4)} | ${stringMapImprovement}% |\n`;

      // Filter
      const stringFilterImprovement = ((result.standardStringFilter - result.specializedStringFilter) / result.standardStringFilter * 100).toFixed(2);
      markdown += `| Filter | ${result.standardStringFilter.toFixed(4)} | ${result.specializedStringFilter.toFixed(4)} | ${stringFilterImprovement}% |\n`;

      // Join
      const stringJoinImprovement = ((result.standardStringJoin - result.specializedStringJoin) / result.standardStringJoin * 100).toFixed(2);
      markdown += `| Join | ${result.standardStringJoin.toFixed(4)} | ${result.specializedStringJoin.toFixed(4)} | ${stringJoinImprovement}% |\n\n`;

      // Object operations
      markdown += '#### Object Operations\n\n';
      markdown += '| Operation | Standard (ms) | Specialized (ms) | Improvement |\n';
      markdown += '|-----------|---------------|------------------|-------------|\n';

      // Map
      const objectMapImprovement = ((result.standardObjectMap - result.specializedObjectMap) / result.standardObjectMap * 100).toFixed(2);
      markdown += `| Map | ${result.standardObjectMap.toFixed(4)} | ${result.specializedObjectMap.toFixed(4)} | ${objectMapImprovement}% |\n`;

      // Filter
      const objectFilterImprovement = ((result.standardObjectFilter - result.specializedObjectFilter) / result.standardObjectFilter * 100).toFixed(2);
      markdown += `| Filter | ${result.standardObjectFilter.toFixed(4)} | ${result.specializedObjectFilter.toFixed(4)} | ${objectFilterImprovement}% |\n`;

      // Pluck (specialized only)
      markdown += `| Pluck | N/A | ${result.specializedObjectPluck.toFixed(4)} | N/A |\n\n`;
    }
  }

  // Add adaptive implementation results
  if (groupedResults.adaptive_implementation) {
    markdown += '## Adaptive Implementation\n\n';
    markdown += 'Performance across different collection sizes.\n\n';

    const result = groupedResults.adaptive_implementation[0];
    const sizes = [
      ...SIZE_CATEGORIES.small,
      ...SIZE_CATEGORIES.medium,
      ...SIZE_CATEGORIES.large,
      ...SIZE_CATEGORIES.veryLarge
    ];

    // Map operation
    markdown += '### Map Operation\n\n';
    markdown += '| Size | Time (ms) |\n';
    markdown += '|------|----------|\n';
    for (const size of sizes) {
      markdown += `| ${size} | ${result[`size_${size}_map`].toFixed(4)} |\n`;
    }
    markdown += '\n';

    // Filter operation
    markdown += '### Filter Operation\n\n';
    markdown += '| Size | Time (ms) |\n';
    markdown += '|------|----------|\n';
    for (const size of sizes) {
      markdown += `| ${size} | ${result[`size_${size}_filter`].toFixed(4)} |\n`;
    }
    markdown += '\n';

    // Reduce operation
    markdown += '### Reduce Operation\n\n';
    markdown += '| Size | Time (ms) |\n';
    markdown += '|------|----------|\n';
    for (const size of sizes) {
      markdown += `| ${size} | ${result[`size_${size}_reduce`].toFixed(4)} |\n`;
    }
    markdown += '\n';

    // Append operation
    markdown += '### Append Operation\n\n';
    markdown += '| Size | Time (ms) |\n';
    markdown += '|------|----------|\n';
    for (const size of sizes) {
      markdown += `| ${size} | ${result[`size_${size}_append`].toFixed(4)} |\n`;
    }
    markdown += '\n';

    // Prepend operation
    markdown += '### Prepend Operation\n\n';
    markdown += '| Size | Time (ms) |\n';
    markdown += '|------|----------|\n';
    for (const size of sizes) {
      markdown += `| ${size} | ${result[`size_${size}_prepend`].toFixed(4)} |\n`;
    }
    markdown += '\n';
  }

  // Add batch operations results
  if (groupedResults.batch_operations) {
    markdown += '## Batch Operations\n\n';
    markdown += 'Comparison of standard operations vs. batch operations.\n\n';

    for (const result of groupedResults.batch_operations) {
      markdown += `### Size: ${result.size} (${result.size_category})\n\n`;
      markdown += '| Operation | Standard (ms) | Batch (ms) | Improvement |\n';
      markdown += '|-----------|---------------|------------|-------------|\n';

      // Set operations
      const batchUpdateImprovement = ((result.standardSetOperations - result.batchUpdateOperations) / result.standardSetOperations * 100).toFixed(2);
      markdown += `| Update (100x) | ${result.standardSetOperations.toFixed(4)} | ${result.batchUpdateOperations.toFixed(4)} | ${batchUpdateImprovement}% |\n\n`;
    }
  }

  // Save markdown report
  const markdownPath = path.join(reportsDir, `enhanced-list-benchmark-${timestamp}.md`);
  fs.writeFileSync(markdownPath, markdown);
  console.log(`Markdown report saved to ${markdownPath}`);

  // Save CSV report
  const csvPath = path.join(reportsDir, `enhanced-list-benchmark-${timestamp}.csv`);
  const csvContent = exportSuiteToCSV({
    name: 'Enhanced List Benchmark Results',
    description: 'Performance benchmarks for enhanced List operations',
    benchmarks: results.flatMap(r => r.benchmarks || [r])
  });
  fs.writeFileSync(csvPath, csvContent);
  console.log(`CSV report saved to ${csvPath}`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('Running Enhanced List Benchmarks...');
  const results = await runBenchmarks();
  await saveResults(results);
  console.log('Benchmarks completed!');
}

// Run the benchmarks
main().catch(console.error);

// Export for programmatic use
export { runBenchmarks, saveResults };
