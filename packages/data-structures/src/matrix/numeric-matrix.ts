/**
 * NumericMatrix implementation
 *
 * A matrix implementation optimized for numeric operations.
 *
 * @packageDocumentation
 */

import { INumericMatrix, INumericMatrixFactory } from './types';
import { Matrix, MatrixFactory } from './matrix';

/**
 * NumericMatrix implementation
 *
 * A matrix implementation optimized for numeric operations.
 */
export class NumericMatrix extends Matrix<number> implements INumericMatrix {
  /**
   * Add another matrix to this matrix
   *
   * @param other The matrix to add
   * @returns A new matrix with the sum
   * @throws Error if the matrices have different dimensions
   */
  public add(other: INumericMatrix): INumericMatrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error(`Matrix dimensions mismatch: (${this.rows}, ${this.cols}) + (${other.rows}, ${other.cols})`);
    }

    const result = this.map((value, row, col) => {
      const otherValue = other.get(row, col);
      return value + (otherValue !== undefined ? otherValue : 0);
    });

    return result as INumericMatrix;
  }

  /**
   * Subtract another matrix from this matrix
   *
   * @param other The matrix to subtract
   * @returns A new matrix with the difference
   * @throws Error if the matrices have different dimensions
   */
  public subtract(other: INumericMatrix): INumericMatrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error(`Matrix dimensions mismatch: (${this.rows}, ${this.cols}) - (${other.rows}, ${other.cols})`);
    }

    const result = this.map((value, row, col) => {
      const otherValue = other.get(row, col);
      return value - (otherValue !== undefined ? otherValue : 0);
    });

    return result as INumericMatrix;
  }

  /**
   * Multiply this matrix by another matrix
   *
   * @param other The matrix to multiply by
   * @returns A new matrix with the product
   * @throws Error if the matrices have incompatible dimensions
   */
  public multiply(other: INumericMatrix): INumericMatrix {
    if (this.cols !== other.rows) {
      throw new Error(`Matrix dimensions incompatible for multiplication: (${this.rows}, ${this.cols}) * (${other.rows}, ${other.cols})`);
    }

    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [];
      for (let j = 0; j < other.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) {
          const a = this.get(i, k);
          const b = other.get(k, j);
          if (a !== undefined && b !== undefined) {
            sum += a * b;
          }
        }
        result[i][j] = sum;
      }
    }

    return new NumericMatrix(result);
  }

  /**
   * Multiply this matrix by a scalar
   *
   * @param scalar The scalar to multiply by
   * @returns A new matrix with the product
   */
  public scalarMultiply(scalar: number): INumericMatrix {
    const result = this.map(value => value * scalar);
    return result as INumericMatrix;
  }

  /**
   * Calculate the determinant of this matrix
   *
   * @returns The determinant
   * @throws Error if the matrix is not square
   */
  public determinant(): number {
    if (this.rows !== this.cols) {
      throw new Error(`Cannot calculate determinant of non-square matrix: (${this.rows}, ${this.cols})`);
    }

    // For 1x1 matrix
    if (this.rows === 1) {
      return this.get(0, 0) ?? 0;
    }

    // For 2x2 matrix
    if (this.rows === 2) {
      const a = this.get(0, 0) ?? 0;
      const b = this.get(0, 1) ?? 0;
      const c = this.get(1, 0) ?? 0;
      const d = this.get(1, 1) ?? 0;
      return a * d - b * c;
    }

    // For larger matrices, use cofactor expansion
    let det = 0;
    for (let j = 0; j < this.cols; j++) {
      det += (j % 2 === 0 ? 1 : -1) * (this.get(0, j) ?? 0) * this.minor(0, j).determinant();
    }
    return det;
  }

  /**
   * Calculate the minor of this matrix
   *
   * @param row The row to exclude
   * @param col The column to exclude
   * @returns The minor matrix
   */
  private minor(row: number, col: number): INumericMatrix {
    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      if (i === row) continue;
      const newRow: number[] = [];
      for (let j = 0; j < this.cols; j++) {
        if (j === col) continue;
        newRow.push(this.get(i, j) ?? 0);
      }
      result.push(newRow);
    }
    return new NumericMatrix(result);
  }

  /**
   * Calculate the inverse of this matrix
   *
   * @returns A new matrix with the inverse
   * @throws Error if the matrix is not square or is singular
   */
  public inverse(): INumericMatrix {
    if (this.rows !== this.cols) {
      throw new Error(`Cannot calculate inverse of non-square matrix: (${this.rows}, ${this.cols})`);
    }

    const det = this.determinant();
    if (Math.abs(det) < 1e-10) {
      throw new Error('Cannot calculate inverse of singular matrix');
    }

    // For 1x1 matrix
    if (this.rows === 1) {
      return new NumericMatrix([[1 / (this.get(0, 0) ?? 0)]]);
    }

    // For 2x2 matrix
    if (this.rows === 2) {
      const a = this.get(0, 0) ?? 0;
      const b = this.get(0, 1) ?? 0;
      const c = this.get(1, 0) ?? 0;
      const d = this.get(1, 1) ?? 0;
      return new NumericMatrix([
        [d / det, -b / det],
        [-c / det, a / det]
      ]);
    }

    // For larger matrices, use adjugate matrix
    const cofactors: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      cofactors[i] = [];
      for (let j = 0; j < this.cols; j++) {
        const sign = (i + j) % 2 === 0 ? 1 : -1;
        cofactors[i][j] = sign * this.minor(i, j).determinant();
      }
    }

    // Transpose the cofactor matrix to get the adjugate
    const adjugate = new NumericMatrix(cofactors).transpose();

    // Divide the adjugate by the determinant
    return adjugate.scalarMultiply(1 / det);
  }

  /**
   * Calculate the trace of this matrix (sum of diagonal elements)
   *
   * @returns The trace
   * @throws Error if the matrix is not square
   */
  public trace(): number {
    if (this.rows !== this.cols) {
      throw new Error(`Cannot calculate trace of non-square matrix: (${this.rows}, ${this.cols})`);
    }

    let sum = 0;
    for (let i = 0; i < this.rows; i++) {
      sum += this.get(i, i) ?? 0;
    }
    return sum;
  }

  /**
   * Calculate the rank of this matrix
   *
   * @returns The rank
   */
  public rank(): number {
    // Implement Gaussian elimination to calculate rank
    const m = this.rows;
    const n = this.cols;
    const A = this.toArray();
    let rank = 0;
    const rowsUsed: boolean[] = new Array(m).fill(false);

    for (let j = 0; j < n; j++) {
      let i;
      for (i = 0; i < m; i++) {
        if (!rowsUsed[i] && Math.abs(A[i][j]) > 1e-10) {
          break;
        }
      }

      if (i < m) {
        rank++;
        rowsUsed[i] = true;
        for (let p = i + 1; p < m; p++) {
          if (Math.abs(A[p][j]) > 1e-10) {
            const factor = A[p][j] / A[i][j];
            for (let q = j; q < n; q++) {
              A[p][q] -= factor * A[i][q];
            }
          }
        }
      }
    }

    return rank;
  }

  /**
   * Calculate the eigenvalues of this matrix
   *
   * @returns The eigenvalues
   * @throws Error if the matrix is not square
   */
  public eigenvalues(): number[] {
    if (this.rows !== this.cols) {
      throw new Error(`Cannot calculate eigenvalues of non-square matrix: (${this.rows}, ${this.cols})`);
    }

    // For 1x1 matrix
    if (this.rows === 1) {
      return [this.get(0, 0) ?? 0];
    }

    // For 2x2 matrix
    if (this.rows === 2) {
      const a = this.get(0, 0) ?? 0;
      const b = this.get(0, 1) ?? 0;
      const c = this.get(1, 0) ?? 0;
      const d = this.get(1, 1) ?? 0;
      const trace = a + d;
      const det = a * d - b * c;
      const discriminant = trace * trace - 4 * det;
      if (discriminant < 0) {
        // Complex eigenvalues
        const real = trace / 2;
        const imag = Math.sqrt(-discriminant) / 2;
        return [real, real]; // Return only real parts for now
      } else {
        const lambda1 = (trace + Math.sqrt(discriminant)) / 2;
        const lambda2 = (trace - Math.sqrt(discriminant)) / 2;
        return [lambda1, lambda2];
      }
    }

    // For larger matrices, we would need to implement more sophisticated algorithms
    // like QR algorithm, but for now we'll throw an error
    throw new Error('Eigenvalue calculation for matrices larger than 2x2 is not implemented');
  }

  /**
   * Calculate the eigenvectors of this matrix
   *
   * @returns The eigenvectors as columns of a matrix
   * @throws Error if the matrix is not square
   */
  public eigenvectors(): INumericMatrix {
    if (this.rows !== this.cols) {
      throw new Error(`Cannot calculate eigenvectors of non-square matrix: (${this.rows}, ${this.cols})`);
    }

    // For 1x1 matrix
    if (this.rows === 1) {
      return new NumericMatrix([[1]]);
    }

    // For 2x2 matrix
    if (this.rows === 2) {
      const eigenvalues = this.eigenvalues();
      const eigenvectors: number[][] = [[], []];

      for (let i = 0; i < eigenvalues.length; i++) {
        const lambda = eigenvalues[i];
        const a = this.get(0, 0) ?? 0;
        const b = this.get(0, 1) ?? 0;
        const c = this.get(1, 0) ?? 0;
        const d = this.get(1, 1) ?? 0;

        // Solve (A - lambda*I)v = 0
        const a11 = a - lambda;
        const a22 = d - lambda;

        // Try to find a non-zero eigenvector
        if (Math.abs(a11) > Math.abs(a22)) {
          // Use the first row
          if (Math.abs(b) > 1e-10) {
            eigenvectors[0][i] = -b;
            eigenvectors[1][i] = a11;
          } else {
            eigenvectors[0][i] = 1;
            eigenvectors[1][i] = 0;
          }
        } else {
          // Use the second row
          if (Math.abs(c) > 1e-10) {
            eigenvectors[0][i] = a22;
            eigenvectors[1][i] = -c;
          } else {
            eigenvectors[0][i] = 0;
            eigenvectors[1][i] = 1;
          }
        }

        // Normalize the eigenvector
        const norm = Math.sqrt(eigenvectors[0][i] * eigenvectors[0][i] + eigenvectors[1][i] * eigenvectors[1][i]);
        eigenvectors[0][i] /= norm;
        eigenvectors[1][i] /= norm;
      }

      return new NumericMatrix(eigenvectors);
    }

    // For larger matrices, we would need to implement more sophisticated algorithms
    // but for now we'll throw an error
    throw new Error('Eigenvector calculation for matrices larger than 2x2 is not implemented');
  }

  /**
   * Calculate the singular value decomposition (SVD) of this matrix
   *
   * @returns An object containing the U, S, and V matrices
   */
  public svd(): { U: INumericMatrix; S: INumericMatrix; V: INumericMatrix } {
    // For now, we'll throw an error as SVD is complex to implement
    throw new Error('SVD calculation is not implemented');
  }

  /**
   * Calculate the LU decomposition of this matrix
   *
   * @returns An object containing the L and U matrices
   * @throws Error if the matrix is not square
   */
  public lu(): { L: INumericMatrix; U: INumericMatrix } {
    if (this.rows !== this.cols) {
      throw new Error(`Cannot calculate LU decomposition of non-square matrix: (${this.rows}, ${this.cols})`);
    }

    const n = this.rows;
    const L: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    const U: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    const A = this.toArray();

    // Initialize L with 1s on the diagonal
    for (let i = 0; i < n; i++) {
      L[i][i] = 1;
    }

    // Perform LU decomposition
    for (let j = 0; j < n; j++) {
      // Upper triangular matrix
      for (let i = 0; i <= j; i++) {
        let sum = 0;
        for (let k = 0; k < i; k++) {
          sum += L[i][k] * U[k][j];
        }
        U[i][j] = A[i][j] - sum;
      }

      // Lower triangular matrix
      for (let i = j + 1; i < n; i++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * U[k][j];
        }
        if (Math.abs(U[j][j]) < 1e-10) {
          throw new Error('LU decomposition failed: matrix is singular');
        }
        L[i][j] = (A[i][j] - sum) / U[j][j];
      }
    }

    return {
      L: new NumericMatrix(L),
      U: new NumericMatrix(U)
    };
  }

  /**
   * Calculate the QR decomposition of this matrix
   *
   * @returns An object containing the Q and R matrices
   */
  public qr(): { Q: INumericMatrix; R: INumericMatrix } {
    // For now, we'll throw an error as QR decomposition is complex to implement
    throw new Error('QR decomposition is not implemented');
  }

  /**
   * Calculate the Cholesky decomposition of this matrix
   *
   * @returns The Cholesky decomposition
   * @throws Error if the matrix is not positive definite
   */
  public cholesky(): INumericMatrix {
    if (this.rows !== this.cols) {
      throw new Error(`Cannot calculate Cholesky decomposition of non-square matrix: (${this.rows}, ${this.cols})`);
    }

    const n = this.rows;
    const L: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    const A = this.toArray();

    // Perform Cholesky decomposition
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k];
        }

        if (i === j) {
          const value = A[i][i] - sum;
          if (value <= 0) {
            throw new Error('Cholesky decomposition failed: matrix is not positive definite');
          }
          L[i][j] = Math.sqrt(value);
        } else {
          L[i][j] = (A[i][j] - sum) / L[j][j];
        }
      }
    }

    return new NumericMatrix(L);
  }

  /**
   * Solve the linear system Ax = b
   *
   * @param b The right-hand side vector or matrix
   * @returns The solution vector or matrix
   * @throws Error if the matrix is singular or dimensions are incompatible
   */
  public solve(b: INumericMatrix): INumericMatrix {
    if (this.rows !== this.cols) {
      throw new Error(`Cannot solve with non-square matrix: (${this.rows}, ${this.cols})`);
    }

    if (this.rows !== b.rows) {
      throw new Error(`Matrix dimensions incompatible for solving: (${this.rows}, ${this.cols}) and (${b.rows}, ${b.cols})`);
    }

    // For now, we'll use the inverse method, which is not the most efficient
    // but is simple to implement
    return this.inverse().multiply(b);
  }

  /**
   * Calculate the condition number of this matrix
   *
   * @returns The condition number
   */
  public conditionNumber(): number {
    // For now, we'll throw an error as condition number calculation requires SVD
    throw new Error('Condition number calculation is not implemented');
  }

  /**
   * Calculate the norm of this matrix
   *
   * @param p The norm type (1, 2, or Infinity)
   * @returns The norm
   */
  public norm(p: 1 | 2 | Infinity = 2): number {
    if (p === 1) {
      // Column sum norm
      let maxSum = 0;
      for (let j = 0; j < this.cols; j++) {
        let sum = 0;
        for (let i = 0; i < this.rows; i++) {
          sum += Math.abs(this.get(i, j) ?? 0);
        }
        maxSum = Math.max(maxSum, sum);
      }
      return maxSum;
    } else if (p === Infinity) {
      // Row sum norm
      let maxSum = 0;
      for (let i = 0; i < this.rows; i++) {
        let sum = 0;
        for (let j = 0; j < this.cols; j++) {
          sum += Math.abs(this.get(i, j) ?? 0);
        }
        maxSum = Math.max(maxSum, sum);
      }
      return maxSum;
    } else {
      // Frobenius norm (approximation of 2-norm)
      let sum = 0;
      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
          const value = this.get(i, j) ?? 0;
          sum += value * value;
        }
      }
      return Math.sqrt(sum);
    }
  }
}

/**
 * NumericMatrix factory
 *
 * Provides methods for creating numeric matrices.
 */
export class NumericMatrixFactory extends MatrixFactory<number> implements INumericMatrixFactory {
  /**
   * Create an identity matrix
   *
   * @param size The size of the matrix
   * @returns A new identity matrix
   */
  public identity(size: number): INumericMatrix {
    return this.of(size, size, (i, j) => i === j ? 1 : 0) as INumericMatrix;
  }

  /**
   * Create a diagonal matrix
   *
   * @param values The diagonal values
   * @returns A new diagonal matrix
   */
  public diagonal(values: number[]): INumericMatrix {
    const size = values.length;
    return this.of(size, size, (i, j) => i === j ? values[i] : 0) as INumericMatrix;
  }

  /**
   * Create a random matrix
   *
   * @param rows The number of rows
   * @param cols The number of columns
   * @param min The minimum value (default: 0)
   * @param max The maximum value (default: 1)
   * @returns A new random matrix
   */
  public random(rows: number, cols: number, min: number = 0, max: number = 1): INumericMatrix {
    return this.of(rows, cols, () => min + Math.random() * (max - min)) as INumericMatrix;
  }

  /**
   * Create a matrix with values from the normal distribution
   *
   * @param rows The number of rows
   * @param cols The number of columns
   * @param mean The mean (default: 0)
   * @param stdDev The standard deviation (default: 1)
   * @returns A new matrix with normally distributed values
   */
  public randomNormal(rows: number, cols: number, mean: number = 0, stdDev: number = 1): INumericMatrix {
    return this.of(rows, cols, () => {
      // Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return mean + stdDev * z0;
    }) as INumericMatrix;
  }

  /**
   * Create a Hilbert matrix
   *
   * @param size The size of the matrix
   * @returns A new Hilbert matrix
   */
  public hilbert(size: number): INumericMatrix {
    return this.of(size, size, (i, j) => 1 / (i + j + 1)) as INumericMatrix;
  }

  /**
   * Create a Vandermonde matrix
   *
   * @param values The values
   * @param degree The degree (default: values.length)
   * @returns A new Vandermonde matrix
   */
  public vandermonde(values: number[], degree?: number): INumericMatrix {
    const n = values.length;
    const m = degree ?? n;
    return this.of(n, m, (i, j) => Math.pow(values[i], j)) as INumericMatrix;
  }

  /**
   * Create a matrix from a 2D array
   *
   * @param data The 2D array
   * @returns A new numeric matrix
   */
  public override from(data: number[][]): INumericMatrix {
    return super.from(data) as INumericMatrix;
  }

  /**
   * Create a matrix from a flat array (row-major order)
   *
   * @param data The flat array
   * @param rows The number of rows
   * @param cols The number of columns
   * @returns A new numeric matrix
   */
  public override fromFlat(data: number[], rows: number, cols: number): INumericMatrix {
    return super.fromFlat(data, rows, cols) as INumericMatrix;
  }

  /**
   * Create a matrix with all elements set to the same value
   *
   * @param rows The number of rows
   * @param cols The number of columns
   * @param value The value to fill the matrix with
   * @returns A new numeric matrix
   */
  public override fill(rows: number, cols: number, value: number): INumericMatrix {
    return super.fill(rows, cols, value) as INumericMatrix;
  }

  /**
   * Create a matrix with elements generated by a function
   *
   * @param rows The number of rows
   * @param cols The number of columns
   * @param fn The function to generate values
   * @returns A new numeric matrix
   */
  public override of(rows: number, cols: number, fn: (row: number, col: number) => number): INumericMatrix {
    return super.of(rows, cols, fn) as INumericMatrix;
  }
}

/**
 * Default numeric matrix factory instance
 */
export const NumericMatrixInstance = new NumericMatrixFactory();
