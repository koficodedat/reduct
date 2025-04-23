/**
 * WebAssembly accelerators
 *
 * @packageDocumentation
 */

// Local exports from the same package

// Core accelerator components
export * from './accelerator';
export * from './wasm-accelerator';

// Data structure accelerators
export * from './data-structures';
export { TieredSortAccelerator } from './data-structures/tiered-sort';
export * from './data-structures/hybrid-string-accelerator';

// Algorithm accelerators
export * from './algorithms';

// Frequency detection components
export * from './frequency-detector';
export * from './frequency-aware-accelerator';
export * from './frequency-aware-accelerator-factory';
export * from './frequency-aware-accelerator-manager';

// Hybrid components
export * from './hybrid-accelerator';
export * from './hybrid-accelerator-factory';
export * from './hybrid-accelerator-manager';
