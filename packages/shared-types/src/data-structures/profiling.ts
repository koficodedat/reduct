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
 * Extended data structure types for internal profiling
 */
export enum InternalDataStructureType {
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
  dataStructureType: InternalDataStructureType | DataStructureType;

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
