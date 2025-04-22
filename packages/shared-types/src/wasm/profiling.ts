/**
 * WebAssembly profiling types
 *
 * This module provides types for profiling WebAssembly operations.
 *
 * @packageDocumentation
 */

/**
 * Profile entry for WebAssembly operations
 */
export interface ProfileEntry {
  /**
   * Name of the operation
   */
  name: string;
  
  /**
   * Start time (ms)
   */
  startTime: number;
  
  /**
   * End time (ms)
   */
  endTime: number;
  
  /**
   * Duration (ms)
   */
  duration: number;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * WebAssembly profiling options
 */
export interface WasmProfilingOptions {
  /**
   * Whether to enable profiling
   */
  enabled: boolean;
  
  /**
   * Whether to log profiling data to the console
   */
  logToConsole: boolean;
  
  /**
   * The maximum number of profiling entries to keep in memory
   */
  maxEntries: number;
}

/**
 * WebAssembly profiling summary
 */
export interface WasmProfilingSummary {
  /**
   * Operation name
   */
  name: string;
  
  /**
   * Number of calls
   */
  count: number;
  
  /**
   * Total duration (ms)
   */
  totalDuration: number;
  
  /**
   * Average duration (ms)
   */
  averageDuration: number;
}
