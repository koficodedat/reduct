/**
 * Example demonstrating WebAssembly acceleration for sorting algorithms
 */
import { isWebAssemblySupported } from '../src/core/feature-detection';
import { SortingAccelerator } from '../src/accelerators/algorithms/sorting';

console.log('WebAssembly Sorting Algorithms Example');
console.log('=====================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create accelerator
const sortingAccelerator = new SortingAccelerator();

// Example 1: Sorting numeric arrays
console.log('\nExample 1: Sorting numeric arrays');
console.log('-------------------------------');

// Create a large array of random numbers
console.log('Creating an array with 1 million random numbers...');
const size = 1000000;
const randomNumbers = Array.from({ length: size }, () => Math.random() * 1000);
console.log(`Array size: ${randomNumbers.length}`);

// Measure JavaScript performance
console.time('JavaScript Sort');
const jsSorted = [...randomNumbers].sort((a, b) => a - b);
console.timeEnd('JavaScript Sort');

// Measure WebAssembly performance
console.time('WebAssembly Sort');
const wasmSorted = sortingAccelerator.sort(randomNumbers);
console.timeEnd('WebAssembly Sort');

// Verify results
console.log(`JavaScript Sort first 5 elements: ${jsSorted.slice(0, 5).join(', ')}`);
console.log(`WebAssembly Sort first 5 elements: ${wasmSorted.slice(0, 5).join(', ')}`);
console.log(`Arrays are equal: ${arraysEqual(jsSorted, wasmSorted)}`);

// Example 2: Sorting Uint32Array
console.log('\nExample 2: Sorting Uint32Array');
console.log('----------------------------');

// Create a large Uint32Array
console.log('Creating a Uint32Array with 1 million random integers...');
const uint32Array = new Uint32Array(size);
for (let i = 0; i < size; i++) {
  uint32Array[i] = Math.floor(Math.random() * 1000000);
}
console.log(`Array size: ${uint32Array.length}`);

// Measure JavaScript performance
console.time('JavaScript Sort Uint32Array');
const jsSortedUint32 = new Uint32Array([...uint32Array].sort((a, b) => a - b));
console.timeEnd('JavaScript Sort Uint32Array');

// Measure WebAssembly performance
console.time('WebAssembly Sort Uint32Array');
const wasmSortedUint32 = sortingAccelerator.sort(uint32Array);
console.timeEnd('WebAssembly Sort Uint32Array');

// Verify results
console.log(`JavaScript Sort first 5 elements: ${Array.from(jsSortedUint32.slice(0, 5)).join(', ')}`);
console.log(`WebAssembly Sort first 5 elements: ${Array.from((wasmSortedUint32 as Uint32Array).slice(0, 5)).join(', ')}`);
console.log(`Arrays are equal: ${typedArraysEqual(jsSortedUint32, wasmSortedUint32 as Uint32Array)}`);

// Example 3: Sorting Uint8Array
console.log('\nExample 3: Sorting Uint8Array');
console.log('---------------------------');

// Create a large Uint8Array
console.log('Creating a Uint8Array with 1 million random bytes...');
const uint8Array = new Uint8Array(size);
for (let i = 0; i < size; i++) {
  uint8Array[i] = Math.floor(Math.random() * 256);
}
console.log(`Array size: ${uint8Array.length}`);

// Measure JavaScript performance
console.time('JavaScript Sort Uint8Array');
const jsSortedUint8 = new Uint8Array([...uint8Array].sort((a, b) => a - b));
console.timeEnd('JavaScript Sort Uint8Array');

// Measure WebAssembly performance
console.time('WebAssembly Sort Uint8Array');
const wasmSortedUint8 = sortingAccelerator.sort(uint8Array);
console.timeEnd('WebAssembly Sort Uint8Array');

// Verify results
console.log(`JavaScript Sort first 5 elements: ${Array.from(jsSortedUint8.slice(0, 5)).join(', ')}`);
console.log(`WebAssembly Sort first 5 elements: ${Array.from((wasmSortedUint8 as Uint8Array).slice(0, 5)).join(', ')}`);
console.log(`Arrays are equal: ${typedArraysEqual(jsSortedUint8, wasmSortedUint8 as Uint8Array)}`);

console.log('\nWebAssembly sorting algorithms example completed.');

// Helper function to check if two arrays are equal
function arraysEqual(a: any[] | Float64Array | Uint32Array | Uint8Array, b: any[] | Float64Array | Uint32Array | Uint8Array): boolean {
  if (a.length !== b.length) return false;

  // Convert to arrays if they are typed arrays
  const arrayA = Array.isArray(a) ? a : Array.from(a);
  const arrayB = Array.isArray(b) ? b : Array.from(b);

  // Check only the first and last 100 elements for large arrays
  if (arrayA.length > 1000) {
    const frontEqual = arrayA.slice(0, 100).every((val, i) => Math.abs(Number(val) - Number(arrayB[i])) < 0.000001);
    const backEqual = arrayA.slice(-100).every((val, i) => Math.abs(Number(val) - Number(arrayB[arrayA.length - 100 + i])) < 0.000001);
    return frontEqual && backEqual;
  }

  return arrayA.every((val, i) => Math.abs(Number(val) - Number(arrayB[i])) < 0.000001);
}

// Helper function to check if two typed arrays are equal
function typedArraysEqual(a: Uint8Array | Uint32Array, b: Uint8Array | Uint32Array): boolean {
  if (a.length !== b.length) return false;

  // Check only the first and last 100 elements for large arrays
  if (a.length > 1000) {
    const frontEqual = Array.from(a.slice(0, 100)).every((val, i) => val === b[i]);
    const backEqual = Array.from(a.slice(-100)).every((val, i) => val === b[a.length - 100 + i]);
    return frontEqual && backEqual;
  }

  return Array.from(a).every((val, i) => val === b[i]);
}
