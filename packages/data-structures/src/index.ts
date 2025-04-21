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
export { NumericOperations, StringOperations } from './list/enhanced';

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
