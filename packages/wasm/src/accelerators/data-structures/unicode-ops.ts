import { WebAssemblyFeature } from '../../core/feature-detection';
import { PerformanceProfile, AcceleratorOptions } from '../accelerator';
import { WasmAccelerator } from '../wasm-accelerator';

/**
 * Unicode normalization form enum
 */
export enum NormalizationForm {
  NFC = 0,
  NFD = 1,
  NFKC = 2,
  NFKD = 3,
}

/**
 * Unicode character information interface
 */
export interface UnicodeCharInfo {
  /** The Unicode code point */
  codePoint: number;
  /** Whether the character is uppercase */
  isUppercase: boolean;
  /** Whether the character is lowercase */
  isLowercase: boolean;
  /** Whether the character is alphabetic */
  isAlphabetic: boolean;
  /** Whether the character is numeric */
  isNumeric: boolean;
  /** Whether the character is alphanumeric */
  isAlphanumeric: boolean;
  /** Whether the character is whitespace */
  isWhitespace: boolean;
  /** Whether the character is a control character */
  isControl: boolean;
}

/**
 * Unicode operations accelerator
 * 
 * Provides optimized implementations of Unicode operations
 * using WebAssembly.
 */
export class UnicodeOperationsAccelerator extends WasmAccelerator {
  /**
   * Create a new Unicode operations accelerator
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    super('data-structures', 'unicode-ops', 'operations', {
      ...options,
      requiredFeatures: [WebAssemblyFeature.BASIC],
    });
  }

  /**
   * Normalize Unicode text
   * 
   * @param text The text to normalize
   * @param form The normalization form to use
   * @returns The normalized text
   */
  public normalize(text: string, form: NormalizationForm = NormalizationForm.NFC): string {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.normalizeJs(text, form);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_normalize(text, form) as string;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.normalizeJs(text, form);
    }
  }

  /**
   * Convert text to uppercase
   * 
   * @param text The text to convert
   * @returns The uppercase text
   */
  public toUpperCase(text: string): string {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.toUpperCaseJs(text);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_to_uppercase(text) as string;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.toUpperCaseJs(text);
    }
  }

  /**
   * Convert text to lowercase
   * 
   * @param text The text to convert
   * @returns The lowercase text
   */
  public toLowerCase(text: string): string {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.toLowerCaseJs(text);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_to_lowercase(text) as string;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.toLowerCaseJs(text);
    }
  }

  /**
   * Check if a character is uppercase
   * 
   * @param c The character to check
   * @returns True if the character is uppercase
   */
  public isUpperCase(c: string): boolean {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.isUpperCaseJs(c);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_is_uppercase(c) as boolean;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.isUpperCaseJs(c);
    }
  }

  /**
   * Check if a character is lowercase
   * 
   * @param c The character to check
   * @returns True if the character is lowercase
   */
  public isLowerCase(c: string): boolean {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.isLowerCaseJs(c);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_is_lowercase(c) as boolean;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.isLowerCaseJs(c);
    }
  }

  /**
   * Check if a character is alphabetic
   * 
   * @param c The character to check
   * @returns True if the character is alphabetic
   */
  public isAlphabetic(c: string): boolean {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.isAlphabeticJs(c);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_is_alphabetic(c) as boolean;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.isAlphabeticJs(c);
    }
  }

  /**
   * Check if a character is numeric
   * 
   * @param c The character to check
   * @returns True if the character is numeric
   */
  public isNumeric(c: string): boolean {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.isNumericJs(c);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_is_numeric(c) as boolean;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.isNumericJs(c);
    }
  }

  /**
   * Check if a character is alphanumeric
   * 
   * @param c The character to check
   * @returns True if the character is alphanumeric
   */
  public isAlphanumeric(c: string): boolean {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.isAlphanumericJs(c);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_is_alphanumeric(c) as boolean;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.isAlphanumericJs(c);
    }
  }

  /**
   * Check if a character is whitespace
   * 
   * @param c The character to check
   * @returns True if the character is whitespace
   */
  public isWhitespace(c: string): boolean {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.isWhitespaceJs(c);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_is_whitespace(c) as boolean;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.isWhitespaceJs(c);
    }
  }

  /**
   * Check if a character is a control character
   * 
   * @param c The character to check
   * @returns True if the character is a control character
   */
  public isControl(c: string): boolean {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.isControlJs(c);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_is_control(c) as boolean;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.isControlJs(c);
    }
  }

  /**
   * Get the Unicode code point of a character
   * 
   * @param c The character to get the code point of
   * @returns The Unicode code point
   */
  public codePoint(c: string): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.codePointJs(c);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_code_point(c) as number;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.codePointJs(c);
    }
  }

  /**
   * Split text into grapheme clusters
   * 
   * @param text The text to split
   * @returns An array of grapheme clusters
   */
  public graphemeClusters(text: string): string[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.graphemeClustersJs(text);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.unicode_grapheme_clusters(text);
      
      // Convert the result back to a regular array
      return Array.from(result as any[]) as string[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.graphemeClustersJs(text);
    }
  }

  /**
   * Count grapheme clusters in text
   * 
   * @param text The text to count grapheme clusters in
   * @returns The number of grapheme clusters
   */
  public graphemeClusterCount(text: string): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.graphemeClusterCountJs(text);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_grapheme_cluster_count(text) as number;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.graphemeClusterCountJs(text);
    }
  }

  /**
   * Split text into words
   * 
   * @param text The text to split
   * @returns An array of words
   */
  public words(text: string): string[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.wordsJs(text);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.unicode_words(text);
      
      // Convert the result back to a regular array
      return Array.from(result as any[]) as string[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.wordsJs(text);
    }
  }

  /**
   * Count words in text
   * 
   * @param text The text to count words in
   * @returns The number of words
   */
  public wordCount(text: string): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.wordCountJs(text);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_word_count(text) as number;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.wordCountJs(text);
    }
  }

  /**
   * Get Unicode character information
   * 
   * @param c The character to get information about
   * @returns Information about the character
   */
  public charInfo(c: string): UnicodeCharInfo {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.charInfoJs(c);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.unicode_char_info(c);
      
      // Convert the result to a UnicodeCharInfo
      return result as UnicodeCharInfo;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.charInfoJs(c);
    }
  }

  /**
   * Fold case of text
   * 
   * @param text The text to fold case of
   * @returns The case-folded text
   */
  public caseFold(text: string): string {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.caseFoldJs(text);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_case_fold(text) as string;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.caseFoldJs(text);
    }
  }

  /**
   * Compare strings with case folding
   * 
   * @param a The first string
   * @param b The second string
   * @returns True if the strings are equal after case folding
   */
  public caseFoldCompare(a: string, b: string): boolean {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.caseFoldCompareJs(a, b);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_case_fold_compare(a, b) as boolean;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.caseFoldCompareJs(a, b);
    }
  }

  /**
   * Trim whitespace from text
   * 
   * @param text The text to trim
   * @returns The trimmed text
   */
  public trim(text: string): string {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.trimJs(text);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_trim(text) as string;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.trimJs(text);
    }
  }

  /**
   * Trim whitespace from the start of text
   * 
   * @param text The text to trim
   * @returns The trimmed text
   */
  public trimStart(text: string): string {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.trimStartJs(text);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_trim_start(text) as string;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.trimStartJs(text);
    }
  }

  /**
   * Trim whitespace from the end of text
   * 
   * @param text The text to trim
   * @returns The trimmed text
   */
  public trimEnd(text: string): string {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.trimEndJs(text);
    }

    try {
      // Call the WebAssembly implementation
      return module.unicode_trim_end(text) as string;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.trimEndJs(text);
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
   * Get the performance profile of the Unicode operations accelerator
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 2.0,
      effectiveInputSize: 1000,
    };
  }

  /**
   * Normalize Unicode text using JavaScript
   * 
   * @param text The text to normalize
   * @param form The normalization form to use
   * @returns The normalized text
   */
  private normalizeJs(text: string, form: NormalizationForm): string {
    switch (form) {
      case NormalizationForm.NFC:
        return text.normalize('NFC');
      case NormalizationForm.NFD:
        return text.normalize('NFD');
      case NormalizationForm.NFKC:
        return text.normalize('NFKC');
      case NormalizationForm.NFKD:
        return text.normalize('NFKD');
      default:
        return text.normalize('NFC');
    }
  }

  /**
   * Convert text to uppercase using JavaScript
   * 
   * @param text The text to convert
   * @returns The uppercase text
   */
  private toUpperCaseJs(text: string): string {
    return text.toUpperCase();
  }

  /**
   * Convert text to lowercase using JavaScript
   * 
   * @param text The text to convert
   * @returns The lowercase text
   */
  private toLowerCaseJs(text: string): string {
    return text.toLowerCase();
  }

  /**
   * Check if a character is uppercase using JavaScript
   * 
   * @param c The character to check
   * @returns True if the character is uppercase
   */
  private isUpperCaseJs(c: string): boolean {
    if (c.length !== 1) {
      throw new Error('Input must be a single character');
    }
    
    return c === c.toUpperCase() && c !== c.toLowerCase();
  }

  /**
   * Check if a character is lowercase using JavaScript
   * 
   * @param c The character to check
   * @returns True if the character is lowercase
   */
  private isLowerCaseJs(c: string): boolean {
    if (c.length !== 1) {
      throw new Error('Input must be a single character');
    }
    
    return c === c.toLowerCase() && c !== c.toUpperCase();
  }

  /**
   * Check if a character is alphabetic using JavaScript
   * 
   * @param c The character to check
   * @returns True if the character is alphabetic
   */
  private isAlphabeticJs(c: string): boolean {
    if (c.length !== 1) {
      throw new Error('Input must be a single character');
    }
    
    return /^[a-zA-Z]$/.test(c);
  }

  /**
   * Check if a character is numeric using JavaScript
   * 
   * @param c The character to check
   * @returns True if the character is numeric
   */
  private isNumericJs(c: string): boolean {
    if (c.length !== 1) {
      throw new Error('Input must be a single character');
    }
    
    return /^[0-9]$/.test(c);
  }

  /**
   * Check if a character is alphanumeric using JavaScript
   * 
   * @param c The character to check
   * @returns True if the character is alphanumeric
   */
  private isAlphanumericJs(c: string): boolean {
    if (c.length !== 1) {
      throw new Error('Input must be a single character');
    }
    
    return /^[a-zA-Z0-9]$/.test(c);
  }

  /**
   * Check if a character is whitespace using JavaScript
   * 
   * @param c The character to check
   * @returns True if the character is whitespace
   */
  private isWhitespaceJs(c: string): boolean {
    if (c.length !== 1) {
      throw new Error('Input must be a single character');
    }
    
    return /^\s$/.test(c);
  }

  /**
   * Check if a character is a control character using JavaScript
   * 
   * @param c The character to check
   * @returns True if the character is a control character
   */
  private isControlJs(c: string): boolean {
    if (c.length !== 1) {
      throw new Error('Input must be a single character');
    }
    
    const code = c.charCodeAt(0);
    return (code >= 0 && code <= 31) || code === 127;
  }

  /**
   * Get the Unicode code point of a character using JavaScript
   * 
   * @param c The character to get the code point of
   * @returns The Unicode code point
   */
  private codePointJs(c: string): number {
    if (c.length !== 1) {
      throw new Error('Input must be a single character');
    }
    
    return c.codePointAt(0) || 0;
  }

  /**
   * Split text into grapheme clusters using JavaScript
   * 
   * @param text The text to split
   * @returns An array of grapheme clusters
   */
  private graphemeClustersJs(text: string): string[] {
    // This is a simplified implementation
    // For a real implementation, we would need to use a library like grapheme-splitter
    return [...text];
  }

  /**
   * Count grapheme clusters in text using JavaScript
   * 
   * @param text The text to count grapheme clusters in
   * @returns The number of grapheme clusters
   */
  private graphemeClusterCountJs(text: string): number {
    // This is a simplified implementation
    // For a real implementation, we would need to use a library like grapheme-splitter
    return [...text].length;
  }

  /**
   * Split text into words using JavaScript
   * 
   * @param text The text to split
   * @returns An array of words
   */
  private wordsJs(text: string): string[] {
    return text.match(/\w+/g) || [];
  }

  /**
   * Count words in text using JavaScript
   * 
   * @param text The text to count words in
   * @returns The number of words
   */
  private wordCountJs(text: string): number {
    return (text.match(/\w+/g) || []).length;
  }

  /**
   * Get Unicode character information using JavaScript
   * 
   * @param c The character to get information about
   * @returns Information about the character
   */
  private charInfoJs(c: string): UnicodeCharInfo {
    if (c.length !== 1) {
      throw new Error('Input must be a single character');
    }
    
    const codePoint = c.codePointAt(0) || 0;
    
    return {
      codePoint,
      isUppercase: this.isUpperCaseJs(c),
      isLowercase: this.isLowerCaseJs(c),
      isAlphabetic: this.isAlphabeticJs(c),
      isNumeric: this.isNumericJs(c),
      isAlphanumeric: this.isAlphanumericJs(c),
      isWhitespace: this.isWhitespaceJs(c),
      isControl: this.isControlJs(c),
    };
  }

  /**
   * Fold case of text using JavaScript
   * 
   * @param text The text to fold case of
   * @returns The case-folded text
   */
  private caseFoldJs(text: string): string {
    // Case folding is similar to lowercase but more comprehensive
    // For simplicity, we'll use lowercase as an approximation
    return text.toLowerCase();
  }

  /**
   * Compare strings with case folding using JavaScript
   * 
   * @param a The first string
   * @param b The second string
   * @returns True if the strings are equal after case folding
   */
  private caseFoldCompareJs(a: string, b: string): boolean {
    return a.toLowerCase() === b.toLowerCase();
  }

  /**
   * Trim whitespace from text using JavaScript
   * 
   * @param text The text to trim
   * @returns The trimmed text
   */
  private trimJs(text: string): string {
    return text.trim();
  }

  /**
   * Trim whitespace from the start of text using JavaScript
   * 
   * @param text The text to trim
   * @returns The trimmed text
   */
  private trimStartJs(text: string): string {
    return text.trimStart();
  }

  /**
   * Trim whitespace from the end of text using JavaScript
   * 
   * @param text The text to trim
   * @returns The trimmed text
   */
  private trimEndJs(text: string): string {
    return text.trimEnd();
  }
}
