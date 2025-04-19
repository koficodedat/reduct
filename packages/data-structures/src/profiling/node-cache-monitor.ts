/**
 * Node cache monitoring system for the Reduct library
 * 
 * This module provides tools to monitor the node cache usage in the Reduct library's data structures.
 */

import { getProfilingSystem, OperationType, DataStructureType } from './index';

/**
 * Node cache statistics
 */
export interface NodeCacheStats {
  /**
   * The number of nodes in the cache
   */
  cacheSize: number;
  
  /**
   * The number of cache hits
   */
  hitCount: number;
  
  /**
   * The number of cache misses
   */
  missCount: number;
  
  /**
   * The hit rate of the cache (hitCount / (hitCount + missCount))
   */
  hitRate: number;
  
  /**
   * The current memory usage of the cache in bytes (estimated)
   */
  memoryUsage: number;
}

/**
 * Node cache monitor for the Reduct library
 */
export class NodeCacheMonitor {
  private static instance: NodeCacheMonitor;
  private cacheSizes: Record<string, number> = {};
  private hitCounts: Record<string, number> = {};
  private missCounts: Record<string, number> = {};
  private nodeSizes: Record<string, number> = {};
  
  /**
   * Create a new node cache monitor
   */
  private constructor() {}
  
  /**
   * Get the singleton instance of the node cache monitor
   * 
   * @returns The node cache monitor instance
   */
  public static getInstance(): NodeCacheMonitor {
    if (!NodeCacheMonitor.instance) {
      NodeCacheMonitor.instance = new NodeCacheMonitor();
    }
    
    return NodeCacheMonitor.instance;
  }
  
  /**
   * Record a node cache access
   * 
   * @param cacheId - The ID of the cache
   * @param hit - Whether the access was a hit or miss
   * @param nodeSize - The size of the node (number of elements)
   */
  public recordAccess(cacheId: string, hit: boolean, nodeSize: number): void {
    // Initialize counters if needed
    if (!this.hitCounts[cacheId]) {
      this.hitCounts[cacheId] = 0;
      this.missCounts[cacheId] = 0;
      this.cacheSizes[cacheId] = 0;
      this.nodeSizes[cacheId] = nodeSize;
    }
    
    if (hit) {
      // Cache hit
      this.hitCounts[cacheId]++;
      
      // Record a cache hit in the profiling system
      const profiler = getProfilingSystem();
      profiler.record(
        {
          operationType: OperationType.NODE_CACHE_HIT,
          dataStructureType: DataStructureType.PERSISTENT_VECTOR,
          size: nodeSize,
          metadata: { cacheId }
        },
        performance.now()
      );
    } else {
      // Cache miss
      this.missCounts[cacheId]++;
      
      // Record a cache miss in the profiling system
      const profiler = getProfilingSystem();
      profiler.record(
        {
          operationType: OperationType.NODE_CACHE_MISS,
          dataStructureType: DataStructureType.PERSISTENT_VECTOR,
          size: nodeSize,
          metadata: { cacheId }
        },
        performance.now()
      );
    }
  }
  
  /**
   * Record a node addition to the cache
   * 
   * @param cacheId - The ID of the cache
   */
  public recordAddition(cacheId: string): void {
    // Initialize counter if needed
    if (!this.cacheSizes[cacheId]) {
      this.cacheSizes[cacheId] = 0;
    }
    
    this.cacheSizes[cacheId]++;
  }
  
  /**
   * Record a node removal from the cache
   * 
   * @param cacheId - The ID of the cache
   */
  public recordRemoval(cacheId: string): void {
    // Initialize counter if needed
    if (!this.cacheSizes[cacheId]) {
      this.cacheSizes[cacheId] = 0;
    }
    
    if (this.cacheSizes[cacheId] > 0) {
      this.cacheSizes[cacheId]--;
    }
  }
  
  /**
   * Get statistics for a specific cache
   * 
   * @param cacheId - The ID of the cache
   * @returns Statistics for the cache
   */
  public getStats(cacheId: string): NodeCacheStats {
    const cacheSize = this.cacheSizes[cacheId] || 0;
    const hitCount = this.hitCounts[cacheId] || 0;
    const missCount = this.missCounts[cacheId] || 0;
    const nodeSize = this.nodeSizes[cacheId] || 0;
    
    const totalAccesses = hitCount + missCount;
    const hitRate = totalAccesses > 0 ? hitCount / totalAccesses : 0;
    
    // Estimate memory usage (8 bytes per number in the node, plus overhead)
    const memoryUsage = cacheSize * nodeSize * 8 + cacheSize * 40; // 40 bytes overhead per node
    
    return {
      cacheSize,
      hitCount,
      missCount,
      hitRate,
      memoryUsage
    };
  }
  
  /**
   * Get statistics for all caches
   * 
   * @returns Statistics for all caches
   */
  public getAllStats(): Record<string, NodeCacheStats> {
    const stats: Record<string, NodeCacheStats> = {};
    
    for (const cacheId in this.cacheSizes) {
      stats[cacheId] = this.getStats(cacheId);
    }
    
    return stats;
  }
  
  /**
   * Get aggregate statistics for all caches
   * 
   * @returns Aggregate statistics for all caches
   */
  public getAggregateStats(): NodeCacheStats {
    let totalCacheSize = 0;
    let totalHitCount = 0;
    let totalMissCount = 0;
    let totalMemoryUsage = 0;
    
    for (const cacheId in this.cacheSizes) {
      const stats = this.getStats(cacheId);
      totalCacheSize += stats.cacheSize;
      totalHitCount += stats.hitCount;
      totalMissCount += stats.missCount;
      totalMemoryUsage += stats.memoryUsage;
    }
    
    const totalAccesses = totalHitCount + totalMissCount;
    const hitRate = totalAccesses > 0 ? totalHitCount / totalAccesses : 0;
    
    return {
      cacheSize: totalCacheSize,
      hitCount: totalHitCount,
      missCount: totalMissCount,
      hitRate,
      memoryUsage: totalMemoryUsage
    };
  }
  
  /**
   * Generate a report of node cache usage
   * 
   * @returns A report of node cache usage as a string
   */
  public generateReport(): string {
    const stats = this.getAllStats();
    const aggregateStats = this.getAggregateStats();
    
    let report = '# Node Cache Usage Report\n\n';
    
    // Add timestamp
    report += `Generated at: ${new Date().toISOString()}\n\n`;
    
    // Add aggregate statistics
    report += '## Aggregate Statistics\n\n';
    report += `- Total Cache Size: ${aggregateStats.cacheSize} nodes\n`;
    report += `- Total Hits: ${aggregateStats.hitCount}\n`;
    report += `- Total Misses: ${aggregateStats.missCount}\n`;
    report += `- Hit Rate: ${(aggregateStats.hitRate * 100).toFixed(2)}%\n`;
    report += `- Memory Usage: ${(aggregateStats.memoryUsage / 1024 / 1024).toFixed(2)} MB\n\n`;
    
    // Add statistics for each cache
    report += '## Cache Statistics\n\n';
    report += '| Cache ID | Size | Hits | Misses | Hit Rate | Memory Usage |\n';
    report += '|----------|------|------|--------|----------|-------------|\n';
    
    for (const cacheId in stats) {
      const cacheStats = stats[cacheId];
      report += `| ${cacheId} | ${cacheStats.cacheSize} | ${cacheStats.hitCount} | ${cacheStats.missCount} | ${(cacheStats.hitRate * 100).toFixed(2)}% | ${(cacheStats.memoryUsage / 1024 / 1024).toFixed(2)} MB |\n`;
    }
    
    return report;
  }
  
  /**
   * Clear all statistics
   */
  public clear(): void {
    this.cacheSizes = {};
    this.hitCounts = {};
    this.missCounts = {};
    this.nodeSizes = {};
  }
}

/**
 * Get the singleton instance of the node cache monitor
 * 
 * @returns The node cache monitor instance
 */
export function getNodeCacheMonitor(): NodeCacheMonitor {
  return NodeCacheMonitor.getInstance();
}

/**
 * Record a node cache access
 * 
 * @param cacheId - The ID of the cache
 * @param hit - Whether the access was a hit or miss
 * @param nodeSize - The size of the node (number of elements)
 */
export function recordNodeCacheAccess(cacheId: string, hit: boolean, nodeSize: number): void {
  const monitor = getNodeCacheMonitor();
  monitor.recordAccess(cacheId, hit, nodeSize);
}

/**
 * Record a node addition to the cache
 * 
 * @param cacheId - The ID of the cache
 */
export function recordNodeCacheAddition(cacheId: string): void {
  const monitor = getNodeCacheMonitor();
  monitor.recordAddition(cacheId);
}

/**
 * Record a node removal from the cache
 * 
 * @param cacheId - The ID of the cache
 */
export function recordNodeCacheRemoval(cacheId: string): void {
  const monitor = getNodeCacheMonitor();
  monitor.recordRemoval(cacheId);
}

/**
 * Generate a report of node cache usage
 * 
 * @returns A report of node cache usage as a string
 */
export function generateNodeCacheReport(): string {
  const monitor = getNodeCacheMonitor();
  return monitor.generateReport();
}

/**
 * Clear all node cache statistics
 */
export function clearNodeCacheStats(): void {
  const monitor = getNodeCacheMonitor();
  monitor.clear();
}
