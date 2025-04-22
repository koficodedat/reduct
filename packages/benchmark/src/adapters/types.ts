/**
 * Operation Adapter Types
 *
 * Defines types for the operation adapter system that allows flexible
 * benchmarking of different data structures and algorithms.
 *
 * @packageDocumentation
 */

import { OperationCategory, OperationComplexity, BenchmarkOperationMetadata } from '@reduct/shared-types/benchmark';

/**
 * Operation metadata
 */
export interface AdapterOperationMetadata extends BenchmarkOperationMetadata {}

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
