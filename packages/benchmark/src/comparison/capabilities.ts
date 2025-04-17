/**
 * Capability system for complex comparisons
 *
 * This module defines the capability system that allows for comparing
 * different data structures based on their capabilities rather than
 * their specific implementations.
 *
 * @packageDocumentation
 */

/**
 * Represents a capability that a data structure can have
 */
export interface Capability {
  /** Unique identifier for the capability */
  id: string;

  /** Human-readable name of the capability */
  name: string;

  /** Description of the capability */
  description: string;

  /** List of operation IDs that are associated with this capability */
  operations: string[];
}

/**
 * Registry of capabilities
 */
const capabilityRegistry: Record<string, Capability> = {};

/**
 * Register a new capability
 *
 * @param capability - The capability to register
 */
export function registerCapability(capability: Capability): void {
  // Skip if already registered
  if (capabilityRegistry[capability.id]) {
    return;
  }

  capabilityRegistry[capability.id] = capability;
}

/**
 * Get a registered capability by ID
 *
 * @param id - The ID of the capability to get
 * @returns The capability, or undefined if not found
 */
export function getCapability(id: string): Capability | undefined {
  return capabilityRegistry[id];
}

/**
 * Get all registered capabilities
 *
 * @returns All registered capabilities
 */
export function getAllCapabilities(): Capability[] {
  return Object.values(capabilityRegistry);
}

/**
 * Check if an implementation has a specific capability
 *
 * @param implementationId - The ID of the implementation to check
 * @param capabilityId - The ID of the capability to check for
 * @returns True if the implementation has the capability, false otherwise
 */
export function hasCapability(implementationId: string, capabilityId: string): boolean {
  const implementation = getImplementationCapabilities(implementationId);
  return implementation.includes(capabilityId);
}

/**
 * Get the capabilities of an implementation
 *
 * @param implementationId - The ID of the implementation to get capabilities for
 * @returns Array of capability IDs
 */
export function getImplementationCapabilities(implementationId: string): string[] {
  // Import dynamically to avoid circular dependencies
  const { getImplementation } = require('../registry');

  const implementation = getImplementation(implementationId);
  if (!implementation) {
    return [];
  }

  return implementation.capabilities || [];
}

/**
 * Find implementations that have all the specified capabilities
 *
 * @param capabilityIds - The IDs of the capabilities to check for
 * @returns Array of implementation IDs that have all the specified capabilities
 */
export function findImplementationsWithCapabilities(capabilityIds: string[]): string[] {
  // Import dynamically to avoid circular dependencies
  const { getAllImplementations } = require('../registry');

  const allImplementations = getAllImplementations();

  return Object.keys(allImplementations).filter(id =>
    capabilityIds.every(capabilityId => hasCapability(id, capabilityId))
  );
}

/**
 * Find operations that are associated with a capability
 *
 * @param capabilityId - The ID of the capability to find operations for
 * @returns Array of operation IDs
 */
export function findOperationsForCapability(capabilityId: string): string[] {
  const capability = getCapability(capabilityId);
  return capability ? capability.operations : [];
}

/**
 * Register built-in capabilities
 */
export function registerBuiltInCapabilities(): void {
  // Sequence capability (ordered collection with indexed access)
  registerCapability({
    id: 'sequence',
    name: 'Sequence',
    description: 'Ordered collection with indexed access',
    operations: ['get', 'indexOf', 'length']
  });

  // Mappable capability (can transform elements)
  registerCapability({
    id: 'mappable',
    name: 'Mappable',
    description: 'Can transform elements using a mapping function',
    operations: ['map']
  });

  // Filterable capability (can filter elements)
  registerCapability({
    id: 'filterable',
    name: 'Filterable',
    description: 'Can filter elements using a predicate function',
    operations: ['filter']
  });

  // Reducible capability (can reduce to a single value)
  registerCapability({
    id: 'reducible',
    name: 'Reducible',
    description: 'Can reduce elements to a single value',
    operations: ['reduce']
  });

  // KeyValueStore capability (can store and retrieve values by key)
  registerCapability({
    id: 'key-value-store',
    name: 'Key-Value Store',
    description: 'Can store and retrieve values by key',
    operations: ['get', 'has', 'set', 'delete']
  });

  // Stack capability (LIFO data structure)
  registerCapability({
    id: 'stack',
    name: 'Stack',
    description: 'Last-in, first-out (LIFO) data structure',
    operations: ['peek', 'push', 'pop']
  });

  // Queue capability (FIFO data structure)
  registerCapability({
    id: 'queue',
    name: 'Queue',
    description: 'First-in, first-out (FIFO) data structure',
    operations: ['peek', 'enqueue', 'dequeue']
  });

  // Sortable capability (can be sorted)
  registerCapability({
    id: 'sortable',
    name: 'Sortable',
    description: 'Can be sorted',
    operations: ['sort', 'isSorted']
  });
}

// Note: We don't automatically register built-in capabilities here
// to avoid duplicate registrations. Call registerBuiltInCapabilities()
// explicitly when needed.
