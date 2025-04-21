/**
 * Example demonstrating WebAssembly-accelerated string operations
 */
import { StringOperationsAccelerator } from '../src/accelerators/data-structures/string-ops';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('WebAssembly-Accelerated String Operations Example');
console.log('==============================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a string operations accelerator
const stringOpsAccelerator = new StringOperationsAccelerator();

// String sorting
console.log('\nString Sorting:');
console.log('--------------');
const strings = [
  'banana',
  'apple',
  'cherry',
  'date',
  'elderberry',
  'fig',
  'grape',
  'honeydew',
  'kiwi',
  'lemon',
];
console.log('Original strings:');
console.log(strings.join(', '));

console.time('Sort (WASM)');
const sortedStrings = stringOpsAccelerator.sort(strings);
console.timeEnd('Sort (WASM)');
console.log('Sorted strings:');
console.log(sortedStrings.join(', '));

// Locale-aware sorting
console.log('\nLocale-Aware Sorting:');
console.log('-------------------');
const stringsWithAccents = [
  'café',
  'apple',
  'résumé',
  'zebra',
  'ñandú',
  'über',
  'papá',
];
console.log('Original strings:');
console.log(stringsWithAccents.join(', '));

console.time('Sort Locale (WASM)');
const sortedStringsLocale = stringOpsAccelerator.sortLocale(stringsWithAccents, 'en');
console.timeEnd('Sort Locale (WASM)');
console.log('Sorted strings (en locale):');
console.log(sortedStringsLocale.join(', '));

// Pattern matching
console.log('\nPattern Matching:');
console.log('----------------');
const text = 'The quick brown fox jumps over the lazy dog. The fox is quick and brown.';
const pattern = 'fox';
console.log(`Text: "${text}"`);
console.log(`Pattern: "${pattern}"`);

console.time('Find All (WASM)');
const indices = stringOpsAccelerator.findAll(text, pattern);
console.timeEnd('Find All (WASM)');
console.log(`Found ${indices.length} occurrences at indices: ${indices.join(', ')}`);

console.time('Find All Boyer-Moore (WASM)');
const indicesBM = stringOpsAccelerator.findAllBoyerMoore(text, pattern);
console.timeEnd('Find All Boyer-Moore (WASM)');
console.log(`Found ${indicesBM.length} occurrences using Boyer-Moore at indices: ${indicesBM.join(', ')}`);

// String encoding/decoding
console.log('\nString Encoding/Decoding:');
console.log('------------------------');
const unicodeText = 'Hello, 世界! 😊';
console.log(`Original text: "${unicodeText}"`);

console.time('Encode UTF-8 (WASM)');
const utf8Bytes = stringOpsAccelerator.encodeUtf8(unicodeText);
console.timeEnd('Encode UTF-8 (WASM)');
console.log(`UTF-8 encoded bytes (${utf8Bytes.length} bytes): ${Array.from(utf8Bytes).slice(0, 10).join(', ')}...`);

console.time('Decode UTF-8 (WASM)');
const decodedUtf8 = stringOpsAccelerator.decodeUtf8(utf8Bytes);
console.timeEnd('Decode UTF-8 (WASM)');
console.log(`UTF-8 decoded text: "${decodedUtf8}"`);

console.time('Encode UTF-16 (WASM)');
const utf16CodeUnits = stringOpsAccelerator.encodeUtf16(unicodeText);
console.timeEnd('Encode UTF-16 (WASM)');
console.log(`UTF-16 encoded code units (${utf16CodeUnits.length} units): ${Array.from(utf16CodeUnits).slice(0, 10).join(', ')}...`);

console.time('Decode UTF-16 (WASM)');
const decodedUtf16 = stringOpsAccelerator.decodeUtf16(utf16CodeUnits);
console.timeEnd('Decode UTF-16 (WASM)');
console.log(`UTF-16 decoded text: "${decodedUtf16}"`);

// String similarity
console.log('\nString Similarity:');
console.log('-----------------');
const string1 = 'kitten';
const string2 = 'sitting';
console.log(`String 1: "${string1}"`);
console.log(`String 2: "${string2}"`);

console.time('Levenshtein Distance (WASM)');
const distance = stringOpsAccelerator.levenshteinDistance(string1, string2);
console.timeEnd('Levenshtein Distance (WASM)');
console.log(`Levenshtein distance: ${distance}`);

console.time('Similarity (WASM)');
const similarity = stringOpsAccelerator.similarity(string1, string2);
console.timeEnd('Similarity (WASM)');
console.log(`Similarity: ${similarity.toFixed(4)}`);

// String tokenization
console.log('\nString Tokenization:');
console.log('-------------------');
const sentence = 'The quick brown fox jumps over the lazy dog.';
console.log(`Sentence: "${sentence}"`);

console.time('Tokenize (WASM)');
const tokens = stringOpsAccelerator.tokenize(sentence);
console.timeEnd('Tokenize (WASM)');
console.log(`Tokens: ${tokens.join(', ')}`);

const csvText = 'apple,banana,cherry,date,elderberry';
console.log(`CSV text: "${csvText}"`);

console.time('Tokenize With Delimiters (WASM)');
const csvTokens = stringOpsAccelerator.tokenizeWithDelimiters(csvText, ',');
console.timeEnd('Tokenize With Delimiters (WASM)');
console.log(`CSV tokens: ${csvTokens.join(', ')}`);

// Performance test with large strings
console.log('\nPerformance Test with Large Strings:');
console.log('----------------------------------');

// Generate a large string
const generateLargeString = (size: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const largeString = generateLargeString(1000000);
console.log(`Generated a string of length ${largeString.length}`);

// Sort a large array of strings
const largeStringArray = Array.from({ length: 10000 }, () => generateLargeString(10));
console.log(`Generated an array of ${largeStringArray.length} strings`);

console.time('Sort Large Array (WASM)');
const sortedLargeStringArray = stringOpsAccelerator.sort(largeStringArray);
console.timeEnd('Sort Large Array (WASM)');
console.log(`Sorted ${sortedLargeStringArray.length} strings`);

// Find all occurrences of a pattern in a large string
const largePattern = 'ABCDEF';
console.log(`Searching for pattern "${largePattern}" in a large string`);

console.time('Find All in Large String (WASM)');
const largeIndices = stringOpsAccelerator.findAll(largeString, largePattern);
console.timeEnd('Find All in Large String (WASM)');
console.log(`Found ${largeIndices.length} occurrences`);

console.time('Find All Boyer-Moore in Large String (WASM)');
const largeIndicesBM = stringOpsAccelerator.findAllBoyerMoore(largeString, largePattern);
console.timeEnd('Find All Boyer-Moore in Large String (WASM)');
console.log(`Found ${largeIndicesBM.length} occurrences using Boyer-Moore`);

// Encode/decode a large string
console.log(`Encoding/decoding a large string`);

console.time('Encode Large String UTF-8 (WASM)');
const largeUtf8Bytes = stringOpsAccelerator.encodeUtf8(largeString);
console.timeEnd('Encode Large String UTF-8 (WASM)');
console.log(`Encoded ${largeUtf8Bytes.length} bytes`);

console.time('Decode Large String UTF-8 (WASM)');
const decodedLargeUtf8 = stringOpsAccelerator.decodeUtf8(largeUtf8Bytes);
console.timeEnd('Decode Large String UTF-8 (WASM)');
console.log(`Decoded ${decodedLargeUtf8.length} characters`);

// Compare with JavaScript implementations
console.log('\nComparison with JavaScript Implementations:');
console.log('----------------------------------------');

// String sorting
console.time('Sort (JS)');
const sortedStringsJs = [...strings].sort();
console.timeEnd('Sort (JS)');
console.log(`Sorted ${sortedStringsJs.length} strings using JavaScript`);

// Pattern matching
console.time('Find All (JS)');
const findAllJs = (text: string, pattern: string): number[] => {
  const indices: number[] = [];
  let index = text.indexOf(pattern);
  while (index !== -1) {
    indices.push(index);
    index = text.indexOf(pattern, index + 1);
  }
  return indices;
};
const indicesJs = findAllJs(text, pattern);
console.timeEnd('Find All (JS)');
console.log(`Found ${indicesJs.length} occurrences using JavaScript`);

// String encoding/decoding
console.time('Encode UTF-8 (JS)');
const utf8BytesJs = new TextEncoder().encode(unicodeText);
console.timeEnd('Encode UTF-8 (JS)');
console.log(`Encoded ${utf8BytesJs.length} bytes using JavaScript`);

// String similarity
console.time('Levenshtein Distance (JS)');
const levenshteinDistanceJs = (a: string, b: string): number => {
  const matrix: number[][] = [];
  
  // Initialize the matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  
  return matrix[a.length][b.length];
};
const distanceJs = levenshteinDistanceJs(string1, string2);
console.timeEnd('Levenshtein Distance (JS)');
console.log(`Levenshtein distance using JavaScript: ${distanceJs}`);

console.log('\nWebAssembly-accelerated string operations example completed.');
