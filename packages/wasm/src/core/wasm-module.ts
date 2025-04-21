/**
 * WebAssembly module loader and initialization
 */
import { isWebAssemblySupported } from './feature-detection';
import { WasmNotSupportedError, WasmLoadError } from './error-handling';

/**
 * WebAssembly module interface
 */
export interface WasmModule {
  // Core functions
  init_panic_hook(): void;
  greet(name: string): string;
  get_version(): string;

  // List operations
  vector_map(input: any, mapFn: Function): any;
  vector_filter(input: any, filterFn: Function): any;
  vector_reduce(input: any, reduceFn: Function, initial: any): any;
  vector_sort(input: any, compareFn: Function): any;
  vector_map_filter(input: any, mapFn: Function, filterFn: Function): any;
  vector_map_reduce(input: any, mapFn: Function, reduceFn: Function, initial: any): any;
  vector_filter_reduce(input: any, filterFn: Function, reduceFn: Function, initial: any): any;
  vector_map_filter_reduce(input: any, mapFn: Function, filterFn: Function, reduceFn: Function, initial: any): any;

  // Numeric operations
  numeric_map_f64(input: any, mapFn: Function): any;
  numeric_filter_f64(input: any, filterFn: Function): any;
  numeric_reduce_f64(input: any, reduceFn: Function, initial: any): any;
  numeric_sort_f64(input: any, compareFn?: Function): any;
  numeric_map_filter_f64(input: any, mapFn: Function, filterFn: Function): any;
  numeric_sum_f64(input: any): number;
  numeric_average_f64(input: any): number;
  numeric_min_f64(input: any): number;
  numeric_max_f64(input: any): number;

  // Statistical operations
  numeric_median_f64(input: any): number;
  numeric_std_dev_f64(input: any): number;
  numeric_correlation_f64(x: any, y: any): number;
  numeric_percentile_f64(input: any, percentile: number): number;

  // Advanced statistical operations
  numeric_covariance_f64(x: any, y: any): number;
  numeric_skewness_f64(input: any): number;
  numeric_kurtosis_f64(input: any): number;
  numeric_quantiles_f64(input: any, quantiles: any): any;

  // Time series operations
  numeric_moving_average_f64(input: any, windowSize: number): any;
  numeric_exponential_moving_average_f64(input: any, alpha: number): any;
  numeric_weighted_moving_average_f64(input: any, windowSize: number): any;
  numeric_detect_outliers_f64(input: any, threshold: number): any;
  numeric_interpolate_missing_f64(input: any): any;
  numeric_autocorrelation_f64(input: any, lag: number): number;

  // Machine learning operations
  linear_regression_f64(x: any, y: any): any;
  linear_regression_predict_f64(x: any, slope: number, intercept: number): any;
  kmeans_clustering_f64(data: any, k: number, maxIterations: number): any;
  pca_f64(data: any, numComponents: number): any;

  // Neural network operations
  neural_network_forward_f64(inputs: any, weights: any, biases: any, activation: number): any;
  neural_network_forward_multi_layer_f64(inputs: any, weights: any, biases: any, activations: any): any;
  neural_network_backprop_f64(inputs: any, weights: any, biases: any, targets: any, learningRate: number, activation: number): any;
  neural_network_mse_loss_f64(predictions: any, targets: any): number;
  neural_network_binary_cross_entropy_loss_f64(predictions: any, targets: any): number;
  neural_network_init_weights_xavier_f64(inputSize: number, outputSize: number): any;
  neural_network_init_biases_zero_f64(outputSize: number): any;

  // String operations
  string_sort(strings: any): any;
  string_sort_locale(strings: any, locale: string): any;
  string_find_all(text: string, pattern: string): any;
  string_find_all_boyer_moore(text: string, pattern: string): any;
  string_encode_utf8(text: string): any;
  string_decode_utf8(bytes: any): any;
  string_encode_utf16(text: string): any;
  string_decode_utf16(codeUnits: any): any;
  string_levenshtein_distance(a: string, b: string): number;
  string_similarity(a: string, b: string): number;
  string_tokenize(text: string): any;
  string_tokenize_with_delimiters(text: string, delimiters: string): any;

  // Regular expression operations
  regex_test(text: string, pattern: string): boolean;
  regex_find_first(text: string, pattern: string): any;
  regex_find_all(text: string, pattern: string): any;
  regex_replace_all(text: string, pattern: string, replacement: string): string;
  regex_split(text: string, pattern: string): any;
  regex_capture_groups(text: string, pattern: string): any;
  regex_named_capture_groups(text: string, pattern: string): any;
  regex_validate_pattern(pattern: string): boolean;
  regex_escape(text: string): string;
  regex_is_valid(pattern: string): boolean;
  regex_get_info(pattern: string): any;

  // Natural language processing operations
  nlp_tokenize(text: string): any;
  nlp_word_frequencies(text: string): any;
  nlp_tf_idf(document: string, corpus: any): any;
  nlp_extract_sentences(text: string): any;
  nlp_jaccard_similarity(text1: string, text2: string): number;

  // Compression operations
  compress_text(text: string, algorithm: number, level: number): any;
  decompress_bytes(bytes: any, algorithm: number): string;
  compression_ratio(originalSize: number, compressedSize: number): number;
  rle_compress(text: string): any;
  rle_decompress(bytes: any): string;
  huffman_compress(text: string): any;
  huffman_decompress(bytes: any): string;

  // Unicode operations
  unicode_normalize(text: string, form: number): string;
  unicode_to_uppercase(text: string): string;
  unicode_to_lowercase(text: string): string;
  unicode_is_uppercase(c: string): boolean;
  unicode_is_lowercase(c: string): boolean;
  unicode_is_alphabetic(c: string): boolean;
  unicode_is_numeric(c: string): boolean;
  unicode_is_alphanumeric(c: string): boolean;
  unicode_is_whitespace(c: string): boolean;
  unicode_is_control(c: string): boolean;
  unicode_code_point(c: string): number;
  unicode_grapheme_clusters(text: string): any;
  unicode_grapheme_cluster_count(text: string): number;
  unicode_words(text: string): any;
  unicode_word_count(text: string): number;
  unicode_char_info(c: string): any;
  unicode_case_fold(text: string): string;
  unicode_case_fold_compare(a: string, b: string): boolean;
  unicode_trim(text: string): string;
  unicode_trim_start(text: string): string;
  unicode_trim_end(text: string): string;

  // Sorting algorithms
  specialized_sort_f64(input: any): any;
  radix_sort_u32(input: any): any;
  counting_sort_u8(input: any): any;
}

/**
 * WebAssembly module loader
 */
export class WasmModuleLoader {
  private static instance: WasmModuleLoader;
  private module: WasmModule | null = null;
  private loading: Promise<WasmModule> | null = null;

  /**
   * Get the singleton instance of the WebAssembly module loader
   * @returns The WebAssembly module loader instance
   */
  public static getInstance(): WasmModuleLoader {
    if (!WasmModuleLoader.instance) {
      WasmModuleLoader.instance = new WasmModuleLoader();
    }
    return WasmModuleLoader.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Load the WebAssembly module
   * @returns A promise that resolves to the WebAssembly module
   * @throws WasmNotSupportedError if WebAssembly is not supported
   * @throws WasmLoadError if the module fails to load
   */
  public async loadModule(): Promise<WasmModule> {
    // If the module is already loaded, return it
    if (this.module) {
      return this.module;
    }

    // If the module is already loading, return the loading promise
    if (this.loading) {
      return this.loading;
    }

    // Check if WebAssembly is supported
    if (!isWebAssemblySupported()) {
      throw new WasmNotSupportedError();
    }

    // Load the module
    this.loading = this.loadModuleInternal();

    try {
      this.module = await this.loading;
      return this.module;
    } catch (error) {
      // Clear the loading promise
      this.loading = null;

      // Throw a WasmLoadError
      throw new WasmLoadError(
        `Failed to load WebAssembly module: ${error}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Internal method to load the WebAssembly module
   * @returns A promise that resolves to the WebAssembly module
   */
  private async loadModuleInternal(): Promise<WasmModule> {
    try {
      // Import the WebAssembly module
      // Use a dynamic import with a string literal to avoid TypeScript errors
      const wasmModulePath = '../../../dist/wasm/reduct_wasm.js';
      const wasmModule = await (Function('return import("' + wasmModulePath + '")')() as Promise<any>);

      // Initialize the module
      wasmModule.init_panic_hook();

      return wasmModule as unknown as WasmModule;
    } catch (error) {
      console.error('Failed to load WebAssembly module:', error);
      throw error;
    }
  }

  /**
   * Check if the WebAssembly module is loaded
   * @returns True if the module is loaded, false otherwise
   */
  public isLoaded(): boolean {
    return this.module !== null;
  }

  /**
   * Get the WebAssembly module
   * @returns The WebAssembly module, or null if not loaded
   */
  public getModule(): WasmModule | null {
    return this.module;
  }

  /**
   * Clear the loaded module
   */
  public clearModule(): void {
    this.module = null;
    this.loading = null;
  }
}
