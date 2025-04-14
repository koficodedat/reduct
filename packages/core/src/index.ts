/**
 * Reduct Core - Functional programming utilities
 *
 * This module provides fundamental functional programming primitives
 * that serve as the foundation for the Reduct library.
 *
 * @packageDocumentation
 */

// Re-export all modules
export * from './composition';
export * from './option';
export * from './result';
export * from './curry';
export * from './memoize';
export * from './utility';
export * from './types';
export * from './lazy';

// Export testing utilities
export * as testing from './testing/property';
