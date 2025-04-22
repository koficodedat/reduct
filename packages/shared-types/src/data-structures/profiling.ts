/**
 * Data structure profiling types
 *
 * This module provides types for profiling data structures.
 *
 * @packageDocumentation
 */

/**
 * Types of data structures for profiling
 */
export enum DataStructureType {
  LIST = 'list',
  MAP = 'map',
  SET = 'set',
  STACK = 'stack',
  QUEUE = 'queue',
  TREE = 'tree',
  GRAPH = 'graph',
  MATRIX = 'matrix',
  VECTOR = 'vector'
}

/**
 * Memory usage statistics for a data structure
 */
export interface MemoryStats {
  /**
   * Number of instances of the data structure
   */
  instanceCount: number;
  
  /**
   * Total number of elements across all instances
   */
  elementCount: number;
  
  /**
   * Estimated memory usage in bytes
   */
  memoryUsage: number;
  
  /**
   * Average memory usage per element in bytes
   */
  memoryPerElement: number;
}
