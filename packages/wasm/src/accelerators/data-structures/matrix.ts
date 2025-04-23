/**
 * WebAssembly accelerator for matrix operations
 *
 * Provides WebAssembly-accelerated implementations of common matrix operations.
 */

import { safeWasmOperation } from '../../core/error-handling';
import { getWasmModule as _getWasmModule } from '../../core/wasm-module';
import { Accelerator, AcceleratorOptions, AcceleratorTier } from '../accelerator';

/**
 * Input for matrix multiplication
 */
export interface MatrixMultiplyInput {
  /** The first matrix as a flat array (row-major order) */
  a: number[];
  /** The second matrix as a flat array (row-major order) */
  b: number[];
  /** The number of rows in the first matrix */
  aRows: number;
  /** The number of columns in the first matrix */
  aCols: number;
  /** The number of rows in the second matrix */
  bRows: number;
  /** The number of columns in the second matrix */
  bCols: number;
}

/**
 * Matrix accelerator
 *
 * Provides WebAssembly-accelerated implementations of common matrix operations.
 */
export class MatrixAccelerator extends Accelerator<any, any> {
  constructor(options?: AcceleratorOptions) {
    super('data-structures', 'matrix', 'operations', options);
  }

  /**
   * Multiply two matrices
   *
   * @param input The input matrices and dimensions
   * @returns The result matrix as a flat array (row-major order)
   */
  public multiply(input: MatrixMultiplyInput): number[] {
    // Determine the appropriate tier for the input
    const tier = this.determineTier(input);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.multiplyJs(input);
    } else {
      return this.multiplyWasm(input);
    }
  }

  /**
   * Multiply two matrices using WebAssembly
   *
   * @param input The input matrices and dimensions
   * @returns The result matrix as a flat array (row-major order)
   */
  private multiplyWasm(input: MatrixMultiplyInput): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.multiplyJs(input);
    }

    return safeWasmOperation(() => {
      try {
        // Check if the matrices have compatible dimensions
        if (input.aCols !== input.bRows) {
          throw new Error(`Matrix dimensions incompatible for multiplication: (${input.aRows}, ${input.aCols}) * (${input.bRows}, ${input.bCols})`);
        }

        // Convert to Float64Array for better performance
        const aTypedArray = new Float64Array(input.a);
        const bTypedArray = new Float64Array(input.b);

        // Call the WebAssembly implementation
        const result = module.matrix_multiply_f64(
          aTypedArray,
          bTypedArray,
          input.aRows,
          input.aCols,
          input.bRows,
          input.bCols
        );

        // Convert the result back to a regular array
        return Array.from(new Float64Array(result));
      } catch (error) {
        // Fall back to native implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this.multiplyJs(input);
      }
    });
  }

  /**
   * Multiply two matrices using JavaScript
   *
   * @param input The input matrices and dimensions
   * @returns The result matrix as a flat array (row-major order)
   */
  private multiplyJs(input: MatrixMultiplyInput): number[] {
    const { a, b, aRows, aCols, bRows, bCols } = input;

    // Check if the matrices have compatible dimensions
    if (aCols !== bRows) {
      throw new Error(`Matrix dimensions incompatible for multiplication: (${aRows}, ${aCols}) * (${bRows}, ${bCols})`);
    }

    // Create the result matrix
    const result = new Array(aRows * bCols).fill(0);

    // Perform matrix multiplication
    for (let i = 0; i < aRows; i++) {
      for (let j = 0; j < bCols; j++) {
        let sum = 0;
        for (let k = 0; k < aCols; k++) {
          sum += a[i * aCols + k] * b[k * bCols + j];
        }
        result[i * bCols + j] = sum;
      }
    }

    return result;
  }

  /**
   * Determine the appropriate tier for the input
   *
   * @param input The input matrices and dimensions
   * @returns The appropriate tier
   */
  protected override determineTier(input: MatrixMultiplyInput): AcceleratorTier {
    // Use the tiering strategy if provided
    if (this.options?.tiering) {
      return super.determineTier(input);
    }

    // Default tiering strategy based on matrix size
    const { aRows, aCols, bCols } = input;
    const resultSize = aRows * bCols;
    const computeComplexity = aRows * aCols * bCols;

    // Always use WebAssembly for large matrices
    if (resultSize >= 2500 || computeComplexity >= 125000) { // 50x50 or equivalent
      return AcceleratorTier.HIGH_VALUE;
    }

    // Use WebAssembly conditionally for medium-sized matrices
    if (resultSize >= 100 || computeComplexity >= 1000) { // 10x10 or equivalent
      return AcceleratorTier.CONDITIONAL;
    }

    // Use JavaScript for small matrices
    return AcceleratorTier.JS_PREFERRED;
  }
}
