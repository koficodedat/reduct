/**
 * Matrix implementation
 *
 * A basic implementation of the Matrix interface.
 *
 * @packageDocumentation
 */

import { IMatrix, IMatrixFactory } from './types';

/**
 * Matrix implementation
 *
 * A basic implementation of the Matrix interface.
 */
export class Matrix<T> implements IMatrix<T> {
  /**
   * The number of rows in the matrix
   */
  public readonly rows: number;

  /**
   * The number of columns in the matrix
   */
  public readonly cols: number;

  /**
   * The data stored in the matrix (row-major order)
   */
  protected readonly _data: T[][];

  /**
   * Create a new matrix
   *
   * @param data The data to store in the matrix
   */
  constructor(data: T[][]) {
    this._data = data;
    this.rows = data.length;
    this.cols = data.length > 0 ? data[0].length : 0;
  }

  /**
   * Get the value at the specified position
   *
   * @param row The row index
   * @param col The column index
   * @returns The value at the specified position, or undefined if out of bounds
   */
  public get(row: number, col: number): T | undefined {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return undefined;
    }
    return this._data[row][col];
  }

  /**
   * Set the value at the specified position
   *
   * @param row The row index
   * @param col The column index
   * @param value The value to set
   * @returns A new matrix with the updated value
   */
  public set(row: number, col: number, value: T): IMatrix<T> {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new Error(`Index out of bounds: (${row}, ${col})`);
    }

    // Create a new data array with the updated value
    const newData = this._data.map((rowData, r) => {
      if (r === row) {
        return rowData.map((colData, c) => {
          if (c === col) {
            return value;
          }
          return colData;
        });
      }
      return rowData.slice();
    });

    return new Matrix<T>(newData);
  }

  /**
   * Map each element in the matrix to a new value
   *
   * @param fn The mapping function
   * @returns A new matrix with the mapped values
   */
  public map<U>(fn: (value: T, row: number, col: number) => U): IMatrix<U> {
    const newData = this._data.map((rowData, r) => {
      return rowData.map((value, c) => {
        return fn(value, r, c);
      });
    });

    return new Matrix<U>(newData);
  }

  /**
   * Filter elements in the matrix
   *
   * @param fn The filter function
   * @returns A new matrix with only the elements that pass the filter
   */
  public filter(fn: (value: T, row: number, col: number) => boolean): IMatrix<T> {
    const newData = this._data.map((rowData, r) => {
      return rowData.map((value, c) => {
        return fn(value, r, c) ? value : undefined as unknown as T;
      });
    });

    return new Matrix<T>(newData);
  }

  /**
   * Reduce the matrix to a single value
   *
   * @param fn The reducer function
   * @param initial The initial value
   * @returns The reduced value
   */
  public reduce<U>(fn: (acc: U, value: T, row: number, col: number) => U, initial: U): U {
    let result = initial;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        result = fn(result, this._data[r][c], r, c);
      }
    }

    return result;
  }

  /**
   * Get a row from the matrix
   *
   * @param row The row index
   * @returns An array containing the row values, or undefined if out of bounds
   */
  public getRow(row: number): T[] | undefined {
    if (row < 0 || row >= this.rows) {
      return undefined;
    }
    return this._data[row].slice();
  }

  /**
   * Get a column from the matrix
   *
   * @param col The column index
   * @returns An array containing the column values, or undefined if out of bounds
   */
  public getCol(col: number): T[] | undefined {
    if (col < 0 || col >= this.cols) {
      return undefined;
    }
    return this._data.map(row => row[col]);
  }

  /**
   * Set a row in the matrix
   *
   * @param row The row index
   * @param values The values to set
   * @returns A new matrix with the updated row
   */
  public setRow(row: number, values: T[]): IMatrix<T> {
    if (row < 0 || row >= this.rows) {
      throw new Error(`Row index out of bounds: ${row}`);
    }
    if (values.length !== this.cols) {
      throw new Error(`Row length mismatch: expected ${this.cols}, got ${values.length}`);
    }

    // Create a new data array with the updated row
    const newData = this._data.map((rowData, r) => {
      if (r === row) {
        return values.slice();
      }
      return rowData.slice();
    });

    return new Matrix<T>(newData);
  }

  /**
   * Set a column in the matrix
   *
   * @param col The column index
   * @param values The values to set
   * @returns A new matrix with the updated column
   */
  public setCol(col: number, values: T[]): IMatrix<T> {
    if (col < 0 || col >= this.cols) {
      throw new Error(`Column index out of bounds: ${col}`);
    }
    if (values.length !== this.rows) {
      throw new Error(`Column length mismatch: expected ${this.rows}, got ${values.length}`);
    }

    // Create a new data array with the updated column
    const newData = this._data.map((rowData, r) => {
      return rowData.map((value, c) => {
        if (c === col) {
          return values[r];
        }
        return value;
      });
    });

    return new Matrix<T>(newData);
  }

  /**
   * Transpose the matrix
   *
   * @returns A new matrix with rows and columns swapped
   */
  public transpose(): IMatrix<T> {
    const newData: T[][] = [];

    for (let c = 0; c < this.cols; c++) {
      newData[c] = [];
      for (let r = 0; r < this.rows; r++) {
        newData[c][r] = this._data[r][c];
      }
    }

    return new Matrix<T>(newData);
  }

  /**
   * Convert the matrix to a 2D array
   *
   * @returns A 2D array representation of the matrix
   */
  public toArray(): T[][] {
    return this._data.map(row => row.slice());
  }

  /**
   * Convert the matrix to a flat array (row-major order)
   *
   * @returns A flat array representation of the matrix
   */
  public toFlatArray(): T[] {
    return this._data.reduce((acc, row) => acc.concat(row), [] as T[]);
  }
}

/**
 * Matrix factory
 *
 * Provides methods for creating matrices.
 */
export class MatrixFactory<T> implements IMatrixFactory<T> {
  /**
   * Create an empty matrix with the specified dimensions
   *
   * @param rows The number of rows
   * @param cols The number of columns
   * @returns A new empty matrix
   */
  public empty(rows: number, cols: number): IMatrix<T> {
    const data: T[][] = [];
    for (let r = 0; r < rows; r++) {
      data[r] = new Array(cols).fill(undefined as unknown as T);
    }
    return new Matrix<T>(data);
  }

  /**
   * Create a matrix from a 2D array
   *
   * @param data The 2D array
   * @returns A new matrix
   */
  public from(data: T[][]): IMatrix<T> {
    // Validate that all rows have the same length
    if (data.length > 0) {
      const cols = data[0].length;
      for (let r = 1; r < data.length; r++) {
        if (data[r].length !== cols) {
          throw new Error(`Row length mismatch: row 0 has ${cols} elements, row ${r} has ${data[r].length} elements`);
        }
      }
    }

    // Create a deep copy of the data
    const newData = data.map(row => row.slice());
    return new Matrix<T>(newData);
  }

  /**
   * Create a matrix from a flat array (row-major order)
   *
   * @param data The flat array
   * @param rows The number of rows
   * @param cols The number of columns
   * @returns A new matrix
   */
  public fromFlat(data: T[], rows: number, cols: number): IMatrix<T> {
    if (data.length !== rows * cols) {
      throw new Error(`Data length mismatch: expected ${rows * cols}, got ${data.length}`);
    }

    const newData: T[][] = [];
    for (let r = 0; r < rows; r++) {
      newData[r] = [];
      for (let c = 0; c < cols; c++) {
        newData[r][c] = data[r * cols + c];
      }
    }

    return new Matrix<T>(newData);
  }

  /**
   * Create a matrix with all elements set to the same value
   *
   * @param rows The number of rows
   * @param cols The number of columns
   * @param value The value to fill the matrix with
   * @returns A new matrix
   */
  public fill(rows: number, cols: number, value: T): IMatrix<T> {
    const data: T[][] = [];
    for (let r = 0; r < rows; r++) {
      data[r] = new Array(cols).fill(value);
    }
    return new Matrix<T>(data);
  }

  /**
   * Create a matrix with elements generated by a function
   *
   * @param rows The number of rows
   * @param cols The number of columns
   * @param fn The function to generate values
   * @returns A new matrix
   */
  public of(rows: number, cols: number, fn: (row: number, col: number) => T): IMatrix<T> {
    const data: T[][] = [];
    for (let r = 0; r < rows; r++) {
      data[r] = [];
      for (let c = 0; c < cols; c++) {
        data[r][c] = fn(r, c);
      }
    }
    return new Matrix<T>(data);
  }
}

/**
 * Default matrix factory instance
 */
export const MatrixFactoryInstance = new MatrixFactory<any>();
