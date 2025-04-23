/**
 * Operation Adapters
 *
 * Provides a system for adapting different implementations to a common
 * interface for benchmarking.
 *
 * @packageDocumentation
 */

import {
  registryImplementationAdapterFactory,
} from './factory';
import {
  exactMatcher,
  categoryMatcher,
  tagMatcher,
  accessModificationMatcher,
} from './matchers';
import {
  registerAdapter,
  registerAdapterFactory,
  registerOperationMatcher,
  getAdapter,
  getAllAdapters,
  getAllAdapterFactories,
  getAllOperationMatchers,
  areOperationsCompatible,
  findCommonAdapterOperations,
} from './registry';



// Register default matchers
registerOperationMatcher(exactMatcher);
registerOperationMatcher(categoryMatcher);
registerOperationMatcher(tagMatcher);
registerOperationMatcher(accessModificationMatcher);

// Register default factories
registerAdapterFactory(registryImplementationAdapterFactory);

// Export registry functions
export {
  registerAdapter,
  registerAdapterFactory,
  registerOperationMatcher,
  getAdapter,
  getAllAdapters,
  getAllAdapterFactories,
  getAllOperationMatchers,
  areOperationsCompatible,
  findCommonAdapterOperations,
};

// Export types
export * from './types';

// Export matchers
export {
  exactMatcher,
  categoryMatcher,
  tagMatcher,
  accessModificationMatcher,
};

// Export factories
export {
  registryImplementationAdapterFactory,
};
