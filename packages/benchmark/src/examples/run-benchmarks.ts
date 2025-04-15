/**
 * Example benchmark runner
 *
 * This script demonstrates how to use the benchmark package to run
 * performance tests on Reduct data structures and algorithms.
 */

import {
  runListBenchmarks,
  compareListWithNativeArray,
  runMapBenchmarks,
  compareMapWithNativeMap,
  runSortingBenchmarks,
  runSortingBenchmarkSuite,
  runSearchingBenchmarks,
  measureListScalability,
  measureMapScalability,
  measureSortingScalability,
  measureSearchingScalability,
} from '../runners';

import {
  formatBenchmarkSuite,
  formatScalabilityResult,
  exportSuiteToCSV,
  exportScalabilityToCSV,
} from '../visualization';

import { quickSort, binarySearch } from '@reduct/algorithms';

// Run list benchmarks
console.log('Running List benchmarks...');
const listBenchmarks = runListBenchmarks(1000);
console.log(formatBenchmarkSuite(listBenchmarks));

// Compare List with native array
console.log('Comparing List with native array...');
console.log(compareListWithNativeArray(1000));

// Run Map benchmarks
console.log('Running Map benchmarks...');
const mapBenchmarks = runMapBenchmarks(1000);
console.log(formatBenchmarkSuite(mapBenchmarks));

// Compare Map with native Map
console.log('Comparing Map with native Map...');
console.log(compareMapWithNativeMap(1000));

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
