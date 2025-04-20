/**
 * Example demonstrating WebAssembly acceleration for numeric operations
 */
import { List } from '../src';
// Import from our mock implementation instead of the actual package
import { isWebAssemblySupported } from '../src/utils/mock-wasm';

console.log('WebAssembly Acceleration Example');
console.log('===============================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a large array of random numbers
console.log('\nCreating an array with 1 million random numbers...');
const size = 1000000;
const randomNumbers = Array.from({ length: size }, () => Math.random() * 1000);
console.log(`Array size: ${randomNumbers.length}`);

// Create a List from the array
console.log('\nCreating a List from the array...');
console.time('List creation');
const list = List.from(randomNumbers);
console.timeEnd('List creation');

// Check if the list is a numeric list
console.log(`\nIs numeric list: ${list.isNumericList()}`);
const numericOps = list.asNumeric();
if (numericOps) {
  console.log('Numeric operations available');
} else {
  console.log('Numeric operations not available');
}

// Example 1: Map operation
console.log('\nExample 1: Map operation');
console.log('----------------------');

// Measure native array performance
console.time('Native Array Map');
const nativeMapResult = randomNumbers.map(x => x * 2);
console.timeEnd('Native Array Map');

// Measure List performance
console.time('List Map');
const listMapResult = list.map(x => x * 2);
console.timeEnd('List Map');

console.log(`Native Array Map result length: ${nativeMapResult.length}`);
console.log(`List Map result length: ${listMapResult.size}`);

// Example 2: Filter operation
console.log('\nExample 2: Filter operation');
console.log('------------------------');

// Measure native array performance
console.time('Native Array Filter');
const nativeFilterResult = randomNumbers.filter(x => x > 500);
console.timeEnd('Native Array Filter');

// Measure List performance
console.time('List Filter');
const listFilterResult = list.filter(x => x > 500);
console.timeEnd('List Filter');

console.log(`Native Array Filter result length: ${nativeFilterResult.length}`);
console.log(`List Filter result length: ${listFilterResult.size}`);

// Example 3: Reduce operation
console.log('\nExample 3: Reduce operation');
console.log('------------------------');

// Measure native array performance
console.time('Native Array Reduce');
const nativeReduceResult = randomNumbers.reduce((acc, x) => acc + x, 0);
console.timeEnd('Native Array Reduce');

// Measure List performance
console.time('List Reduce');
const listReduceResult = list.reduce((acc, x) => acc + x, 0);
console.timeEnd('List Reduce');

console.log(`Native Array Reduce result: ${nativeReduceResult}`);
console.log(`List Reduce result: ${listReduceResult}`);

// Example 4: Sum operation (specialized for numeric lists)
console.log('\nExample 4: Sum operation');
console.log('---------------------');

// Measure native array performance
console.time('Native Array Sum');
const nativeSumResult = randomNumbers.reduce((acc, x) => acc + x, 0);
console.timeEnd('Native Array Sum');

// Measure List performance
console.time('List Sum');
const listSumResult = numericOps?.sum() ?? 0;
console.timeEnd('List Sum');

console.log(`Native Array Sum result: ${nativeSumResult}`);
console.log(`List Sum result: ${listSumResult}`);

// Example 5: Map-Filter operation
console.log('\nExample 5: Map-Filter operation');
console.log('----------------------------');

// Measure native array performance
console.time('Native Array Map-Filter');
const nativeMapFilterResult = randomNumbers.map(x => x * 2).filter(x => x > 1000);
console.timeEnd('Native Array Map-Filter');

// Measure List performance
console.time('List Map-Filter');
const listMapFilterResult = list.mapFilter(x => x * 2, x => x > 1000);
console.timeEnd('List Map-Filter');

console.log(`Native Array Map-Filter result length: ${nativeMapFilterResult.length}`);
console.log(`List Map-Filter result length: ${listMapFilterResult.size}`);

// Example 6: Sort operation
console.log('\nExample 6: Sort operation');
console.log('----------------------');

// Create a copy of the array for sorting (to avoid modifying the original)
const arrayToSort = [...randomNumbers.slice(0, 100000)]; // Use a smaller array for sorting
const listToSort = List.from(arrayToSort);

// Measure native array performance
console.time('Native Array Sort');
const nativeSortResult = [...arrayToSort].sort((a, b) => a - b);
console.timeEnd('Native Array Sort');

// Measure List performance
console.time('List Sort');
const listSortResult = (listToSort.asNumeric() as any)?.sort?.() ?? listToSort;
console.timeEnd('List Sort');

console.log(`Native Array Sort first 5 elements: ${nativeSortResult.slice(0, 5).join(', ')}`);
console.log(`List Sort first 5 elements: ${listSortResult.toArray().slice(0, 5).join(', ')}`);

// Example 7: Statistical operations
console.log('\nExample 7: Statistical operations');
console.log('------------------------------');

// Create a smaller array for statistical operations
const statsArray = randomNumbers.slice(0, 100000);
const statsList = List.from(statsArray);
const statsOps = statsList.asNumeric() as any;

if (statsOps?.median) {
  console.log('\nMedian calculation:');

  // Measure native array performance
  console.time('Native Array Median');
  const sortedArray = [...statsArray].sort((a, b) => a - b);
  const nativeMedian = statsArray.length % 2 === 0
    ? (sortedArray[statsArray.length / 2 - 1] + sortedArray[statsArray.length / 2]) / 2
    : sortedArray[Math.floor(statsArray.length / 2)];
  console.timeEnd('Native Array Median');

  // Measure List performance
  console.time('List Median');
  const listMedian = statsOps.median();
  console.timeEnd('List Median');

  console.log(`Native Array Median: ${nativeMedian}`);
  console.log(`List Median: ${listMedian}`);
}

if (statsOps?.standardDeviation) {
  console.log('\nStandard Deviation calculation:');

  // Measure native array performance
  console.time('Native Array Standard Deviation');
  const mean = statsArray.reduce((acc, x) => acc + x, 0) / statsArray.length;
  const variance = statsArray.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / statsArray.length;
  const nativeStdDev = Math.sqrt(variance);
  console.timeEnd('Native Array Standard Deviation');

  // Measure List performance
  console.time('List Standard Deviation');
  const listStdDev = statsOps.standardDeviation();
  console.timeEnd('List Standard Deviation');

  console.log(`Native Array Standard Deviation: ${nativeStdDev}`);
  console.log(`List Standard Deviation: ${listStdDev}`);
}

console.log('\nWebAssembly acceleration example completed.');
