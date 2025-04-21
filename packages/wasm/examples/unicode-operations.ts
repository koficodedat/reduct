/**
 * Example demonstrating WebAssembly-accelerated Unicode operations
 */
import { UnicodeOperationsAccelerator, NormalizationForm } from '../src/accelerators/data-structures/unicode-ops';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('WebAssembly-Accelerated Unicode Operations Example');
console.log('==============================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a Unicode operations accelerator
const unicodeOpsAccelerator = new UnicodeOperationsAccelerator();

// Unicode normalization
console.log('\nUnicode Normalization:');
console.log('---------------------');
const precomposed = 'café';
const decomposed = 'cafe\u0301';
console.log(`Precomposed: "${precomposed}" (${precomposed.length} characters)`);
console.log(`Decomposed: "${decomposed}" (${decomposed.length} characters)`);
console.log(`Precomposed === Decomposed: ${precomposed === decomposed as string}`);

console.time('Normalize NFC (WASM)');
const nfc = unicodeOpsAccelerator.normalize(decomposed, NormalizationForm.NFC);
console.timeEnd('Normalize NFC (WASM)');
console.log(`NFC: "${nfc}" (${nfc.length} characters)`);
console.log(`NFC === Precomposed: ${nfc === precomposed}`);

console.time('Normalize NFD (WASM)');
const nfd = unicodeOpsAccelerator.normalize(precomposed, NormalizationForm.NFD);
console.timeEnd('Normalize NFD (WASM)');
console.log(`NFD: "${nfd}" (${nfd.length} characters)`);
console.log(`NFD === Decomposed: ${nfd === decomposed}`);

// Case conversion
console.log('\nCase Conversion:');
console.log('---------------');
const mixedCase = 'Hello, World!';
console.log(`Mixed case: "${mixedCase}"`);

console.time('To Uppercase (WASM)');
const upperCase = unicodeOpsAccelerator.toUpperCase(mixedCase);
console.timeEnd('To Uppercase (WASM)');
console.log(`Uppercase: "${upperCase}"`);

console.time('To Lowercase (WASM)');
const lowerCase = unicodeOpsAccelerator.toLowerCase(mixedCase);
console.timeEnd('To Lowercase (WASM)');
console.log(`Lowercase: "${lowerCase}"`);

// Case folding
console.log('\nCase Folding:');
console.log('------------');
const text1 = 'Hello, World!';
const text2 = 'hello, world!';
const text3 = 'HELLO, WORLD!';
console.log(`Text 1: "${text1}"`);
console.log(`Text 2: "${text2}"`);
console.log(`Text 3: "${text3}"`);

console.time('Case Fold (WASM)');
const caseFolded1 = unicodeOpsAccelerator.caseFold(text1);
console.timeEnd('Case Fold (WASM)');
console.log(`Case folded 1: "${caseFolded1}"`);

console.time('Case Fold Compare (WASM)');
const equal12 = unicodeOpsAccelerator.caseFoldCompare(text1, text2);
const equal13 = unicodeOpsAccelerator.caseFoldCompare(text1, text3);
console.timeEnd('Case Fold Compare (WASM)');
console.log(`Text 1 == Text 2 (case insensitive): ${equal12}`);
console.log(`Text 1 == Text 3 (case insensitive): ${equal13}`);

// Character properties
console.log('\nCharacter Properties:');
console.log('-------------------');
const characters = ['A', 'a', '1', ' ', '\t'];
console.log('Characters:', characters.join(', '));

for (const char of characters) {
  console.time(`Char Info (WASM) for "${char}"`);
  const info = unicodeOpsAccelerator.charInfo(char);
  console.timeEnd(`Char Info (WASM) for "${char}"`);
  
  console.log(`Character: "${char}"`);
  console.log(`  Code point: ${info.codePoint} (0x${info.codePoint.toString(16).toUpperCase()})`);
  console.log(`  Is uppercase: ${info.isUppercase}`);
  console.log(`  Is lowercase: ${info.isLowercase}`);
  console.log(`  Is alphabetic: ${info.isAlphabetic}`);
  console.log(`  Is numeric: ${info.isNumeric}`);
  console.log(`  Is alphanumeric: ${info.isAlphanumeric}`);
  console.log(`  Is whitespace: ${info.isWhitespace}`);
  console.log(`  Is control: ${info.isControl}`);
}

// Grapheme clusters
console.log('\nGrapheme Clusters:');
console.log('----------------');
const complexText = 'café';
console.log(`Complex text: "${complexText}" (${complexText.length} code units)`);

console.time('Grapheme Clusters (WASM)');
const clusters = unicodeOpsAccelerator.graphemeClusters(complexText);
console.timeEnd('Grapheme Clusters (WASM)');
console.log(`Grapheme clusters: ${clusters.map(c => `"${c}"`).join(', ')} (${clusters.length} clusters)`);

console.time('Grapheme Cluster Count (WASM)');
const clusterCount = unicodeOpsAccelerator.graphemeClusterCount(complexText);
console.timeEnd('Grapheme Cluster Count (WASM)');
console.log(`Grapheme cluster count: ${clusterCount}`);

// Words
console.log('\nWords:');
console.log('-----');
const sentence = 'The quick brown fox jumps over the lazy dog.';
console.log(`Sentence: "${sentence}"`);

console.time('Words (WASM)');
const words = unicodeOpsAccelerator.words(sentence);
console.timeEnd('Words (WASM)');
console.log(`Words: ${words.map(w => `"${w}"`).join(', ')} (${words.length} words)`);

console.time('Word Count (WASM)');
const wordCount = unicodeOpsAccelerator.wordCount(sentence);
console.timeEnd('Word Count (WASM)');
console.log(`Word count: ${wordCount}`);

// Trimming
console.log('\nTrimming:');
console.log('--------');
const paddedText = '  \t Hello, World! \n ';
console.log(`Padded text: "${paddedText}"`);

console.time('Trim (WASM)');
const trimmed = unicodeOpsAccelerator.trim(paddedText);
console.timeEnd('Trim (WASM)');
console.log(`Trimmed: "${trimmed}"`);

console.time('Trim Start (WASM)');
const trimmedStart = unicodeOpsAccelerator.trimStart(paddedText);
console.timeEnd('Trim Start (WASM)');
console.log(`Trimmed start: "${trimmedStart}"`);

console.time('Trim End (WASM)');
const trimmedEnd = unicodeOpsAccelerator.trimEnd(paddedText);
console.timeEnd('Trim End (WASM)');
console.log(`Trimmed end: "${trimmedEnd}"`);

// Performance test with large text
console.log('\nPerformance Test with Large Text:');
console.log('-------------------------------');

// Generate a large text with Unicode characters
const generateLargeText = (size: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789áéíóúñÁÉÍÓÚÑ';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const largeText = generateLargeText(100000);
console.log(`Generated a text of length ${largeText.length}`);

// Normalize a large text
console.log('Normalizing a large text...');

console.time('Normalize Large Text (WASM)');
const normalizedLargeText = unicodeOpsAccelerator.normalize(largeText, NormalizationForm.NFC);
console.timeEnd('Normalize Large Text (WASM)');
console.log(`Normalized ${normalizedLargeText.length} characters`);

// Case fold a large text
console.log('Case folding a large text...');

console.time('Case Fold Large Text (WASM)');
const caseFoldedLargeText = unicodeOpsAccelerator.caseFold(largeText);
console.timeEnd('Case Fold Large Text (WASM)');
console.log(`Case folded ${caseFoldedLargeText.length} characters`);

// Compare with JavaScript implementations
console.log('\nComparison with JavaScript Implementations:');
console.log('----------------------------------------');

// Normalize
console.time('Normalize NFC (JS)');
const nfcJs = decomposed.normalize('NFC');
console.timeEnd('Normalize NFC (JS)');
console.log(`NFC (JS): "${nfcJs}" (${nfcJs.length} characters)`);

// Case conversion
console.time('To Uppercase (JS)');
const upperCaseJs = mixedCase.toUpperCase();
console.timeEnd('To Uppercase (JS)');
console.log(`Uppercase (JS): "${upperCaseJs}"`);

// Case folding
console.time('Case Fold (JS)');
const caseFoldedJs = text1.toLowerCase();
console.timeEnd('Case Fold (JS)');
console.log(`Case folded (JS): "${caseFoldedJs}"`);

// Normalize a large text
console.time('Normalize Large Text (JS)');
const normalizedLargeTextJs = largeText.normalize('NFC');
console.timeEnd('Normalize Large Text (JS)');
console.log(`Normalized ${normalizedLargeTextJs.length} characters using JavaScript`);

console.log('\nWebAssembly-accelerated Unicode operations example completed.');
