/**
 * Registry types
 *
 * Defines types for the registry system that allows flexible benchmarking
 * of different data structures and algorithms.
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

/**
 * Operation metadata
 */
export interface OperationMetadata {
  /** Name of the operation */
  name: string;
  /** Description of the operation */
  description?: string;
  /** Category of the operation */
  category: string;
  /** Whether the operation is read-only */
  readOnly?: boolean;
  /** Default arguments for the operation */
  defaultArgs?: any[];
  /** Required capabilities for this operation */
  requiredCapabilities?: string[];
}

/**
 * Registry of operations
 */
export type OperationsRegistry = Record<string, OperationMetadata>;

/**
 * Test case generator function
 *
 * @param size - Size of the test case
 * @returns Test case data
 */
export type TestCaseGenerator<T = any> = (size: number) => T;

/**
 * Test case for a complex comparison
 */
export interface TestCase<T = any> {
  /** Name of the test case */
  name: string;
  /** Description of the test case */
  description?: string;
  /** Generator function for the test case */
  generator: TestCaseGenerator<T>;
}

/**
 * Operation adapter for a complex comparison
 */
export interface ComplexOperationAdapter<T = any, R = any> {
  /** Name of the operation */
  name: string;
  /** Description of the operation */
  description?: string;
  /** Function to adapt the operation */
  adapter: (instance: T, ...args: any[]) => R;
}

/**
 * Implementation adapter for a complex comparison
 */
export interface ComplexImplementationAdapter<T = any> {
  /** ID of the implementation */
  id: string;
  /** Name of the implementation */
  name: string;
  /** Description of the implementation */
  description?: string;
  /** Function to create an instance */
  factory: (size: number, testCase?: any) => T;
  /** Map of operation adapters */
  operations: Record<string, ComplexOperationAdapter<T>>;
}

/**
 * Complex comparison configuration
 */
export interface ComplexComparisonConfig {
  /** Name of the comparison */
  name: string;
  /** Description of the comparison */
  description?: string;
  /** Implementations to compare */
  implementations: ComplexImplementationAdapter[];
  /** Test cases to run */
  testCases: TestCase[];
  /** Input sizes to test */
  inputSizes: number[];
  /** Benchmark options */
  options?: {
    /** Number of iterations */
    iterations?: number;
    /** Number of warmup iterations */
    warmupIterations?: number;
    /** Whether to measure memory usage */
    measureMemory?: boolean;
  };
}
