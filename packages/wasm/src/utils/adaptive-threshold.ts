/**
 * Utilities for adaptive thresholds in WebAssembly acceleration
 */
import { AcceleratorTier } from '../accelerators/accelerator';

/**
 * Performance sample for a specific input size
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
   * Speedup factor (JS time / WASM time)
   */
  speedup: number;

  /**
   * Timestamp when the sample was taken
   */
  timestamp: number;
}

/**
 * Adaptive threshold configuration
 */
export interface AdaptiveThresholdConfig {
  /**
   * Maximum number of samples to keep
   */
  maxSamples?: number;

  /**
   * Minimum number of samples required before adapting thresholds
   */
  minSamplesForAdaptation?: number;

  /**
   * Minimum speedup required for HIGH_VALUE tier
   */
  highValueMinSpeedup?: number;

  /**
   * Minimum speedup required for CONDITIONAL tier
   */
  conditionalMinSpeedup?: number;

  /**
   * Safety margin to add to thresholds (percentage)
   */
  safetyMargin?: number;

  /**
   * Maximum age of samples in milliseconds
   */
  maxSampleAge?: number;

  /**
   * How frequently to adapt thresholds (in number of operations)
   */
  adaptationFrequency?: number;
}

/**
 * Default adaptive threshold configuration
 */
const DEFAULT_CONFIG: Required<AdaptiveThresholdConfig> = {
  maxSamples: 100,
  minSamplesForAdaptation: 10,
  highValueMinSpeedup: 2.0,
  conditionalMinSpeedup: 1.2,
  safetyMargin: 0.1, // 10%
  maxSampleAge: 24 * 60 * 60 * 1000, // 24 hours
  adaptationFrequency: 100,
};

/**
 * Adaptive threshold manager
 *
 * Manages adaptive thresholds for WebAssembly acceleration based on runtime performance data.
 */
export class AdaptiveThresholdManager {
  /**
   * Performance samples
   */
  private samples: PerformanceSample[] = [];

  /**
   * Current thresholds
   */
  private thresholds: {
    [AcceleratorTier.HIGH_VALUE]: number;
    [AcceleratorTier.CONDITIONAL]: number;
  };

  /**
   * Configuration
   */
  private config: Required<AdaptiveThresholdConfig>;

  /**
   * Operation counter
   */
  private operationCounter: number = 0;

  /**
   * Create a new adaptive threshold manager
   *
   * @param initialHighValueThreshold Initial threshold for HIGH_VALUE tier
   * @param initialConditionalThreshold Initial threshold for CONDITIONAL tier
   * @param config Configuration
   */
  constructor(
    initialHighValueThreshold: number,
    initialConditionalThreshold: number,
    config: AdaptiveThresholdConfig = {}
  ) {
    this.thresholds = {
      [AcceleratorTier.HIGH_VALUE]: initialHighValueThreshold,
      [AcceleratorTier.CONDITIONAL]: initialConditionalThreshold,
    };

    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a performance sample
   *
   * @param inputSize Input size
   * @param jsTime JavaScript execution time in milliseconds
   * @param wasmTime WebAssembly execution time in milliseconds
   */
  public addSample(inputSize: number, jsTime: number, wasmTime: number): void {
    // Calculate speedup
    const speedup = jsTime / wasmTime;

    // Create sample
    const sample: PerformanceSample = {
      inputSize,
      jsTime,
      wasmTime,
      speedup,
      timestamp: Date.now(),
    };

    // Add sample
    this.samples.push(sample);

    // Trim samples if necessary
    if (this.samples.length > this.config.maxSamples) {
      this.samples.sort((a, b) => a.timestamp - b.timestamp);
      this.samples = this.samples.slice(-this.config.maxSamples);
    }

    // Increment operation counter
    this.operationCounter++;

    // Adapt thresholds if necessary
    if (this.operationCounter % this.config.adaptationFrequency === 0) {
      this.adaptThresholds();
    }
  }

  /**
   * Get the current threshold for a tier
   *
   * @param tier The tier
   * @returns The threshold
   */
  public getThreshold(tier: AcceleratorTier): number {
    if (tier === AcceleratorTier.HIGH_VALUE) {
      return this.thresholds[AcceleratorTier.HIGH_VALUE];
    } else if (tier === AcceleratorTier.CONDITIONAL) {
      return this.thresholds[AcceleratorTier.CONDITIONAL];
    } else {
      return 0; // JS_PREFERRED has no threshold
    }
  }

  /**
   * Determine the appropriate tier for an input size
   *
   * @param inputSize Input size
   * @returns The appropriate tier
   */
  public determineTier(inputSize: number): AcceleratorTier {
    if (inputSize >= this.thresholds[AcceleratorTier.HIGH_VALUE]) {
      return AcceleratorTier.HIGH_VALUE;
    } else if (inputSize >= this.thresholds[AcceleratorTier.CONDITIONAL]) {
      return AcceleratorTier.CONDITIONAL;
    } else {
      return AcceleratorTier.JS_PREFERRED;
    }
  }

  /**
   * Adapt thresholds based on performance samples
   */
  private adaptThresholds(): void {
    // Remove old samples
    const now = Date.now();
    this.samples = this.samples.filter(sample =>
      now - sample.timestamp <= this.config.maxSampleAge
    );

    // Check if we have enough samples
    if (this.samples.length < this.config.minSamplesForAdaptation) {
      return;
    }

    // Sort samples by input size
    this.samples.sort((a, b) => a.inputSize - b.inputSize);

    // Find crossover points
    let highValueThreshold = this.findCrossoverPoint(this.config.highValueMinSpeedup);
    let conditionalThreshold = this.findCrossoverPoint(this.config.conditionalMinSpeedup);

    // Apply safety margin
    highValueThreshold = highValueThreshold * (1 + this.config.safetyMargin);
    conditionalThreshold = conditionalThreshold * (1 + this.config.safetyMargin);

    // Ensure conditional threshold is less than high value threshold
    conditionalThreshold = Math.min(conditionalThreshold, highValueThreshold * 0.5);

    // Update thresholds
    this.thresholds[AcceleratorTier.HIGH_VALUE] = highValueThreshold;
    this.thresholds[AcceleratorTier.CONDITIONAL] = conditionalThreshold;
  }

  /**
   * Find the crossover point where WebAssembly becomes faster than JavaScript by a given factor
   *
   * @param minSpeedup Minimum speedup required
   * @returns The crossover point, or the current threshold if no crossover point is found
   */
  private findCrossoverPoint(minSpeedup: number): number {
    // Check each sample
    for (let i = 0; i < this.samples.length - 1; i++) {
      const current = this.samples[i];
      const next = this.samples[i + 1];

      // Check if we cross the speedup threshold
      if (current.speedup < minSpeedup && next.speedup >= minSpeedup) {
        // Linear interpolation to find the exact crossover point
        const t = (minSpeedup - current.speedup) / (next.speedup - current.speedup);
        return current.inputSize + t * (next.inputSize - current.inputSize);
      }
    }

    // Check if WebAssembly is always faster
    const alwaysFaster = this.samples.every(sample => sample.speedup >= minSpeedup);

    if (alwaysFaster && this.samples.length > 0) {
      // WebAssembly is always faster, use the minimum input size
      return this.samples[0].inputSize;
    }

    // No crossover point found, use the current threshold
    return minSpeedup === this.config.highValueMinSpeedup
      ? this.thresholds[AcceleratorTier.HIGH_VALUE]
      : this.thresholds[AcceleratorTier.CONDITIONAL];
  }

  /**
   * Get performance statistics
   *
   * @returns Performance statistics
   */
  public getStats(): {
    sampleCount: number;
    averageSpeedup: number;
    thresholds: {
      [AcceleratorTier.HIGH_VALUE]: number;
      [AcceleratorTier.CONDITIONAL]: number;
    };
  } {
    // Calculate average speedup
    const averageSpeedup = this.samples.length > 0
      ? this.samples.reduce((sum, sample) => sum + sample.speedup, 0) / this.samples.length
      : 0;

    return {
      sampleCount: this.samples.length,
      averageSpeedup,
      thresholds: { ...this.thresholds },
    };
  }

  /**
   * Reset the adaptive threshold manager
   *
   * @param initialHighValueThreshold Initial threshold for HIGH_VALUE tier
   * @param initialConditionalThreshold Initial threshold for CONDITIONAL tier
   */
  public reset(
    initialHighValueThreshold: number,
    initialConditionalThreshold: number
  ): void {
    this.samples = [];
    this.thresholds = {
      [AcceleratorTier.HIGH_VALUE]: initialHighValueThreshold,
      [AcceleratorTier.CONDITIONAL]: initialConditionalThreshold,
    };
    this.operationCounter = 0;
  }
}
