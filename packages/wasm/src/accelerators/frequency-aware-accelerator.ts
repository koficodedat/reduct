/**
 * Frequency-aware accelerator for WebAssembly
 *
 * An accelerator that uses frequency detection to optimize operations in tight loops.
 */

import { AcceleratorOptions, AcceleratorTier, PerformanceProfile } from '@reduct/shared-types/wasm';
import { BaseAccelerator } from './accelerator';

/**
 * Options for a frequency-aware accelerator
 */
export interface FrequencyAwareAcceleratorOptions extends AcceleratorOptions {
  /**
   * JavaScript implementation of the operation
   */
  jsImplementation: (input: any) => any;

  /**
   * WebAssembly implementation of the operation
   */
  wasmImplementation: (input: any) => any;

  /**
   * Estimated speedup factor of the WebAssembly implementation compared to JavaScript
   */
  estimatedSpeedup?: number;

  /**
   * Minimum input size for which the WebAssembly implementation is effective
   */
  effectiveInputSize?: number;

  /**
   * Memory overhead of the WebAssembly implementation
   */
  memoryOverhead?: number;
}

/**
 * Frequency-aware accelerator for WebAssembly
 *
 * An accelerator that uses frequency detection to optimize operations in tight loops.
 */
export class FrequencyAwareAccelerator<T, R> extends BaseAccelerator<T, R> {
  /**
   * JavaScript implementation of the operation
   */
  private readonly jsImplementation: (input: T) => R;

  /**
   * WebAssembly implementation of the operation
   */
  private readonly wasmImplementation: (input: T) => R;

  /**
   * Estimated speedup factor of the WebAssembly implementation compared to JavaScript
   */
  private readonly estimatedSpeedup: number;

  /**
   * Minimum input size for which the WebAssembly implementation is effective
   */
  private readonly effectiveInputSize?: number;

  /**
   * Memory overhead of the WebAssembly implementation
   */
  private readonly memoryOverhead?: number;

  /**
   * Create a new frequency-aware accelerator
   *
   * @param domain The domain of the accelerator (e.g., 'data-structures')
   * @param type The type of the accelerator (e.g., 'list')
   * @param operation The operation to accelerate (e.g., 'map')
   * @param options Options for the accelerator
   */
  constructor(
    domain: string,
    type: string,
    operation: string,
    options: FrequencyAwareAcceleratorOptions
  ) {
    // Enable frequency detection by default
    const enhancedOptions: AcceleratorOptions = {
      ...options,
      useFrequencyDetection: true
    };

    super(domain, type, operation, enhancedOptions);

    this.jsImplementation = options.jsImplementation;
    this.wasmImplementation = options.wasmImplementation;
    this.estimatedSpeedup = options.estimatedSpeedup || 2.0;
    this.effectiveInputSize = options.effectiveInputSize;
    this.memoryOverhead = options.memoryOverhead;
  }

  /**
   * Execute the operation using the appropriate implementation for the given tier
   *
   * @param input The input for the operation
   * @param tier The tier to use
   * @returns The result of the operation
   */
  protected executeWithTier(input: T, tier: AcceleratorTier): R {
    switch (tier) {
      case AcceleratorTier.HIGH_VALUE:
      case AcceleratorTier.CONDITIONAL:
        try {
          return this.wasmImplementation(input);
        } catch (error) {
          console.warn('WebAssembly implementation failed, falling back to JavaScript:', error);
          return this.jsImplementation(input);
        }
      case AcceleratorTier.JS_PREFERRED:
      default:
        return this.jsImplementation(input);
    }
  }

  /**
   * Get the performance profile of the accelerator
   *
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: this.estimatedSpeedup,
      effectiveInputSize: this.effectiveInputSize,
      memoryOverhead: this.memoryOverhead
    };
  }
}
