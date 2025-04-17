/**
 * Operation Adapter Registry
 *
 * Provides a central registry for operation adapters and factories.
 *
 * @packageDocumentation
 */

import {
  OperationAdapter,
  OperationAdapterFactory,
  OperationInterface,
  OperationMatcher,
  OperationCompatibility,
} from './types';

// Registry of operation adapters
const adapters: Record<string, OperationAdapter> = {};

// Registry of operation adapter factories
const adapterFactories: OperationAdapterFactory[] = [];

// Registry of operation matchers
const operationMatchers: OperationMatcher[] = [];

/**
 * Registers an operation adapter
 *
 * @param adapter - Operation adapter to register
 * @param overwrite - Whether to overwrite an existing adapter with the same ID
 * @returns True if the adapter was registered, false if it already exists and overwrite is false
 */
export function registerAdapter(adapter: OperationAdapter, overwrite: boolean = true): boolean {
  if (adapters[adapter.implementationId] && !overwrite) {
    // Skip registration if adapter already exists and overwrite is false
    return false;
  }

  adapters[adapter.implementationId] = adapter;
  return true;
}

/**
 * Registers an operation adapter factory
 *
 * @param factory - Operation adapter factory to register
 */
export function registerAdapterFactory(factory: OperationAdapterFactory): void {
  // Check if factory with same ID already exists
  const existingIndex = adapterFactories.findIndex(f => f.id === factory.id);
  if (existingIndex >= 0) {
    // Replace existing factory
    adapterFactories[existingIndex] = factory;
  } else {
    // Add new factory
    adapterFactories.push(factory);
  }

  // Sort factories by priority (descending)
  adapterFactories.sort((a, b) => b.priority - a.priority);
}

/**
 * Registers an operation matcher
 *
 * @param matcher - Operation matcher to register
 */
export function registerOperationMatcher(matcher: OperationMatcher): void {
  // Check if matcher with same ID already exists
  const existingIndex = operationMatchers.findIndex(m => m.id === matcher.id);
  if (existingIndex >= 0) {
    // Replace existing matcher
    operationMatchers[existingIndex] = matcher;
  } else {
    // Add new matcher
    operationMatchers.push(matcher);
  }

  // Sort matchers by priority (descending)
  operationMatchers.sort((a, b) => b.priority - a.priority);
}

/**
 * Gets an operation adapter for an implementation
 *
 * @param implementationId - Implementation ID
 * @returns Operation adapter or undefined if not found
 */
export function getAdapter<T>(implementationId: string): OperationAdapter<T> | undefined {
  // Check if adapter is already registered
  const adapter = adapters[implementationId] as OperationAdapter<T>;
  if (adapter) {
    return adapter;
  }

  // Try to create adapter using factories
  for (const factory of adapterFactories) {
    const adapter = factory.createAdapter<T>(implementationId);
    if (adapter) {
      // Register the adapter (don't overwrite existing adapters)
      registerAdapter(adapter, false);
      return adapter;
    }
  }

  return undefined;
}

/**
 * Gets all registered adapters
 *
 * @returns All registered adapters
 */
export function getAllAdapters(): Record<string, OperationAdapter> {
  return { ...adapters };
}

/**
 * Gets all registered adapter factories
 *
 * @returns All registered adapter factories
 */
export function getAllAdapterFactories(): OperationAdapterFactory[] {
  return [...adapterFactories];
}

/**
 * Gets all registered operation matchers
 *
 * @returns All registered operation matchers
 */
export function getAllOperationMatchers(): OperationMatcher[] {
  return [...operationMatchers];
}

/**
 * Checks if two operations are compatible
 *
 * @param op1 - First operation
 * @param op2 - Second operation
 * @returns Compatibility result
 */
export function areOperationsCompatible(
  op1: OperationInterface,
  op2: OperationInterface
): OperationCompatibility {
  // If no matchers are registered, operations are not compatible
  if (operationMatchers.length === 0) {
    return {
      compatible: false,
      reason: 'No operation matchers registered',
    };
  }

  // Try each matcher in order of priority
  for (const matcher of operationMatchers) {
    const result = matcher.isCompatible(op1, op2);
    if (result.compatible) {
      return result;
    }
  }

  // If no matcher found operations compatible, they are not compatible
  return {
    compatible: false,
    reason: 'No matcher found operations compatible',
  };
}

/**
 * Finds common operations between adapters
 *
 * @param adapterIds - Adapter IDs
 * @returns Map of common operation names to compatibility scores
 */
export function findCommonAdapterOperations(
  adapterIds: string[]
): Map<string, number> {
  if (adapterIds.length === 0) {
    return new Map();
  }

  // Get adapters
  const adapterList = adapterIds.map(id => getAdapter(id)).filter(Boolean) as OperationAdapter[];
  if (adapterList.length !== adapterIds.length) {
    throw new Error('One or more adapters not found');
  }

  // Get operations from first adapter
  const firstAdapter = adapterList[0];
  const operations = Object.keys(firstAdapter.operations);

  // Find common operations
  const commonOperations = new Map<string, number>();

  for (const opName of operations) {
    const op1 = firstAdapter.operations[opName];

    // Check if operation exists in all other adapters
    let minScore = 1;
    let compatible = true;

    for (let i = 1; i < adapterList.length; i++) {
      const adapter = adapterList[i];
      const op2 = adapter.operations[opName];

      if (!op2) {
        compatible = false;
        break;
      }

      // Check if operations are compatible
      const result = areOperationsCompatible(op1, op2);
      if (!result.compatible) {
        compatible = false;
        break;
      }

      // Update minimum score
      if (result.score !== undefined && result.score < minScore) {
        minScore = result.score;
      }
    }

    if (compatible) {
      commonOperations.set(opName, minScore);
    }
  }

  return commonOperations;
}
