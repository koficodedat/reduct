/**
 * Memory monitoring system for the Reduct library
 *
 * This module provides tools to monitor the memory usage of the Reduct library's data structures.
 */

import { MemoryStats } from '@reduct/shared-types/data-structures';

import { InternalDataStructureType } from './index';

// Using MemoryStats from shared-types

/**
 * Memory monitor for the Reduct library
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private instanceCounts: Record<InternalDataStructureType, number> = {} as Record<InternalDataStructureType, number>;
  private elementCounts: Record<InternalDataStructureType, number> = {} as Record<InternalDataStructureType, number>;
  private memorySamples: Record<InternalDataStructureType, number[]> = {} as Record<InternalDataStructureType, number[]>;
  private maxSamples = 100;

  /**
   * Create a new memory monitor
   */
  private constructor() {
    // Initialize counters
    for (const ds in InternalDataStructureType) {
      if (isNaN(Number(ds))) {
        const dsType = InternalDataStructureType[ds as keyof typeof InternalDataStructureType];
        this.instanceCounts[dsType] = 0;
        this.elementCounts[dsType] = 0;
        this.memorySamples[dsType] = [];
      }
    }
  }

  /**
   * Get the singleton instance of the memory monitor
   *
   * @returns The memory monitor instance
   */
  public static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }

    return MemoryMonitor.instance;
  }

  /**
   * Record a data structure creation
   *
   * @param type - The type of data structure
   * @param elementCount - The number of elements in the data structure
   * @param memoryUsage - The estimated memory usage in bytes
   */
  public recordCreation(type: InternalDataStructureType, elementCount: number, memoryUsage: number): void {
    this.instanceCounts[type]++;
    this.elementCounts[type] += elementCount;

    // Add a memory sample
    this.memorySamples[type].push(memoryUsage);

    // Keep only the most recent samples
    if (this.memorySamples[type].length > this.maxSamples) {
      this.memorySamples[type].shift();
    }
  }

  /**
   * Record a data structure destruction
   *
   * @param type - The type of data structure
   * @param elementCount - The number of elements in the data structure
   */
  public recordDestruction(type: InternalDataStructureType, elementCount: number): void {
    if (this.instanceCounts[type] > 0) {
      this.instanceCounts[type]--;
    }

    this.elementCounts[type] = Math.max(0, this.elementCounts[type] - elementCount);
  }

  /**
   * Get statistics for a specific data structure type
   *
   * @param type - The type of data structure
   * @returns Statistics for the data structure type
   */
  public getStats(type: InternalDataStructureType): MemoryStats {
    const instanceCount = this.instanceCounts[type] || 0;
    const elementCount = this.elementCounts[type] || 0;

    // Calculate average memory usage from samples
    const samples = this.memorySamples[type] || [];
    const totalMemory = samples.reduce((sum, mem) => sum + mem, 0);
    const avgMemoryPerInstance = samples.length > 0 ? totalMemory / samples.length : 0;

    // Estimate total memory usage
    const memoryUsage = avgMemoryPerInstance * instanceCount;

    // Calculate memory per element
    const memoryPerElement = elementCount > 0 ? memoryUsage / elementCount : 0;

    return {
      instanceCount,
      elementCount,
      memoryUsage,
      memoryPerElement
    };
  }

  /**
   * Get statistics for all data structure types
   *
   * @returns Statistics for all data structure types
   */
  public getAllStats(): Record<InternalDataStructureType, MemoryStats> {
    const stats: Record<InternalDataStructureType, MemoryStats> = {} as Record<InternalDataStructureType, MemoryStats>;

    for (const ds in InternalDataStructureType) {
      if (isNaN(Number(ds))) {
        const dsType = InternalDataStructureType[ds as keyof typeof InternalDataStructureType];
        stats[dsType] = this.getStats(dsType);
      }
    }

    return stats;
  }

  /**
   * Get aggregate statistics for all data structure types
   *
   * @returns Aggregate statistics for all data structure types
   */
  public getAggregateStats(): MemoryStats {
    let totalInstanceCount = 0;
    let totalElementCount = 0;
    let totalMemoryUsage = 0;

    for (const ds in InternalDataStructureType) {
      if (isNaN(Number(ds))) {
        const dsType = InternalDataStructureType[ds as keyof typeof InternalDataStructureType];
        const stats = this.getStats(dsType);

        totalInstanceCount += stats.instanceCount;
        totalElementCount += stats.elementCount;
        totalMemoryUsage += stats.memoryUsage;
      }
    }

    const memoryPerElement = totalElementCount > 0 ? totalMemoryUsage / totalElementCount : 0;

    return {
      instanceCount: totalInstanceCount,
      elementCount: totalElementCount,
      memoryUsage: totalMemoryUsage,
      memoryPerElement
    };
  }

  /**
   * Generate a report of memory usage
   *
   * @returns A report of memory usage as a string
   */
  public generateReport(): string {
    const stats = this.getAllStats();
    const aggregateStats = this.getAggregateStats();

    let report = '# Memory Usage Report\n\n';

    // Add timestamp
    report += `Generated at: ${new Date().toISOString()}\n\n`;

    // Add aggregate statistics
    report += '## Aggregate Statistics\n\n';
    report += `- Total Instances: ${aggregateStats.instanceCount}\n`;
    report += `- Total Elements: ${aggregateStats.elementCount}\n`;
    report += `- Total Memory Usage: ${(aggregateStats.memoryUsage / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- Average Memory Per Element: ${aggregateStats.memoryPerElement.toFixed(2)} bytes\n\n`;

    // Add statistics for each data structure type
    report += '## Data Structure Statistics\n\n';
    report += '| Data Structure | Instances | Elements | Memory Usage | Memory Per Element |\n';
    report += '|----------------|-----------|----------|--------------|-------------------|\n';

    for (const type in stats) {
      const typeStats = stats[type as InternalDataStructureType];

      if (typeStats.instanceCount > 0) {
        report += `| ${type} | ${typeStats.instanceCount} | ${typeStats.elementCount} | ${(typeStats.memoryUsage / 1024 / 1024).toFixed(2)} MB | ${typeStats.memoryPerElement.toFixed(2)} bytes |\n`;
      }
    }

    return report;
  }

  /**
   * Clear all statistics
   */
  public clear(): void {
    for (const ds in InternalDataStructureType) {
      if (isNaN(Number(ds))) {
        const dsType = InternalDataStructureType[ds as keyof typeof InternalDataStructureType];
        this.instanceCounts[dsType] = 0;
        this.elementCounts[dsType] = 0;
        this.memorySamples[dsType] = [];
      }
    }
  }
}

/**
 * Get the singleton instance of the memory monitor
 *
 * @returns The memory monitor instance
 */
export function getMemoryMonitor(): MemoryMonitor {
  return MemoryMonitor.getInstance();
}

/**
 * Record a data structure creation
 *
 * @param type - The type of data structure
 * @param elementCount - The number of elements in the data structure
 * @param memoryUsage - The estimated memory usage in bytes
 */
export function recordDataStructureCreation(
  type: InternalDataStructureType,
  elementCount: number,
  memoryUsage: number
): void {
  const monitor = getMemoryMonitor();
  monitor.recordCreation(type, elementCount, memoryUsage);
}

/**
 * Record a data structure destruction
 *
 * @param type - The type of data structure
 * @param elementCount - The number of elements in the data structure
 */
export function recordDataStructureDestruction(type: InternalDataStructureType, elementCount: number): void {
  const monitor = getMemoryMonitor();
  monitor.recordDestruction(type, elementCount);
}

/**
 * Generate a report of memory usage
 *
 * @returns A report of memory usage as a string
 */
export function generateMemoryReport(): string {
  const monitor = getMemoryMonitor();
  return monitor.generateReport();
}

/**
 * Clear all memory statistics
 */
export function clearMemoryStats(): void {
  const monitor = getMemoryMonitor();
  monitor.clear();
}

/**
 * Estimate the memory usage of a data structure
 *
 * @param type - The type of data structure
 * @param elementCount - The number of elements in the data structure
 * @returns The estimated memory usage in bytes
 */
export function estimateMemoryUsage(type: InternalDataStructureType, elementCount: number): number {
  // Base memory usage for the data structure
  let baseMemory = 40; // Object overhead

  // Memory usage per element
  let memoryPerElement = 0;

  switch (type) {
    case InternalDataStructureType.SMALL_LIST:
      // Small list uses a simple array
      baseMemory += 40; // Array overhead
      memoryPerElement = 8; // 8 bytes per element (reference)
      break;

    case InternalDataStructureType.CHUNKED_LIST:
      // Chunked list uses a trie structure
      baseMemory += 80; // Trie overhead
      memoryPerElement = 12; // 12 bytes per element (reference + overhead)
      break;

    case InternalDataStructureType.PERSISTENT_VECTOR:
      // Persistent vector uses a trie structure with more levels
      baseMemory += 120; // Trie overhead
      memoryPerElement = 16; // 16 bytes per element (reference + overhead)
      break;

    case InternalDataStructureType.TRANSIENT_SMALL_LIST:
      // Transient small list uses a simple array
      baseMemory += 40; // Array overhead
      memoryPerElement = 8; // 8 bytes per element (reference)
      break;

    case InternalDataStructureType.TRANSIENT_CHUNKED_LIST:
      // Transient chunked list uses a trie structure
      baseMemory += 80; // Trie overhead
      memoryPerElement = 10; // 10 bytes per element (reference + overhead)
      break;

    case InternalDataStructureType.TRANSIENT_PERSISTENT_VECTOR:
      // Transient persistent vector uses a trie structure with more levels
      baseMemory += 120; // Trie overhead
      memoryPerElement = 14; // 14 bytes per element (reference + overhead)
      break;

    case InternalDataStructureType.LIST:
    default:
      // List is a wrapper around one of the above
      baseMemory += 60; // Wrapper overhead
      memoryPerElement = 12; // Average memory per element
      break;
  }

  return baseMemory + (memoryPerElement * elementCount);
}
