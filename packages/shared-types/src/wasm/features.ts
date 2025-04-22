/**
 * WebAssembly features
 *
 * This module provides types for WebAssembly feature detection.
 *
 * @packageDocumentation
 */

/**
 * WebAssembly features that can be detected
 */
export enum WebAssemblyFeature {
  /**
   * Basic WebAssembly support
   */
  BASIC = 'basic',
  
  /**
   * SIMD (Single Instruction, Multiple Data) support
   */
  SIMD = 'simd',
  
  /**
   * Threading support
   */
  THREADS = 'threads',
  
  /**
   * Reference types support
   */
  REFERENCE_TYPES = 'reference-types',
  
  /**
   * Bulk memory operations support
   */
  BULK_MEMORY = 'bulk-memory',
  
  /**
   * Exception handling support
   */
  EXCEPTION_HANDLING = 'exception-handling',
}
