/**
 * Adaptive Threshold Manager
 *
 * This utility manages thresholds for WebAssembly acceleration based on runtime performance.
 * It automatically adjusts thresholds based on observed performance to optimize the decision
 * of when to use WebAssembly vs. JavaScript.
 */
import { PerformanceProfile } from '../accelerators/accelerator';

/**
 * Performance sample for a specific operation
 */
export interface PerformanceSample {
  /**
   * Input size
   */
  inputSize: number;

  /**
   * JavaScript execution time in milliseconds
   */
  jsTime: number;

  /**
   * WebAssembly execution time in milliseconds
   */
  wasmTime: number;

  /**
   * Timestamp when the sample was taken
   */
  timestamp: number;
}

/**
 * Threshold configuration for an operation
 */
export interface ThresholdConfig {
  /**
   * Minimum input size to consider using WebAssembly
   */
  minInputSize: number;

  /**
   * Maximum input size to consider using WebAssembly
   * (beyond this size, always use WebAssembly)
   */
  maxInputSize: number;

  /**
   * Minimum speedup ratio (wasmTime/jsTime) to use WebAssembly
   */
  minSpeedupRatio: number;

  /**
   * Maximum number of samples to keep
   */
  maxSamples: number;

  /**
   * Sample expiration time in milliseconds
   */
  sampleExpirationTime: number;

  /**
   * Whether to enable adaptive thresholds
   */
  adaptiveThresholds: boolean;

  /**
   * Learning rate for threshold adjustments (0-1)
   */
  learningRate: number;
}

/**
 * Default threshold configuration
 */
const DEFAULT_CONFIG: ThresholdConfig = {
  minInputSize: 1000,
  maxInputSize: 100000,
  minSpeedupRatio: 1.1,
  maxSamples: 100,
  sampleExpirationTime: 24 * 60 * 60 * 1000, // 24 hours
  adaptiveThresholds: true,
  learningRate: 0.1,
};

/**
 * Adaptive threshold manager for WebAssembly acceleration
 */
export class AdaptiveThresholdManager {
  private _config: ThresholdConfig;
  private _samples: Map<string, PerformanceSample[]> = new Map();
  private _thresholds: Map<string, number> = new Map();
  private _performanceProfiles: Map<string, PerformanceProfile> = new Map();

  /**
   * Create a new adaptive threshold manager
   * @param config Threshold configuration
   */
  constructor(config: Partial<ThresholdConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Record a performance sample for an operation
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   * @param sample Performance sample
   */
  public recordSample(domain: string, type: string, operation: string, sample: PerformanceSample): void {
    const key = this._getKey(domain, type, operation);
    
    // Get or create the samples array
    let samples = this._samples.get(key);
    if (!samples) {
      samples = [];
      this._samples.set(key, samples);
    }
    
    // Add the sample
    samples.push(sample);
    
    // Limit the number of samples
    if (samples.length > this._config.maxSamples) {
      samples.shift();
    }
    
    // Remove expired samples
    const now = Date.now();
    const expirationTime = now - this._config.sampleExpirationTime;
    const validSamples = samples.filter(s => s.timestamp >= expirationTime);
    this._samples.set(key, validSamples);
    
    // Update the threshold
    if (this._config.adaptiveThresholds) {
      this._updateThreshold(domain, type, operation);
    }
  }

  /**
   * Get the threshold for an operation
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   * @returns The threshold for the operation
   */
  public getThreshold(domain: string, type: string, operation: string): number {
    const key = this._getKey(domain, type, operation);
    
    // Get the threshold or use the default
    const threshold = this._thresholds.get(key);
    if (threshold !== undefined) {
      return threshold;
    }
    
    // If no threshold is set, use the default
    return this._config.minInputSize;
  }

  /**
   * Set the performance profile for an operation
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   * @param profile Performance profile
   */
  public setPerformanceProfile(domain: string, type: string, operation: string, profile: PerformanceProfile): void {
    const key = this._getKey(domain, type, operation);
    this._performanceProfiles.set(key, profile);
    
    // Initialize the threshold based on the profile
    if (!this._thresholds.has(key)) {
      this._thresholds.set(key, profile.effectiveInputSize);
    }
  }

  /**
   * Get the performance profile for an operation
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   * @returns The performance profile for the operation
   */
  public getPerformanceProfile(domain: string, type: string, operation: string): PerformanceProfile | undefined {
    const key = this._getKey(domain, type, operation);
    return this._performanceProfiles.get(key);
  }

  /**
   * Get the performance samples for an operation
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   * @returns The performance samples for the operation
   */
  public getSamples(domain: string, type: string, operation: string): PerformanceSample[] {
    const key = this._getKey(domain, type, operation);
    return this._samples.get(key) || [];
  }

  /**
   * Clear all samples and thresholds
   */
  public clear(): void {
    this._samples.clear();
    this._thresholds.clear();
  }

  /**
   * Reset the threshold for an operation to the default
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   */
  public resetThreshold(domain: string, type: string, operation: string): void {
    const key = this._getKey(domain, type, operation);
    this._thresholds.delete(key);
  }

  /**
   * Get the configuration
   */
  public get config(): ThresholdConfig {
    return { ...this._config };
  }

  /**
   * Update the configuration
   * @param config New configuration
   */
  public updateConfig(config: Partial<ThresholdConfig>): void {
    this._config = { ...this._config, ...config };
  }

  /**
   * Determine if WebAssembly should be used for an operation
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   * @param inputSize Size of the input
   * @returns Whether to use WebAssembly
   */
  public shouldUseWasm(domain: string, type: string, operation: string, inputSize: number): boolean {
    // Always use WebAssembly for large inputs
    if (inputSize >= this._config.maxInputSize) {
      return true;
    }
    
    // Always use JavaScript for small inputs
    const threshold = this.getThreshold(domain, type, operation);
    if (inputSize < threshold) {
      return false;
    }
    
    // For inputs between the threshold and max size, use WebAssembly
    return true;
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
   * Update the threshold for an operation based on performance samples
   * @param domain Domain of the operation
   * @param type Type of the operation
   * @param operation Name of the operation
   */
  private _updateThreshold(domain: string, type: string, operation: string): void {
    const key = this._getKey(domain, type, operation);
    const samples = this._samples.get(key);
    
    if (!samples || samples.length < 5) {
      return; // Not enough samples to make a decision
    }
    
    // Group samples by input size
    const samplesBySize = new Map<number, PerformanceSample[]>();
    for (const sample of samples) {
      const size = sample.inputSize;
      const sizeSamples = samplesBySize.get(size) || [];
      sizeSamples.push(sample);
      samplesBySize.set(size, sizeSamples);
    }
    
    // Calculate average speedup ratio for each input size
    const speedupBySize = new Map<number, number>();
    for (const [size, sizeSamples] of samplesBySize.entries()) {
      let totalSpeedup = 0;
      for (const sample of sizeSamples) {
        const speedup = sample.jsTime / sample.wasmTime;
        totalSpeedup += speedup;
      }
      const avgSpeedup = totalSpeedup / sizeSamples.length;
      speedupBySize.set(size, avgSpeedup);
    }
    
    // Find the smallest input size that meets the minimum speedup ratio
    const sizes = Array.from(speedupBySize.keys()).sort((a, b) => a - b);
    let newThreshold = this._config.minInputSize;
    
    for (const size of sizes) {
      const speedup = speedupBySize.get(size) || 0;
      if (speedup >= this._config.minSpeedupRatio) {
        newThreshold = size;
        break;
      }
    }
    
    // Get the current threshold
    const currentThreshold = this._thresholds.get(key) || this._config.minInputSize;
    
    // Apply learning rate to smooth the transition
    const adjustedThreshold = Math.round(
      currentThreshold * (1 - this._config.learningRate) + newThreshold * this._config.learningRate
    );
    
    // Update the threshold
    this._thresholds.set(key, adjustedThreshold);
  }
}

// Create a singleton instance
export const adaptiveThresholdManager = new AdaptiveThresholdManager();
