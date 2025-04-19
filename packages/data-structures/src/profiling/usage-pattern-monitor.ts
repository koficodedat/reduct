/**
 * Usage pattern monitoring for adaptive implementation selection
 * 
 * This module provides tools for monitoring usage patterns of data structures
 * and adapting the implementation based on those patterns.
 */

import { OperationType, DataStructureType } from './index';
import { RepresentationType } from '../list/types';

/**
 * Operation pattern data
 */
export interface OperationPattern {
  /**
   * The type of operation
   */
  operationType: OperationType;
  
  /**
   * The frequency of the operation (0-1)
   */
  frequency: number;
  
  /**
   * The average size of the data structure when the operation is performed
   */
  averageSize: number;
}

/**
 * Usage pattern data
 */
export interface UsagePattern {
  /**
   * The most frequent operations
   */
  frequentOperations: OperationPattern[];
  
  /**
   * The average size of the data structure
   */
  averageSize: number;
  
  /**
   * The size distribution of the data structure
   */
  sizeDistribution: {
    small: number; // Percentage of operations on small collections
    medium: number; // Percentage of operations on medium collections
    large: number; // Percentage of operations on large collections
    veryLarge: number; // Percentage of operations on very large collections
  };
  
  /**
   * The operation distribution
   */
  operationDistribution: Record<OperationType, number>;
}

/**
 * Implementation recommendation
 */
export interface ImplementationRecommendation {
  /**
   * The recommended representation type
   */
  representation: RepresentationType;
  
  /**
   * The confidence level of the recommendation (0-1)
   */
  confidence: number;
  
  /**
   * The reason for the recommendation
   */
  reason: string;
  
  /**
   * Custom thresholds for the implementation
   */
  thresholds?: {
    small?: number;
    medium?: number;
    large?: number;
  };
}

/**
 * Usage pattern monitor
 * 
 * This class monitors usage patterns of data structures and provides
 * recommendations for adaptive implementation selection.
 */
export class UsagePatternMonitor {
  private static instance: UsagePatternMonitor;
  
  /**
   * Operation counts by type
   */
  private operationCounts: Record<OperationType, number> = {} as Record<OperationType, number>;
  
  /**
   * Operation counts by size range
   */
  private operationCountsBySize: {
    small: Record<OperationType, number>;
    medium: Record<OperationType, number>;
    large: Record<OperationType, number>;
    veryLarge: Record<OperationType, number>;
  } = {
    small: {} as Record<OperationType, number>,
    medium: {} as Record<OperationType, number>,
    large: {} as Record<OperationType, number>,
    veryLarge: {} as Record<OperationType, number>
  };
  
  /**
   * Total operation count
   */
  private totalOperations = 0;
  
  /**
   * Size sum for calculating average size
   */
  private sizeSum = 0;
  
  /**
   * Size thresholds for categorizing operations
   */
  private sizeThresholds = {
    small: 32, // Default threshold for small collections
    medium: 1024, // Default threshold for medium collections
    large: 10000 // Default threshold for large collections
  };
  
  /**
   * Whether to enable adaptive implementation selection
   */
  private adaptiveEnabled = true;
  
  /**
   * The minimum number of operations required for a recommendation
   */
  private minOperationsForRecommendation = 100;
  
  /**
   * The window size for recent operations
   */
  private recentOperationsWindow = 1000;
  
  /**
   * Recent operations for calculating trends
   */
  private recentOperations: Array<{
    operationType: OperationType;
    size: number;
    timestamp: number;
  }> = [];
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize operation counts
    for (const op in OperationType) {
      if (isNaN(Number(op))) {
        const opType = OperationType[op as keyof typeof OperationType];
        this.operationCounts[opType] = 0;
        this.operationCountsBySize.small[opType] = 0;
        this.operationCountsBySize.medium[opType] = 0;
        this.operationCountsBySize.large[opType] = 0;
        this.operationCountsBySize.veryLarge[opType] = 0;
      }
    }
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): UsagePatternMonitor {
    if (!UsagePatternMonitor.instance) {
      UsagePatternMonitor.instance = new UsagePatternMonitor();
    }
    
    return UsagePatternMonitor.instance;
  }
  
  /**
   * Record an operation
   * 
   * @param operationType - The type of operation
   * @param size - The size of the data structure
   */
  public recordOperation(operationType: OperationType, size: number): void {
    if (!this.adaptiveEnabled) {
      return;
    }
    
    // Record the operation count
    this.operationCounts[operationType] = (this.operationCounts[operationType] || 0) + 1;
    
    // Record the operation count by size range
    if (size < this.sizeThresholds.small) {
      this.operationCountsBySize.small[operationType] = (this.operationCountsBySize.small[operationType] || 0) + 1;
    } else if (size < this.sizeThresholds.medium) {
      this.operationCountsBySize.medium[operationType] = (this.operationCountsBySize.medium[operationType] || 0) + 1;
    } else if (size < this.sizeThresholds.large) {
      this.operationCountsBySize.large[operationType] = (this.operationCountsBySize.large[operationType] || 0) + 1;
    } else {
      this.operationCountsBySize.veryLarge[operationType] = (this.operationCountsBySize.veryLarge[operationType] || 0) + 1;
    }
    
    // Update total operations and size sum
    this.totalOperations++;
    this.sizeSum += size;
    
    // Record recent operation
    this.recentOperations.push({
      operationType,
      size,
      timestamp: Date.now()
    });
    
    // Trim recent operations if needed
    if (this.recentOperations.length > this.recentOperationsWindow) {
      this.recentOperations.shift();
    }
  }
  
  /**
   * Get the current usage pattern
   */
  public getUsagePattern(): UsagePattern {
    // Calculate average size
    const averageSize = this.totalOperations > 0 ? this.sizeSum / this.totalOperations : 0;
    
    // Calculate operation distribution
    const operationDistribution: Record<OperationType, number> = {} as Record<OperationType, number>;
    
    for (const op in this.operationCounts) {
      operationDistribution[op as OperationType] = this.totalOperations > 0 
        ? this.operationCounts[op as OperationType] / this.totalOperations 
        : 0;
    }
    
    // Calculate size distribution
    const smallCount = Object.values(this.operationCountsBySize.small).reduce((sum, count) => sum + count, 0);
    const mediumCount = Object.values(this.operationCountsBySize.medium).reduce((sum, count) => sum + count, 0);
    const largeCount = Object.values(this.operationCountsBySize.large).reduce((sum, count) => sum + count, 0);
    const veryLargeCount = Object.values(this.operationCountsBySize.veryLarge).reduce((sum, count) => sum + count, 0);
    
    const sizeDistribution = {
      small: this.totalOperations > 0 ? smallCount / this.totalOperations : 0,
      medium: this.totalOperations > 0 ? mediumCount / this.totalOperations : 0,
      large: this.totalOperations > 0 ? largeCount / this.totalOperations : 0,
      veryLarge: this.totalOperations > 0 ? veryLargeCount / this.totalOperations : 0
    };
    
    // Calculate frequent operations
    const frequentOperations: OperationPattern[] = [];
    
    for (const op in this.operationCounts) {
      const count = this.operationCounts[op as OperationType];
      const frequency = this.totalOperations > 0 ? count / this.totalOperations : 0;
      
      // Only include operations with a frequency above 1%
      if (frequency >= 0.01) {
        // Calculate average size for this operation
        let opSizeSum = 0;
        let opCount = 0;
        
        for (const operation of this.recentOperations) {
          if (operation.operationType === op) {
            opSizeSum += operation.size;
            opCount++;
          }
        }
        
        const opAverageSize = opCount > 0 ? opSizeSum / opCount : averageSize;
        
        frequentOperations.push({
          operationType: op as OperationType,
          frequency,
          averageSize: opAverageSize
        });
      }
    }
    
    // Sort by frequency (descending)
    frequentOperations.sort((a, b) => b.frequency - a.frequency);
    
    return {
      frequentOperations,
      averageSize,
      sizeDistribution,
      operationDistribution
    };
  }
  
  /**
   * Get a recommendation for the best implementation based on usage patterns
   */
  public getRecommendation(): ImplementationRecommendation | null {
    // If we don't have enough operations, return null
    if (this.totalOperations < this.minOperationsForRecommendation) {
      return null;
    }
    
    const pattern = this.getUsagePattern();
    
    // Default recommendation
    let recommendation: ImplementationRecommendation = {
      representation: RepresentationType.SMALL,
      confidence: 0.5,
      reason: 'Default recommendation based on limited data'
    };
    
    // Check size distribution first
    if (pattern.sizeDistribution.veryLarge > 0.5) {
      // If more than 50% of operations are on very large collections, use HAMT_VECTOR
      recommendation = {
        representation: RepresentationType.HAMT_VECTOR,
        confidence: 0.8,
        reason: 'Majority of operations are on very large collections'
      };
    } else if (pattern.sizeDistribution.large > 0.5) {
      // If more than 50% of operations are on large collections, use VECTOR
      recommendation = {
        representation: RepresentationType.VECTOR,
        confidence: 0.8,
        reason: 'Majority of operations are on large collections'
      };
    } else if (pattern.sizeDistribution.medium > 0.5) {
      // If more than 50% of operations are on medium collections, use CHUNKED
      recommendation = {
        representation: RepresentationType.CHUNKED,
        confidence: 0.8,
        reason: 'Majority of operations are on medium collections'
      };
    } else if (pattern.sizeDistribution.small > 0.5) {
      // If more than 50% of operations are on small collections, use SMALL
      recommendation = {
        representation: RepresentationType.SMALL,
        confidence: 0.8,
        reason: 'Majority of operations are on small collections'
      };
    }
    
    // Check operation patterns
    if (pattern.frequentOperations.length > 0) {
      const mostFrequentOp = pattern.frequentOperations[0];
      
      // Adjust recommendation based on most frequent operation
      switch (mostFrequentOp.operationType) {
        case OperationType.GET:
          // For frequent get operations, prefer CHUNKED for medium-sized collections
          if (mostFrequentOp.averageSize >= this.sizeThresholds.small && 
              mostFrequentOp.averageSize < this.sizeThresholds.medium) {
            recommendation = {
              representation: RepresentationType.CHUNKED,
              confidence: 0.7,
              reason: 'Frequent get operations on medium-sized collections',
              thresholds: {
                small: Math.max(16, Math.min(32, Math.floor(mostFrequentOp.averageSize / 4)))
              }
            };
          }
          break;
        case OperationType.APPEND:
        case OperationType.PREPEND:
          // For frequent append/prepend operations, prefer CHUNKED with larger chunks
          if (mostFrequentOp.averageSize >= this.sizeThresholds.small && 
              mostFrequentOp.averageSize < this.sizeThresholds.large) {
            recommendation = {
              representation: RepresentationType.CHUNKED,
              confidence: 0.7,
              reason: `Frequent ${mostFrequentOp.operationType} operations on medium-sized collections`,
              thresholds: {
                small: Math.max(16, Math.min(32, Math.floor(mostFrequentOp.averageSize / 8))),
                medium: Math.max(512, Math.min(2048, Math.floor(mostFrequentOp.averageSize / 2)))
              }
            };
          }
          break;
        case OperationType.MAP:
        case OperationType.FILTER:
        case OperationType.REDUCE:
          // For frequent map/filter/reduce operations, prefer VECTOR for larger collections
          if (mostFrequentOp.averageSize >= this.sizeThresholds.medium) {
            recommendation = {
              representation: RepresentationType.VECTOR,
              confidence: 0.7,
              reason: `Frequent ${mostFrequentOp.operationType} operations on large collections`,
              thresholds: {
                medium: Math.max(512, Math.min(1024, Math.floor(mostFrequentOp.averageSize / 4)))
              }
            };
          }
          break;
        case OperationType.SLICE:
          // For frequent slice operations, prefer CHUNKED with optimized chunk size
          if (mostFrequentOp.averageSize >= this.sizeThresholds.small) {
            recommendation = {
              representation: RepresentationType.CHUNKED,
              confidence: 0.7,
              reason: 'Frequent slice operations',
              thresholds: {
                small: Math.max(16, Math.min(32, Math.floor(mostFrequentOp.averageSize / 16))),
                medium: Math.max(512, Math.min(2048, Math.floor(mostFrequentOp.averageSize / 4)))
              }
            };
          }
          break;
        case OperationType.CONCAT:
          // For frequent concat operations, prefer VECTOR
          if (mostFrequentOp.averageSize >= this.sizeThresholds.medium) {
            recommendation = {
              representation: RepresentationType.VECTOR,
              confidence: 0.7,
              reason: 'Frequent concat operations on large collections'
            };
          }
          break;
      }
    }
    
    // Check for mixed operation patterns
    if (pattern.frequentOperations.length >= 3) {
      const hasAppendOrPrepend = pattern.frequentOperations.some(op => 
        op.operationType === OperationType.APPEND || op.operationType === OperationType.PREPEND);
      const hasMapOrFilter = pattern.frequentOperations.some(op => 
        op.operationType === OperationType.MAP || op.operationType === OperationType.FILTER);
      const hasGet = pattern.frequentOperations.some(op => op.operationType === OperationType.GET);
      
      if (hasAppendOrPrepend && hasMapOrFilter && hasGet) {
        // For mixed operation patterns, prefer CHUNKED with balanced thresholds
        recommendation = {
          representation: RepresentationType.CHUNKED,
          confidence: 0.6,
          reason: 'Mixed operation pattern with append/prepend, map/filter, and get operations',
          thresholds: {
            small: 24,
            medium: 768
          }
        };
      }
    }
    
    return recommendation;
  }
  
  /**
   * Set the size thresholds for categorizing operations
   * 
   * @param thresholds - The new thresholds
   */
  public setSizeThresholds(thresholds: {
    small?: number;
    medium?: number;
    large?: number;
  }): void {
    if (thresholds.small !== undefined) {
      this.sizeThresholds.small = thresholds.small;
    }
    
    if (thresholds.medium !== undefined) {
      this.sizeThresholds.medium = thresholds.medium;
    }
    
    if (thresholds.large !== undefined) {
      this.sizeThresholds.large = thresholds.large;
    }
  }
  
  /**
   * Enable or disable adaptive implementation selection
   * 
   * @param enabled - Whether to enable adaptive implementation selection
   */
  public setAdaptiveEnabled(enabled: boolean): void {
    this.adaptiveEnabled = enabled;
  }
  
  /**
   * Set the minimum number of operations required for a recommendation
   * 
   * @param minOperations - The minimum number of operations
   */
  public setMinOperationsForRecommendation(minOperations: number): void {
    this.minOperationsForRecommendation = minOperations;
  }
  
  /**
   * Set the window size for recent operations
   * 
   * @param windowSize - The window size
   */
  public setRecentOperationsWindow(windowSize: number): void {
    this.recentOperationsWindow = windowSize;
    
    // Trim recent operations if needed
    if (this.recentOperations.length > this.recentOperationsWindow) {
      this.recentOperations = this.recentOperations.slice(-this.recentOperationsWindow);
    }
  }
  
  /**
   * Clear all usage pattern data
   */
  public clear(): void {
    // Reset operation counts
    for (const op in OperationType) {
      if (isNaN(Number(op))) {
        const opType = OperationType[op as keyof typeof OperationType];
        this.operationCounts[opType] = 0;
        this.operationCountsBySize.small[opType] = 0;
        this.operationCountsBySize.medium[opType] = 0;
        this.operationCountsBySize.large[opType] = 0;
        this.operationCountsBySize.veryLarge[opType] = 0;
      }
    }
    
    // Reset other counters
    this.totalOperations = 0;
    this.sizeSum = 0;
    this.recentOperations = [];
  }
  
  /**
   * Generate a report of usage patterns
   */
  public generateReport(): string {
    const pattern = this.getUsagePattern();
    const recommendation = this.getRecommendation();
    
    let report = '# Usage Pattern Report\n\n';
    
    // Add timestamp
    report += `Generated at: ${new Date().toISOString()}\n\n`;
    
    // Add summary
    report += '## Summary\n\n';
    report += `Total operations: ${this.totalOperations}\n`;
    report += `Average size: ${pattern.averageSize.toFixed(2)}\n\n`;
    
    // Add size distribution
    report += '## Size Distribution\n\n';
    report += `Small (< ${this.sizeThresholds.small}): ${(pattern.sizeDistribution.small * 100).toFixed(2)}%\n`;
    report += `Medium (${this.sizeThresholds.small} - ${this.sizeThresholds.medium}): ${(pattern.sizeDistribution.medium * 100).toFixed(2)}%\n`;
    report += `Large (${this.sizeThresholds.medium} - ${this.sizeThresholds.large}): ${(pattern.sizeDistribution.large * 100).toFixed(2)}%\n`;
    report += `Very Large (>= ${this.sizeThresholds.large}): ${(pattern.sizeDistribution.veryLarge * 100).toFixed(2)}%\n\n`;
    
    // Add frequent operations
    report += '## Frequent Operations\n\n';
    report += '| Operation | Frequency | Average Size |\n';
    report += '|-----------|-----------|-------------|\n';
    
    for (const op of pattern.frequentOperations) {
      report += `| ${op.operationType} | ${(op.frequency * 100).toFixed(2)}% | ${op.averageSize.toFixed(2)} |\n`;
    }
    
    report += '\n';
    
    // Add recommendation
    report += '## Recommendation\n\n';
    
    if (recommendation) {
      report += `Representation: ${recommendation.representation}\n`;
      report += `Confidence: ${(recommendation.confidence * 100).toFixed(2)}%\n`;
      report += `Reason: ${recommendation.reason}\n\n`;
      
      if (recommendation.thresholds) {
        report += '### Custom Thresholds\n\n';
        
        if (recommendation.thresholds.small !== undefined) {
          report += `Small: ${recommendation.thresholds.small}\n`;
        }
        
        if (recommendation.thresholds.medium !== undefined) {
          report += `Medium: ${recommendation.thresholds.medium}\n`;
        }
        
        if (recommendation.thresholds.large !== undefined) {
          report += `Large: ${recommendation.thresholds.large}\n`;
        }
        
        report += '\n';
      }
    } else {
      report += 'No recommendation available (not enough data)\n\n';
    }
    
    return report;
  }
}

/**
 * Get the singleton instance of the usage pattern monitor
 */
export function getUsagePatternMonitor(): UsagePatternMonitor {
  return UsagePatternMonitor.getInstance();
}

/**
 * Record an operation in the usage pattern monitor
 * 
 * @param operationType - The type of operation
 * @param size - The size of the data structure
 */
export function recordOperation(operationType: OperationType, size: number): void {
  const monitor = getUsagePatternMonitor();
  monitor.recordOperation(operationType, size);
}

/**
 * Get a recommendation for the best implementation based on usage patterns
 */
export function getImplementationRecommendation(): ImplementationRecommendation | null {
  const monitor = getUsagePatternMonitor();
  return monitor.getRecommendation();
}

/**
 * Generate a report of usage patterns
 */
export function generateUsagePatternReport(): string {
  const monitor = getUsagePatternMonitor();
  return monitor.generateReport();
}

/**
 * Clear all usage pattern data
 */
export function clearUsagePatternData(): void {
  const monitor = getUsagePatternMonitor();
  monitor.clear();
}

/**
 * Enable or disable adaptive implementation selection
 * 
 * @param enabled - Whether to enable adaptive implementation selection
 */
export function setAdaptiveImplementationEnabled(enabled: boolean): void {
  const monitor = getUsagePatternMonitor();
  monitor.setAdaptiveEnabled(enabled);
}

/**
 * Set the size thresholds for categorizing operations
 * 
 * @param thresholds - The new thresholds
 */
export function setSizeThresholds(thresholds: {
  small?: number;
  medium?: number;
  large?: number;
}): void {
  const monitor = getUsagePatternMonitor();
  monitor.setSizeThresholds(thresholds);
}
