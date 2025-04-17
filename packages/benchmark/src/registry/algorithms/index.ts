/**
 * Algorithm registry
 * 
 * Registers all algorithms that can be benchmarked.
 * 
 * @packageDocumentation
 */

import { Registry } from '../types';
import { sortingRegistry } from './sorting';
import { searchingRegistry } from './searching';

// Combine all algorithm registries
export const algorithmRegistry: Registry = {
  ...sortingRegistry,
  ...searchingRegistry,
};

// Export individual registries
export * from './sorting';
export * from './searching';
