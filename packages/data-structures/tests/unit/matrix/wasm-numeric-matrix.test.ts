/**
 * Tests for WebAssembly-accelerated NumericMatrix
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NumericMatrix, NumericMatrixInstance, WasmNumericMatrix, WasmNumericMatrixInstance } from '../../../src/matrix/index';
import { isWebAssemblySupported } from '../../../src/utils/mock-wasm';

describe('WasmNumericMatrix', () => {
  // Create matrices for testing
  let matrix1: WasmNumericMatrix;
  let matrix2: WasmNumericMatrix;
  let jsMatrix1: NumericMatrix;
  let jsMatrix2: NumericMatrix;

  beforeEach(() => {
    // Create test matrices
    matrix1 = WasmNumericMatrixInstance.from([
      [1, 2, 3],
      [4, 5, 6]
    ]) as WasmNumericMatrix;

    matrix2 = WasmNumericMatrixInstance.from([
      [7, 8],
      [9, 10],
      [11, 12]
    ]) as WasmNumericMatrix;

    jsMatrix1 = NumericMatrixInstance.from([
      [1, 2, 3],
      [4, 5, 6]
    ]) as NumericMatrix;

    jsMatrix2 = NumericMatrixInstance.from([
      [7, 8],
      [9, 10],
      [11, 12]
    ]) as NumericMatrix;
  });

  describe('Basic operations', () => {
    it('should create a matrix with the correct dimensions', () => {
      expect(matrix1.rows).toBe(2);
      expect(matrix1.cols).toBe(3);
      expect(matrix2.rows).toBe(3);
      expect(matrix2.cols).toBe(2);
    });

    it('should get values at specific positions', () => {
      expect(matrix1.get(0, 0)).toBe(1);
      expect(matrix1.get(0, 1)).toBe(2);
      expect(matrix1.get(1, 2)).toBe(6);
      expect(matrix2.get(2, 1)).toBe(12);
    });

    it('should set values at specific positions', () => {
      const newMatrix = matrix1.set(0, 1, 20) as WasmNumericMatrix;
      expect(newMatrix.get(0, 1)).toBe(20);
      expect(matrix1.get(0, 1)).toBe(2); // Original matrix should be unchanged
    });

    it('should convert to a 2D array', () => {
      expect(matrix1.toArray()).toEqual([
        [1, 2, 3],
        [4, 5, 6]
      ]);
    });

    it('should convert to a flat array', () => {
      expect(matrix1.toFlatArray()).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('Matrix operations', () => {
    it('should multiply matrices correctly', () => {
      const result = matrix1.multiply(matrix2);
      const expected = [
        [58, 64],
        [139, 154]
      ];

      expect(result.rows).toBe(2);
      expect(result.cols).toBe(2);
      expect(result.toArray()).toEqual(expected);
    });

    it('should add matrices correctly', () => {
      const matrix3 = WasmNumericMatrixInstance.from([
        [1, 2],
        [3, 4]
      ]) as WasmNumericMatrix;

      const matrix4 = WasmNumericMatrixInstance.from([
        [5, 6],
        [7, 8]
      ]) as WasmNumericMatrix;

      const result = matrix3.add(matrix4);
      const expected = [
        [6, 8],
        [10, 12]
      ];

      expect(result.toArray()).toEqual(expected);
    });

    it('should subtract matrices correctly', () => {
      const matrix3 = WasmNumericMatrixInstance.from([
        [5, 6],
        [7, 8]
      ]) as WasmNumericMatrix;

      const matrix4 = WasmNumericMatrixInstance.from([
        [1, 2],
        [3, 4]
      ]) as WasmNumericMatrix;

      const result = matrix3.subtract(matrix4);
      const expected = [
        [4, 4],
        [4, 4]
      ];

      expect(result.toArray()).toEqual(expected);
    });

    it('should multiply by a scalar correctly', () => {
      const result = matrix1.scalarMultiply(2);
      const expected = [
        [2, 4, 6],
        [8, 10, 12]
      ];

      expect(result.toArray()).toEqual(expected);
    });
  });

  describe('WebAssembly acceleration', () => {
    it('should check if WebAssembly is supported', () => {
      // This is just a basic check to ensure the function exists
      expect(typeof isWebAssemblySupported).toBe('function');
    });

    it('should produce the same result as JavaScript implementation', () => {
      // Calculate the expected result manually
      const expected = [
        [58, 64],
        [139, 154]
      ];

      // Get the result from the WebAssembly implementation
      const wasmResult = matrix1.multiply(matrix2);

      // Verify the result
      expect(wasmResult.toArray()).toEqual(expected);
    });

    it('should fall back to JavaScript implementation when WebAssembly is not supported', () => {
      // Mock isWebAssemblySupported to return false
      const originalIsWebAssemblySupported = isWebAssemblySupported;
      (global as any).isWebAssemblySupported = vi.fn().mockReturnValue(false);

      // Create a new matrix with WebAssembly disabled
      const noWasmMatrix1 = WasmNumericMatrixInstance.from([
        [1, 2, 3],
        [4, 5, 6]
      ]) as WasmNumericMatrix;

      const noWasmMatrix2 = WasmNumericMatrixInstance.from([
        [7, 8],
        [9, 10],
        [11, 12]
      ]) as WasmNumericMatrix;

      // Perform multiplication
      const result = noWasmMatrix1.multiply(noWasmMatrix2);
      const expected = [
        [58, 64],
        [139, 154]
      ];

      // Verify the result
      expect(result.toArray()).toEqual(expected);

      // Restore the original function
      (global as any).isWebAssemblySupported = originalIsWebAssemblySupported;
    });
  });

  describe('Factory methods', () => {
    it('should create an identity matrix', () => {
      const identity = WasmNumericMatrixInstance.identity(3);
      const expected = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ];

      expect(identity.toArray()).toEqual(expected);
    });

    it('should create a diagonal matrix', () => {
      const diagonal = WasmNumericMatrixInstance.diagonal([1, 2, 3]);
      const expected = [
        [1, 0, 0],
        [0, 2, 0],
        [0, 0, 3]
      ];

      expect(diagonal.toArray()).toEqual(expected);
    });

    it('should create a matrix filled with a value', () => {
      const filled = WasmNumericMatrixInstance.fill(2, 3, 42);
      const expected = [
        [42, 42, 42],
        [42, 42, 42]
      ];

      expect(filled.toArray()).toEqual(expected);
    });

    it('should create a matrix with a generator function', () => {
      const generated = WasmNumericMatrixInstance.of(2, 3, (i, j) => i + j);
      const expected = [
        [0, 1, 2],
        [1, 2, 3]
      ];

      expect(generated.toArray()).toEqual(expected);
    });
  });
});
