/**
 * Operation Adapter Factory
 *
 * Provides utilities for creating operation adapters.
 *
 * @packageDocumentation
 */

import { Implementation , getImplementation } from '../registry';

import {
  OperationAdapter,
  OperationAdapterFactory,
  OperationInterface,
  OperationCategory,
  AdapterOperationMetadata,
} from './types';

/**
 * Creates an operation adapter for a registry implementation
 *
 * @param implementation - Registry implementation
 * @returns Operation adapter
 */
export function createAdapterFromImplementation<T>(
  implementation: Implementation<T>
): OperationAdapter<T> {
  const operations: Record<string, OperationInterface<T>> = {};

  // Convert implementation operations to operation interfaces
  for (const [opName, opFn] of Object.entries(implementation.operations)) {
    // Determine operation category based on name
    let category = OperationCategory.UTILITY;
    let readOnly = true;

    if (opName === 'get' || opName === 'has' || opName === 'peek' || opName === 'size' || opName === 'isEmpty') {
      category = OperationCategory.ACCESS;
      readOnly = true;
    } else if (opName === 'set' || opName === 'delete' || opName === 'append' || opName === 'prepend' || opName === 'push' || opName === 'pop') {
      category = OperationCategory.MODIFICATION;
      readOnly = false;
    } else if (opName === 'map' || opName === 'filter' || opName === 'reduce' || opName === 'forEach') {
      category = OperationCategory.TRAVERSAL;
      readOnly = true;
    } else if (opName.includes('search') || opName === 'find' || opName === 'indexOf') {
      category = OperationCategory.SEARCH;
      readOnly = true;
    } else if (opName.includes('sort')) {
      category = OperationCategory.SORT;
      readOnly = false;
    }

    // Create metadata
    const metadata: AdapterOperationMetadata = {
      name: opName,
      category,
      readOnly,
      description: `${opName} operation for ${implementation.name}`,
    };

    // Create operation interface
    operations[opName] = {
      metadata,
      execute: opFn,
      createBenchmarkArgs: createBenchmarkArgsForOperation(opName, implementation.type),
    };
  }

  return {
    implementationId: implementation.name,
    operations,
    supports: (instance: any) => {
      // Check if instance is of the expected type
      // This is a simple check that could be enhanced
      return typeof instance === 'object' && instance !== null;
    },
  };
}

/**
 * Creates benchmark arguments for an operation
 *
 * @param opName - Operation name
 * @param implementationType - Implementation type
 * @returns Function to create benchmark arguments
 */
function createBenchmarkArgsForOperation(
  opName: string,
  implementationType: string
): ((instance: any, size: number) => any[]) | undefined {
  // Handle different operation types based on naming conventions
  if (opName === 'get' || opName === 'has') {
    // For get/has operations, use random indices/keys
    if (implementationType === 'list' || implementationType === 'stack') {
      // For list/stack, use random indices
      return (_instance: any, _size: number) => {
        // In a real implementation, we would use the instance size
        return [Math.floor(Math.random() * 100)];
      };
    } else if (implementationType === 'map') {
      // For map, use random keys
      return (_instance: any, size: number) => {
        return [`key${Math.floor(Math.random() * size)}`];
      };
    }
  } else if (opName === 'map' || opName === 'filter') {
    // For map/filter operations, use a simple function
    return (_: any, _size: number) => [(_x: any) => _x];
  } else if (opName === 'reduce') {
    // For reduce operations, use a simple reducer and initial value
    return (_: any, _size: number) => [(acc: any, x: any) => acc + x, 0];
  } else if (opName === 'append' || opName === 'prepend' || opName === 'push') {
    // For append/prepend/push operations, use a random value
    return (_: any, _size: number) => [Math.random()];
  } else if (opName === 'set') {
    // For set operations, use a random key and value
    return (_instance: any, size: number) => [`key${Math.floor(Math.random() * size)}`, Math.random()];
  }

  // Default: no arguments
  return (_: any, _size: number) => [];
}

/**
 * Registry implementation adapter factory
 */
export const registryImplementationAdapterFactory: OperationAdapterFactory = {
  id: 'registry-implementation-adapter-factory',
  description: 'Creates adapters from registry implementations',
  createAdapter: <T>(implementationId: string): OperationAdapter<T> | undefined => {
    const implementation = getImplementation<T>(implementationId);
    if (!implementation) {
      return undefined;
    }

    return createAdapterFromImplementation(implementation);
  },
  priority: 100,
};
