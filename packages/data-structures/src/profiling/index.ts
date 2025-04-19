/**
 * Profiling and monitoring system for the Reduct library
 *
 * This module provides tools to monitor and profile the performance of the Reduct library's data structures.
 */

/**
 * Types of operations that can be profiled
 */
export enum OperationType {
  GET = 'get',
  SET = 'set',
  APPEND = 'append',
  PREPEND = 'prepend',
  INSERT = 'insert',
  REMOVE = 'remove',
  MAP = 'map',
  FILTER = 'filter',
  REDUCE = 'reduce',
  CONCAT = 'concat',
  SLICE = 'slice',
  FIND = 'find',
  FIND_INDEX = 'findIndex',
  TO_ARRAY = 'toArray',
  TRANSIENT = 'transient',
  PERSISTENT = 'persistent',
  BATCH_UPDATE = 'batchUpdate',
  BATCH_INSERT = 'batchInsert',
  BATCH_REMOVE = 'batchRemove',
  CHUNK_POOL_HIT = 'chunkPoolHit',
  CHUNK_POOL_MISS = 'chunkPoolMiss',
  NODE_CACHE_HIT = 'nodeCacheHit',
  NODE_CACHE_MISS = 'nodeCacheMiss',
  TRANSITION = 'transition',
  SPECIALIZED = 'specialized'
}

/**
 * Types of data structures that can be profiled
 */
export enum DataStructureType {
  LIST = 'list',
  SMALL_LIST = 'smallList',
  CHUNKED_LIST = 'chunkedList',
  PERSISTENT_VECTOR = 'persistentVector',
  TRANSIENT_LIST = 'transientList',
  TRANSIENT_SMALL_LIST = 'transientSmallList',
  TRANSIENT_CHUNKED_LIST = 'transientChunkedList',
  TRANSIENT_PERSISTENT_VECTOR = 'transientPersistentVector'
}

/**
 * Profiling data for a specific operation
 */
export interface ProfilingData {
  /**
   * The type of operation
   */
  operationType: OperationType;

  /**
   * The type of data structure
   */
  dataStructureType: DataStructureType;

  /**
   * The size of the data structure
   */
  size: number;

  /**
   * The time taken to execute the operation in milliseconds
   */
  time: number;

  /**
   * The memory used by the operation in bytes (if available)
   */
  memory?: number;

  /**
   * Additional metadata about the operation
   */
  metadata?: Record<string, any>;
}

/**
 * Profiling options
 */
export interface ProfilingOptions {
  /**
   * Whether to enable profiling
   */
  enabled: boolean;

  /**
   * Whether to log profiling data to the console
   */
  logToConsole: boolean;

  /**
   * Whether to collect memory usage data
   */
  collectMemoryData: boolean;

  /**
   * The sampling rate for profiling (0-1)
   * 1 means profile every operation, 0.1 means profile 10% of operations
   */
  samplingRate: number;

  /**
   * The maximum number of profiling entries to keep in memory
   */
  maxEntries: number;
}

/**
 * Default profiling options
 */
const DEFAULT_PROFILING_OPTIONS: ProfilingOptions = {
  enabled: false,
  logToConsole: false,
  collectMemoryData: false,
  samplingRate: 0.01, // 1% sampling rate by default
  maxEntries: 1000
};

/**
 * Profiling system for the Reduct library
 */
export class ProfilingSystem {
  private static instance: ProfilingSystem;
  private options: ProfilingOptions;
  private data: ProfilingData[] = [];
  private operationCounts: Record<OperationType, number> = {} as Record<OperationType, number>;
  private dataStructureCounts: Record<DataStructureType, number> = {} as Record<DataStructureType, number>;
  private poolHits = 0;
  private poolMisses = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private transitionCounts: Record<string, number> = {};

  /**
   * Create a new profiling system
   *
   * @param options - Profiling options
   */
  private constructor(options: Partial<ProfilingOptions> = {}) {
    this.options = { ...DEFAULT_PROFILING_OPTIONS, ...options };

    // Initialize operation counts
    for (const op in OperationType) {
      if (isNaN(Number(op))) {
        this.operationCounts[OperationType[op as keyof typeof OperationType]] = 0;
      }
    }

    // Initialize data structure counts
    for (const ds in DataStructureType) {
      if (isNaN(Number(ds))) {
        this.dataStructureCounts[DataStructureType[ds as keyof typeof DataStructureType]] = 0;
      }
    }
  }

  /**
   * Get the singleton instance of the profiling system
   *
   * @param options - Profiling options
   * @returns The profiling system instance
   */
  public static getInstance(options: Partial<ProfilingOptions> = {}): ProfilingSystem {
    if (!ProfilingSystem.instance) {
      ProfilingSystem.instance = new ProfilingSystem(options);
    } else if (Object.keys(options).length > 0) {
      // Update options if provided
      ProfilingSystem.instance.setOptions(options);
    }

    return ProfilingSystem.instance;
  }

  /**
   * Set profiling options
   *
   * @param options - Profiling options
   */
  public setOptions(options: Partial<ProfilingOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Enable profiling
   */
  public enable(): void {
    this.options.enabled = true;
  }

  /**
   * Disable profiling
   */
  public disable(): void {
    this.options.enabled = false;
  }

  /**
   * Clear all profiling data
   */
  public clear(): void {
    this.data = [];

    // Reset operation counts
    for (const op in this.operationCounts) {
      this.operationCounts[op as OperationType] = 0;
    }

    // Reset data structure counts
    for (const ds in this.dataStructureCounts) {
      this.dataStructureCounts[ds as DataStructureType] = 0;
    }

    // Reset pool and cache counts
    this.poolHits = 0;
    this.poolMisses = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;

    // Reset transition counts
    this.transitionCounts = {};
  }

  /**
   * Record a profiling entry
   *
   * @param data - Profiling data
   */
  public record(data: Omit<ProfilingData, 'time'>, startTime: number): void {
    if (!this.options.enabled) {
      return;
    }

    // Only record a sample of operations based on the sampling rate
    if (Math.random() > this.options.samplingRate) {
      return;
    }

    // Calculate the time taken
    const endTime = performance.now();
    const time = endTime - startTime;

    // Record the operation count
    this.operationCounts[data.operationType] = (this.operationCounts[data.operationType] || 0) + 1;

    // Record the data structure count
    this.dataStructureCounts[data.dataStructureType] = (this.dataStructureCounts[data.dataStructureType] || 0) + 1;

    // Record pool and cache hits/misses
    if (data.operationType === OperationType.CHUNK_POOL_HIT) {
      this.poolHits++;
    } else if (data.operationType === OperationType.CHUNK_POOL_MISS) {
      this.poolMisses++;
    } else if (data.operationType === OperationType.NODE_CACHE_HIT) {
      this.cacheHits++;
    } else if (data.operationType === OperationType.NODE_CACHE_MISS) {
      this.cacheMisses++;
    } else if (data.operationType === OperationType.TRANSITION) {
      const from = data.metadata?.from || 'unknown';
      const to = data.metadata?.to || 'unknown';
      const key = `${from}->${to}`;
      this.transitionCounts[key] = (this.transitionCounts[key] || 0) + 1;
    }

    // Add the entry to the data array
    this.data.push({ ...data, time });

    // Trim the data array if it exceeds the maximum number of entries
    if (this.data.length > this.options.maxEntries) {
      this.data.shift();
    }

    // Log to console if enabled
    if (this.options.logToConsole) {
      console.log(`[Profiling] ${data.dataStructureType}.${data.operationType} (size: ${data.size}): ${time.toFixed(3)}ms`);
    }
  }

  /**
   * Start profiling an operation
   *
   * @param operationType - The type of operation
   * @param dataStructureType - The type of data structure
   * @param size - The size of the data structure
   * @param metadata - Additional metadata about the operation
   * @returns A function to stop profiling and record the entry
   */
  public start(
    operationType: OperationType,
    dataStructureType: DataStructureType,
    size: number,
    metadata?: Record<string, any>
  ): () => void {
    if (!this.options.enabled) {
      return () => {}; // No-op if profiling is disabled
    }

    const startTime = performance.now();

    return () => {
      this.record({ operationType, dataStructureType, size, metadata }, startTime);
    };
  }

  /**
   * Get all profiling data
   *
   * @returns All profiling data
   */
  public getData(): ProfilingData[] {
    return [...this.data];
  }

  /**
   * Get operation counts
   *
   * @returns Operation counts
   */
  public getOperationCounts(): Record<OperationType, number> {
    return { ...this.operationCounts };
  }

  /**
   * Get data structure counts
   *
   * @returns Data structure counts
   */
  public getDataStructureCounts(): Record<DataStructureType, number> {
    return { ...this.dataStructureCounts };
  }

  /**
   * Get pool hit/miss statistics
   *
   * @returns Pool hit/miss statistics
   */
  public getPoolStats(): { hits: number; misses: number; hitRate: number } {
    const total = this.poolHits + this.poolMisses;
    const hitRate = total > 0 ? this.poolHits / total : 0;

    return {
      hits: this.poolHits,
      misses: this.poolMisses,
      hitRate
    };
  }

  /**
   * Get cache hit/miss statistics
   *
   * @returns Cache hit/miss statistics
   */
  public getCacheStats(): { hits: number; misses: number; hitRate: number } {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? this.cacheHits / total : 0;

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate
    };
  }

  /**
   * Get transition statistics
   *
   * @returns Transition counts
   */
  public getTransitionStats(): Record<string, number> {
    return { ...this.transitionCounts };
  }

  /**
   * Get a summary of profiling data
   *
   * @returns A summary of profiling data
   */
  public getSummary(): {
    operationCounts: Record<OperationType, number>;
    dataStructureCounts: Record<DataStructureType, number>;
    poolStats: { hits: number; misses: number; hitRate: number };
    cacheStats: { hits: number; misses: number; hitRate: number };
    transitionStats: Record<string, number>;
    averageTimes: Record<OperationType, number>;
  } {
    // Calculate average times for each operation type
    const averageTimes: Record<OperationType, number> = {} as Record<OperationType, number>;

    for (const op in OperationType) {
      if (isNaN(Number(op))) {
        const opType = OperationType[op as keyof typeof OperationType];
        const opData = this.data.filter(d => d.operationType === opType);

        if (opData.length > 0) {
          const totalTime = opData.reduce((sum, d) => sum + d.time, 0);
          averageTimes[opType] = totalTime / opData.length;
        } else {
          averageTimes[opType] = 0;
        }
      }
    }

    return {
      operationCounts: this.getOperationCounts(),
      dataStructureCounts: this.getDataStructureCounts(),
      poolStats: this.getPoolStats(),
      cacheStats: this.getCacheStats(),
      transitionStats: this.getTransitionStats(),
      averageTimes
    };
  }

  /**
   * Generate a report of profiling data
   *
   * @returns A report of profiling data as a string
   */
  public generateReport(): string {
    const summary = this.getSummary();

    let report = '# Reduct Profiling Report\n\n';

    // Add timestamp
    report += `Generated at: ${new Date().toISOString()}\n\n`;

    // Add operation counts
    report += '## Operation Counts\n\n';
    report += '| Operation | Count | Average Time (ms) |\n';
    report += '|-----------|-------|------------------|\n';

    for (const op in summary.operationCounts) {
      const count = summary.operationCounts[op as OperationType];
      const avgTime = summary.averageTimes[op as OperationType].toFixed(3);
      report += `| ${op} | ${count} | ${avgTime} |\n`;
    }

    report += '\n';

    // Add data structure counts
    report += '## Data Structure Usage\n\n';
    report += '| Data Structure | Count |\n';
    report += '|----------------|-------|\n';

    for (const ds in summary.dataStructureCounts) {
      const count = summary.dataStructureCounts[ds as DataStructureType];
      report += `| ${ds} | ${count} |\n`;
    }

    report += '\n';

    // Add pool stats
    report += '## Chunk Pool Statistics\n\n';
    report += `- Hits: ${summary.poolStats.hits}\n`;
    report += `- Misses: ${summary.poolStats.misses}\n`;
    report += `- Hit Rate: ${(summary.poolStats.hitRate * 100).toFixed(2)}%\n\n`;

    // Add cache stats
    report += '## Node Cache Statistics\n\n';
    report += `- Hits: ${summary.cacheStats.hits}\n`;
    report += `- Misses: ${summary.cacheStats.misses}\n`;
    report += `- Hit Rate: ${(summary.cacheStats.hitRate * 100).toFixed(2)}%\n\n`;

    // Add transition stats
    report += '## Representation Transitions\n\n';
    report += '| Transition | Count |\n';
    report += '|------------|-------|\n';

    for (const transition in summary.transitionStats) {
      const count = summary.transitionStats[transition];
      report += `| ${transition} | ${count} |\n`;
    }

    report += '\n';

    // Add performance by size
    report += '## Performance by Size\n\n';

    // Group data by size ranges
    const sizeRanges = [
      { name: 'Small (0-32)', min: 0, max: 32 },
      { name: 'Medium (33-1000)', min: 33, max: 1000 },
      { name: 'Large (1001+)', min: 1001, max: Infinity }
    ];

    for (const range of sizeRanges) {
      report += `### ${range.name}\n\n`;
      report += '| Operation | Average Time (ms) | Count |\n';
      report += '|-----------|-------------------|-------|\n';

      for (const op in OperationType) {
        if (isNaN(Number(op))) {
          const opType = OperationType[op as keyof typeof OperationType];
          const opData = this.data.filter(
            d => d.operationType === opType && d.size >= range.min && d.size <= range.max
          );

          if (opData.length > 0) {
            const totalTime = opData.reduce((sum, d) => sum + d.time, 0);
            const avgTime = (totalTime / opData.length).toFixed(3);
            report += `| ${opType} | ${avgTime} | ${opData.length} |\n`;
          }
        }
      }

      report += '\n';
    }

    return report;
  }
}

/**
 * Get the singleton instance of the profiling system
 *
 * @param options - Profiling options
 * @returns The profiling system instance
 */
export function getProfilingSystem(options: Partial<ProfilingOptions> = {}): ProfilingSystem {
  return ProfilingSystem.getInstance(options);
}

/**
 * Enable profiling
 *
 * @param options - Profiling options
 */
export function enableProfiling(options: Partial<ProfilingOptions> = {}): void {
  const profiler = getProfilingSystem(options);
  profiler.enable();
}

/**
 * Disable profiling
 */
export function disableProfiling(): void {
  const profiler = getProfilingSystem();
  profiler.disable();
}

/**
 * Generate a profiling report
 *
 * @returns A profiling report as a string
 */
export function generateProfilingReport(): string {
  const profiler = getProfilingSystem();
  return profiler.generateReport();
}

/**
 * Clear profiling data
 */
export function clearProfilingData(): void {
  const profiler = getProfilingSystem();
  profiler.clear();
}

/**
 * Profile a function
 *
 * @param operationType - The type of operation
 * @param dataStructureType - The type of data structure
 * @param size - The size of the data structure
 * @param fn - The function to profile
 * @param metadata - Additional metadata about the operation
 * @returns The result of the function
 */
export function profile<T>(
  operationType: OperationType,
  dataStructureType: DataStructureType,
  size: number,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const profiler = getProfilingSystem();

  if (!profiler.options.enabled) {
    return fn();
  }

  const stop = profiler.start(operationType, dataStructureType, size, metadata);
  const result = fn();
  stop();

  return result;
}
