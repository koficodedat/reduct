/**
 * Reduct Data Structures
 *
 * Immutable, functional data structures for modern TypeScript applications.
 *
 * @packageDocumentation
 */

// Export original implementations
export * from './list';
export * from './stack';
export * from './map';

// Export optimized implementations
export { OptimizedList } from './optimized/list';
export { PersistentVector } from './optimized/persistent-vector';
