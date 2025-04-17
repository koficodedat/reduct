/**
 * Types for the benchmark registry system
 *
 * @packageDocumentation
 */

import { SimpleOperationAdapter } from './adapter-factory';

/**
 * Definition of a benchmark operation
 */
export interface BenchmarkOperation {
  /** Name of the operation */
  name: string;
  /** Description of the operation */
  description?: string;
  /** Adapter function for the operation */
  adapter: SimpleOperationAdapter;
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

/**
 * Definition of a benchmark suite
 */
export interface BenchmarkDefinition {
  /** Name of the benchmark */
  name: string;
  /** Description of the benchmark */
  description?: string;
  /** Category of the benchmark (data structure, algorithm, etc.) */
  category: 'data-structure' | 'algorithm' | 'utility';
  /** Type of the benchmark (list, map, stack, sort, search, etc.) */
  type: string;
  /** Operations supported by this benchmark */
  operations: BenchmarkOperation[];
  /** Setup function for creating test instances */
  setupFn?: (size: number) => any;
  /** Teardown function for cleaning up test instances */
  teardownFn?: (instance: any) => void;
  /** Special cases for this benchmark */
  specialCases?: BenchmarkSpecialCase[];
  /** Default input sizes for this benchmark */
  defaultInputSizes?: number[];
  /** Default number of iterations for this benchmark */
  defaultIterations?: number;
  /** Tags for categorizing and filtering benchmarks */
  tags?: string[];
  /** Examples of how to use this benchmark */
  examples?: string[];
}

/**
 * Configuration for running a benchmark
 */
export interface BenchmarkConfig {
  /** Type of benchmark to run */
  type: string;
  /** Operations to benchmark */
  operations?: string[];
  /** Input sizes to test */
  inputSizes?: number[];
  /** Number of iterations to run */
  iterations?: number;
  /** Implementations to benchmark */
  implementations?: string[];
  /** Special case to use */
  specialCase?: string;
}
