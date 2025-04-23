/**
 * Capabilities Setup
 *
 * Sets up capabilities for the registered implementations.
 *
 * @packageDocumentation
 */

import { registerBuiltInCapabilities } from '../comparison/capabilities';

import { updateImplementationCapabilities, updateOperationRequiredCapabilities, registerOperation } from './index';

/**
 * Registers capabilities for all implementations
 */
export function setupCapabilities(): void {
  // Register built-in capabilities
  registerBuiltInCapabilities();
  // Register capabilities for data structures
  updateImplementationCapabilities('reduct-list', ['sequence', 'mappable', 'filterable', 'reducible']);
  updateImplementationCapabilities('native-array', ['sequence', 'mappable', 'filterable', 'reducible']);
  updateImplementationCapabilities('reduct-map', ['key-value-store']);
  updateImplementationCapabilities('native-map', ['key-value-store']);
  updateImplementationCapabilities('plain-object', ['key-value-store']);
  updateImplementationCapabilities('reduct-stack', ['stack', 'mappable', 'filterable']);
  updateImplementationCapabilities('native-array-stack', ['stack', 'mappable', 'filterable']);

  // Register operations if they don't exist
  registerOperation('get', { name: 'Get', category: 'data-structure', description: 'Get an element by index or key' });
  registerOperation('map', { name: 'Map', category: 'data-structure', description: 'Transform elements' });
  registerOperation('filter', { name: 'Filter', category: 'data-structure', description: 'Filter elements' });
  registerOperation('reduce', { name: 'Reduce', category: 'data-structure', description: 'Reduce to a single value' });
  registerOperation('has', { name: 'Has', category: 'data-structure', description: 'Check if a key exists' });
  registerOperation('set', { name: 'Set', category: 'data-structure', description: 'Set a value' });
  registerOperation('delete', { name: 'Delete', category: 'data-structure', description: 'Delete a value' });
  registerOperation('push', { name: 'Push', category: 'data-structure', description: 'Add to the top of a stack' });
  registerOperation('pop', { name: 'Pop', category: 'data-structure', description: 'Remove from the top of a stack' });
  registerOperation('peek', { name: 'Peek', category: 'data-structure', description: 'Look at the top of a stack' });

  // Register required capabilities for operations
  updateOperationRequiredCapabilities('get', ['sequence']);
  updateOperationRequiredCapabilities('map', ['mappable']);
  updateOperationRequiredCapabilities('filter', ['filterable']);
  updateOperationRequiredCapabilities('reduce', ['reducible']);
  updateOperationRequiredCapabilities('has', ['key-value-store']);
  updateOperationRequiredCapabilities('set', ['key-value-store']);
  updateOperationRequiredCapabilities('delete', ['key-value-store']);
  updateOperationRequiredCapabilities('push', ['stack']);
  updateOperationRequiredCapabilities('pop', ['stack']);
  updateOperationRequiredCapabilities('peek', ['stack']);
}
