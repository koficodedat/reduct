/**
 * Example demonstrating WebAssembly-accelerated compression operations
 */
import { CompressionAccelerator, CompressionAlgorithm, CompressionLevel } from '../src/accelerators/data-structures/compression';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('WebAssembly-Accelerated Compression Operations Example');
console.log('==================================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a compression operations accelerator
const compressionAccelerator = new CompressionAccelerator();

// Generate test data
console.log('\nGenerating test data...');
const generateText = (size: number, repetition: number): string => {
  const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog'];
  let result = '';
  
  for (let i = 0; i < size; i++) {
    const word = words[i % words.length];
    for (let j = 0; j < repetition; j++) {
      result += word + ' ';
    }
  }
  
  return result;
};

const smallText = 'The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.';
const mediumText = generateText(100, 1);
const largeText = generateText(1000, 10);
const repeatedText = 'AAAAAAAAAABBBBBBBBBBCCCCCCCCCCDDDDDDDDDD';

console.log(`Small text (${smallText.length} bytes): "${smallText.substring(0, 50)}..."`);
console.log(`Medium text (${mediumText.length} bytes): "${mediumText.substring(0, 50)}..."`);
console.log(`Large text (${largeText.length} bytes): "${largeText.substring(0, 50)}..."`);
console.log(`Repeated text (${repeatedText.length} bytes): "${repeatedText}"`);

// Gzip compression
console.log('\nGzip Compression:');
console.log('----------------');

console.time('Gzip Compress Small Text (WASM)');
const smallTextGzipped = compressionAccelerator.compress(smallText, CompressionAlgorithm.Gzip, CompressionLevel.Default);
console.timeEnd('Gzip Compress Small Text (WASM)');
console.log(`Original size: ${smallText.length} bytes, Compressed size: ${smallTextGzipped.length} bytes`);
console.log(`Compression ratio: ${compressionAccelerator.compressionRatio(smallText.length, smallTextGzipped.length).toFixed(4)}`);

console.time('Gzip Decompress Small Text (WASM)');
const smallTextDecompressed = compressionAccelerator.decompress(smallTextGzipped, CompressionAlgorithm.Gzip);
console.timeEnd('Gzip Decompress Small Text (WASM)');
console.log(`Decompressed text matches original: ${smallTextDecompressed === smallText}`);

console.time('Gzip Compress Medium Text (WASM)');
const mediumTextGzipped = compressionAccelerator.compress(mediumText, CompressionAlgorithm.Gzip, CompressionLevel.Default);
console.timeEnd('Gzip Compress Medium Text (WASM)');
console.log(`Original size: ${mediumText.length} bytes, Compressed size: ${mediumTextGzipped.length} bytes`);
console.log(`Compression ratio: ${compressionAccelerator.compressionRatio(mediumText.length, mediumTextGzipped.length).toFixed(4)}`);

console.time('Gzip Compress Large Text (WASM)');
const largeTextGzipped = compressionAccelerator.compress(largeText, CompressionAlgorithm.Gzip, CompressionLevel.Default);
console.timeEnd('Gzip Compress Large Text (WASM)');
console.log(`Original size: ${largeText.length} bytes, Compressed size: ${largeTextGzipped.length} bytes`);
console.log(`Compression ratio: ${compressionAccelerator.compressionRatio(largeText.length, largeTextGzipped.length).toFixed(4)}`);

// Compression levels
console.log('\nCompression Levels:');
console.log('------------------');

console.time('Gzip Compress (None) (WASM)');
const largeTextGzippedNone = compressionAccelerator.compress(largeText, CompressionAlgorithm.Gzip, CompressionLevel.None);
console.timeEnd('Gzip Compress (None) (WASM)');
console.log(`Compression level None: ${largeTextGzippedNone.length} bytes, Ratio: ${compressionAccelerator.compressionRatio(largeText.length, largeTextGzippedNone.length).toFixed(4)}`);

console.time('Gzip Compress (Fast) (WASM)');
const largeTextGzippedFast = compressionAccelerator.compress(largeText, CompressionAlgorithm.Gzip, CompressionLevel.Fast);
console.timeEnd('Gzip Compress (Fast) (WASM)');
console.log(`Compression level Fast: ${largeTextGzippedFast.length} bytes, Ratio: ${compressionAccelerator.compressionRatio(largeText.length, largeTextGzippedFast.length).toFixed(4)}`);

console.time('Gzip Compress (Default) (WASM)');
const largeTextGzippedDefault = compressionAccelerator.compress(largeText, CompressionAlgorithm.Gzip, CompressionLevel.Default);
console.timeEnd('Gzip Compress (Default) (WASM)');
console.log(`Compression level Default: ${largeTextGzippedDefault.length} bytes, Ratio: ${compressionAccelerator.compressionRatio(largeText.length, largeTextGzippedDefault.length).toFixed(4)}`);

console.time('Gzip Compress (Best) (WASM)');
const largeTextGzippedBest = compressionAccelerator.compress(largeText, CompressionAlgorithm.Gzip, CompressionLevel.Best);
console.timeEnd('Gzip Compress (Best) (WASM)');
console.log(`Compression level Best: ${largeTextGzippedBest.length} bytes, Ratio: ${compressionAccelerator.compressionRatio(largeText.length, largeTextGzippedBest.length).toFixed(4)}`);

// Compression algorithms
console.log('\nCompression Algorithms:');
console.log('---------------------');

console.time('Gzip Compress (WASM)');
const largeTextGzip = compressionAccelerator.compress(largeText, CompressionAlgorithm.Gzip, CompressionLevel.Default);
console.timeEnd('Gzip Compress (WASM)');
console.log(`Gzip: ${largeTextGzip.length} bytes, Ratio: ${compressionAccelerator.compressionRatio(largeText.length, largeTextGzip.length).toFixed(4)}`);

console.time('Deflate Compress (WASM)');
const largeTextDeflate = compressionAccelerator.compress(largeText, CompressionAlgorithm.Deflate, CompressionLevel.Default);
console.timeEnd('Deflate Compress (WASM)');
console.log(`Deflate: ${largeTextDeflate.length} bytes, Ratio: ${compressionAccelerator.compressionRatio(largeText.length, largeTextDeflate.length).toFixed(4)}`);

console.time('Zlib Compress (WASM)');
const largeTextZlib = compressionAccelerator.compress(largeText, CompressionAlgorithm.Zlib, CompressionLevel.Default);
console.timeEnd('Zlib Compress (WASM)');
console.log(`Zlib: ${largeTextZlib.length} bytes, Ratio: ${compressionAccelerator.compressionRatio(largeText.length, largeTextZlib.length).toFixed(4)}`);

// Run-length encoding (RLE)
console.log('\nRun-Length Encoding (RLE):');
console.log('------------------------');

console.time('RLE Compress (WASM)');
const repeatedTextRle = compressionAccelerator.rleCompress(repeatedText);
console.timeEnd('RLE Compress (WASM)');
console.log(`Original size: ${repeatedText.length} bytes, Compressed size: ${repeatedTextRle.length} bytes`);
console.log(`Compression ratio: ${compressionAccelerator.compressionRatio(repeatedText.length, repeatedTextRle.length).toFixed(4)}`);

console.time('RLE Decompress (WASM)');
const repeatedTextRleDecompressed = compressionAccelerator.rleDecompress(repeatedTextRle);
console.timeEnd('RLE Decompress (WASM)');
console.log(`Decompressed text matches original: ${repeatedTextRleDecompressed === repeatedText}`);

// Huffman encoding
console.log('\nHuffman Encoding:');
console.log('----------------');

console.time('Huffman Compress (WASM)');
const largeTextHuffman = compressionAccelerator.huffmanCompress(largeText);
console.timeEnd('Huffman Compress (WASM)');
console.log(`Original size: ${largeText.length} bytes, Compressed size: ${largeTextHuffman.length} bytes`);
console.log(`Compression ratio: ${compressionAccelerator.compressionRatio(largeText.length, largeTextHuffman.length).toFixed(4)}`);

console.time('Huffman Decompress (WASM)');
const largeTextHuffmanDecompressed = compressionAccelerator.huffmanDecompress(largeTextHuffman);
console.timeEnd('Huffman Decompress (WASM)');
console.log(`Decompressed text matches original: ${largeTextHuffmanDecompressed === largeText}`);

// Compare with JavaScript implementations
console.log('\nComparison with JavaScript Implementations:');
console.log('----------------------------------------');

// RLE compression
console.time('RLE Compress (JS)');
const rleCompressJs = (text: string): Uint8Array => {
  if (text.length === 0) {
    return new Uint8Array(0);
  }
  
  const bytes = new TextEncoder().encode(text);
  const compressed: number[] = [];
  
  let currentChar = bytes[0];
  let count = 1;
  
  for (let i = 1; i < bytes.length; i++) {
    if (bytes[i] === currentChar && count < 255) {
      count++;
    } else {
      compressed.push(count);
      compressed.push(currentChar);
      currentChar = bytes[i];
      count = 1;
    }
  }
  
  // Add the last character
  compressed.push(count);
  compressed.push(currentChar);
  
  return new Uint8Array(compressed);
};
const repeatedTextRleJs = rleCompressJs(repeatedText);
console.timeEnd('RLE Compress (JS)');
console.log(`Original size: ${repeatedText.length} bytes, Compressed size (JS): ${repeatedTextRleJs.length} bytes`);
console.log(`Compression ratio (JS): ${compressionAccelerator.compressionRatio(repeatedText.length, repeatedTextRleJs.length).toFixed(4)}`);

console.log('\nWebAssembly-accelerated compression operations example completed.');
