/**
 * Performance Counter
 *
 * This utility tracks performance metrics for WebAssembly acceleration.
 * It records execution times, speedups, and other metrics to help optimize
 * the decision of when to use WebAssembly vs. JavaScript.
 */
import { adaptiveThresholdManager, PerformanceSample } from './adaptive-threshold-manager';

/**
 * Performance metrics for an operation
 */
export interface PerformanceMetrics {
  /**
   * Total number of executions
   */
  totalExecutions: number;

  /**
   * Number of WebAssembly executions
   */
  wasmExecutions: number;

  /**
   * Number of JavaScript executions
   */
  jsExecutions: number;

  /**
   * Number of fallbacks from WebAssembly to JavaScript
   */
  fallbacks: number;

  /**
   * Total JavaScript execution time in milliseconds
   */
  totalJsTime: number;

  /**
   * Total WebAssembly execution time in milliseconds
   */
  totalWasmTime: number;

  /**
   * Average JavaScript execution time in milliseconds
   */
  avgJsTime: number;

  /**
   * Average WebAssembly execution time in milliseconds
   */
  avgWasmTime: number;

  /**
   * Average speedup ratio (jsTime/wasmTime)
   */
  avgSpeedup: number;

  /**
   * Maximum speedup ratio observed
   */
  maxSpeedup: number;

  /**
   * Minimum speedup ratio observed
   */
  minSpeedup: number;

  /**
   * Total time saved by using WebAssembly in milliseconds
   */
  totalTimeSaved: number;
}

/**
 * Performance counter for WebAssembly acceleration
 */
export class PerformanceCounter {
  private _metrics: Map<string, PerformanceMetrics> = new Map();
  private _enabled: boolean = true;

  /**
   * Create a new performance counter
   * @param enabled Whether the counter is enabled
   */
  constructor(enabled: boolean = true) {
    this._enabled = enabled;
  }

  /**
   * Enable or disable the counter
   * @param enabled Whether the counter is enabled
   */
  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  /**
   * Check if the counter is enabled
   * @returns Whether the counter is enabled
   */
  public isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * Record a performance measurement
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   * @param jsTime JavaScript execution time in milliseconds
   * @param wasmTime WebAssembly execution time in milliseconds
   * @param inputSize Size of the input
   * @param usedWasm Whether WebAssembly was used
   * @param fallback Whether there was a fallback from WebAssembly to JavaScript
   */
  public recordMeasurement(
    domain: string,
    type: string,
    operation: string,
    jsTime: number,
    wasmTime: number,
    inputSize: number,
    usedWasm: boolean,
    fallback: boolean = false
  ): void {
    if (!this._enabled) {
      return;
    }

    const key = this._getKey(domain, type, operation);
    
    // Get or create the metrics
    let metrics = this._metrics.get(key);
    if (!metrics) {
      metrics = this._createEmptyMetrics();
      this._metrics.set(key, metrics);
    }
    
    // Update the metrics
    metrics.totalExecutions++;
    if (usedWasm) {
      metrics.wasmExecutions++;
      metrics.totalWasmTime += wasmTime;
    } else {
      metrics.jsExecutions++;
      metrics.totalJsTime += jsTime;
    }
    
    if (fallback) {
      metrics.fallbacks++;
    }
    
    // Calculate speedup
    const speedup = jsTime / wasmTime;
    
    // Update speedup metrics
    if (metrics.totalExecutions === 1) {
      metrics.avgSpeedup = speedup;
      metrics.maxSpeedup = speedup;
      metrics.minSpeedup = speedup;
    } else {
      // Update average speedup
      const oldWeight = (metrics.totalExecutions - 1) / metrics.totalExecutions;
      const newWeight = 1 / metrics.totalExecutions;
      metrics.avgSpeedup = metrics.avgSpeedup * oldWeight + speedup * newWeight;
      
      // Update max and min speedup
      metrics.maxSpeedup = Math.max(metrics.maxSpeedup, speedup);
      metrics.minSpeedup = Math.min(metrics.minSpeedup, speedup);
    }
    
    // Calculate average times
    metrics.avgJsTime = metrics.totalJsTime / (metrics.jsExecutions || 1);
    metrics.avgWasmTime = metrics.totalWasmTime / (metrics.wasmExecutions || 1);
    
    // Calculate time saved
    if (usedWasm) {
      metrics.totalTimeSaved += (jsTime - wasmTime);
    }
    
    // Record the sample in the adaptive threshold manager
    const sample: PerformanceSample = {
      inputSize,
      jsTime,
      wasmTime,
      timestamp: Date.now(),
    };
    
    adaptiveThresholdManager.recordSample(domain, type, operation, sample);
  }

  /**
   * Get the metrics for an operation
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   * @returns The metrics for the operation
   */
  public getMetrics(domain: string, type: string, operation: string): PerformanceMetrics {
    const key = this._getKey(domain, type, operation);
    return this._metrics.get(key) || this._createEmptyMetrics();
  }

  /**
   * Get all metrics
   * @returns All metrics
   */
  public getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this._metrics);
  }

  /**
   * Clear all metrics
   */
  public clear(): void {
    this._metrics.clear();
  }

  /**
   * Reset the metrics for an operation
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   */
  public resetMetrics(domain: string, type: string, operation: string): void {
    const key = this._getKey(domain, type, operation);
    this._metrics.set(key, this._createEmptyMetrics());
  }

  /**
   * Get the key for an operation
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   * @returns The key for the operation
   */
  private _getKey(domain: string, type: string, operation: string): string {
    return `${domain}:${type}:${operation}`;
  }

  /**
   * Create empty metrics
   * @returns Empty metrics
   */
  private _createEmptyMetrics(): PerformanceMetrics {
    return {
      totalExecutions: 0,
      wasmExecutions: 0,
      jsExecutions: 0,
      fallbacks: 0,
      totalJsTime: 0,
      totalWasmTime: 0,
      avgJsTime: 0,
      avgWasmTime: 0,
      avgSpeedup: 0,
      maxSpeedup: 0,
      minSpeedup: 0,
      totalTimeSaved: 0,
    };
  }
}

// Create a singleton instance
export const performanceCounter = new PerformanceCounter();
