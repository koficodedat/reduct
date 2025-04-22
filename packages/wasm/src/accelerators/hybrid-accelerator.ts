/**
 * Hybrid accelerator for WebAssembly
 *
 * An accelerator that uses both JavaScript and WebAssembly for different parts of an operation.
 */

import { AcceleratorOptions, AcceleratorTier, PerformanceProfile } from '@reduct/shared-types/wasm';
import { BaseAccelerator } from './accelerator';
import { EnhancedInputCharacteristicsAnalyzer, ProcessingStrategy } from '../utils/enhanced-input-characteristics';

/**
 * Hybrid operation part
 */
export enum HybridOperationPart {
  /**
   * Preprocessing part (typically done in JavaScript)
   */
  PREPROCESSING = 'preprocessing',

  /**
   * Core processing part (typically done in WebAssembly)
   */
  CORE_PROCESSING = 'core_processing',

  /**
   * Postprocessing part (typically done in JavaScript)
   */
  POSTPROCESSING = 'postprocessing'
}

/**
 * Hybrid operation implementation
 */
export interface HybridOperationImplementation<T, R, I = any> {
  /**
   * Preprocessing function (JavaScript)
   * @param input The input for the operation
   * @returns The preprocessed input
   */
  preprocess: (input: T) => I;

  /**
   * Core processing function (WebAssembly)
   * @param input The preprocessed input
   * @returns The processed output
   */
  process: (input: I) => I;

  /**
   * Postprocessing function (JavaScript)
   * @param input The processed output
   * @returns The final result
   */
  postprocess: (input: I) => R;

  /**
   * Pure JavaScript implementation
   * @param input The input for the operation
   * @returns The result of the operation
   */
  jsImplementation: (input: T) => R;
}

/**
 * Options for a hybrid accelerator
 */
export interface HybridAcceleratorOptions extends AcceleratorOptions {
  /**
   * Hybrid operation implementation
   */
  implementation: HybridOperationImplementation<any, any, any>;

  /**
   * Estimated speedup factor of the hybrid implementation compared to JavaScript
   */
  estimatedSpeedup?: number;

  /**
   * Minimum input size for which the hybrid implementation is effective
   */
  effectiveInputSize?: number;

  /**
   * Memory overhead of the hybrid implementation
   */
  memoryOverhead?: number;

  /**
   * Whether to use enhanced input characteristics analysis
   */
  useEnhancedAnalysis?: boolean;
}

/**
 * Hybrid accelerator for WebAssembly
 *
 * An accelerator that uses both JavaScript and WebAssembly for different parts of an operation.
 */
export class HybridAccelerator<T, R, I = any> extends BaseAccelerator<T, R> {
  /**
   * Hybrid operation implementation
   */
  private readonly implementation: HybridOperationImplementation<T, R, I>;

  /**
   * Estimated speedup factor of the hybrid implementation compared to JavaScript
   */
  private readonly estimatedSpeedup: number;

  /**
   * Minimum input size for which the hybrid implementation is effective
   */
  private readonly effectiveInputSize?: number;

  /**
   * Memory overhead of the hybrid implementation
   */
  private readonly memoryOverhead?: number;

  /**
   * Whether to use enhanced input characteristics analysis
   */
  private readonly useEnhancedAnalysis: boolean;

  /**
   * Create a new hybrid accelerator
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
    options: HybridAcceleratorOptions
  ) {
    super(domain, type, operation, options);

    this.implementation = options.implementation;
    this.estimatedSpeedup = options.estimatedSpeedup || 1.5;
    this.effectiveInputSize = options.effectiveInputSize;
    this.memoryOverhead = options.memoryOverhead;
    this.useEnhancedAnalysis = options.useEnhancedAnalysis || false;
  }

  /**
   * Execute the operation
   *
   * @param input The input for the operation
   * @returns The result of the operation
   */
  public execute(input: T): R {
    // Determine the appropriate tier for the input
    const tier = this.determineTier(input);

    // Execute the operation using the appropriate implementation
    return this.executeWithTier(input, tier);
  }

  /**
   * Determine the appropriate tier for the input
   *
   * @param input The input for the operation
   * @returns The appropriate tier
   */
  public determineTier(input: T): AcceleratorTier {
    // If enhanced analysis is enabled, use it to determine the tier
    if (this.useEnhancedAnalysis && Array.isArray(input)) {
      const characteristics = EnhancedInputCharacteristicsAnalyzer.analyzeArray(input);

      // Use the recommended strategy to determine the tier
      switch (characteristics.recommendedStrategy) {
        case ProcessingStrategy.WEBASSEMBLY:
        case ProcessingStrategy.SIMD:
        case ProcessingStrategy.PARALLEL:
          return AcceleratorTier.HIGH_VALUE;

        case ProcessingStrategy.HYBRID:
          return AcceleratorTier.CONDITIONAL;

        case ProcessingStrategy.JAVASCRIPT:
        default:
          return AcceleratorTier.JS_PREFERRED;
      }
    }

    // Otherwise, use the default tier determination
    return super.determineTier(input);
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
          // Use the hybrid implementation
          return this.executeHybrid(input);
        } catch (error) {
          console.warn('Hybrid implementation failed, falling back to JavaScript:', error);
          return this.implementation.jsImplementation(input);
        }

      case AcceleratorTier.JS_PREFERRED:
      default:
        return this.implementation.jsImplementation(input);
    }
  }

  /**
   * Execute the operation using the hybrid implementation
   *
   * @param input The input for the operation
   * @returns The result of the operation
   */
  private executeHybrid(input: T): R {
    // Preprocess the input (JavaScript)
    const preprocessed = this.implementation.preprocess(input);

    // Process the input (WebAssembly)
    const processed = this.implementation.process(preprocessed);

    // Postprocess the output (JavaScript)
    return this.implementation.postprocess(processed);
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
