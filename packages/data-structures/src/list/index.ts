/**
 * Enhanced List Implementation
 *
 * An immutable list implementation that adapts its internal representation
 * based on collection size for optimal performance.
 *
 * @packageDocumentation
 */

// Export the enhanced List implementation
export { List, NumericOperations, StringOperations } from './enhanced';

// Export the List interface
export { IList, IListFactory, TransientList, RepresentationType } from './types';

// Export the specialized list implementations
export { 
  createNumericList as numericList,
  createStringList as stringList,
  createObjectList as objectList,
  createTypedOptimizedList as specializedList
} from './optimized/factory';

// Export the optimized list implementations
export { CompactList } from './optimized/compact-list';
export { NumericList } from './optimized/numeric-list';
export { StringList } from './optimized/string-list';

// Export the legacy implementations for backward compatibility
export { SmallList, TransientSmallList } from './small-list';
export { ChunkedList, TransientChunkedList } from './chunked-list';
export { PersistentVector, TransientPersistentVector } from './persistent-vector';
export { HAMTPersistentVector } from './hamt-persistent-vector';

// Set default export to the enhanced List implementation
import { List } from './enhanced';
export default List;
