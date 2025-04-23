/**
 * Algorithm registry
 * 
 * Registers all algorithms that can be benchmarked.
 * 
 * @packageDocumentation
 */

import { Registry } from '../types';

import { searchingRegistry } from './searching';
import { sortingRegistry } from './sorting';

// Combine all algorithm registries
export const algorithmRegistry: Registry = {
  ...sortingRegistry,
  ...searchingRegistry,
};

// Export individual registries
export * from './sorting';
export * from './searching';
