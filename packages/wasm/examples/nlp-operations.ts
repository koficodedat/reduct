/**
 * Example demonstrating WebAssembly-accelerated natural language processing operations
 */
import { NlpOperationsAccelerator, WordFrequencyMap } from '../src/accelerators/data-structures/nlp-ops';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('WebAssembly-Accelerated Natural Language Processing Operations Example');
console.log('==================================================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a natural language processing operations accelerator
const nlpOpsAccelerator = new NlpOperationsAccelerator();

// Text tokenization
console.log('\nText Tokenization:');
console.log('-----------------');
const text = 'The quick brown fox jumps over the lazy dog. The fox is quick and brown.';
console.log(`Text: "${text}"`);

console.time('Tokenize (WASM)');
const tokens = nlpOpsAccelerator.tokenize(text);
console.timeEnd('Tokenize (WASM)');
console.log(`Tokens: ${tokens.join(', ')}`);

// Word frequencies
console.log('\nWord Frequencies:');
console.log('----------------');
console.time('Word Frequencies (WASM)');
const frequencies = nlpOpsAccelerator.wordFrequencies(text);
console.timeEnd('Word Frequencies (WASM)');
console.log('Word frequencies:');
Object.entries(frequencies)
  .sort((a, b) => b[1] - a[1])
  .forEach(([word, count]) => {
    console.log(`  "${word}": ${count}`);
  });

// TF-IDF
console.log('\nTF-IDF:');
console.log('-------');
const corpus = [
  'The quick brown fox jumps over the lazy dog.',
  'The fox is quick and brown.',
  'The dog is lazy and sleeps all day.',
  'The cat is quick and agile.',
];
console.log('Corpus:');
corpus.forEach((doc, i) => {
  console.log(`  Document ${i + 1}: "${doc}"`);
});

const document = 'The quick brown fox jumps over the lazy dog.';
console.log(`Document: "${document}"`);

console.time('TF-IDF (WASM)');
const tfIdf = nlpOpsAccelerator.tfIdf(document, corpus);
console.timeEnd('TF-IDF (WASM)');
console.log('TF-IDF scores:');
Object.entries(tfIdf)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .forEach(([word, score]) => {
    console.log(`  "${word}": ${score.toFixed(4)}`);
  });

// Sentence extraction
console.log('\nSentence Extraction:');
console.log('-------------------');
const paragraphText = 'The quick brown fox jumps over the lazy dog. The fox is quick and brown. The dog is lazy and sleeps all day. The cat is quick and agile.';
console.log(`Text: "${paragraphText}"`);

console.time('Extract Sentences (WASM)');
const sentences = nlpOpsAccelerator.extractSentences(paragraphText);
console.timeEnd('Extract Sentences (WASM)');
console.log('Sentences:');
sentences.forEach((sentence, i) => {
  console.log(`  ${i + 1}. "${sentence}"`);
});

// Jaccard similarity
console.log('\nJaccard Similarity:');
console.log('------------------');
const text1 = 'The quick brown fox jumps over the lazy dog.';
const text2 = 'The fox is quick and brown.';
const text3 = 'The cat is quick and agile.';
console.log(`Text 1: "${text1}"`);
console.log(`Text 2: "${text2}"`);
console.log(`Text 3: "${text3}"`);

console.time('Jaccard Similarity 1-2 (WASM)');
const similarity12 = nlpOpsAccelerator.jaccardSimilarity(text1, text2);
console.timeEnd('Jaccard Similarity 1-2 (WASM)');
console.log(`Similarity between Text 1 and Text 2: ${similarity12.toFixed(4)}`);

console.time('Jaccard Similarity 1-3 (WASM)');
const similarity13 = nlpOpsAccelerator.jaccardSimilarity(text1, text3);
console.timeEnd('Jaccard Similarity 1-3 (WASM)');
console.log(`Similarity between Text 1 and Text 3: ${similarity13.toFixed(4)}`);

console.time('Jaccard Similarity 2-3 (WASM)');
const similarity23 = nlpOpsAccelerator.jaccardSimilarity(text2, text3);
console.timeEnd('Jaccard Similarity 2-3 (WASM)');
console.log(`Similarity between Text 2 and Text 3: ${similarity23.toFixed(4)}`);

// Performance test with large text
console.log('\nPerformance Test with Large Text:');
console.log('-------------------------------');

// Generate a large text
const generateLargeText = (size: number): string => {
  const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'a', 'an', 'and', 'is', 'was', 'were', 'be', 'being', 'been', 'to', 'of', 'in', 'for', 'with', 'on', 'at', 'by', 'from', 'up', 'down', 'into', 'out', 'about', 'like', 'through', 'after', 'before', 'between', 'under', 'above', 'below', 'since', 'until', 'while', 'because', 'although', 'if', 'unless', 'when', 'where', 'how', 'what', 'who', 'whom', 'whose', 'which', 'that', 'this', 'these', 'those', 'such', 'so', 'too', 'very', 'quite', 'rather', 'somewhat', 'enough', 'indeed', 'still', 'yet', 'again', 'already', 'always', 'never', 'sometimes', 'often', 'usually', 'seldom', 'rarely', 'hardly', 'scarcely', 'almost', 'nearly', 'just', 'only', 'even', 'also', 'else', 'otherwise', 'however', 'nevertheless', 'nonetheless', 'therefore', 'thus', 'hence', 'accordingly', 'consequently', 'instead', 'meanwhile', 'furthermore', 'moreover', 'besides', 'anyway', 'actually', 'certainly', 'probably', 'possibly', 'perhaps', 'maybe'];

  let result = '';
  for (let i = 0; i < size; i++) {
    result += words[Math.floor(Math.random() * words.length)];
    result += ' ';

    // Add some punctuation
    if (i % 15 === 14) {
      result += '. ';
    } else if (i % 15 === 7) {
      result += ', ';
    }
  }
  return result;
};

const largeText = generateLargeText(10000);
console.log(`Generated a text of length ${largeText.length}`);

// Tokenize a large text
console.log('Tokenizing a large text...');

console.time('Tokenize Large Text (WASM)');
const largeTokens = nlpOpsAccelerator.tokenize(largeText);
console.timeEnd('Tokenize Large Text (WASM)');
console.log(`Tokenized ${largeTokens.length} tokens`);

// Word frequencies in a large text
console.log('Calculating word frequencies in a large text...');

console.time('Word Frequencies Large Text (WASM)');
const largeFrequencies = nlpOpsAccelerator.wordFrequencies(largeText);
console.timeEnd('Word Frequencies Large Text (WASM)');
console.log(`Calculated frequencies for ${Object.keys(largeFrequencies).length} unique words`);

// Extract sentences from a large text
console.log('Extracting sentences from a large text...');

console.time('Extract Sentences Large Text (WASM)');
const largeSentences = nlpOpsAccelerator.extractSentences(largeText);
console.timeEnd('Extract Sentences Large Text (WASM)');
console.log(`Extracted ${largeSentences.length} sentences`);

// Compare with JavaScript implementations
console.log('\nComparison with JavaScript Implementations:');
console.log('----------------------------------------');

// Tokenize
console.time('Tokenize (JS)');
const tokenizeJs = (text: string): string[] => {
  return text.split(/\s+/).filter(word => word.length > 0);
};
const tokensJs = tokenizeJs(text);
console.timeEnd('Tokenize (JS)');
console.log(`Tokenized ${tokensJs.length} tokens using JavaScript`);

// Word frequencies
console.time('Word Frequencies (JS)');
const wordFrequenciesJs = (text: string): WordFrequencyMap => {
  const words = text.split(/\s+/)
    .map(word => word.replace(/[^\w]/g, '').toLowerCase())
    .filter(word => word.length > 0);

  const frequencies: WordFrequencyMap = {};

  for (const word of words) {
    frequencies[word] = (frequencies[word] || 0) + 1;
  }

  return frequencies;
};
const frequenciesJs = wordFrequenciesJs(text);
console.timeEnd('Word Frequencies (JS)');
console.log(`Calculated frequencies for ${Object.keys(frequenciesJs).length} unique words using JavaScript`);

// Tokenize a large text
console.time('Tokenize Large Text (JS)');
const largeTokensJs = tokenizeJs(largeText);
console.timeEnd('Tokenize Large Text (JS)');
console.log(`Tokenized ${largeTokensJs.length} tokens using JavaScript`);

console.log('\nWebAssembly-accelerated natural language processing operations example completed.');
