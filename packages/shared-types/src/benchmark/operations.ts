/**
 * Benchmark operation types
 *
 * This module provides types for benchmark operations.
 *
 * @packageDocumentation
 */

/**
 * Operation category
 */
export enum OperationCategory {
  /** Operations that access data without modifying it */
  ACCESS = 'access',
  
  /** Operations that modify data */
  MODIFICATION = 'modification',
  
  /** Operations that traverse data */
  TRAVERSAL = 'traversal',
  
  /** Operations that search for data */
  SEARCH = 'search',
  
  /** Operations that sort data */
  SORT = 'sort',
  
  /** Operations that create new data structures */
  CREATION = 'creation',
  
  /** Operations that convert between data structures */
  CONVERSION = 'conversion',
  
  /** Operations that perform bulk operations */
  BULK = 'bulk',
  
  /** Operations that perform utility functions */
  UTILITY = 'utility',
}

/**
 * Operation complexity
 */
export enum OperationComplexity {
  /** O(1) - Constant time */
  CONSTANT = 'O(1)',
  
  /** O(log n) - Logarithmic time */
  LOGARITHMIC = 'O(log n)',
  
  /** O(n) - Linear time */
  LINEAR = 'O(n)',
  
  /** O(n log n) - Linearithmic time */
  LINEARITHMIC = 'O(n log n)',
  
  /** O(n²) - Quadratic time */
  QUADRATIC = 'O(n²)',
  
  /** O(n³) - Cubic time */
  CUBIC = 'O(n³)',
  
  /** O(2^n) - Exponential time */
  EXPONENTIAL = 'O(2^n)',
  
  /** O(n!) - Factorial time */
  FACTORIAL = 'O(n!)',
}

/**
 * Enhanced operation metadata with additional fields for benchmarking
 */
export interface BenchmarkOperationMetadata {
  /** Name of the operation */
  name: string;
  
  /** Description of the operation */
  description?: string;
  
  /** Category of the operation */
  category: OperationCategory;
  
  /** Whether the operation is read-only */
  readOnly: boolean;
  
  /** Expected time complexity */
  complexity?: OperationComplexity;
  
  /** Tags for the operation */
  tags?: string[];
  
  /** Version of the operation */
  version?: string;
}

/**
 * Definition of a benchmark operation
 */
export interface BenchmarkOperation {
  /** Name of the operation */
  name: string;
  
  /** Description of the operation */
  description?: string;
  
  /** Adapter function for the operation */
  adapter: Function;
}

/**
 * Special case for benchmark setup
 */
export interface BenchmarkSpecialCase {
  /** Name of the special case */
  name: string;
  
  /** Description of the special case */
  description?: string;
  
  /** Setup function for the special case */
  setupFn: (size: number) => any;
}
