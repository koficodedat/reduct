/**
 * WebAssembly accelerator interfaces and types
 */
import { InputSizeCategory, InputDataType } from '@reduct/shared-types/utils';
import { AcceleratorTier, PerformanceProfile, AcceleratorOptions, Accelerator } from '@reduct/shared-types/wasm/accelerator';
import { WebAssemblyFeature } from '@reduct/shared-types/wasm/features';

import { WasmAcceleratorNotAvailableError } from '../core/error-handling';
import { isWebAssemblySupported } from '../core/feature-detection';
import { adaptiveThresholdManager, ThresholdConfig } from '../utils/adaptive-threshold-manager';
import { InputCharacteristicsAnalyzer } from '../utils/input-characteristics';
import { performanceCounter } from '../utils/performance-counter';

import { FrequencyDetector, FrequencyDetectorConfig } from './frequency-detector';


/**
 * Tiering strategy for determining when to use WebAssembly
 */
export interface TieringStrategy<T> {
  /**
   * Function that determines if input qualifies for HIGH_VALUE tier
   */
  [AcceleratorTier.HIGH_VALUE]?: (input: T) => boolean;

  /**
   * Function that determines if input qualifies for CONDITIONAL tier
   */
  [AcceleratorTier.CONDITIONAL]?: (input: T) => boolean;

  /**
   * Function that determines if input qualifies for JS_PREFERRED tier
   */
  [AcceleratorTier.JS_PREFERRED]?: (input: T) => boolean;
}

/**
 * Performance statistics for an accelerator
 */
export interface AcceleratorPerformanceStats {
  /**
   * Number of times each tier was used
   */
  tierUsage: Record<AcceleratorTier, number>;

  /**
   * Average execution time for each tier (in milliseconds)
   */
  averageExecutionTime: Record<AcceleratorTier, number>;

  /**
   * Input size distribution for each tier
   */
  inputSizeDistribution: Record<AcceleratorTier, number[]>;
}

// Using PerformanceProfile from shared-types

/**
 * Extended options for an accelerator
 */
export interface ExtendedAcceleratorOptions extends AcceleratorOptions {
  /**
   * Required WebAssembly features
   */
  requiredFeatures?: WebAssemblyFeature[];
  /**
   * Whether to use shared memory
   */
  useSharedMemory?: boolean;

  /**
   * Tiering strategy for this accelerator
   */
  tiering?: TieringStrategy<any>;

  /**
   * Default thresholds for common operations
   */
  thresholds?: {
    /**
     * Minimum array size for using WebAssembly
     */
    minArraySize?: number;

    /**
     * Minimum string length for using WebAssembly
     */
    minStringLength?: number;

    /**
     * Minimum matrix size for using WebAssembly
     */
    minMatrixSize?: number;

    /**
     * Whether to use adaptive thresholds
     */
    adaptive?: boolean;

    /**
     * Configuration for adaptive thresholds
     */
    adaptiveConfig?: Partial<ThresholdConfig>;
  };

  /**
   * Whether to use frequency detection for tight loops
   */
  useFrequencyDetection?: boolean;

  /**
   * Configuration for frequency detection
   */
  frequencyDetectionConfig?: FrequencyDetectorConfig;
}

/**
 * Extended accelerator interface
 */
export interface ExtendedAccelerator<T, R> extends Accelerator<T, R> {
  /**
   * Check if the accelerator is available in the current environment
   * @returns True if the accelerator is available, false otherwise
   */
  isAvailable(): boolean;

  /**
   * Determine the appropriate tier for the given input
   * @param input The input to evaluate
   * @returns The appropriate tier for the input
   */
  determineTier(input: T): AcceleratorTier;

  /**
   * Get performance statistics for this accelerator
   * @returns The performance statistics
   */
  getPerformanceStats(): AcceleratorPerformanceStats;
}

/**
 * Base class for accelerators
 */
export abstract class BaseAccelerator<T, R> implements ExtendedAccelerator<T, R> {
  /**
   * Performance statistics for this accelerator
   */
  private stats: AcceleratorPerformanceStats = {
    tierUsage: {
      [AcceleratorTier.HIGH_VALUE]: 0,
      [AcceleratorTier.CONDITIONAL]: 0,
      [AcceleratorTier.JS_PREFERRED]: 0,
    },
    averageExecutionTime: {
      [AcceleratorTier.HIGH_VALUE]: 0,
      [AcceleratorTier.CONDITIONAL]: 0,
      [AcceleratorTier.JS_PREFERRED]: 0,
    },
    inputSizeDistribution: {
      [AcceleratorTier.HIGH_VALUE]: [],
      [AcceleratorTier.CONDITIONAL]: [],
      [AcceleratorTier.JS_PREFERRED]: [],
    },
  };

  /**
   * Whether to use the global adaptive threshold manager
   */
  private useAdaptiveThresholds: boolean = false;

  /**
   * Whether to use frequency detection for tight loops
   */
  private useFrequencyDetection: boolean = false;

  /**
   * Frequency detector for tight loops
   */
  private frequencyDetector: FrequencyDetector | null = null;

  /**
   * Create a new accelerator
   * @param domain The domain of the accelerator (e.g., 'data-structures')
   * @param type The type of the accelerator (e.g., 'list')
   * @param operation The operation to accelerate (e.g., 'map')
   * @param options Options for the accelerator
   */
  constructor(
    protected readonly domain: string,
    protected readonly type: string,
    protected readonly operation: string,
    protected readonly options: ExtendedAcceleratorOptions = {}
  ) {
    // Initialize adaptive thresholds if enabled
    if (options.thresholds?.adaptive) {
      this.useAdaptiveThresholds = true;

      // Set performance profile in the adaptive threshold manager
      const profile = this.getPerformanceProfile();
      adaptiveThresholdManager.setPerformanceProfile(domain, type, operation, profile);
    }

    // Initialize frequency detection if enabled
    if (options.useFrequencyDetection) {
      this.useFrequencyDetection = true;
      this.frequencyDetector = new FrequencyDetector(options.frequencyDetectionConfig);
    }
  }

  /**
   * Execute the accelerated operation
   * @param input The input for the operation
   * @returns The result of the operation
   */
  public execute(input: T): R {
    // Analyze input characteristics
    const inputSize = this.getInputSize(input);

    // Analyze array characteristics if applicable
    if (Array.isArray(input)) {
      const characteristics = InputCharacteristicsAnalyzer.analyzeArray(input);

      // Use characteristics to make more informed decisions
      // For example, we might want to use WebAssembly for homogeneous numeric arrays
      if (characteristics.dataType === InputDataType.NUMBER &&
          characteristics.isHomogeneous &&
          characteristics.sizeCategory !== InputSizeCategory.TINY) {
        // This is a good candidate for WebAssembly acceleration
      }
    }

    // Determine the appropriate tier for the input
    const tier = this.determineTier(input);

    // Update usage statistics
    this.stats.tierUsage[tier]++;

    // Track input size if possible
    if (inputSize !== undefined) {
      this.stats.inputSizeDistribution[tier].push(inputSize);
    }

    // For adaptive thresholds, we need to measure both JS and WASM performance
    if (this.useAdaptiveThresholds && inputSize !== undefined) {
      // Measure JavaScript execution time
      const jsStartTime = performance.now();
      const jsResult = this.executeJs(input);
      const jsEndTime = performance.now();
      const jsTime = jsEndTime - jsStartTime;

      // Measure WebAssembly execution time
      const wasmStartTime = performance.now();
      const wasmResult = this.executeWasm(input);
      const wasmEndTime = performance.now();
      const wasmTime = wasmEndTime - wasmStartTime;

      // Record the sample in the adaptive threshold manager
      adaptiveThresholdManager.recordSample(
        this.domain,
        this.type,
        this.operation,
        {
          inputSize,
          jsTime,
          wasmTime,
          timestamp: Date.now(),
        }
      );

      // Record the measurement in the performance counter
      performanceCounter.recordMeasurement(
        this.domain,
        this.type,
        this.operation,
        jsTime,
        wasmTime,
        inputSize,
        tier !== AcceleratorTier.JS_PREFERRED,
        false
      );

      // Return the result based on the selected tier
      const result = tier === AcceleratorTier.JS_PREFERRED ? jsResult : wasmResult;

      // Update execution time statistics
      const executionTime = tier === AcceleratorTier.JS_PREFERRED ? jsTime : wasmTime;

      // Update average execution time using a weighted average
      const currentAvg = this.stats.averageExecutionTime[tier];
      const currentCount = this.stats.tierUsage[tier];

      if (currentCount === 1) {
        // First execution, just set the time
        this.stats.averageExecutionTime[tier] = executionTime;
      } else {
        // Update the weighted average
        this.stats.averageExecutionTime[tier] =
          (currentAvg * (currentCount - 1) + executionTime) / currentCount;
      }

      return result as R;
    } else {
      // Standard execution without adaptive thresholds

      // Record the call in the frequency detector if enabled
      let inputHash: string | undefined;
      if (this.useFrequencyDetection && this.frequencyDetector) {
        inputHash = this.frequencyDetector.recordCall(
          this.domain,
          this.type,
          this.operation,
          input
        );
      }

      // Measure execution time
      const startTime = performance.now();

      // Execute the operation using the appropriate implementation
      const result = this.executeWithTier(input, tier);

      // Update execution time statistics
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Record the result in the frequency detector if enabled
      if (this.useFrequencyDetection && this.frequencyDetector && inputHash) {
        this.frequencyDetector.recordResult(
          this.domain,
          this.type,
          this.operation,
          inputHash,
          result,
          executionTime
        );
      }

      // Update average execution time using a weighted average
      const currentAvg = this.stats.averageExecutionTime[tier];
      const currentCount = this.stats.tierUsage[tier];

      if (currentCount === 1) {
        // First execution, just set the time
        this.stats.averageExecutionTime[tier] = executionTime;
      } else {
        // Update the weighted average
        this.stats.averageExecutionTime[tier] =
          (currentAvg * (currentCount - 1) + executionTime) / currentCount;
      }

      return result;
    }
  }

  /**
   * Execute the operation using JavaScript
   * @param input The input for the operation
   * @returns The result of the operation
   */
  protected executeJs(input: T): any {
    return this.executeWithTier(input, AcceleratorTier.JS_PREFERRED);
  }

  /**
   * Execute the operation using WebAssembly
   * @param input The input for the operation
   * @returns The result of the operation
   */
  protected executeWasm(input: T): any {
    return this.executeWithTier(input, AcceleratorTier.HIGH_VALUE);
  }

  /**
   * Execute the operation using the appropriate implementation for the given tier
   * @param input The input for the operation
   * @param tier The tier to use
   * @returns The result of the operation
   */
  protected abstract executeWithTier(input: T, tier: AcceleratorTier): R;

  /**
   * Check if the accelerator is available in the current environment
   * @returns True if the accelerator is available, false otherwise
   */
  public isAvailable(): boolean {
    // Check if WebAssembly is supported
    if (!isWebAssemblySupported()) {
      return false;
    }

    // Check if required features are supported
    const { requiredFeatures = [] } = this.options;
    if (requiredFeatures.length > 0) {
      // This is a synchronous check, so we can't use the async isFeatureSupported
      // In a real implementation, we would cache the results of feature detection
      return true;
    }

    return true;
  }

  /**
   * Get the performance profile of the accelerator
   * @returns The performance profile
   */
  public abstract getPerformanceProfile(): PerformanceProfile;

  /**
   * Determine the appropriate tier for the given input
   * @param input The input to evaluate
   * @returns The appropriate tier for the input
   */
  public determineTier(input: T): AcceleratorTier {
    // Use frequency detection if enabled
    if (this.useFrequencyDetection && this.frequencyDetector) {
      // Check if we have a cached result from the frequency detector
      const cachedResult = this.frequencyDetector.getCachedResult(
        this.domain,
        this.type,
        this.operation,
        input
      );

      if (cachedResult !== undefined) {
        // Return the cached result
        return cachedResult;
      }

      // Record the call in the frequency detector
      this.frequencyDetector.recordCall(
        this.domain,
        this.type,
        this.operation,
        input
      );

      // Determine the tier based on frequency
      const tier = this.frequencyDetector.determineTier(
        this.domain,
        this.type,
        this.operation,
        input
      );

      // If the tier is not JS_PREFERRED, return it immediately
      if (tier !== AcceleratorTier.JS_PREFERRED) {
        return tier;
      }

      // Otherwise, continue with the normal tiering strategy
    }

    const { tiering } = this.options;

    // If no tiering strategy is provided, use default thresholds
    if (!tiering) {
      return this.determineDefaultTier(input);
    }

    // Check each tier in order of priority
    if (tiering[AcceleratorTier.HIGH_VALUE] && tiering[AcceleratorTier.HIGH_VALUE](input)) {
      return AcceleratorTier.HIGH_VALUE;
    }

    if (tiering[AcceleratorTier.CONDITIONAL] && tiering[AcceleratorTier.CONDITIONAL](input)) {
      return AcceleratorTier.CONDITIONAL;
    }

    // Default to JS_PREFERRED if no other tier matches
    return AcceleratorTier.JS_PREFERRED;
  }

  /**
   * Determine the appropriate tier based on default thresholds
   * @param input The input to evaluate
   * @returns The appropriate tier for the input
   */
  protected determineDefaultTier(input: T): AcceleratorTier {
    const { thresholds } = this.options;

    if (!thresholds) {
      // No thresholds provided, default to JS_PREFERRED
      return AcceleratorTier.JS_PREFERRED;
    }

    // Get the input size
    const inputSize = this.getInputSize(input);

    if (inputSize === undefined) {
      // Can't determine input size, default to JS_PREFERRED
      return AcceleratorTier.JS_PREFERRED;
    }

    // Use adaptive threshold manager if enabled
    if (this.useAdaptiveThresholds) {
      return adaptiveThresholdManager.shouldUseWasm(this.domain, this.type, this.operation, inputSize)
        ? AcceleratorTier.HIGH_VALUE
        : AcceleratorTier.JS_PREFERRED;
    }

    // Check if the input size exceeds the high-value threshold
    const highValueThreshold = this.getHighValueThreshold();
    if (inputSize >= highValueThreshold) {
      return AcceleratorTier.HIGH_VALUE;
    }

    // Check if the input size exceeds the conditional threshold
    const conditionalThreshold = this.getConditionalThreshold();
    if (inputSize >= conditionalThreshold) {
      return AcceleratorTier.CONDITIONAL;
    }

    // Default to JS_PREFERRED for small inputs
    return AcceleratorTier.JS_PREFERRED;
  }

  /**
   * Get the size of the input
   * @param input The input to measure
   * @returns The size of the input, or undefined if it can't be determined
   */
  protected getInputSize(input: T): number | undefined {
    // Default implementation for common input types
    if (Array.isArray(input)) {
      return input.length;
    }

    if (typeof input === 'string') {
      return input.length;
    }

    if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
      return (input as any).length || (input as any).byteLength;
    }

    // For objects, count the number of properties
    if (typeof input === 'object' && input !== null) {
      return Object.keys(input).length;
    }

    // Can't determine size for other types
    return undefined;
  }

  /**
   * Get the threshold for high-value tier
   * @returns The threshold for high-value tier
   */
  protected getHighValueThreshold(): number {
    const { thresholds } = this.options;

    if (!thresholds) {
      return 100000; // Default high-value threshold
    }

    // Use the appropriate threshold based on the input type
    if (thresholds.minArraySize !== undefined) {
      return thresholds.minArraySize * 5; // High-value is 5x the conditional threshold
    }

    if (thresholds.minStringLength !== undefined) {
      return thresholds.minStringLength * 5;
    }

    if (thresholds.minMatrixSize !== undefined) {
      return thresholds.minMatrixSize * 5;
    }

    return 100000; // Default high-value threshold
  }

  /**
   * Get the threshold for conditional tier
   * @returns The threshold for conditional tier
   */
  protected getConditionalThreshold(): number {
    const { thresholds } = this.options;

    if (!thresholds) {
      return 20000; // Default conditional threshold
    }

    // Use the appropriate threshold based on the input type
    if (thresholds.minArraySize !== undefined) {
      return thresholds.minArraySize;
    }

    if (thresholds.minStringLength !== undefined) {
      return thresholds.minStringLength;
    }

    if (thresholds.minMatrixSize !== undefined) {
      return thresholds.minMatrixSize;
    }

    return 20000; // Default conditional threshold
  }

  /**
   * Get performance statistics for this accelerator
   * @returns The performance statistics
   */
  public getPerformanceStats(): AcceleratorPerformanceStats {
    return this.stats;
  }

  /**
   * Get adaptive threshold statistics
   * @returns The adaptive threshold statistics, or undefined if adaptive thresholds are not enabled
   */
  public getAdaptiveThresholdStats(): ThresholdConfig | undefined {
    if (!this.useAdaptiveThresholds) {
      return undefined;
    }

    return adaptiveThresholdManager.config;
  }

  /**
   * Get frequency detection statistics
   * @returns The frequency detection statistics, or undefined if frequency detection is not enabled
   */
  public getFrequencyDetectionStats(): any | undefined {
    if (!this.useFrequencyDetection || !this.frequencyDetector) {
      return undefined;
    }

    return this.frequencyDetector.getStats(this.domain, this.type, this.operation);
  }

  /**
   * Ensure that the accelerator is available
   * @throws WasmAcceleratorNotAvailableError if the accelerator is not available
   */
  protected ensureAvailable(): void {
    if (!this.isAvailable()) {
      throw new WasmAcceleratorNotAvailableError(this.domain, this.type, this.operation);
    }
  }
}

/**
 * JavaScript fallback accelerator
 */
export class JavaScriptFallbackAccelerator<T, R> extends BaseAccelerator<T, R> {
  /**
   * Create a new JavaScript fallback accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @param implementation The JavaScript implementation
   * @param options Options for the accelerator
   */
  constructor(
    domain: string,
    type: string,
    operation: string,
    private readonly implementation: (input: T) => R,
    options: AcceleratorOptions = {}
  ) {
    super(domain, type, operation, options);
  }

  /**
   * Execute the operation using the appropriate implementation for the given tier
   * @param input The input for the operation
   * @param _tier The tier to use (unused in this implementation)
   * @returns The result of the operation
   */
  protected executeWithTier(input: T, _tier: AcceleratorTier): R {
    // JavaScript fallback always uses the same implementation regardless of tier
    return this.implementation(input);
  }

  /**
   * JavaScript fallback is always available
   * @returns Always true
   */
  public isAvailable(): boolean {
    return true;
  }

  /**
   * Get the performance profile of the JavaScript fallback
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 1.0, // No speedup compared to JavaScript
    };
  }
}

/**
 * Registry for accelerators
 */
export class AcceleratorRegistry {
  private static instance: AcceleratorRegistry;
  private accelerators: Map<string, Accelerator<any, any>> = new Map();

  /**
   * Get the singleton instance of the accelerator registry
   * @returns The accelerator registry instance
   */
  public static getInstance(): AcceleratorRegistry {
    if (!AcceleratorRegistry.instance) {
      AcceleratorRegistry.instance = new AcceleratorRegistry();
    }
    return AcceleratorRegistry.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Register an accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @param accelerator The accelerator to register
   */
  public register<T, R>(
    domain: string,
    type: string,
    operation: string,
    accelerator: Accelerator<T, R>
  ): void {
    const key = this.getKey(domain, type, operation);
    this.accelerators.set(key, accelerator);
  }

  /**
   * Get an accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns The accelerator, or undefined if not found
   */
  public get<T, R>(domain: string, type: string, operation: string): Accelerator<T, R> | undefined {
    const key = this.getKey(domain, type, operation);
    return this.accelerators.get(key) as Accelerator<T, R> | undefined;
  }

  /**
   * Check if an accelerator is registered
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns True if the accelerator is registered, false otherwise
   */
  public has(domain: string, type: string, operation: string): boolean {
    const key = this.getKey(domain, type, operation);
    return this.accelerators.has(key);
  }

  /**
   * Unregister an accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns True if the accelerator was unregistered, false otherwise
   */
  public unregister(domain: string, type: string, operation: string): boolean {
    const key = this.getKey(domain, type, operation);
    return this.accelerators.delete(key);
  }

  /**
   * Clear all registered accelerators
   */
  public clear(): void {
    this.accelerators.clear();
  }

  /**
   * Get the key for an accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns The key
   */
  private getKey(domain: string, type: string, operation: string): string {
    return `${domain}/${type}/${operation}`;
  }
}
