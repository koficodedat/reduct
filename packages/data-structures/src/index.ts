/**
 * Reduct Data Structures
 *
 * Immutable, functional data structures for modern TypeScript applications.
 *
 * @packageDocumentation
 */

// Import and re-export List implementation
import { default as List } from './list';
export { List };

// Export list interfaces and types
export { IList, IListFactory, TransientList } from './list/types';

// Export type detection utilities
export { detectDataType, isNumericArray, isStringArray, isObjectArray } from './list/type-detection';

// Export data type from shared types
export { DataType, RepresentationType } from '@reduct/shared-types/data-structures';

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
export { WasmNumericList } from './list/optimized/wasm-numeric-list';
export { StringList } from './list/optimized/string-list';
// Export operations (already exported from './list')

// Export persistent vector implementations
export { HAMTPersistentVector } from './list/hamt-persistent-vector';
export { WasmHAMTPersistentVector } from './list/wasm-hamt-persistent-vector';
export { EnhancedHAMTPersistentVector } from './list/enhanced-hamt-persistent-vector';
export { WasmEnhancedHAMTPersistentVector } from './list/wasm-enhanced-hamt-persistent-vector';

// Export Matrix implementation
export * from './matrix';

// Export Signal Processing implementation
export * from './signal';

// Export WebAssembly utilities
export { isWebAssemblySupported } from './utils/mock-wasm';
