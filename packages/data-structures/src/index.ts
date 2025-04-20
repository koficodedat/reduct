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
  numericList,
  stringList,
  objectList,
  specializedList
} from './list';