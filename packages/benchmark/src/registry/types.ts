/**
 * Registry types
 *
 * Defines types for the registry system that allows flexible benchmarking
 * of different data structures and algorithms.
 *
 * @packageDocumentation
 */

import {
  InstanceCreator,
  OperationFunction,
  OperationsMap,
  Implementation,
  Registry,
  OperationMetadata,
  OperationsRegistry
} from '@reduct/shared-types/registry';

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
