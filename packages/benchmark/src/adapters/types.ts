/**
 * Operation Adapter Types
 *
 * Defines types for the operation adapter system that allows flexible
 * benchmarking of different data structures and algorithms.
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
 * Operation metadata
 */
export interface AdapterOperationMetadata {
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
 * Operation interface
 */
export interface OperationInterface<T = any, R = any> {
  /** Metadata for the operation */
  metadata: AdapterOperationMetadata;
  /** Function to execute the operation */
  execute: (instance: T, ...args: any[]) => R;
  /** Function to create benchmark arguments */
  createBenchmarkArgs?: (instance: T, size: number) => any[];
  /** Function to validate the operation result */
  validateResult?: (result: R, instance: T, ...args: any[]) => boolean;
}

/**
 * Operation adapter
 */
export interface OperationAdapter<T = any> {
  /** Implementation ID */
  implementationId: string;
  /** Operations supported by this adapter */
  operations: Record<string, OperationInterface<T>>;
  /** Function to check if this adapter supports an instance */
  supports: (instance: any) => boolean;
  /** Function to adapt an instance to the expected type */
  adapt?: (instance: any) => T;
}

/**
 * Operation adapter factory
 */
export interface OperationAdapterFactory {
  /** ID of the factory */
  id: string;
  /** Description of the factory */
  description?: string;
  /** Function to create an adapter for an implementation */
  createAdapter: <T>(implementationId: string) => OperationAdapter<T> | undefined;
  /** Priority of the factory (higher values take precedence) */
  priority: number;
}

/**
 * Operation compatibility result
 */
export interface OperationCompatibility {
  /** Whether the operations are compatible */
  compatible: boolean;
  /** Reason for incompatibility */
  reason?: string;
  /** Compatibility score (0-1, higher is better) */
  score?: number;
}

/**
 * Operation matcher
 */
export interface OperationMatcher {
  /** ID of the matcher */
  id: string;
  /** Description of the matcher */
  description?: string;
  /** Function to check if two operations are compatible */
  isCompatible: (op1: OperationInterface, op2: OperationInterface) => OperationCompatibility;
  /** Priority of the matcher (higher values take precedence) */
  priority: number;
}
