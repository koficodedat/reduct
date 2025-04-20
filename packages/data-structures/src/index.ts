/**
 * Reduct Data Structures
 *
 * Immutable, functional data structures for modern TypeScript applications.
 *
 * @packageDocumentation
 */

// Export List implementation
export * from './list';
export { default as List } from './list';
export { SmallList, TransientSmallList } from './list/small-list';
export { ChunkedList, TransientChunkedList } from './list/chunked-list';
export { PersistentVector, TransientPersistentVector } from './list/persistent-vector';
export { HAMTPersistentVector } from './list/hamt-persistent-vector';

// Export specialized list implementations
export {
  createNumericList as numericList,
  createStringList as stringList,
  createObjectList as objectList,
  createTypedOptimizedList as specializedList
} from './list/optimized/factory';

// Export optimized list implementations
export { CompactList } from './list/optimized/compact-list';
export { NumericList } from './list/optimized/numeric-list';
export { StringList } from './list/optimized/string-list';
export { NumericOperations, StringOperations } from './list/enhanced';