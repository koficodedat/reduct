/**
 * WebAssembly accelerator interfaces and types
 *
 * This module provides types for WebAssembly acceleration.
 *
 * @packageDocumentation
 */

import { WebAssemblyFeature } from './features';

/**
 * Accelerator tiers for optimization strategy
 */
export enum AcceleratorTier {
  /**
   * Always use WebAssembly (significant performance benefit)
   */
  HIGH_VALUE = 'high-value',

  /**
   * Use WebAssembly conditionally (based on input characteristics)
   */
  CONDITIONAL = 'conditional',

  /**
   * Prefer JavaScript (WebAssembly overhead outweighs benefits)
   */
  JS_PREFERRED = 'js-preferred'
}

/**
 * Performance profile for an accelerator
 */
export interface PerformanceProfile {
  /**
   * Estimated speedup factor compared to JavaScript
   */
  estimatedSpeedup: number;

  /**
   * Effective input size where WebAssembly becomes faster than JavaScript
   */
  effectiveInputSize?: number;
}

/**
 * Options for an accelerator
 */
export interface AcceleratorOptions {
  /**
   * Required WebAssembly features
   */
  requiredFeatures?: WebAssemblyFeature[];

  /**
   * Element type for specialized accelerators
   */
  elementType?: string;

  /**
   * Whether to use SIMD when available
   */
  useSIMD?: boolean;

  /**
   * Custom options for the accelerator
   */
  [key: string]: any;
}

/**
 * Base accelerator interface
 */
export interface Accelerator<T, R> {
  /**
   * Execute the accelerated operation
   */
  execute(input: T): R;

  /**
   * Get the performance profile of the accelerator
   */
  getPerformanceProfile(): PerformanceProfile;
}
