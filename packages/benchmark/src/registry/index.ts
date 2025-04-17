/**
 * Registry for data structures and algorithms
 *
 * Provides a central registry for all data structures and algorithms
 * that can be benchmarked.
 *
 * @packageDocumentation
 */

import { Registry, Implementation, OperationsRegistry, OperationMetadata } from './types';
import { dataStructureRegistry } from './data-structures';
import { algorithmRegistry } from './algorithms';
import { hasCapability } from '../comparison/capabilities';

// Global registry
const registry: Registry = {
  ...dataStructureRegistry,
  ...algorithmRegistry,
};

// Global operations registry
const operationsRegistry: OperationsRegistry = {};

/**
 * Registers a new implementation
 *
 * @param id - Unique identifier for the implementation
 * @param implementation - Implementation details
 */
export function registerImplementation<T>(id: string, implementation: Implementation<T>): void {
  if (registry[id]) {
    throw new Error(`Implementation with ID '${id}' already exists`);
  }

  registry[id] = implementation;

  // Register operations
  for (const [opName, _] of Object.entries(implementation.operations)) {
    if (!operationsRegistry[opName]) {
      operationsRegistry[opName] = {
        name: opName,
        category: implementation.category,
      };
    }
  }
}

/**
 * Registers operation metadata
 *
 * @param name - Name of the operation
 * @param metadata - Operation metadata
 */
export function registerOperation(name: string, metadata: OperationMetadata): void {
  operationsRegistry[name] = {
    ...operationsRegistry[name],
    ...metadata,
  };
}

/**
 * Gets an implementation by ID
 *
 * @param id - Implementation ID
 * @returns Implementation or undefined if not found
 */
export function getImplementation<T>(id: string): Implementation<T> | undefined {
  return registry[id] as Implementation<T>;
}

/**
 * Gets all implementations
 *
 * @returns All registered implementations
 */
export function getAllImplementations(): Registry {
  return { ...registry };
}

/**
 * Gets implementations by category
 *
 * @param category - Category to filter by
 * @returns Implementations in the category
 */
export function getImplementationsByCategory(category: 'data-structure' | 'algorithm'): Registry {
  return Object.entries(registry)
    .filter(([_, impl]) => impl.category === category)
    .reduce((acc, [id, impl]) => {
      acc[id] = impl;
      return acc;
    }, {} as Registry);
}

/**
 * Gets implementations by type
 *
 * @param type - Type to filter by
 * @returns Implementations of the type
 */
export function getImplementationsByType(type: string): Registry {
  return Object.entries(registry)
    .filter(([_, impl]) => impl.type === type)
    .reduce((acc, [id, impl]) => {
      acc[id] = impl;
      return acc;
    }, {} as Registry);
}

/**
 * Gets operation metadata
 *
 * @param name - Operation name
 * @returns Operation metadata or undefined if not found
 */
export function getOperationMetadata(name: string): OperationMetadata | undefined {
  return operationsRegistry[name];
}

/**
 * Gets all operations
 *
 * @returns All registered operations
 */
export function getAllOperations(): OperationsRegistry {
  return { ...operationsRegistry };
}

/**
 * Gets operations by category
 *
 * @param category - Category to filter by
 * @returns Operations in the category
 */
export function getOperationsByCategory(category: string): OperationsRegistry {
  return Object.entries(operationsRegistry)
    .filter(([_, op]) => op.category === category)
    .reduce((acc, [name, op]) => {
      acc[name] = op;
      return acc;
    }, {} as OperationsRegistry);
}

/**
 * Finds common operations between implementations
 *
 * @param ids - Implementation IDs
 * @returns Array of common operation names
 */
export function findCommonOperations(ids: string[]): string[] {
  if (ids.length === 0) return [];

  const implementations = ids.map(id => registry[id]).filter(Boolean);
  if (implementations.length !== ids.length) {
    throw new Error('One or more implementations not found');
  }

  // Get operations from first implementation
  const operations = Object.keys(implementations[0].operations);

  // Filter operations that exist in all implementations
  return operations.filter(op =>
    implementations.every(impl =>
      typeof impl.operations[op] === 'function'
    )
  );
}

/**
 * Updates the capabilities of an implementation
 *
 * @param id - Implementation ID
 * @param capabilities - Capabilities to add
 */
export function updateImplementationCapabilities(id: string, capabilities: string[]): void {
  const implementation = registry[id];
  if (!implementation) {
    throw new Error(`Implementation with ID '${id}' not found`);
  }

  implementation.capabilities = [
    ...(implementation.capabilities || []),
    ...capabilities
  ];

  // Remove duplicates
  implementation.capabilities = [...new Set(implementation.capabilities)];
}

/**
 * Gets implementations by capability
 *
 * @param capabilityId - Capability ID
 * @returns Implementations with the capability
 */
export function getImplementationsByCapability(capabilityId: string): Registry {
  return Object.entries(registry)
    .filter(([id, _]) => hasCapability(id, capabilityId))
    .reduce((acc, [id, impl]) => {
      acc[id] = impl;
      return acc;
    }, {} as Registry);
}

/**
 * Finds implementations that have all the specified capabilities
 *
 * @param capabilityIds - Capability IDs
 * @returns Implementations with all the capabilities
 */
export function findImplementationsWithCapabilities(capabilityIds: string[]): string[] {
  if (capabilityIds.length === 0) return Object.keys(registry);

  return Object.keys(registry).filter(id =>
    capabilityIds.every(capabilityId => hasCapability(id, capabilityId))
  );
}

/**
 * Finds operations that require a specific capability
 *
 * @param capabilityId - Capability ID
 * @returns Operations that require the capability
 */
export function findOperationsForCapability(capabilityId: string): string[] {
  return Object.entries(operationsRegistry)
    .filter(([_, metadata]) =>
      metadata.requiredCapabilities?.includes(capabilityId)
    )
    .map(([name, _]) => name);
}

/**
 * Updates the required capabilities of an operation
 *
 * @param name - Operation name
 * @param requiredCapabilities - Required capabilities
 */
export function updateOperationRequiredCapabilities(name: string, requiredCapabilities: string[]): void {
  const metadata = operationsRegistry[name];
  if (!metadata) {
    throw new Error(`Operation with name '${name}' not found`);
  }

  metadata.requiredCapabilities = [
    ...(metadata.requiredCapabilities || []),
    ...requiredCapabilities
  ];

  // Remove duplicates
  metadata.requiredCapabilities = [...new Set(metadata.requiredCapabilities)];
}

// Export types
export * from './types';
export { dataStructureRegistry } from './data-structures';
export { algorithmRegistry } from './algorithms';

// Import and run capabilities setup
import { setupCapabilities } from './capabilities-setup';

// Setup capabilities for implementations
setupCapabilities();
