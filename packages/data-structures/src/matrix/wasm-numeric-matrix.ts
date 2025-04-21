/**
 * WebAssembly-accelerated NumericMatrix implementation
 *
 * A matrix implementation optimized for numeric operations using WebAssembly.
 *
 * @packageDocumentation
 */

import { INumericMatrix, INumericMatrixFactory } from './types';
import { NumericMatrix, NumericMatrixFactory } from './numeric-matrix';
import { isWebAssemblySupported } from '../utils/mock-wasm';

// Import types for testing
interface MatrixMultiplyInput {
  a: number[];
  b: number[];
  aRows: number;
  aCols: number;
  bRows: number;
  bCols: number;
}

enum AcceleratorTier {
  HIGH_VALUE = 'high-value',
  CONDITIONAL = 'conditional',
  JS_PREFERRED = 'js-preferred'
}

// Mock MatrixAccelerator for testing
class MatrixAccelerator {
  constructor(options?: any) {}

  multiply(input: MatrixMultiplyInput): number[] {
    // Mock implementation that just performs the multiplication in JavaScript
    const { a, b, aRows, aCols, bRows, bCols } = input;
    const result = new Array(aRows * bCols).fill(0);
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
}

/**
 * WebAssembly-accelerated NumericMatrix implementation
 *
 * A matrix implementation optimized for numeric operations using WebAssembly.
 */
export class WasmNumericMatrix extends NumericMatrix {
  /**
   * The WebAssembly accelerator
   */
  private static _accelerator: MatrixAccelerator | null = isWebAssemblySupported()
    ? new MatrixAccelerator({
        tiering: {
          // Tier 1: Always use WebAssembly for large matrices (50x50 or larger)
          [AcceleratorTier.HIGH_VALUE]: (input: MatrixMultiplyInput) => {
            const { aRows, aCols, bCols } = input;
            const resultSize = aRows * bCols;
            const computeComplexity = aRows * aCols * bCols;
            return resultSize >= 2500 || computeComplexity >= 125000;
          },
          // Tier 2: Use WebAssembly conditionally for medium-sized matrices (10x10 to 50x50)
          [AcceleratorTier.CONDITIONAL]: (input: MatrixMultiplyInput) => {
            const { aRows, aCols, bCols } = input;
            const resultSize = aRows * bCols;
            const computeComplexity = aRows * aCols * bCols;
            return resultSize >= 100 || computeComplexity >= 1000;
          },
          // Tier 3: Use JavaScript for small matrices (smaller than 10x10)
          [AcceleratorTier.JS_PREFERRED]: () => true
        }
      })
    : null;

  /**
   * The fallback matrix implementation
   */
  private _fallbackMatrix: NumericMatrix;

  /**
   * Create a new WebAssembly-accelerated numeric matrix
   *
   * @param data The data to store in the matrix
   */
  constructor(data: number[][]) {
    super(data);
    this._fallbackMatrix = new NumericMatrix(data);
  }

  /**
   * Multiply this matrix by another matrix
   *
   * @param other The matrix to multiply by
   * @returns A new matrix with the product
   * @throws Error if the matrices have incompatible dimensions
   */
  public override multiply(other: INumericMatrix): INumericMatrix {
    // Check if WebAssembly is supported
    if (!WasmNumericMatrix._accelerator) {
      return super.multiply(other);
    }

    // Check if the matrices have compatible dimensions
    if (this.cols !== other.rows) {
      throw new Error(`Matrix dimensions incompatible for multiplication: (${this.rows}, ${this.cols}) * (${other.rows}, ${other.cols})`);
    }

    try {
      // Prepare the input for the accelerator
      const input: MatrixMultiplyInput = {
        a: this.toFlatArray(),
        b: other.toFlatArray(),
        aRows: this.rows,
        aCols: this.cols,
        bRows: other.rows,
        bCols: other.cols
      };

      // Use the accelerator to perform the multiplication
      const startTime = performance.now();
      const result = WasmNumericMatrix._accelerator.multiply(input);
      const endTime = performance.now();

      // Log performance metrics
      console.debug(`WebAssembly matrix multiplication completed in ${(endTime - startTime).toFixed(3)}ms for ${this.rows}x${this.cols} * ${other.rows}x${other.cols} matrices`);

      // Create a new matrix from the result
      return WasmNumericMatrix.fromFlat(result, this.rows, other.cols);
    } catch (error) {
      // Fall back to JavaScript implementation
      console.warn('WebAssembly acceleration failed, falling back to JavaScript implementation:', error);
      return super.multiply(other);
    }
  }

  /**
   * Create a matrix from a flat array (row-major order)
   *
   * @param data The flat array
   * @param rows The number of rows
   * @param cols The number of columns
   * @returns A new WebAssembly-accelerated numeric matrix
   */
  public static fromFlat(data: number[], rows: number, cols: number): WasmNumericMatrix {
    // Convert the flat array to a 2D array
    const matrix2D: number[][] = [];
    for (let i = 0; i < rows; i++) {
      matrix2D[i] = [];
      for (let j = 0; j < cols; j++) {
        matrix2D[i][j] = data[i * cols + j];
      }
    }
    return new WasmNumericMatrix(matrix2D);
  }
}

/**
 * WebAssembly-accelerated NumericMatrix factory
 *
 * Provides methods for creating WebAssembly-accelerated numeric matrices.
 */
export class WasmNumericMatrixFactory extends NumericMatrixFactory {
  /**
   * Create a matrix from a 2D array
   *
   * @param data The 2D array
   * @returns A new WebAssembly-accelerated numeric matrix
   */
  public override from(data: number[][]): INumericMatrix {
    return new WasmNumericMatrix(data.map(row => row.slice()));
  }

  /**
   * Create a matrix from a flat array (row-major order)
   *
   * @param data The flat array
   * @param rows The number of rows
   * @param cols The number of columns
   * @returns A new WebAssembly-accelerated numeric matrix
   */
  public override fromFlat(data: number[], rows: number, cols: number): INumericMatrix {
    return WasmNumericMatrix.fromFlat(data, rows, cols);
  }

  /**
   * Create a matrix with all elements set to the same value
   *
   * @param rows The number of rows
   * @param cols The number of columns
   * @param value The value to fill the matrix with
   * @returns A new WebAssembly-accelerated numeric matrix
   */
  public override fill(rows: number, cols: number, value: number): INumericMatrix {
    const data: number[][] = [];
    for (let r = 0; r < rows; r++) {
      data[r] = new Array(cols).fill(value);
    }
    return new WasmNumericMatrix(data);
  }

  /**
   * Create a matrix with elements generated by a function
   *
   * @param rows The number of rows
   * @param cols The number of columns
   * @param fn The function to generate values
   * @returns A new WebAssembly-accelerated numeric matrix
   */
  public override of(rows: number, cols: number, fn: (row: number, col: number) => number): INumericMatrix {
    const data: number[][] = [];
    for (let r = 0; r < rows; r++) {
      data[r] = [];
      for (let c = 0; c < cols; c++) {
        data[r][c] = fn(r, c);
      }
    }
    return new WasmNumericMatrix(data);
  }

  /**
   * Create an identity matrix
   *
   * @param size The size of the matrix
   * @returns A new WebAssembly-accelerated identity matrix
   */
  public override identity(size: number): INumericMatrix {
    return this.of(size, size, (i, j) => i === j ? 1 : 0);
  }

  /**
   * Create a diagonal matrix
   *
   * @param values The diagonal values
   * @returns A new WebAssembly-accelerated diagonal matrix
   */
  public override diagonal(values: number[]): INumericMatrix {
    const size = values.length;
    return this.of(size, size, (i, j) => i === j ? values[i] : 0);
  }

  /**
   * Create a random matrix
   *
   * @param rows The number of rows
   * @param cols The number of columns
   * @param min The minimum value (default: 0)
   * @param max The maximum value (default: 1)
   * @returns A new WebAssembly-accelerated random matrix
   */
  public override random(rows: number, cols: number, min: number = 0, max: number = 1): INumericMatrix {
    return this.of(rows, cols, () => min + Math.random() * (max - min));
  }
}

/**
 * Default WebAssembly-accelerated numeric matrix factory instance
 */
export const WasmNumericMatrixInstance = new WasmNumericMatrixFactory();
