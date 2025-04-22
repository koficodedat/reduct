/**
 * WebAssembly accelerators
 */

export * from './accelerator';
export * from './wasm-accelerator';
export * from './data-structures';

// Export tiered optimization components
export { TieredSortAccelerator } from './data-structures/tiered-sort';
export * from './algorithms';

// Export frequency detection components
export * from './frequency-detector';
export * from './frequency-aware-accelerator';
export * from './frequency-aware-accelerator-factory';
export * from './frequency-aware-accelerator-manager';

// Export hybrid components
export * from './hybrid-accelerator';
export * from './hybrid-accelerator-factory';
export * from './hybrid-accelerator-manager';
export * from './data-structures/hybrid-string-accelerator';
