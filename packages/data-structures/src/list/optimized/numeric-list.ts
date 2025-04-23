/**
 * NumericList - Specialized implementation for numeric data
 *
 * This implementation is optimized for numeric operations based on
 * our benchmark findings, which showed that specialized implementations
 * for specific data types can significantly improve performance.
 */

import { getPooledArray, releasePooledArray } from '../../memory/pool';
import { IList, TransientList } from '../types';

import { CompactList } from './compact-list';

/**
 * A specialized list implementation for numeric data
 */
export class NumericList implements IList<number> {
  private _data: number[];
  private _size: number;

  /**
   * Create a new NumericList
   *
   * @param data - Initial data array
   */
  constructor(data: number[] = []) {
    this._data = data;
    this._size = data.length;
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

    return new NumericList(newData);
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

    // Optimize for append operation (which benchmarks showed is already fast)
    if (index === this._size) {
      const newData = [...this._data, value];
      return new NumericList(newData);
    }

    // Optimize for prepend operation (which benchmarks showed is slow)
    if (index === 0) {
      const newData = [value, ...this._data];
      return new NumericList(newData);
    }

    // General case
    const newData = [
      ...this._data.slice(0, index),
      value,
      ...this._data.slice(index)
    ];

    return new NumericList(newData);
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

    return new NumericList(newData);
  }

  /**
   * Append an element to the end of the list
   *
   * @param value - The value to append
   * @returns A new list with the appended element
   */
  append(value: number): IList<number> {
    // Direct implementation for append which benchmarks showed is already fast
    return new NumericList([...this._data, value]);
  }

  /**
   * Prepend an element to the beginning of the list
   *
   * @param value - The value to prepend
   * @returns A new list with the prepended element
   */
  prepend(value: number): IList<number> {
    // Optimized implementation for prepend which benchmarks showed is slow
    return new NumericList([value, ...this._data]);
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

    const result = new NumericList(newData.slice(0, newSize));
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
    // If the result is numeric, use NumericList
    if (typeof fn(this._data[0], 0) === 'number') {
      // Use pooled array for better memory efficiency
      const newData = getPooledArray<number>(this._size);

      // Direct loop is faster than array.map for large collections
      for (let i = 0; i < this._size; i++) {
        newData[i] = fn(this._data[i], i) as unknown as number;
      }

      const result = new NumericList(newData.slice(0, this._size)) as unknown as IList<U>;
      releasePooledArray(newData);
      return result;
    }

    // For non-numeric results, use CompactList
    const newData = getPooledArray<U>(this._size);

    for (let i = 0; i < this._size; i++) {
      newData[i] = fn(this._data[i], i);
    }

    const result = new CompactList<U>(newData.slice(0, this._size));
    releasePooledArray(newData);
    return result;
  }

  /**
   * Filter elements based on a predicate
   *
   * @param fn - The filter predicate
   * @returns A new list with the filtered elements
   */
  filter(fn: (value: number, index: number) => boolean): IList<number> {
    // For small lists, use native filter which is well-optimized
    if (this._size < 1000) {
      return new NumericList(this._data.filter(fn));
    }

    // For larger lists, use a more efficient implementation
    const result: number[] = [];

    for (let i = 0; i < this._size; i++) {
      const value = this._data[i];
      if (fn(value, i)) {
        result.push(value);
      }
    }

    return new NumericList(result);
  }

  /**
   * Reduce the list to a single value
   *
   * @param fn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  reduce<U>(fn: (accumulator: U, value: number, index: number) => U, initial: U): U {
    // Benchmarks showed reduce is already relatively fast
    // Use direct loop for better performance on large collections
    let result = initial;

    for (let i = 0; i < this._size; i++) {
      result = fn(result, this._data[i], i);
    }

    return result;
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
    return `NumericList(${this._size}) [ ${this._data.slice(0, 3).join(', ')}${this._size > 3 ? ', ...' : ''} ]`;
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
    // If the result is numeric, use NumericList
    if (typeof mapFn(this._data[0], 0) === 'number') {
      const result: number[] = [];

      for (let i = 0; i < this._size; i++) {
        const mappedValue = mapFn(this._data[i], i) as unknown as number;
        if (filterFn(mappedValue as unknown as U, i)) {
          result.push(mappedValue);
        }
      }

      return new NumericList(result) as unknown as IList<U>;
    }

    // For non-numeric results, use CompactList
    const result: U[] = [];

    for (let i = 0; i < this._size; i++) {
      const mappedValue = mapFn(this._data[i], i);
      if (filterFn(mappedValue, i)) {
        result.push(mappedValue);
      }
    }

    return new CompactList<U>(result);
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
    // If the result is numeric, use NumericList
    if (typeof mapFn(this._data[0], 0) === 'number') {
      const result: number[] = [];

      for (let i = 0; i < this._size; i++) {
        const value = this._data[i];
        if (filterFn(value, i)) {
          result.push(mapFn(value, i) as unknown as number);
        }
      }

      return new NumericList(result) as unknown as IList<U>;
    }

    // For non-numeric results, use CompactList
    const result: U[] = [];

    for (let i = 0; i < this._size; i++) {
      const value = this._data[i];
      if (filterFn(value, i)) {
        result.push(mapFn(value, i));
      }
    }

    return new CompactList<U>(result);
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
    let result = initial;

    for (let i = 0; i < this._size; i++) {
      const mappedValue = mapFn(this._data[i], i);
      result = reduceFn(result, mappedValue, i);
    }

    return result;
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
    let result = initial;
    let resultIndex = 0;

    for (let i = 0; i < this._size; i++) {
      const value = this._data[i];
      if (filterFn(value, i)) {
        result = reduceFn(result, value, resultIndex++);
      }
    }

    return result;
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
    let result = initial;
    let resultIndex = 0;

    for (let i = 0; i < this._size; i++) {
      const mappedValue = mapFn(this._data[i], i);
      if (filterFn(mappedValue, i)) {
        result = reduceFn(result, mappedValue, resultIndex++);
      }
    }

    return result;
  }

  /**
   * Specialized numeric sum operation
   *
   * @returns The sum of all elements in the list
   */
  sum(): number {
    let sum = 0;
    for (let i = 0; i < this._size; i++) {
      sum += this._data[i];
    }
    return sum;
  }

  /**
   * Specialized numeric average operation
   *
   * @returns The average of all elements in the list
   */
  average(): number {
    if (this._size === 0) {
      return 0;
    }
    return this.sum() / this._size;
  }

  /**
   * Specialized numeric min operation
   *
   * @returns The minimum value in the list
   */
  min(): number {
    if (this._size === 0) {
      return Infinity;
    }

    let min = this._data[0];
    for (let i = 1; i < this._size; i++) {
      if (this._data[i] < min) {
        min = this._data[i];
      }
    }

    return min;
  }

  /**
   * Specialized numeric max operation
   *
   * @returns The maximum value in the list
   */
  max(): number {
    if (this._size === 0) {
      return -Infinity;
    }

    let max = this._data[0];
    for (let i = 1; i < this._size; i++) {
      if (this._data[i] > max) {
        max = this._data[i];
      }
    }

    return max;
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

    return new NumericList(newData);
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
      return new NumericList([]);
    }

    return new NumericList(this._data.slice(start, end));
  }

  /**
   * Find the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The first element that satisfies the predicate, or undefined if none is found
   */
  find(fn: (value: number, index: number) => boolean): number | undefined {
    for (let i = 0; i < this._size; i++) {
      const value = this._data[i];
      if (fn(value, i)) {
        return value;
      }
    }
    return undefined;
  }

  /**
   * Find the index of the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The index of the first element that satisfies the predicate, or -1 if none is found
   */
  findIndex(fn: (value: number, index: number) => boolean): number {
    for (let i = 0; i < this._size; i++) {
      if (fn(this._data[i], i)) {
        return i;
      }
    }
    return -1;
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
        return new NumericList(data);
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
}
