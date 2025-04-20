/**
 * ObjectList - Specialized implementation for object data
 * 
 * This implementation is optimized for object operations based on
 * our benchmark findings, which showed that object operations have
 * a significant performance gap compared to native arrays.
 */

import { IList, TransientList } from '../types';
import { getPooledArray, releasePooledArray } from '../../memory/pool';
import { CompactList } from './compact-list';

/**
 * A specialized list implementation for object data
 */
export class ObjectList<T extends object> implements IList<T> {
  private _data: T[];
  private _size: number;
  private _keyCache: Map<string, any[]> = new Map();

  /**
   * Create a new ObjectList
   * 
   * @param data - Initial data array
   */
  constructor(data: T[] = []) {
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
  get(index: number): T | undefined {
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
  set(index: number, value: T): IList<T> {
    if (index < 0 || index >= this._size) {
      return this;
    }

    // Create a new array with the updated element
    const newData = this._data.slice();
    newData[index] = value;
    
    return new ObjectList<T>(newData);
  }

  /**
   * Insert an element at the specified index
   * 
   * @param index - The index to insert at
   * @param value - The value to insert
   * @returns A new list with the inserted element
   */
  insert(index: number, value: T): IList<T> {
    if (index < 0) {
      index = 0;
    }
    if (index > this._size) {
      index = this._size;
    }

    // Optimize for append operation (which benchmarks showed is already fast)
    if (index === this._size) {
      const newData = [...this._data, value];
      return new ObjectList<T>(newData);
    }

    // Optimize for prepend operation (which benchmarks showed is slow)
    if (index === 0) {
      const newData = [value, ...this._data];
      return new ObjectList<T>(newData);
    }

    // General case
    const newData = [
      ...this._data.slice(0, index),
      value,
      ...this._data.slice(index)
    ];
    
    return new ObjectList<T>(newData);
  }

  /**
   * Remove an element at the specified index
   * 
   * @param index - The index to remove
   * @returns A new list with the element removed
   */
  remove(index: number): IList<T> {
    if (index < 0 || index >= this._size) {
      return this;
    }

    const newData = [
      ...this._data.slice(0, index),
      ...this._data.slice(index + 1)
    ];
    
    return new ObjectList<T>(newData);
  }

  /**
   * Append an element to the end of the list
   * 
   * @param value - The value to append
   * @returns A new list with the appended element
   */
  append(value: T): IList<T> {
    // Direct implementation for append which benchmarks showed is already fast
    return new ObjectList<T>([...this._data, value]);
  }

  /**
   * Prepend an element to the beginning of the list
   * 
   * @param value - The value to prepend
   * @returns A new list with the prepended element
   */
  prepend(value: T): IList<T> {
    // Optimized implementation for prepend which benchmarks showed is slow
    return new ObjectList<T>([value, ...this._data]);
  }

  /**
   * Concatenate this list with another list
   * 
   * @param other - The other list to concatenate with
   * @returns A new list with the concatenated elements
   */
  concat(other: IList<T>): IList<T> {
    if (other.isEmpty) {
      return this;
    }

    if (this.isEmpty) {
      return other;
    }

    // Use pooled array for better memory efficiency
    const newSize = this._size + other.size;
    const newData = getPooledArray<T>(newSize);
    
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
    
    const result = new ObjectList<T>(newData.slice(0, newSize));
    releasePooledArray(newData);
    return result;
  }

  /**
   * Map each element to a new value
   * 
   * @param fn - The mapping function
   * @returns A new list with the mapped elements
   */
  map<U>(fn: (value: T, index: number) => U): IList<U> {
    // If the result is an object, use ObjectList
    if (typeof fn(this._data[0], 0) === 'object' && fn(this._data[0], 0) !== null) {
      // Use pooled array for better memory efficiency
      const newData = getPooledArray<U>(this._size);
      
      // Direct loop is faster than array.map for large collections
      for (let i = 0; i < this._size; i++) {
        newData[i] = fn(this._data[i], i);
      }
      
      const result = new ObjectList<U & object>(newData.slice(0, this._size) as unknown as (U & object)[]) as unknown as IList<U>;
      releasePooledArray(newData);
      return result;
    }
    
    // For non-object results, use CompactList
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
  filter(fn: (value: T, index: number) => boolean): IList<T> {
    // For small lists, use native filter which is well-optimized
    if (this._size < 1000) {
      return new ObjectList<T>(this._data.filter(fn));
    }
    
    // For larger lists, use a more efficient implementation
    const result: T[] = [];
    
    for (let i = 0; i < this._size; i++) {
      const value = this._data[i];
      if (fn(value, i)) {
        result.push(value);
      }
    }
    
    return new ObjectList<T>(result);
  }

  /**
   * Reduce the list to a single value
   * 
   * @param fn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  reduce<U>(fn: (accumulator: U, value: T, index: number) => U, initial: U): U {
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
  toArray(): T[] {
    return this._data.slice();
  }

  /**
   * Create a string representation of the list
   * 
   * @returns A string representation of the list
   */
  toString(): string {
    return `ObjectList(${this._size}) [ ${this._data.slice(0, 3).map(x => JSON.stringify(x)).join(', ')}${this._size > 3 ? ', ...' : ''} ]`;
  }

  /**
   * Optimized implementation for map followed by filter
   * 
   * @param mapFn - The mapping function
   * @param filterFn - The filter predicate
   * @returns A new list with the mapped and filtered elements
   */
  mapFilter<U>(
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean
  ): IList<U> {
    // If the result is an object, use ObjectList
    if (typeof mapFn(this._data[0], 0) === 'object' && mapFn(this._data[0], 0) !== null) {
      const result: U[] = [];
      
      for (let i = 0; i < this._size; i++) {
        const mappedValue = mapFn(this._data[i], i);
        if (filterFn(mappedValue, i)) {
          result.push(mappedValue);
        }
      }
      
      return new ObjectList<U & object>(result as unknown as (U & object)[]) as unknown as IList<U>;
    }
    
    // For non-object results, use CompactList
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
    filterFn: (value: T, index: number) => boolean,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    // If the result is an object, use ObjectList
    if (typeof mapFn(this._data[0], 0) === 'object' && mapFn(this._data[0], 0) !== null) {
      const result: U[] = [];
      
      for (let i = 0; i < this._size; i++) {
        const value = this._data[i];
        if (filterFn(value, i)) {
          result.push(mapFn(value, i));
        }
      }
      
      return new ObjectList<U & object>(result as unknown as (U & object)[]) as unknown as IList<U>;
    }
    
    // For non-object results, use CompactList
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
    mapFn: (value: T, index: number) => U,
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
    filterFn: (value: T, index: number) => boolean,
    reduceFn: (accumulator: U, value: T, index: number) => U,
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
    mapFn: (value: T, index: number) => U,
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
   * Optimized batch update operation
   * 
   * @param updates - Array of [index, value] pairs
   * @returns A new list with all updates applied
   */
  batchUpdate(updates: Array<[number, T]>): IList<T> {
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
    
    return new ObjectList<T>(newData);
  }

  /**
   * Create a slice of the list
   * 
   * @param start - The start index
   * @param end - The end index (exclusive)
   * @returns A new list with the sliced elements
   */
  slice(start: number = 0, end: number = this._size): IList<T> {
    // Normalize indices
    start = start < 0 ? Math.max(0, this._size + start) : Math.min(this._size, start);
    end = end < 0 ? Math.max(0, this._size + end) : Math.min(this._size, end);
    
    if (start >= end) {
      return new ObjectList<T>([]);
    }
    
    return new ObjectList<T>(this._data.slice(start, end));
  }

  /**
   * Find the first element in the list that satisfies a predicate
   * 
   * @param fn - The predicate function
   * @returns The first element that satisfies the predicate, or undefined if none is found
   */
  find(fn: (value: T, index: number) => boolean): T | undefined {
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
  findIndex(fn: (value: T, index: number) => boolean): number {
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
  transient(): TransientList<T> {
    // Simple implementation that just returns a mutable wrapper
    const data = this._data.slice();
    
    return {
      append(value: T): TransientList<T> {
        data.push(value);
        return this;
      },
      prepend(value: T): TransientList<T> {
        data.unshift(value);
        return this;
      },
      set(index: number, value: T): TransientList<T> {
        if (index >= 0 && index < data.length) {
          data[index] = value;
        }
        return this;
      },
      persistent(): IList<T> {
        return new ObjectList<T>(data);
      }
    };
  }

  /**
   * Get the first element in the list
   * 
   * @returns The first element, or undefined if the list is empty
   */
  first(): T | undefined {
    return this._size > 0 ? this._data[0] : undefined;
  }

  /**
   * Get the last element in the list
   * 
   * @returns The last element, or undefined if the list is empty
   */
  last(): T | undefined {
    return this._size > 0 ? this._data[this._size - 1] : undefined;
  }

  /**
   * Extract a specific property from all objects in the list
   * 
   * @param key - The property key to extract
   * @returns A new list containing the extracted property values
   */
  pluck<K extends keyof T>(key: K): IList<T[K]> {
    // Check if we have a cached result
    const cacheKey = String(key);
    if (this._keyCache.has(cacheKey)) {
      return new CompactList<T[K]>(this._keyCache.get(cacheKey) as T[K][]);
    }
    
    // Use pooled array for better memory efficiency
    const result = getPooledArray<T[K]>(this._size);
    
    for (let i = 0; i < this._size; i++) {
      result[i] = this._data[i][key];
    }
    
    const finalResult = result.slice(0, this._size);
    
    // Cache the result
    this._keyCache.set(cacheKey, finalResult as any[]);
    
    releasePooledArray(result);
    return new CompactList<T[K]>(finalResult);
  }

  /**
   * Group objects by a specific property
   * 
   * @param key - The property key to group by
   * @returns A Map where keys are property values and values are lists of objects
   */
  groupBy<K extends keyof T>(key: K): Map<T[K], IList<T>> {
    const groups = new Map<T[K], T[]>();
    
    for (let i = 0; i < this._size; i++) {
      const item = this._data[i];
      const groupKey = item[key];
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      
      groups.get(groupKey)!.push(item);
    }
    
    // Convert arrays to lists
    const result = new Map<T[K], IList<T>>();
    
    for (const [groupKey, items] of groups.entries()) {
      result.set(groupKey, new ObjectList<T>(items));
    }
    
    return result;
  }

  /**
   * Find objects where the specified property equals the given value
   * 
   * @param key - The property key to check
   * @param value - The value to compare against
   * @returns A new list containing objects where the property equals the value
   */
  findByProperty<K extends keyof T>(key: K, value: T[K]): IList<T> {
    const result: T[] = [];
    
    for (let i = 0; i < this._size; i++) {
      const item = this._data[i];
      if (item[key] === value) {
        result.push(item);
      }
    }
    
    return new ObjectList<T>(result);
  }

  /**
   * Sort objects by a specific property
   * 
   * @param key - The property key to sort by
   * @param direction - The sort direction (1 for ascending, -1 for descending)
   * @returns A new list with sorted objects
   */
  sortBy<K extends keyof T>(key: K, direction: 1 | -1 = 1): IList<T> {
    const newData = this._data.slice();
    
    newData.sort((a, b) => {
      if (a[key] < b[key]) return -1 * direction;
      if (a[key] > b[key]) return 1 * direction;
      return 0;
    });
    
    return new ObjectList<T>(newData);
  }
}
