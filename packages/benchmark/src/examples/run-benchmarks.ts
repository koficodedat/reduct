/**
 * Example benchmark runner
 *
 * This script demonstrates how to use the benchmark package to run
 * performance tests on Reduct data structures and algorithms.
 *
 * @packageDocumentation
 */

import { quickSort, binarySearch } from '@reduct/algorithms';

import { runSearchingBenchmarks, measureSearchingScalability } from '../algorithms/searching';
import { runSortingBenchmarks, runSortingBenchmarkSuite, measureSortingScalability } from '../algorithms/sorting';
import { compareImplementationsWithAdapters } from '../comparison/adapter-based';
import { runListBenchmarks, measureListScalability } from '../data-structures/list';
import { runMapBenchmarks, measureMapScalability } from '../data-structures/map';
import { runStackBenchmarks, measureStackScalability } from '../data-structures/stack';
import {
  formatBenchmarkSuite,
  formatScalabilityResult,
  exportSuiteToCSV,
  exportScalabilityToCSV,
} from '../visualization';


// Run list benchmarks
console.log('Running List benchmarks...');
const listBenchmarks = runListBenchmarks(1000);
console.log(formatBenchmarkSuite(listBenchmarks));

// Compare List with native array
console.log('Comparing List with native array...');
const listComparisons = compareImplementationsWithAdapters(
  ['reduct-list', 'native-array'],
  { size: 1000 }
);
console.log(listComparisons[0]);

// Run Map benchmarks
console.log('Running Map benchmarks...');
const mapBenchmarks = runMapBenchmarks(1000);
console.log(formatBenchmarkSuite(mapBenchmarks));

// Compare Map with native Map
console.log('Comparing Map with native Map...');
const mapComparisons = compareImplementationsWithAdapters(
  ['reduct-map', 'native-map'],
  { size: 1000 }
);
console.log(mapComparisons[0]);

// Run Stack benchmarks
console.log('Running Stack benchmarks...');
const stackBenchmarks = runStackBenchmarks(1000);
console.log(formatBenchmarkSuite(stackBenchmarks));

// Compare Stack with native array
console.log('Comparing Stack with native array...');
const stackComparisons = compareImplementationsWithAdapters(
  ['reduct-stack', 'native-array'],
  { size: 1000 }
);
console.log(stackComparisons[0]);

// Run sorting benchmarks
console.log('Running sorting benchmarks...');
const sortingBenchmarks = runSortingBenchmarks(1000);
console.log(formatBenchmarkSuite(sortingBenchmarks));

// Run sorting benchmark suite with different array types
console.log('Running sorting benchmark suite...');
const sortingSuite = runSortingBenchmarkSuite(1000);
console.log(formatBenchmarkSuite(sortingSuite.random));
console.log(formatBenchmarkSuite(sortingSuite.sorted));
console.log(formatBenchmarkSuite(sortingSuite.reversed));
console.log(formatBenchmarkSuite(sortingSuite.partiallySorted));

// Run searching benchmarks
console.log('Running searching benchmarks...');
const searchingBenchmarks = runSearchingBenchmarks(1000);
console.log(formatBenchmarkSuite(searchingBenchmarks));

// Measure List scalability
console.log('Measuring List scalability...');
const listScalability = measureListScalability('map', 10000, 5);
console.log(formatScalabilityResult(listScalability));

// Measure Map scalability
console.log('Measuring Map scalability...');
const mapScalability = measureMapScalability('get', 10000, 5);
console.log(formatScalabilityResult(mapScalability));

// Measure Stack scalability
console.log('Measuring Stack scalability...');
const stackScalability = measureStackScalability('push', 10000, 5);
console.log(formatScalabilityResult(stackScalability));

// Measure sorting algorithm scalability
console.log('Measuring sorting algorithm scalability...');
const sortingScalability = measureSortingScalability(quickSort, 'quickSort', 10000, 5);
console.log(formatScalabilityResult(sortingScalability));

// Measure searching algorithm scalability
console.log('Measuring searching algorithm scalability...');
const searchingScalability = measureSearchingScalability(binarySearch, 'binarySearch', 100000, 5);
console.log(formatScalabilityResult(searchingScalability));

// Export results to CSV
console.log('\nExporting results to CSV...');
const listCsv = exportSuiteToCSV(listBenchmarks);
console.log('List benchmarks CSV:');
console.log(listCsv.slice(0, 200) + '...');

const scalabilityCsv = exportScalabilityToCSV(sortingScalability);
console.log('Sorting scalability CSV:');
console.log(scalabilityCsv);
