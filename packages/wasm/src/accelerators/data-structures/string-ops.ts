import { WasmAccelerator } from '../wasm-accelerator';
import { PerformanceProfile, AcceleratorOptions } from '../accelerator';
import { WebAssemblyFeature } from '../../core/feature-detection';

/**
 * String operations accelerator
 * 
 * Provides optimized implementations of string operations
 * using WebAssembly.
 */
export class StringOperationsAccelerator extends WasmAccelerator {
  /**
   * Create a new string operations accelerator
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    super('data-structures', 'string-ops', 'operations', {
      ...options,
      requiredFeatures: [WebAssemblyFeature.BASIC],
    });
  }

  /**
   * Sort strings using a fast algorithm
   * 
   * @param strings The array of strings to sort
   * @returns The sorted array of strings
   */
  public sort(strings: string[]): string[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.sortJs(strings);
    }

    try {
      // Check if the array contains only strings
      if (!this.isStringArray(strings)) {
        return this.sortJs(strings);
      }
      
      // Call the WebAssembly implementation
      const result = module.string_sort(strings);
      
      // Convert the result back to a regular array
      return Array.from(result as any[]) as string[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.sortJs(strings);
    }
  }

  /**
   * Sort strings using a locale-aware algorithm
   * 
   * @param strings The array of strings to sort
   * @param locale The locale to use for sorting
   * @returns The sorted array of strings
   */
  public sortLocale(strings: string[], locale: string): string[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.sortLocaleJs(strings, locale);
    }

    try {
      // Check if the array contains only strings
      if (!this.isStringArray(strings)) {
        return this.sortLocaleJs(strings, locale);
      }
      
      // Call the WebAssembly implementation
      const result = module.string_sort_locale(strings, locale);
      
      // Convert the result back to a regular array
      return Array.from(result as any[]) as string[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.sortLocaleJs(strings, locale);
    }
  }

  /**
   * Find all occurrences of a pattern in a string
   * 
   * @param text The text to search in
   * @param pattern The pattern to search for
   * @returns An array of indices where the pattern occurs
   */
  public findAll(text: string, pattern: string): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.findAllJs(text, pattern);
    }

    try {
      // Validate inputs
      if (pattern.length === 0) {
        throw new Error('Pattern cannot be empty');
      }
      
      // Call the WebAssembly implementation
      const result = module.string_find_all(text, pattern);
      
      // Convert the result back to a regular array
      return Array.from(result as any[]) as number[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.findAllJs(text, pattern);
    }
  }

  /**
   * Find all occurrences of a pattern in a string using the Boyer-Moore algorithm
   * 
   * @param text The text to search in
   * @param pattern The pattern to search for
   * @returns An array of indices where the pattern occurs
   */
  public findAllBoyerMoore(text: string, pattern: string): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.findAllJs(text, pattern);
    }

    try {
      // Validate inputs
      if (pattern.length === 0) {
        throw new Error('Pattern cannot be empty');
      }
      
      // Call the WebAssembly implementation
      const result = module.string_find_all_boyer_moore(text, pattern);
      
      // Convert the result back to a regular array
      return Array.from(result as any[]) as number[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.findAllJs(text, pattern);
    }
  }

  /**
   * Encode a string to UTF-8
   * 
   * @param text The string to encode
   * @returns A Uint8Array containing the UTF-8 encoded bytes
   */
  public encodeUtf8(text: string): Uint8Array {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.encodeUtf8Js(text);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.string_encode_utf8(text);
      
      // Return the result
      return new Uint8Array(result as ArrayBuffer);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.encodeUtf8Js(text);
    }
  }

  /**
   * Decode a UTF-8 encoded array to a string
   * 
   * @param bytes The Uint8Array containing UTF-8 encoded bytes
   * @returns The decoded string
   */
  public decodeUtf8(bytes: Uint8Array): string {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.decodeUtf8Js(bytes);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.string_decode_utf8(bytes);
      
      // Return the result
      return result as string;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.decodeUtf8Js(bytes);
    }
  }

  /**
   * Encode a string to UTF-16
   * 
   * @param text The string to encode
   * @returns A Uint16Array containing the UTF-16 encoded code units
   */
  public encodeUtf16(text: string): Uint16Array {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.encodeUtf16Js(text);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.string_encode_utf16(text);
      
      // Return the result
      return new Uint16Array(result as ArrayBuffer);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.encodeUtf16Js(text);
    }
  }

  /**
   * Decode a UTF-16 encoded array to a string
   * 
   * @param codeUnits The Uint16Array containing UTF-16 encoded code units
   * @returns The decoded string
   */
  public decodeUtf16(codeUnits: Uint16Array): string {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.decodeUtf16Js(codeUnits);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.string_decode_utf16(codeUnits);
      
      // Return the result
      return result as string;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.decodeUtf16Js(codeUnits);
    }
  }

  /**
   * Calculate the Levenshtein distance between two strings
   * 
   * @param a The first string
   * @param b The second string
   * @returns The Levenshtein distance
   */
  public levenshteinDistance(a: string, b: string): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.levenshteinDistanceJs(a, b);
    }

    try {
      // Call the WebAssembly implementation
      return module.string_levenshtein_distance(a, b) as number;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.levenshteinDistanceJs(a, b);
    }
  }

  /**
   * Calculate the similarity between two strings
   * 
   * @param a The first string
   * @param b The second string
   * @returns A similarity score between 0 and 1
   */
  public similarity(a: string, b: string): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.similarityJs(a, b);
    }

    try {
      // Call the WebAssembly implementation
      return module.string_similarity(a, b) as number;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.similarityJs(a, b);
    }
  }

  /**
   * Tokenize a string into words
   * 
   * @param text The string to tokenize
   * @returns An array of words
   */
  public tokenize(text: string): string[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.tokenizeJs(text);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.string_tokenize(text);
      
      // Convert the result back to a regular array
      return Array.from(result as any[]) as string[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.tokenizeJs(text);
    }
  }

  /**
   * Tokenize a string into words with custom delimiters
   * 
   * @param text The string to tokenize
   * @param delimiters The delimiters to use
   * @returns An array of words
   */
  public tokenizeWithDelimiters(text: string, delimiters: string): string[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.tokenizeWithDelimitersJs(text, delimiters);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.string_tokenize_with_delimiters(text, delimiters);
      
      // Convert the result back to a regular array
      return Array.from(result as any[]) as string[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.tokenizeWithDelimitersJs(text, delimiters);
    }
  }

  /**
   * Execute the accelerated operation
   * @param _input The input for the operation
   * @returns The result of the operation
   */
  public execute(_input: any): any {
    throw new Error('Method not implemented. Use specific operation methods instead.');
  }

  /**
   * Get the performance profile of the string operations accelerator
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 5.0,
      effectiveInputSize: 1000,
    };
  }

  /**
   * Check if an array contains only strings
   * 
   * @param array The array to check
   * @returns True if the array contains only strings
   */
  private isStringArray(array: any[]): boolean {
    return array.every(value => typeof value === 'string');
  }

  /**
   * Sort strings using a fast algorithm using JavaScript
   * 
   * @param strings The array of strings to sort
   * @returns The sorted array of strings
   */
  private sortJs(strings: string[]): string[] {
    return [...strings].sort();
  }

  /**
   * Sort strings using a locale-aware algorithm using JavaScript
   * 
   * @param strings The array of strings to sort
   * @param locale The locale to use for sorting
   * @returns The sorted array of strings
   */
  private sortLocaleJs(strings: string[], locale: string): string[] {
    return [...strings].sort((a, b) => a.localeCompare(b, locale));
  }

  /**
   * Find all occurrences of a pattern in a string using JavaScript
   * 
   * @param text The text to search in
   * @param pattern The pattern to search for
   * @returns An array of indices where the pattern occurs
   */
  private findAllJs(text: string, pattern: string): number[] {
    if (pattern.length === 0) {
      throw new Error('Pattern cannot be empty');
    }

    const indices: number[] = [];
    let index = text.indexOf(pattern);

    while (index !== -1) {
      indices.push(index);
      index = text.indexOf(pattern, index + 1);
    }

    return indices;
  }

  /**
   * Encode a string to UTF-8 using JavaScript
   * 
   * @param text The string to encode
   * @returns A Uint8Array containing the UTF-8 encoded bytes
   */
  private encodeUtf8Js(text: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  /**
   * Decode a UTF-8 encoded array to a string using JavaScript
   * 
   * @param bytes The Uint8Array containing UTF-8 encoded bytes
   * @returns The decoded string
   */
  private decodeUtf8Js(bytes: Uint8Array): string {
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  /**
   * Encode a string to UTF-16 using JavaScript
   * 
   * @param text The string to encode
   * @returns A Uint16Array containing the UTF-16 encoded code units
   */
  private encodeUtf16Js(text: string): Uint16Array {
    const codeUnits = new Uint16Array(text.length);
    for (let i = 0; i < text.length; i++) {
      codeUnits[i] = text.charCodeAt(i);
    }
    return codeUnits;
  }

  /**
   * Decode a UTF-16 encoded array to a string using JavaScript
   * 
   * @param codeUnits The Uint16Array containing UTF-16 encoded code units
   * @returns The decoded string
   */
  private decodeUtf16Js(codeUnits: Uint16Array): string {
    return String.fromCharCode.apply(null, Array.from(codeUnits));
  }

  /**
   * Calculate the Levenshtein distance between two strings using JavaScript
   * 
   * @param a The first string
   * @param b The second string
   * @returns The Levenshtein distance
   */
  private levenshteinDistanceJs(a: string, b: string): number {
    // Get the lengths of the strings
    const aLen = a.length;
    const bLen = b.length;
    
    // Handle edge cases
    if (aLen === 0) {
      return bLen;
    }
    if (bLen === 0) {
      return aLen;
    }
    
    // Initialize the distance matrix
    const distances: number[][] = [];
    for (let i = 0; i <= aLen; i++) {
      distances[i] = [];
      distances[i][0] = i;
    }
    for (let j = 0; j <= bLen; j++) {
      distances[0][j] = j;
    }
    
    // Fill in the rest of the matrix
    for (let i = 1; i <= aLen; i++) {
      for (let j = 1; j <= bLen; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        
        distances[i][j] = Math.min(
          distances[i - 1][j] + 1,
          distances[i][j - 1] + 1,
          distances[i - 1][j - 1] + cost,
        );
      }
    }
    
    // Return the distance
    return distances[aLen][bLen];
  }

  /**
   * Calculate the similarity between two strings using JavaScript
   * 
   * @param a The first string
   * @param b The second string
   * @returns A similarity score between 0 and 1
   */
  private similarityJs(a: string, b: string): number {
    // Get the lengths of the strings
    const aLen = a.length;
    const bLen = b.length;
    
    // Handle edge cases
    if (aLen === 0 && bLen === 0) {
      return 1.0;
    }
    if (aLen === 0 || bLen === 0) {
      return 0.0;
    }
    
    // Calculate the Levenshtein distance
    const distance = this.levenshteinDistanceJs(a, b);
    
    // Calculate the similarity score
    const maxLen = Math.max(aLen, bLen);
    return 1.0 - (distance / maxLen);
  }

  /**
   * Tokenize a string into words using JavaScript
   * 
   * @param text The string to tokenize
   * @returns An array of words
   */
  private tokenizeJs(text: string): string[] {
    return text.split(/\s+/).filter(word => word.length > 0);
  }

  /**
   * Tokenize a string into words with custom delimiters using JavaScript
   * 
   * @param text The string to tokenize
   * @param delimiters The delimiters to use
   * @returns An array of words
   */
  private tokenizeWithDelimitersJs(text: string, delimiters: string): string[] {
    // Create a regular expression for splitting
    const delimiterRegex = new RegExp(`[${delimiters.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]+`);
    
    // Split the string and filter out empty strings
    return text.split(delimiterRegex).filter(word => word.length > 0);
  }
}
