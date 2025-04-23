/**
 * Data structure registry
 * 
 * Registers all data structures that can be benchmarked.
 * 
 * @packageDocumentation
 */

import { Registry } from '../types';

import { listRegistry } from './list';
import { mapRegistry } from './map';
import { stackRegistry } from './stack';

// Combine all data structure registries
export const dataStructureRegistry: Registry = {
  ...listRegistry,
  ...mapRegistry,
  ...stackRegistry,
};

// Export individual registries
export * from './list';
export * from './map';
export * from './stack';
