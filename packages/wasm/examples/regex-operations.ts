/**
 * Example demonstrating WebAssembly-accelerated regular expression operations
 */
import { RegexOperationsAccelerator, RegexMatch } from '../src/accelerators/data-structures/regex-ops';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('WebAssembly-Accelerated Regular Expression Operations Example');
console.log('========================================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a regular expression operations accelerator
const regexOpsAccelerator = new RegexOperationsAccelerator();

// Regular expression testing
console.log('\nRegular Expression Testing:');
console.log('-------------------------');
const emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
const validEmail = 'test@example.com';
const invalidEmail = 'test@example';

console.log(`Email pattern: ${emailPattern}`);
console.log(`Valid email: ${validEmail}`);
console.log(`Invalid email: ${invalidEmail}`);

console.time('Test Valid Email (WASM)');
const isValidEmail = regexOpsAccelerator.test(validEmail, emailPattern);
console.timeEnd('Test Valid Email (WASM)');
console.log(`Is valid email valid? ${isValidEmail}`);

console.time('Test Invalid Email (WASM)');
const isInvalidEmail = regexOpsAccelerator.test(invalidEmail, emailPattern);
console.timeEnd('Test Invalid Email (WASM)');
console.log(`Is invalid email valid? ${isInvalidEmail}`);

// Pattern matching
console.log('\nPattern Matching:');
console.log('----------------');
const text = 'The quick brown fox jumps over the lazy dog. The fox is quick and brown.';
const pattern = '\\b\\w{5}\\b';
console.log(`Text: "${text}"`);
console.log(`Pattern: "${pattern}" (5-letter words)`);

console.time('Find First (WASM)');
const firstMatch = regexOpsAccelerator.findFirst(text, pattern);
console.timeEnd('Find First (WASM)');
console.log(`First match: ${firstMatch ? JSON.stringify(firstMatch) : 'No match'}`);

console.time('Find All (WASM)');
const allMatches = regexOpsAccelerator.findAll(text, pattern);
console.timeEnd('Find All (WASM)');
console.log(`Found ${allMatches.length} matches:`);
allMatches.forEach((match, index) => {
  console.log(`  ${index + 1}. "${match.text}" at index ${match.index}`);
});

// String replacement
console.log('\nString Replacement:');
console.log('------------------');
const htmlText = '<p>This is <b>bold</b> and <i>italic</i> text.</p>';
const htmlPattern = '<[^>]+>';
console.log(`HTML text: "${htmlText}"`);
console.log(`HTML pattern: "${htmlPattern}"`);

console.time('Replace All (WASM)');
const plainText = regexOpsAccelerator.replaceAll(htmlText, htmlPattern, '');
console.timeEnd('Replace All (WASM)');
console.log(`Plain text: "${plainText}"`);

// String splitting
console.log('\nString Splitting:');
console.log('----------------');
const csvText = 'apple,banana,cherry,date,elderberry';
const csvPattern = ',';
console.log(`CSV text: "${csvText}"`);
console.log(`CSV pattern: "${csvPattern}"`);

console.time('Split (WASM)');
const csvParts = regexOpsAccelerator.split(csvText, csvPattern);
console.timeEnd('Split (WASM)');
console.log(`CSV parts: ${JSON.stringify(csvParts)}`);

// Capture groups
console.log('\nCapture Groups:');
console.log('--------------');
const dateText = '2023-04-15';
const datePattern = '(\\d{4})-(\\d{2})-(\\d{2})';
console.log(`Date text: "${dateText}"`);
console.log(`Date pattern: "${datePattern}"`);

console.time('Capture Groups (WASM)');
const dateGroups = regexOpsAccelerator.captureGroups(dateText, datePattern);
console.timeEnd('Capture Groups (WASM)');
console.log(`Date groups: ${dateGroups ? JSON.stringify(dateGroups) : 'No match'}`);

// Named capture groups
console.log('\nNamed Capture Groups:');
console.log('--------------------');
const personText = 'John Doe (42)';
const personPattern = '(?<name>\\w+ \\w+) \\((?<age>\\d+)\\)';
console.log(`Person text: "${personText}"`);
console.log(`Person pattern: "${personPattern}"`);

console.time('Named Capture Groups (WASM)');
const personGroups = regexOpsAccelerator.namedCaptureGroups(personText, personPattern);
console.timeEnd('Named Capture Groups (WASM)');
console.log(`Person groups: ${personGroups ? JSON.stringify(personGroups) : 'No match'}`);

// Pattern validation
console.log('\nPattern Validation:');
console.log('------------------');
const validPattern = '\\d+';
const invalidPattern = '\\d+[';
console.log(`Valid pattern: "${validPattern}"`);
console.log(`Invalid pattern: "${invalidPattern}"`);

console.time('Validate Valid Pattern (WASM)');
const isValidPattern = regexOpsAccelerator.validatePattern(validPattern);
console.timeEnd('Validate Valid Pattern (WASM)');
console.log(`Is valid pattern valid? ${isValidPattern}`);

console.time('Validate Invalid Pattern (WASM)');
const isInvalidPattern = regexOpsAccelerator.validatePattern(invalidPattern);
console.timeEnd('Validate Invalid Pattern (WASM)');
console.log(`Is invalid pattern valid? ${isInvalidPattern}`);

// String escaping
console.log('\nString Escaping:');
console.log('---------------');
const specialCharsText = 'Hello (world). How are you?';
console.log(`Special chars text: "${specialCharsText}"`);

console.time('Escape (WASM)');
const escapedText = regexOpsAccelerator.escape(specialCharsText);
console.timeEnd('Escape (WASM)');
console.log(`Escaped text: "${escapedText}"`);

// Pattern information
console.log('\nPattern Information:');
console.log('-------------------');
const complexPattern = '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})';
console.log(`Complex pattern: "${complexPattern}"`);

console.time('Get Info (WASM)');
const patternInfo = regexOpsAccelerator.getInfo(complexPattern);
console.timeEnd('Get Info (WASM)');
console.log(`Pattern info: ${JSON.stringify(patternInfo)}`);

// Performance test with large text
console.log('\nPerformance Test with Large Text:');
console.log('-------------------------------');

// Generate a large text
const generateLargeText = (size: number): string => {
  const words = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew', 'kiwi', 'lemon'];
  let result = '';
  for (let i = 0; i < size; i++) {
    result += words[Math.floor(Math.random() * words.length)];
    result += ' ';
  }
  return result;
};

const largeText = generateLargeText(100000);
console.log(`Generated a text of length ${largeText.length}`);

// Find all occurrences of a pattern in a large text
const wordPattern = '\\b\\w{5}\\b';
console.log(`Searching for pattern "${wordPattern}" in a large text`);

console.time('Find All in Large Text (WASM)');
const largeTextMatches = regexOpsAccelerator.findAll(largeText, wordPattern);
console.timeEnd('Find All in Large Text (WASM)');
console.log(`Found ${largeTextMatches.length} matches`);

// Replace all occurrences of a pattern in a large text
console.log(`Replacing pattern "${wordPattern}" in a large text`);

console.time('Replace All in Large Text (WASM)');
regexOpsAccelerator.replaceAll(largeText, wordPattern, 'WORD');
console.timeEnd('Replace All in Large Text (WASM)');
console.log(`Replaced ${largeTextMatches.length} occurrences`);

// Compare with JavaScript implementations
console.log('\nComparison with JavaScript Implementations:');
console.log('----------------------------------------');

// Regular expression testing
console.time('Test Valid Email (JS)');
const isValidEmailJs = new RegExp(emailPattern).test(validEmail);
console.timeEnd('Test Valid Email (JS)');
console.log(`Is valid email valid (JS)? ${isValidEmailJs}`);

// Pattern matching
console.time('Find All (JS)');
const findAllJs = (text: string, pattern: string): RegexMatch[] => {
  const regex = new RegExp(pattern, 'g');
  const matches: RegexMatch[] = [];

  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      text: match[0],
    });

    // Avoid infinite loops for zero-length matches
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  return matches;
};
const allMatchesJs = findAllJs(text, pattern);
console.timeEnd('Find All (JS)');
console.log(`Found ${allMatchesJs.length} matches using JavaScript`);

// String replacement
console.time('Replace All (JS)');
const plainTextJs = htmlText.replace(new RegExp(htmlPattern, 'g'), '');
console.timeEnd('Replace All (JS)');
console.log(`Plain text (JS): "${plainTextJs}"`);

// Find all occurrences of a pattern in a large text
console.time('Find All in Large Text (JS)');
const largeTextMatchesJs = findAllJs(largeText, wordPattern);
console.timeEnd('Find All in Large Text (JS)');
console.log(`Found ${largeTextMatchesJs.length} matches using JavaScript`);

console.log('\nWebAssembly-accelerated regular expression operations example completed.');
