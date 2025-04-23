/**
 * WebAssembly-Accelerated HAMTPersistentVector implementation
 *
 * A 32-way branching trie implementation of the List interface optimized for large collections.
 * Uses Hash Array Mapped Trie (HAMT) for efficient structural sharing and memory usage.
 * Uses WebAssembly for accelerating numeric operations.
 */

import { NumericAccelerator, isWebAssemblySupported } from '../utils/mock-wasm';

import { HAMTPersistentVector } from './hamt-persistent-vector';
import { IList, TransientList } from './types';
// Create a singleton accelerator instance
const accelerator = new NumericAccelerator();

/**
 * WebAssembly-accelerated HAMTPersistentVector for numeric data
 */
export class WasmHAMTPersistentVector implements IList<number> {
  private _impl: HAMTPersistentVector<number>;
  private _acceleratorAvailable: boolean;

  /**
   * Create a new WasmHAMTPersistentVector
   *
   * @param data - Initial data array
   */
  constructor(data: number[] = []) {
    this._impl = HAMTPersistentVector.from(data);
    this._acceleratorAvailable = isWebAssemblySupported();
  }

  /**
   * Get the size of the vector
   */
  get size(): number {
    return this._impl.size;
  }

  /**
   * Check if the vector is empty
   */
  get isEmpty(): boolean {
    return this._impl.isEmpty;
  }

  /**
   * Get an element at the specified index
   */
  get(index: number): number | undefined {
    return this._impl.get(index);
  }

  /**
   * Set an element at the specified index
   */
  set(index: number, value: number): IList<number> {
    const newImpl = this._impl.set(index, value);
    const result = new WasmHAMTPersistentVector();
    result._impl = newImpl as HAMTPersistentVector<number>;
    return result;
  }

  /**
   * Insert an element at the specified index
   */
  insert(index: number, value: number): IList<number> {
    const newImpl = this._impl.insert(index, value);
    const result = new WasmHAMTPersistentVector();
    result._impl = newImpl as HAMTPersistentVector<number>;
    return result;
  }

  /**
   * Remove an element at the specified index
   */
  remove(index: number): IList<number> {
    const newImpl = this._impl.remove(index);
    const result = new WasmHAMTPersistentVector();
    result._impl = newImpl as HAMTPersistentVector<number>;
    return result;
  }

  /**
   * Append an element to the end of the list
   */
  append(value: number): IList<number> {
    const newImpl = this._impl.append(value);
    const result = new WasmHAMTPersistentVector();
    result._impl = newImpl as HAMTPersistentVector<number>;
    return result;
  }

  /**
   * Prepend an element to the beginning of the list
   */
  prepend(value: number): IList<number> {
    const newImpl = this._impl.prepend(value);
    const result = new WasmHAMTPersistentVector();
    result._impl = newImpl as HAMTPersistentVector<number>;
    return result;
  }

  /**
   * Map the elements of the list to new values
   */
  map<U>(fn: (value: number, index: number) => U): IList<U> {
    // Use WebAssembly acceleration for numeric results if available
    if (this._acceleratorAvailable && typeof fn(0, 0) === 'number') {
      try {
        // Use WebAssembly for numeric map
        const data = this._impl.toArray();
        const result = accelerator.map(data, fn as (value: number, index: number) => number);
        return new WasmHAMTPersistentVector(result) as unknown as IList<U>;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // For non-numeric results or if WebAssembly is not available, use the fallback
    return this._impl.map(fn);
  }

  /**
   * Filter the elements of the list
   */
  filter(fn: (value: number, index: number) => boolean): IList<number> {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        // Use WebAssembly for filter
        const data = this._impl.toArray();
        const result = accelerator.filter(data, fn);
        return new WasmHAMTPersistentVector(result);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available, use the fallback
    return this._impl.filter(fn);
  }

  /**
   * Reduce the elements of the list to a single value
   */
  reduce<U>(fn: (accumulator: U, value: number, index: number) => U, initial: U): U {
    // Use WebAssembly acceleration if available and the result is numeric
    if (this._acceleratorAvailable && typeof initial === 'number' && this.size > 0) {
      try {
        // Use WebAssembly for reduce
        const data = this._impl.toArray();
        return accelerator.reduce(
          data,
          fn as unknown as (accumulator: number, value: number, index: number) => number,
          initial as unknown as number
        ) as unknown as U;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available or the result is not numeric, use the fallback
    return this._impl.reduce(fn, initial);
  }

  /**
   * Get a slice of the list
   */
  slice(start: number = 0, end?: number): IList<number> {
    const newImpl = this._impl.slice(start, end);
    const result = new WasmHAMTPersistentVector();
    result._impl = newImpl as HAMTPersistentVector<number>;
    return result;
  }

  /**
   * Concatenate this list with another list
   */
  concat(other: IList<number>): IList<number> {
    const newImpl = this._impl.concat(other);
    const result = new WasmHAMTPersistentVector();
    result._impl = newImpl as HAMTPersistentVector<number>;
    return result;
  }

  /**
   * Find the first element that satisfies the predicate
   */
  find(fn: (value: number, index: number) => boolean): number | undefined {
    return this._impl.find(fn);
  }

  /**
   * Find the index of the first element that satisfies the predicate
   */
  findIndex(fn: (value: number, index: number) => boolean): number {
    return this._impl.findIndex(fn);
  }

  /**
   * Convert the list to an array
   */
  toArray(): number[] {
    return this._impl.toArray();
  }

  /**
   * Create a transient version of the list
   */
  transient(): TransientList<number> {
    const transientImpl = this._impl.transient();
    return {
      append(value: number): TransientList<number> {
        transientImpl.append(value);
        return this;
      },
      prepend(value: number): TransientList<number> {
        transientImpl.prepend(value);
        return this;
      },
      set(index: number, value: number): TransientList<number> {
        transientImpl.set(index, value);
        return this;
      },
      persistent(): IList<number> {
        const persistentImpl = transientImpl.persistent();
        const result = new WasmHAMTPersistentVector();
        result._impl = persistentImpl as HAMTPersistentVector<number>;
        return result;
      }
    };
  }

  /**
   * Perform a map, filter, and reduce operation in a single pass
   */
  mapFilterReduce<U, V>(
    mapFn: (value: number, index: number) => U,
    filterFn: (value: U, index: number) => boolean,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    // Use WebAssembly acceleration if available and all result types are numeric
    if (
      this._acceleratorAvailable &&
      typeof mapFn(0, 0) === 'number' &&
      typeof initial === 'number'
    ) {
      try {
        // Use WebAssembly for mapFilterReduce
        const data = this._impl.toArray();
        return accelerator.mapFilterReduce(
          data,
          mapFn as (value: number, index: number) => number,
          filterFn as (value: number, index: number) => boolean,
          reduceFn as unknown as (accumulator: number, value: number, index: number) => number,
          initial as unknown as number
        ) as unknown as V;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available or the result is not numeric, use the fallback
    return this._impl.mapFilterReduce(mapFn, filterFn, reduceFn, initial);
  }

  /**
   * Perform a map and reduce operation in a single pass
   */
  mapReduce<U, V>(
    mapFn: (value: number, index: number) => U,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    // Use WebAssembly acceleration if available and all result types are numeric
    if (
      this._acceleratorAvailable &&
      typeof mapFn(0, 0) === 'number' &&
      typeof initial === 'number'
    ) {
      try {
        // Use WebAssembly for mapReduce
        const data = this._impl.toArray();
        return accelerator.mapReduce(
          data,
          mapFn as (value: number, index: number) => number,
          reduceFn as unknown as (accumulator: number, value: number, index: number) => number,
          initial as unknown as number
        ) as unknown as V;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available or the result is not numeric, use the fallback
    return this._impl.mapReduce(mapFn, reduceFn, initial);
  }

  /**
   * Perform a filter and map operation in a single pass
   */
  filterMap<U>(
    filterFn: (value: number, index: number) => boolean,
    mapFn: (value: number, index: number) => U
  ): IList<U> {
    // Use WebAssembly acceleration for numeric results if available
    if (this._acceleratorAvailable && typeof mapFn(0, 0) === 'number') {
      try {
        // First filter, then map using WebAssembly
        const data = this._impl.toArray();
        const filtered = accelerator.filter(data, filterFn);
        const result = accelerator.map(
          filtered,
          mapFn as (value: number, index: number) => number
        );
        return new WasmHAMTPersistentVector(result) as unknown as IList<U>;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available or the result is not numeric, use the fallback
    return this._impl.filterMap(filterFn, mapFn);
  }

  /**
   * Perform a map and filter operation in a single pass
   */
  mapFilter<U>(
    mapFn: (value: number, index: number) => U,
    filterFn: (value: U, index: number) => boolean
  ): IList<U> {
    // Use WebAssembly acceleration for numeric results if available
    if (this._acceleratorAvailable && typeof mapFn(0, 0) === 'number') {
      try {
        // Use WebAssembly for mapFilter
        const data = this._impl.toArray();
        const result = accelerator.mapFilter(
          data,
          mapFn as (value: number, index: number) => number,
          filterFn as (value: number, index: number) => boolean
        );
        return new WasmHAMTPersistentVector(result) as unknown as IList<U>;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available or the result is not numeric, use the fallback
    return this._impl.mapFilter(mapFn, filterFn);
  }

  /**
   * Perform a filter and reduce operation in a single pass
   */
  filterReduce<V>(
    filterFn: (value: number, index: number) => boolean,
    reduceFn: (acc: V, value: number, index: number) => V,
    initial: V
  ): V {
    // Use WebAssembly acceleration if available and the result is numeric
    if (this._acceleratorAvailable && typeof initial === 'number') {
      try {
        // First filter using WebAssembly, then reduce
        const data = this._impl.toArray();
        const filtered = accelerator.filter(data, filterFn);
        return accelerator.reduce(
          filtered,
          reduceFn as unknown as (accumulator: number, value: number, index: number) => number,
          initial as unknown as number
        ) as unknown as V;
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available or the result is not numeric, use the fallback
    return this._impl.filterReduce(filterFn, reduceFn, initial);
  }

  /**
   * Get the first element in the list
   */
  first(): number | undefined {
    return this._impl.first();
  }

  /**
   * Get the last element in the list
   */
  last(): number | undefined {
    return this._impl.last();
  }

  /**
   * Specialized numeric sum operation
   */
  sum(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        const data = this._impl.toArray();
        return accelerator.sum(data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available, use the fallback
    return this._impl.reduce((acc, value) => acc + value, 0);
  }

  /**
   * Specialized numeric average operation
   */
  average(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        const data = this._impl.toArray();
        return accelerator.average(data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available, use the fallback
    if (this.isEmpty) {
      return 0;
    }
    return this._impl.reduce((acc, value) => acc + value, 0) / this.size;
  }

  /**
   * Specialized numeric min operation
   */
  min(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        const data = this._impl.toArray();
        return accelerator.min(data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available, use the fallback
    if (this.isEmpty) {
      return Infinity;
    }
    return this._impl.reduce((acc, value) => Math.min(acc, value), Infinity);
  }

  /**
   * Specialized numeric max operation
   */
  max(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        const data = this._impl.toArray();
        return accelerator.max(data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available, use the fallback
    if (this.isEmpty) {
      return -Infinity;
    }
    return this._impl.reduce((acc, value) => Math.max(acc, value), -Infinity);
  }

  /**
   * Specialized numeric sort operation
   */
  sort(compareFn?: (a: number, b: number) => number): IList<number> {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        const data = this._impl.toArray();
        const result = accelerator.sort(data, compareFn);
        return new WasmHAMTPersistentVector(result);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available, use the fallback
    const data = this._impl.toArray();
    const sorted = [...data].sort(compareFn);
    return new WasmHAMTPersistentVector(sorted);
  }

  /**
   * Specialized numeric median operation
   */
  median(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        const data = this._impl.toArray();
        return accelerator.median(data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available, use the fallback
    const data = this._impl.toArray();
    if (data.length === 0) {
      return NaN;
    }
    if (data.length === 1) {
      return data[0];
    }
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  /**
   * Specialized numeric standard deviation operation
   */
  standardDeviation(): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        const data = this._impl.toArray();
        return accelerator.standardDeviation(data);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available, use the fallback
    const data = this._impl.toArray();
    if (data.length === 0) {
      return NaN;
    }
    if (data.length === 1) {
      return 0;
    }
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  /**
   * Specialized numeric percentile operation
   */
  percentile(percentile: number): number {
    // Use WebAssembly acceleration if available
    if (this._acceleratorAvailable) {
      try {
        const data = this._impl.toArray();
        return accelerator.percentile(data, percentile);
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      }
    }

    // If WebAssembly is not available, use the fallback
    const data = this._impl.toArray();
    if (data.length === 0) {
      return NaN;
    }
    if (data.length === 1) {
      return data[0];
    }
    const p = Math.max(0, Math.min(100, percentile));
    const sorted = [...data].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (lower === upper) {
      return sorted[lower];
    }
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Create an empty WasmHAMTPersistentVector
   */
  static empty(): WasmHAMTPersistentVector {
    return new WasmHAMTPersistentVector();
  }

  /**
   * Create a WasmHAMTPersistentVector from an array
   */
  static from(items: number[]): WasmHAMTPersistentVector {
    return new WasmHAMTPersistentVector(items);
  }
}
