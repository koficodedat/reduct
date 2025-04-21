/**
 * Matrix module
 *
 * Exports matrix implementations.
 *
 * @packageDocumentation
 */

export * from './types';
export { Matrix, MatrixFactoryInstance } from './matrix';
export { NumericMatrix, NumericMatrixFactory, NumericMatrixInstance } from './numeric-matrix';
export { WasmNumericMatrix, WasmNumericMatrixFactory, WasmNumericMatrixInstance } from './wasm-numeric-matrix';
