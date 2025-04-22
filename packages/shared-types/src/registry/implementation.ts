/**
 * Registry implementation types
 *
 * This module provides types for the registry system's implementations.
 *
 * @packageDocumentation
 */

/**
 * Function that creates an instance of a data structure or algorithm
 *
 * @param size - Size of the data structure or input size for algorithm
 * @returns Instance of the data structure or algorithm
 */
export type InstanceCreator<T> = (size: number) => T;

/**
 * Function that performs an operation on a data structure or algorithm
 *
 * @param instance - Instance of the data structure or algorithm
 * @param args - Arguments for the operation
 * @returns Result of the operation
 */
export type OperationFunction<T, R = any> = (instance: T, ...args: any[]) => R;

/**
 * Map of operations for a data structure or algorithm
 */
export type OperationsMap<T> = Record<string, OperationFunction<T>>;

/**
 * Implementation of a data structure or algorithm
 */
export interface Implementation<T> {
  /** Name of the implementation */
  name: string;
  /** Description of the implementation */
  description?: string;
  /** Category of the implementation (data-structure or algorithm) */
  category: 'data-structure' | 'algorithm';
  /** Type of the implementation (list, map, stack, sorting, searching, etc.) */
  type: string;
  /** Function to create an instance */
  create: InstanceCreator<T>;
  /** Map of operations */
  operations: OperationsMap<T>;
  /** Capabilities of the implementation */
  capabilities?: string[];
}

/**
 * Registry of implementations
 */
export type Registry = Record<string, Implementation<any>>;
