/**
 * Chunk pool monitoring system for the Reduct library
 * 
 * This module provides tools to monitor the chunk pool usage in the Reduct library's data structures.
 */

import { getProfilingSystem, OperationType, DataStructureType } from './index';

/**
 * Chunk pool statistics
 */
export interface ChunkPoolStats {
  /**
   * The number of chunks in the pool
   */
  poolSize: number;
  
  /**
   * The number of chunks acquired from the pool
   */
  acquiredCount: number;
  
  /**
   * The number of chunks released back to the pool
   */
  releasedCount: number;
  
  /**
   * The number of chunks created (pool misses)
   */
  createdCount: number;
  
  /**
   * The hit rate of the pool (acquiredCount / (acquiredCount + createdCount))
   */
  hitRate: number;
  
  /**
   * The current memory usage of the pool in bytes (estimated)
   */
  memoryUsage: number;
}

/**
 * Chunk pool monitor for the Reduct library
 */
export class ChunkPoolMonitor {
  private static instance: ChunkPoolMonitor;
  private poolSizes: Record<string, number> = {};
  private acquiredCounts: Record<string, number> = {};
  private releasedCounts: Record<string, number> = {};
  private createdCounts: Record<string, number> = {};
  private chunkSizes: Record<string, number> = {};
  
  /**
   * Create a new chunk pool monitor
   */
  private constructor() {}
  
  /**
   * Get the singleton instance of the chunk pool monitor
   * 
   * @returns The chunk pool monitor instance
   */
  public static getInstance(): ChunkPoolMonitor {
    if (!ChunkPoolMonitor.instance) {
      ChunkPoolMonitor.instance = new ChunkPoolMonitor();
    }
    
    return ChunkPoolMonitor.instance;
  }
  
  /**
   * Record a chunk acquisition from the pool
   * 
   * @param poolId - The ID of the pool
   * @param fromPool - Whether the chunk was acquired from the pool or created
   * @param chunkSize - The size of the chunk
   */
  public recordAcquire(poolId: string, fromPool: boolean, chunkSize: number): void {
    // Initialize counters if needed
    if (!this.acquiredCounts[poolId]) {
      this.acquiredCounts[poolId] = 0;
      this.createdCounts[poolId] = 0;
      this.poolSizes[poolId] = 0;
      this.chunkSizes[poolId] = chunkSize;
    }
    
    if (fromPool) {
      // Chunk was acquired from the pool
      this.acquiredCounts[poolId]++;
      this.poolSizes[poolId]--;
      
      // Record a pool hit in the profiling system
      const profiler = getProfilingSystem();
      profiler.record(
        {
          operationType: OperationType.CHUNK_POOL_HIT,
          dataStructureType: DataStructureType.CHUNKED_LIST,
          size: chunkSize,
          metadata: { poolId }
        },
        performance.now()
      );
    } else {
      // Chunk was created (pool miss)
      this.createdCounts[poolId]++;
      
      // Record a pool miss in the profiling system
      const profiler = getProfilingSystem();
      profiler.record(
        {
          operationType: OperationType.CHUNK_POOL_MISS,
          dataStructureType: DataStructureType.CHUNKED_LIST,
          size: chunkSize,
          metadata: { poolId }
        },
        performance.now()
      );
    }
  }
  
  /**
   * Record a chunk release back to the pool
   * 
   * @param poolId - The ID of the pool
   */
  public recordRelease(poolId: string): void {
    // Initialize counters if needed
    if (!this.releasedCounts[poolId]) {
      this.releasedCounts[poolId] = 0;
    }
    
    this.releasedCounts[poolId]++;
    this.poolSizes[poolId]++;
  }
  
  /**
   * Get statistics for a specific pool
   * 
   * @param poolId - The ID of the pool
   * @returns Statistics for the pool
   */
  public getStats(poolId: string): ChunkPoolStats {
    const poolSize = this.poolSizes[poolId] || 0;
    const acquiredCount = this.acquiredCounts[poolId] || 0;
    const releasedCount = this.releasedCounts[poolId] || 0;
    const createdCount = this.createdCounts[poolId] || 0;
    const chunkSize = this.chunkSizes[poolId] || 0;
    
    const totalAcquired = acquiredCount + createdCount;
    const hitRate = totalAcquired > 0 ? acquiredCount / totalAcquired : 0;
    
    // Estimate memory usage (8 bytes per number in the chunk)
    const memoryUsage = poolSize * chunkSize * 8;
    
    return {
      poolSize,
      acquiredCount,
      releasedCount,
      createdCount,
      hitRate,
      memoryUsage
    };
  }
  
  /**
   * Get statistics for all pools
   * 
   * @returns Statistics for all pools
   */
  public getAllStats(): Record<string, ChunkPoolStats> {
    const stats: Record<string, ChunkPoolStats> = {};
    
    for (const poolId in this.poolSizes) {
      stats[poolId] = this.getStats(poolId);
    }
    
    return stats;
  }
  
  /**
   * Get aggregate statistics for all pools
   * 
   * @returns Aggregate statistics for all pools
   */
  public getAggregateStats(): ChunkPoolStats {
    let totalPoolSize = 0;
    let totalAcquiredCount = 0;
    let totalReleasedCount = 0;
    let totalCreatedCount = 0;
    let totalMemoryUsage = 0;
    
    for (const poolId in this.poolSizes) {
      const stats = this.getStats(poolId);
      totalPoolSize += stats.poolSize;
      totalAcquiredCount += stats.acquiredCount;
      totalReleasedCount += stats.releasedCount;
      totalCreatedCount += stats.createdCount;
      totalMemoryUsage += stats.memoryUsage;
    }
    
    const totalRequests = totalAcquiredCount + totalCreatedCount;
    const hitRate = totalRequests > 0 ? totalAcquiredCount / totalRequests : 0;
    
    return {
      poolSize: totalPoolSize,
      acquiredCount: totalAcquiredCount,
      releasedCount: totalReleasedCount,
      createdCount: totalCreatedCount,
      hitRate,
      memoryUsage: totalMemoryUsage
    };
  }
  
  /**
   * Generate a report of chunk pool usage
   * 
   * @returns A report of chunk pool usage as a string
   */
  public generateReport(): string {
    const stats = this.getAllStats();
    const aggregateStats = this.getAggregateStats();
    
    let report = '# Chunk Pool Usage Report\n\n';
    
    // Add timestamp
    report += `Generated at: ${new Date().toISOString()}\n\n`;
    
    // Add aggregate statistics
    report += '## Aggregate Statistics\n\n';
    report += `- Total Pool Size: ${aggregateStats.poolSize} chunks\n`;
    report += `- Total Acquired: ${aggregateStats.acquiredCount} chunks\n`;
    report += `- Total Created: ${aggregateStats.createdCount} chunks\n`;
    report += `- Total Released: ${aggregateStats.releasedCount} chunks\n`;
    report += `- Hit Rate: ${(aggregateStats.hitRate * 100).toFixed(2)}%\n`;
    report += `- Memory Usage: ${(aggregateStats.memoryUsage / 1024 / 1024).toFixed(2)} MB\n\n`;
    
    // Add statistics for each pool
    report += '## Pool Statistics\n\n';
    report += '| Pool ID | Size | Acquired | Created | Released | Hit Rate | Memory Usage |\n';
    report += '|---------|------|----------|---------|----------|----------|-------------|\n';
    
    for (const poolId in stats) {
      const poolStats = stats[poolId];
      report += `| ${poolId} | ${poolStats.poolSize} | ${poolStats.acquiredCount} | ${poolStats.createdCount} | ${poolStats.releasedCount} | ${(poolStats.hitRate * 100).toFixed(2)}% | ${(poolStats.memoryUsage / 1024 / 1024).toFixed(2)} MB |\n`;
    }
    
    return report;
  }
  
  /**
   * Clear all statistics
   */
  public clear(): void {
    this.poolSizes = {};
    this.acquiredCounts = {};
    this.releasedCounts = {};
    this.createdCounts = {};
    this.chunkSizes = {};
  }
}

/**
 * Get the singleton instance of the chunk pool monitor
 * 
 * @returns The chunk pool monitor instance
 */
export function getChunkPoolMonitor(): ChunkPoolMonitor {
  return ChunkPoolMonitor.getInstance();
}

/**
 * Record a chunk acquisition from the pool
 * 
 * @param poolId - The ID of the pool
 * @param fromPool - Whether the chunk was acquired from the pool or created
 * @param chunkSize - The size of the chunk
 */
export function recordChunkAcquire(poolId: string, fromPool: boolean, chunkSize: number): void {
  const monitor = getChunkPoolMonitor();
  monitor.recordAcquire(poolId, fromPool, chunkSize);
}

/**
 * Record a chunk release back to the pool
 * 
 * @param poolId - The ID of the pool
 */
export function recordChunkRelease(poolId: string): void {
  const monitor = getChunkPoolMonitor();
  monitor.recordRelease(poolId);
}

/**
 * Generate a report of chunk pool usage
 * 
 * @returns A report of chunk pool usage as a string
 */
export function generateChunkPoolReport(): string {
  const monitor = getChunkPoolMonitor();
  return monitor.generateReport();
}

/**
 * Clear all chunk pool statistics
 */
export function clearChunkPoolStats(): void {
  const monitor = getChunkPoolMonitor();
  monitor.clear();
}
