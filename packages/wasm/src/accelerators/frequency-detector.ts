/**
 * Frequency detector for WebAssembly acceleration
 *
 * Tracks the frequency of operations to determine when to use WebAssembly acceleration.
 */

import { AcceleratorTier } from '@reduct/shared-types/wasm';

/**
 * Operation call record
 */
interface OperationCall {
  /** Timestamp of the call */
  timestamp: number;
  /** Input hash for the call */
  inputHash: string;
  /** Result of the call (for caching) */
  result?: any;
  /** Execution time in milliseconds */
  executionTime?: number;
}

/**
 * Operation statistics
 */
interface OperationStats {
  /** Total number of calls */
  callCount: number;
  /** Recent calls (for frequency detection) */
  recentCalls: OperationCall[];
  /** Call frequency (calls per second) */
  frequency: number;
  /** Average execution time in milliseconds */
  averageExecutionTime: number;
  /** Cache hit rate */
  cacheHitRate: number;
  /** Last tier decision */
  lastTierDecision: AcceleratorTier;
  /** Timestamp of the last tier decision */
  lastTierDecisionTime: number;
}

/**
 * Configuration for the frequency detector
 */
export interface FrequencyDetectorConfig {
  /** Maximum number of recent calls to track */
  maxRecentCalls?: number;
  /** Time window for frequency calculation (in milliseconds) */
  frequencyWindow?: number;
  /** Frequency threshold for high-value operations (calls per second) */
  highValueFrequencyThreshold?: number;
  /** Frequency threshold for conditional operations (calls per second) */
  conditionalFrequencyThreshold?: number;
  /** Execution time threshold for high-value operations (in milliseconds) */
  highValueExecutionTimeThreshold?: number;
  /** Execution time threshold for conditional operations (in milliseconds) */
  conditionalExecutionTimeThreshold?: number;
  /** Enable result caching */
  enableCaching?: boolean;
  /** Maximum cache size per operation */
  maxCacheSize?: number;
}

/**
 * Default configuration for the frequency detector
 */
const DEFAULT_CONFIG: FrequencyDetectorConfig = {
  maxRecentCalls: 100,
  frequencyWindow: 1000, // 1 second
  highValueFrequencyThreshold: 50, // 50 calls per second
  conditionalFrequencyThreshold: 10, // 10 calls per second
  highValueExecutionTimeThreshold: 10, // 10 milliseconds
  conditionalExecutionTimeThreshold: 5, // 5 milliseconds
  enableCaching: true,
  maxCacheSize: 50
};

/**
 * Frequency detector for WebAssembly acceleration
 *
 * Tracks the frequency of operations to determine when to use WebAssembly acceleration.
 */
export class FrequencyDetector {
  /** Configuration */
  private config: Required<FrequencyDetectorConfig>;

  /** Operation statistics by domain, type, and operation */
  private stats: Map<string, Map<string, Map<string, OperationStats>>>;

  /** Cache by domain, type, operation, and input hash */
  private cache: Map<string, Map<string, Map<string, Map<string, any>>>>;

  /**
   * Create a new frequency detector
   *
   * @param config Configuration options
   */
  constructor(config: FrequencyDetectorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<FrequencyDetectorConfig>;
    this.stats = new Map();
    this.cache = new Map();
  }

  /**
   * Record an operation call
   *
   * @param domain The domain of the operation
   * @param type The type of the operation
   * @param operation The operation name
   * @param input The input to the operation
   * @returns A unique identifier for the call
   */
  public recordCall(domain: string, type: string, operation: string, input: any): string {
    // Get or create the stats for this operation
    const domainStats = this.stats.get(domain) || new Map();
    const typeStats = domainStats.get(type) || new Map();
    const operationStats = typeStats.get(operation) || {
      callCount: 0,
      recentCalls: [],
      frequency: 0,
      averageExecutionTime: 0,
      cacheHitRate: 0,
      lastTierDecision: AcceleratorTier.JS_PREFERRED,
      lastTierDecisionTime: 0
    };

    // Generate a hash for the input
    const inputHash = this.hashInput(input);

    // Record the call
    const call: OperationCall = {
      timestamp: Date.now(),
      inputHash
    };

    // Update the stats
    operationStats.callCount++;
    operationStats.recentCalls.push(call);

    // Trim the recent calls list if it's too long
    if (operationStats.recentCalls.length > this.config.maxRecentCalls) {
      operationStats.recentCalls.shift();
    }

    // Update the frequency
    this.updateFrequency(operationStats);

    // Store the updated stats
    typeStats.set(operation, operationStats);
    domainStats.set(type, typeStats);
    this.stats.set(domain, domainStats);

    // Return the input hash for later reference
    return inputHash;
  }

  /**
   * Record the result of an operation call
   *
   * @param domain The domain of the operation
   * @param type The type of the operation
   * @param operation The operation name
   * @param inputHash The input hash from recordCall
   * @param result The result of the operation
   * @param executionTime The execution time in milliseconds
   */
  public recordResult(
    domain: string,
    type: string,
    operation: string,
    inputHash: string,
    result: any,
    executionTime: number
  ): void {
    // Get the stats for this operation
    const domainStats = this.stats.get(domain);
    if (!domainStats) return;

    const typeStats = domainStats.get(type);
    if (!typeStats) return;

    const operationStats = typeStats.get(operation);
    if (!operationStats) return;

    // Find the call with this input hash
    const call = operationStats.recentCalls.find(c => c.inputHash === inputHash);
    if (!call) return;

    // Record the result and execution time
    call.result = result;
    call.executionTime = executionTime;

    // Update the average execution time
    this.updateAverageExecutionTime(operationStats);

    // Cache the result if caching is enabled
    if (this.config.enableCaching) {
      this.cacheResult(domain, type, operation, inputHash, result);
    }
  }

  /**
   * Get the cached result for an operation call
   *
   * @param domain The domain of the operation
   * @param type The type of the operation
   * @param operation The operation name
   * @param input The input to the operation
   * @returns The cached result, or undefined if not found
   */
  public getCachedResult(domain: string, type: string, operation: string, input: any): any {
    if (!this.config.enableCaching) return undefined;

    // Generate a hash for the input
    const inputHash = this.hashInput(input);

    // Get the cache for this operation
    const domainCache = this.cache.get(domain);
    if (!domainCache) return undefined;

    const typeCache = domainCache.get(type);
    if (!typeCache) return undefined;

    const operationCache = typeCache.get(operation);
    if (!operationCache) return undefined;

    // Get the cached result
    return operationCache.get(inputHash);
  }

  /**
   * Determine the appropriate tier for an operation
   *
   * @param domain The domain of the operation
   * @param type The type of the operation
   * @param operation The operation name
   * @param input The input to the operation
   * @returns The appropriate tier
   */
  public determineTier(domain: string, type: string, operation: string, input: any): AcceleratorTier {
    // Get the stats for this operation
    const domainStats = this.stats.get(domain);
    if (!domainStats) return AcceleratorTier.JS_PREFERRED;

    const typeStats = domainStats.get(type);
    if (!typeStats) return AcceleratorTier.JS_PREFERRED;

    const operationStats = typeStats.get(operation);
    if (!operationStats) return AcceleratorTier.JS_PREFERRED;

    // Check if we've made a tier decision recently
    const now = Date.now();
    if (now - operationStats.lastTierDecisionTime < 1000) {
      return operationStats.lastTierDecision;
    }

    // Determine the appropriate tier based on frequency and execution time
    let tier = AcceleratorTier.JS_PREFERRED;

    if (
      operationStats.frequency >= this.config.highValueFrequencyThreshold ||
      operationStats.averageExecutionTime >= this.config.highValueExecutionTimeThreshold
    ) {
      tier = AcceleratorTier.HIGH_VALUE;
    } else if (
      operationStats.frequency >= this.config.conditionalFrequencyThreshold ||
      operationStats.averageExecutionTime >= this.config.conditionalExecutionTimeThreshold
    ) {
      tier = AcceleratorTier.CONDITIONAL;
    }

    // Record the tier decision
    operationStats.lastTierDecision = tier;
    operationStats.lastTierDecisionTime = now;

    return tier;
  }

  /**
   * Get statistics for an operation
   *
   * @param domain The domain of the operation
   * @param type The type of the operation
   * @param operation The operation name
   * @returns The operation statistics
   */
  public getStats(domain: string, type: string, operation: string): OperationStats | undefined {
    const domainStats = this.stats.get(domain);
    if (!domainStats) return undefined;

    const typeStats = domainStats.get(type);
    if (!typeStats) return undefined;

    return typeStats.get(operation);
  }

  /**
   * Clear all statistics and cache
   */
  public clear(): void {
    this.stats.clear();
    this.cache.clear();
  }

  /**
   * Update the frequency for an operation
   *
   * @param stats The operation statistics
   */
  private updateFrequency(stats: OperationStats): void {
    const now = Date.now();
    const windowStart = now - this.config.frequencyWindow;

    // Count the number of calls in the window
    const callsInWindow = stats.recentCalls.filter(call => call.timestamp >= windowStart).length;

    // Calculate the frequency (calls per second)
    stats.frequency = (callsInWindow * 1000) / this.config.frequencyWindow;
  }

  /**
   * Update the average execution time for an operation
   *
   * @param stats The operation statistics
   */
  private updateAverageExecutionTime(stats: OperationStats): void {
    // Get all calls with execution times
    const callsWithTimes = stats.recentCalls.filter(call => call.executionTime !== undefined);
    if (callsWithTimes.length === 0) return;

    // Calculate the average execution time
    const totalTime = callsWithTimes.reduce((sum, call) => sum + (call.executionTime || 0), 0);
    stats.averageExecutionTime = totalTime / callsWithTimes.length;
  }

  /**
   * Cache the result of an operation
   *
   * @param domain The domain of the operation
   * @param type The type of the operation
   * @param operation The operation name
   * @param inputHash The input hash
   * @param result The result of the operation
   */
  private cacheResult(
    domain: string,
    type: string,
    operation: string,
    inputHash: string,
    result: any
  ): void {
    // Get or create the cache for this operation
    const domainCache = this.cache.get(domain) || new Map();
    const typeCache = domainCache.get(type) || new Map();
    const operationCache = typeCache.get(operation) || new Map();

    // Add the result to the cache
    operationCache.set(inputHash, result);

    // Trim the cache if it's too large
    if (operationCache.size > this.config.maxCacheSize) {
      // Remove the oldest entry
      const oldestKey = operationCache.keys().next().value;
      operationCache.delete(oldestKey);
    }

    // Store the updated cache
    typeCache.set(operation, operationCache);
    domainCache.set(type, typeCache);
    this.cache.set(domain, domainCache);
  }

  /**
   * Generate a hash for an input
   *
   * @param input The input to hash
   * @returns A hash string
   */
  private hashInput(input: any): string {
    try {
      // For simple inputs, use JSON.stringify
      if (
        input === null ||
        input === undefined ||
        typeof input === 'string' ||
        typeof input === 'number' ||
        typeof input === 'boolean'
      ) {
        return String(input);
      }

      // For arrays, hash each element
      if (Array.isArray(input)) {
        // For large arrays, hash a sample
        if (input.length > 100) {
          const sample = [
            ...input.slice(0, 10),
            ...input.slice(Math.floor(input.length / 2) - 5, Math.floor(input.length / 2) + 5),
            ...input.slice(input.length - 10)
          ];
          return `array:${input.length}:${this.hashInput(sample)}`;
        }

        return `array:${input.length}:${input.map(item => this.hashInput(item)).join(',')}`;
      }

      // For objects, hash the keys and values
      if (typeof input === 'object') {
        const keys = Object.keys(input).sort();

        // For large objects, hash a sample of keys
        if (keys.length > 20) {
          const sampleKeys = keys.slice(0, 20);
          const sampleObj: Record<string, any> = {};
          sampleKeys.forEach(key => {
            sampleObj[key] = input[key];
          });
          return `object:${keys.length}:${JSON.stringify(sampleObj)}`;
        }

        return `object:${JSON.stringify(input)}`;
      }

      // For functions, use the function name
      if (typeof input === 'function') {
        return `function:${input.name || 'anonymous'}`;
      }

      // For everything else, use toString
      return `other:${String(input)}`;
    } catch (error) {
      // If hashing fails, use a fallback
      return `fallback:${Date.now()}:${Math.random()}`;
    }
  }
}
