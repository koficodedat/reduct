/**
 * WebAssembly-Accelerated NumericList
 *
 * This implementation uses WebAssembly for numeric operations to achieve
 * better performance than pure JavaScript implementations.
 */

import { InputDataType, InputSizeCategory as _InputSizeCategory } from '@reduct/shared-types/utils';

import { getPooledArray, releasePooledArray } from '../../memory/pool';
import { InputCharacteristicsAnalyzer } from '../../utils/input-characteristics';
import { NumericAccelerator , isWebAssemblySupported } from '../../utils/mock-wasm';
import { IList, TransientList as _TransientList } from '../types';

// CompactList implementation may be used in the future
// import { CompactList } from './compact-list';
import { NumericList } from './numeric-list';



// Create a singleton accelerator instance
const accelerator = new NumericAccelerator();

/**
 * A WebAssembly-accelerated list implementation for numeric data
 */
export class WasmNumericList implements IList<number> {
  private _data: number[];
  private _size: number;
  private _fallbackList: NumericList;
  private _acceleratorAvailable: boolean;

  /**
   * Create a new WasmNumericList
   *
   * @param data - Initial data array
   */
  constructor(data: number[] = []) {
    this._data = data;
    this._size = data.length;
    this._fallbackList = new NumericList(data);
    this._acceleratorAvailable = isWebAssemblySupported();
  }

  /**
   * Get the size of the list
   */
  get size(): number {
    return this._size;
  }

  /**
   * Check if the list is empty
   */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Get an element at the specified index
   *
   * @param index - The index to get
   * @returns The element at the index, or undefined if out of bounds
   */
  get(index: number): number | undefined {
    if (index < 0 || index >= this._size) {
      return undefined;
    }
    return this._data[index];
  }

  /**
   * Set an element at the specified index
   *
   * @param index - The index to set
   * @param value - The value to set
   * @returns A new list with the updated element
   */
  set(index: number, value: number): IList<number> {
    if (index < 0 || index >= this._size) {
      return this;
    }

    // Create a new array with the updated element
    const newData = this._data.slice();
    newData[index] = value;

    return new WasmNumericList(newData);
  }

  /**
   * Insert an element at the specified index
   *
   * @param index - The index to insert at
   * @param value - The value to insert
   * @returns A new list with the inserted element
   */
  insert(index: number, value: number): IList<number> {
    if (index < 0) {
      index = 0;
    }
    if (index > this._size) {
      index = this._size;
    }

    // Optimize for append operation
    if (index === this._size) {
      const newData = [...this._data, value];
      return new WasmNumericList(newData);
    }

    // Optimize for prepend operation
    if (index === 0) {
      const newData = [value, ...this._data];
      return new WasmNumericList(newData);
    }

    // General case
    const newData = [
      ...this._data.slice(0, index),
      value,
      ...this._data.slice(index)
    ];

    return new WasmNumericList(newData);
  }

  /**
   * Remove an element at the specified index
   *
   * @param index - The index to remove
   * @returns A new list with the element removed
   */
  remove(index: number): IList<number> {
    if (index < 0 || index >= this._size) {
      return this;
    }

    const newData = [
      ...this._data.slice(0, index),
      ...this._data.slice(index + 1)
    ];

    return new WasmNumericList(newData);
  }

  /**
   * Append an element to the end of the list
   *
   * @param value - The value to append
   * @returns A new list with the appended element
   */
  append(value: number): IList<number> {
    return new WasmNumericList([...this._data, value]);
  }

  /**
   * Prepend an element to the beginning of the list
   *
   * @param value - The value to prepend
   * @returns A new list with the prepended element
   */
  prepend(value: number): IList<number> {
    return new WasmNumericList([value, ...this._data]);
  }

  /**
   * Concatenate this list with another list
   *
   * @param other - The other list to concatenate with
   * @returns A new list with the concatenated elements
   */
  concat(other: IList<number>): IList<number> {
    if (other.isEmpty) {
      return this;
    }

    if (this.isEmpty) {
      return other;
    }

    // Use pooled array for better memory efficiency
    const newSize = this._size + other.size;
    const newData = getPooledArray<number>(newSize);

    // Copy this list's data
    for (let i = 0; i < this._size; i++) {
      newData[i] = this._data[i];
    }

    // Copy other list's data
    for (let i = 0; i < other.size; i++) {
      const value = other.get(i);
      if (value !== undefined) {
        newData[this._size + i] = value;
      }
    }

    const result = new WasmNumericList(newData.slice(0, newSize));
    releasePooledArray(newData);
    return result;
  }

  /**
   * Map each element to a new value
   *
   * @param fn - The mapping function
   * @returns A new list with the mapped elements
   */
  map<U>(fn: (value: number, index: number) => U): IList<U> {
    // Analyze input characteristics
    const characteristics = InputCharacteristicsAnalyzer.analyzeArray(this._data);

    // Check if the result is numeric
    const isNumericResult = this._data.length > 0 && typeof fn(this._data[0], 0) === 'number';

    // Determine if we should use WebAssembly
    const shouldUseWasm = this._acceleratorAvailable &&
      isNumericResult &&
      characteristics.size >= 1000 &&
      characteristics.dataType === InputDataType.NUMBER &&
      characteristics.isHomogeneous &&
      !characteristics.hasSpecialValues;

    if (shouldUseWasm) {
      try {
        // Use WebAssembly for numeric map
        const startTime = performance.now();
        const result = accelerator.map(this._data, fn as (value: number, index: number) => number);
        const endTime = performance.now();

        // Log performance metrics
        console.debug(`WebAssembly map operation completed in ${(endTime - startTime).toFixed(3)}ms for ${this._data.length} elements`);

        return new WasmNumericList(result) as unknown as IList<U>;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.map(fn);
      }
    }

    // For non-numeric results or if WebAssembly is not available, use the fallback
    return this._fallbackList.map(fn);
  }

  /**
   * Filter elements based on a predicate
   *
   * @param fn - The filter predicate
   * @returns A new list with the filtered elements
   */
  filter(fn: (value: number, index: number) => boolean): IList<number> {
    // Analyze input characteristics
    const characteristics = InputCharacteristicsAnalyzer.analyzeArray(this._data);

    // Determine if we should use WebAssembly
    const shouldUseWasm = this._acceleratorAvailable &&
      characteristics.size >= 1000 &&
      characteristics.dataType === InputDataType.NUMBER &&
      characteristics.isHomogeneous &&
      !characteristics.hasSpecialValues;

    if (shouldUseWasm) {
      try {
        // Use WebAssembly for filter
        const startTime = performance.now();
        const result = accelerator.filter(this._data, fn);
        const endTime = performance.now();

        // Log performance metrics
        console.debug(`WebAssembly filter operation completed in ${(endTime - startTime).toFixed(3)}ms for ${this._data.length} elements`);

        return new WasmNumericList(result);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.filter(fn);
      }
    }

    // If WebAssembly is not available or not suitable, use the fallback
    return this._fallbackList.filter(fn);
  }

  /**
   * Reduce the list to a single value
   *
   * @param fn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  reduce<U>(fn: (accumulator: U, value: number, index: number) => U, initial: U): U {
    // Analyze input characteristics
    const characteristics = InputCharacteristicsAnalyzer.analyzeArray(this._data);

    // Check if the result is numeric
    const isNumericResult = typeof initial === 'number';

    // Determine if we should use WebAssembly
    const shouldUseWasm = this._acceleratorAvailable &&
      isNumericResult &&
      characteristics.size >= 1000 &&
      characteristics.dataType === InputDataType.NUMBER &&
      characteristics.isHomogeneous &&
      !characteristics.hasSpecialValues;

    if (shouldUseWasm) {
      try {
        // Use WebAssembly for reduce
        const startTime = performance.now();
        const result = accelerator.reduce(
          this._data,
          fn as unknown as (accumulator: number, value: number, index: number) => number,
          initial as unknown as number
        );
        const endTime = performance.now();

        // Log performance metrics
        console.debug(`WebAssembly reduce operation completed in ${(endTime - startTime).toFixed(3)}ms for ${this._data.length} elements`);

        return result as unknown as U;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.reduce(fn, initial);
      }
    }

    // If WebAssembly is not available or not suitable, use the fallback
    return this._fallbackList.reduce(fn, initial);
  }

  /**
   * Convert the list to an array
   *
   * @returns An array containing the elements of the list
   */
  toArray(): number[] {
    return this._data.slice();
  }

  /**
   * Create a string representation of the list
   *
   * @returns A string representation of the list
   */
  toString(): string {
    return `WasmNumericList(${this._size}) [ ${this._data.slice(0, 3).join(', ')}${this._size > 3 ? ', ...' : ''} ]`;
  }

  /**
   * Optimized implementation for map followed by filter
   *
   * @param mapFn - The mapping function
   * @param filterFn - The filter predicate
   * @returns A new list with the mapped and filtered elements
   */
  mapFilter<U>(
    mapFn: (value: number, index: number) => U,
    filterFn: (value: U, index: number) => boolean
  ): IList<U> {
    // Use WebAssembly acceleration for numeric results if available
    if (this._acceleratorAvailable && typeof mapFn(this._data[0], 0) === 'number') {
      try {
        // Use WebAssembly for mapFilter
        const result = accelerator.mapFilter(
          this._data,
          mapFn as (value: number, index: number) => number,
          filterFn as (value: number, index: number) => boolean
        );
        return new WasmNumericList(result) as unknown as IList<U>;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.mapFilter(mapFn, filterFn);
      }
    }

    // If WebAssembly is not available or the result is not numeric, use the fallback
    return this._fallbackList.mapFilter(mapFn, filterFn);
  }

  /**
   * Optimized implementation for filter followed by map
   *
   * @param filterFn - The filter predicate
   * @param mapFn - The mapping function
   * @returns A new list with the filtered and mapped elements
   */
  filterMap<U>(
    filterFn: (value: number, index: number) => boolean,
    mapFn: (value: number, index: number) => U
  ): IList<U> {
    // Use WebAssembly acceleration for numeric results if available
    if (this._acceleratorAvailable && typeof mapFn(this._data[0], 0) === 'number') {
      try {
        // First filter, then map using WebAssembly
        const filtered = accelerator.filter(this._data, filterFn);
        const result = accelerator.map(
          filtered,
          mapFn as (value: number, index: number) => number
        );
        return new WasmNumericList(result) as unknown as IList<U>;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.filterMap(filterFn, mapFn);
      }
    }

    // If WebAssembly is not available or the result is not numeric, use the fallback
    return this._fallbackList.filterMap(filterFn, mapFn);
  }

  /**
   * Optimized implementation for map followed by reduce
   *
   * @param mapFn - The mapping function
   * @param reduceFn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  mapReduce<U, V>(
    mapFn: (value: number, index: number) => U,
    reduceFn: (accumulator: V, value: U, index: number) => V,
    initial: V
  ): V {
    // Use WebAssembly acceleration if available and both result types are numeric
    if (
      this._acceleratorAvailable &&
      typeof mapFn(this._data[0], 0) === 'number' &&
      typeof initial === 'number'
    ) {
      try {
        // Use WebAssembly for mapReduce
        return accelerator.mapReduce(
          this._data,
          mapFn as (value: number, index: number) => number,
          reduceFn as unknown as (accumulator: number, value: number, index: number) => number,
          initial as unknown as number
        ) as unknown as V;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.mapReduce(mapFn, reduceFn, initial);
      }
    }

    // If WebAssembly is not available or the result is not numeric, use the fallback
    return this._fallbackList.mapReduce(mapFn, reduceFn, initial);
  }

  /**
   * Optimized implementation for filter followed by reduce
   *
   * @param filterFn - The filter predicate
   * @param reduceFn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  filterReduce<U>(
    filterFn: (value: number, index: number) => boolean,
    reduceFn: (accumulator: U, value: number, index: number) => U,
    initial: U
  ): U {
    // Use WebAssembly acceleration if available and the result is numeric
    if (this._acceleratorAvailable && typeof initial === 'number') {
      try {
        // First filter using WebAssembly, then reduce
        const filtered = accelerator.filter(this._data, filterFn);
        return accelerator.reduce(
          filtered,
          reduceFn as unknown as (accumulator: number, value: number, index: number) => number,
          initial as unknown as number
        ) as unknown as U;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.filterReduce(filterFn, reduceFn, initial);
      }
    }

    // If WebAssembly is not available or the result is not numeric, use the fallback
    return this._fallbackList.filterReduce(filterFn, reduceFn, initial);
  }

  /**
   * Optimized implementation for map, filter, and reduce
   *
   * @param mapFn - The mapping function
   * @param filterFn - The filter predicate
   * @param reduceFn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  mapFilterReduce<U, V>(
    mapFn: (value: number, index: number) => U,
    filterFn: (value: U, index: number) => boolean,
    reduceFn: (accumulator: V, value: U, index: number) => V,
    initial: V
  ): V {
    // Use WebAssembly acceleration if available and all result types are numeric
    if (
      this._acceleratorAvailable &&
      typeof mapFn(this._data[0], 0) === 'number' &&
      typeof initial === 'number'
    ) {
      try {
        // Use WebAssembly for mapFilterReduce
        return accelerator.mapFilterReduce(
          this._data,
          mapFn as (value: number, index: number) => number,
          filterFn as (value: number, index: number) => boolean,
          reduceFn as unknown as (accumulator: number, value: number, index: number) => number,
          initial as unknown as number
        ) as unknown as V;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.mapFilterReduce(mapFn, filterFn, reduceFn, initial);
      }
    }

    // If WebAssembly is not available or the result is not numeric, use the fallback
    return this._fallbackList.mapFilterReduce(mapFn, filterFn, reduceFn, initial);
  }

  /**
   * Specialized numeric sum operation
   *
   * @returns The sum of all elements in the list
   */
  sum(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        return accelerator.sum(this._data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.sum();
      }
    }

    // If WebAssembly is not available, use the fallback
    return this._fallbackList.sum();
  }

  /**
   * Specialized numeric average operation
   *
   * @returns The average of all elements in the list
   */
  average(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        return accelerator.average(this._data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.average();
      }
    }

    // If WebAssembly is not available, use the fallback
    return this._fallbackList.average();
  }

  /**
   * Specialized numeric min operation
   *
   * @returns The minimum value in the list
   */
  min(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        return accelerator.min(this._data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.min();
      }
    }

    // If WebAssembly is not available, use the fallback
    return this._fallbackList.min();
  }

  /**
   * Specialized numeric max operation
   *
   * @returns The maximum value in the list
   */
  max(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        return accelerator.max(this._data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._fallbackList.max();
      }
    }

    // If WebAssembly is not available, use the fallback
    return this._fallbackList.max();
  }

  /**
   * Optimized batch update operation
   *
   * @param updates - Array of [index, value] pairs
   * @returns A new list with all updates applied
   */
  batchUpdate(updates: Array<[number, number]>): IList<number> {
    if (updates.length === 0) {
      return this;
    }

    // Create a new array with all updates applied at once
    const newData = this._data.slice();

    for (const [index, value] of updates) {
      if (index >= 0 && index < this._size) {
        newData[index] = value;
      }
    }

    return new WasmNumericList(newData);
  }

  /**
   * Create a slice of the list
   *
   * @param start - The start index
   * @param end - The end index (exclusive)
   * @returns A new list with the sliced elements
   */
  slice(start: number = 0, end: number = this._size): IList<number> {
    // Normalize indices
    start = start < 0 ? Math.max(0, this._size + start) : Math.min(this._size, start);
    end = end < 0 ? Math.max(0, this._size + end) : Math.min(this._size, end);

    if (start >= end) {
      return new WasmNumericList([]);
    }

    return new WasmNumericList(this._data.slice(start, end));
  }

  /**
   * Find the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The first element that satisfies the predicate, or undefined if none is found
   */
  find(fn: (value: number, index: number) => boolean): number | undefined {
    return this._fallbackList.find(fn);
  }

  /**
   * Find the index of the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The index of the first element that satisfies the predicate, or -1 if none is found
   */
  findIndex(fn: (value: number, index: number) => boolean): number {
    return this._fallbackList.findIndex(fn);
  }

  /**
   * Create a transient (temporarily mutable) version of the list
   *
   * @returns A transient list with the current values
   */
  transient(): TransientList<number> {
    // Simple implementation that just returns a mutable wrapper
    const data = this._data.slice();

    return {
      append(value: number): TransientList<number> {
        data.push(value);
        return this;
      },
      prepend(value: number): TransientList<number> {
        data.unshift(value);
        return this;
      },
      set(index: number, value: number): TransientList<number> {
        if (index >= 0 && index < data.length) {
          data[index] = value;
        }
        return this;
      },
      persistent(): IList<number> {
        return new WasmNumericList(data);
      }
    };
  }

  /**
   * Get the first element in the list
   *
   * @returns The first element, or undefined if the list is empty
   */
  first(): number | undefined {
    return this._size > 0 ? this._data[0] : undefined;
  }

  /**
   * Get the last element in the list
   *
   * @returns The last element, or undefined if the list is empty
   */
  last(): number | undefined {
    return this._size > 0 ? this._data[this._size - 1] : undefined;
  }

  /**
   * Sort the list
   *
   * @param compareFn - Optional comparison function
   * @returns A new sorted list
   */
  sort(compareFn?: (a: number, b: number) => number): IList<number> {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        // Use WebAssembly for sort
        const result = accelerator.sort(this._data, compareFn);
        return new WasmNumericList(result);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return new WasmNumericList([...this._data].sort(compareFn));
      }
    }

    // If WebAssembly is not available, use the native sort
    return new WasmNumericList([...this._data].sort(compareFn));
  }

  /**
   * Calculate the median of the list
   *
   * @returns The median value
   */
  median(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        // Use WebAssembly for median calculation
        return accelerator.median(this._data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._calculateMedianJs();
      }
    }

    // If WebAssembly is not available, use JavaScript implementation
    return this._calculateMedianJs();
  }

  /**
   * Calculate the standard deviation of the list
   *
   * @returns The standard deviation
   */
  standardDeviation(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        // Use WebAssembly for standard deviation calculation
        return accelerator.standardDeviation(this._data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._calculateStdDevJs();
      }
    }

    // If WebAssembly is not available, use JavaScript implementation
    return this._calculateStdDevJs();
  }

  /**
   * Calculate the percentile of the list
   *
   * @param percentile - The percentile (0-100)
   * @returns The value at the specified percentile
   */
  percentile(percentile: number): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        // Use WebAssembly for percentile calculation
        return accelerator.percentile(this._data, percentile);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this._calculatePercentileJs(percentile);
      }
    }

    // If WebAssembly is not available, use JavaScript implementation
    return this._calculatePercentileJs(percentile);
  }

  /**
   * Calculate the median using JavaScript
   *
   * @returns The median value
   */
  private _calculateMedianJs(): number {
    if (this._size === 0) {
      return NaN;
    }

    if (this._size === 1) {
      return this._data[0];
    }

    const sorted = [...this._data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  /**
   * Calculate the standard deviation using JavaScript
   *
   * @returns The standard deviation
   */
  private _calculateStdDevJs(): number {
    if (this._size === 0) {
      return NaN;
    }

    if (this._size === 1) {
      return 0;
    }

    const mean = this.average();
    const squaredDiffs = this._data.map(value => {
      const diff = value - mean;
      return diff * diff;
    });
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / this._size;
    return Math.sqrt(variance);
  }

  /**
   * Calculate the percentile using JavaScript
   *
   * @param percentile - The percentile (0-100)
   * @returns The value at the specified percentile
   */
  private _calculatePercentileJs(percentile: number): number {
    if (this._size === 0) {
      return NaN;
    }

    if (this._size === 1) {
      return this._data[0];
    }

    const p = Math.max(0, Math.min(100, percentile));
    const sorted = [...this._data].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}
