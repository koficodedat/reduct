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
export { IList, IListFactory, TransientList } from './types';
export { RepresentationType } from '@reduct/shared-types/data-structures';

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

// Legacy implementations have been archived
// They are no longer exported to encourage use of the enhanced implementations

// Set default export to the enhanced List implementation
import { List } from './enhanced';
export default List;
