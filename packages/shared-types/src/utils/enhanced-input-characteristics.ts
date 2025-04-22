/**
 * Enhanced Input Characteristics Types
 *
 * This module provides types for enhanced analysis of input characteristics to help determine
 * when to use WebAssembly and which implementation strategy to use.
 *
 * @packageDocumentation
 */

import { InputCharacteristics } from './input-characteristics';

/**
 * Processing strategy
 */
export enum ProcessingStrategy {
  /**
   * Use JavaScript implementation
   */
  JAVASCRIPT = 'javascript',

  /**
   * Use WebAssembly implementation
   */
  WEBASSEMBLY = 'webassembly',

  /**
   * Use hybrid implementation (part JavaScript, part WebAssembly)
   */
  HYBRID = 'hybrid',

  /**
   * Use SIMD-accelerated implementation
   */
  SIMD = 'simd',

  /**
   * Use parallel implementation
   */
  PARALLEL = 'parallel',

  /**
   * Use specialized implementation for the specific input characteristics
   */
  SPECIALIZED = 'specialized'
}

/**
 * Enhanced input characteristics
 */
export interface EnhancedInputCharacteristics extends InputCharacteristics {
  /**
   * Whether the input is suitable for WebAssembly acceleration
   */
  isWasmSuitable: boolean;

  /**
   * Whether the input is suitable for SIMD acceleration
   */
  isSIMDSuitable: boolean;

  /**
   * Whether the input is suitable for parallel processing
   */
  isParallelSuitable: boolean;

  /**
   * Whether the input is suitable for hybrid processing
   */
  isHybridSuitable: boolean;

  /**
   * Recommended processing strategy
   */
  recommendedStrategy: ProcessingStrategy;

  /**
   * Estimated speedup factor for WebAssembly
   */
  estimatedWasmSpeedup: number;

  /**
   * Estimated memory overhead for WebAssembly
   */
  estimatedMemoryOverhead: number;

  /**
   * Complexity score (higher means more complex)
   */
  complexityScore: number;
}
