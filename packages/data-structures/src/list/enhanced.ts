/**
 * Enhanced List Implementation
 *
 * This implementation uses specialized optimizations based on our benchmark findings.
 * It automatically selects the most efficient implementation based on the data type and size.
 */

import { IList, TransientList } from './types';
import { createOptimizedList, createNumericList, createPersistentVector } from './optimized/factory';
import { isNumericArray, isStringArray } from './type-detection';
import { NumericList } from './optimized/numeric-list';
import { StringList } from './optimized/string-list';

/**
 * Enhanced List class that automatically selects the most efficient implementation
 */
export class List<T> implements IList<T> {
  private _impl: IList<T>;

  /**
   * Create a new List
   *
   * @param data - Initial data array
   */
  private constructor(impl: IList<T>) {
    this._impl = impl;
  }

  /**
   * Create a List from an array
   *
   * @param data - The array to create a List from
   * @returns A new List
   */
  static from<T>(data: T[]): List<T> {
    // Use specialized implementations based on data type
    if (isNumericArray(data)) {
      // For large numeric arrays, use persistent vector
      if (data.length > 1000) {
        return new List<T>(createPersistentVector(data) as IList<T>);
      }
      // For smaller numeric arrays, use the factory function which will use WebAssembly if available
      return new List<T>(createNumericList(data as unknown as number[]) as unknown as IList<T>);
    }

    if (isStringArray(data)) {
      return new List<T>(new StringList(data as unknown as string[]) as unknown as IList<T>);
    }

    // Use the optimized implementation for other types
    return new List<T>(createOptimizedList(data));
  }

  /**
   * Create an empty List
   *
   * @returns An empty List
   */
  static empty<T>(): List<T> {
    return new List<T>(createOptimizedList<T>([]));
  }

  /**
   * Create a List of the specified size with the same value
   *
   * @param size - The size of the List
   * @param value - The value to fill the List with
   * @returns A new List
   */
  static of<T>(size: number, value: T): List<T> {
    const data = Array(size).fill(value);
    return List.from(data);
  }

  /**
   * Create a List from a range of numbers
   *
   * @param start - The start of the range (inclusive)
   * @param end - The end of the range (exclusive)
   * @param step - The step between values
   * @returns A new List
   */
  static range(start: number, end: number, step: number = 1): List<number> {
    const size = Math.max(0, Math.ceil((end - start) / step));
    const data = Array(size);

    for (let i = 0; i < size; i++) {
      data[i] = start + i * step;
    }

    // Use the factory function which will use WebAssembly if available
    return new List<number>(createNumericList(data));
  }

  /**
   * Get the size of the list
   */
  get size(): number {
    return this._impl.size;
  }

  /**
   * Check if the list is empty
   */
  get isEmpty(): boolean {
    return this._impl.isEmpty;
  }

  /**
   * Get an element at the specified index
   *
   * @param index - The index to get
   * @returns The element at the index, or undefined if out of bounds
   */
  get(index: number): T | undefined {
    return this._impl.get(index);
  }

  /**
   * Set an element at the specified index
   *
   * @param index - The index to set
   * @param value - The value to set
   * @returns A new list with the updated element
   */
  set(index: number, value: T): IList<T> {
    return new List<T>(this._impl.set(index, value));
  }

  /**
   * Insert an element at the specified index
   *
   * @param index - The index to insert at
   * @param value - The value to insert
   * @returns A new list with the inserted element
   */
  insert(index: number, value: T): IList<T> {
    return new List<T>(this._impl.insert(index, value));
  }

  /**
   * Remove an element at the specified index
   *
   * @param index - The index to remove
   * @returns A new list with the element removed
   */
  remove(index: number): IList<T> {
    return new List<T>(this._impl.remove(index));
  }

  /**
   * Append an element to the end of the list
   *
   * @param value - The value to append
   * @returns A new list with the appended element
   */
  append(value: T): IList<T> {
    return new List<T>(this._impl.append(value));
  }

  /**
   * Prepend an element to the beginning of the list
   *
   * @param value - The value to prepend
   * @returns A new list with the prepended element
   */
  prepend(value: T): IList<T> {
    return new List<T>(this._impl.prepend(value));
  }

  /**
   * Concatenate this list with another list
   *
   * @param other - The other list to concatenate with
   * @returns A new list with the concatenated elements
   */
  concat(other: IList<T>): IList<T> {
    if (other instanceof List) {
      return new List<T>(this._impl.concat(other._impl));
    }
    return new List<T>(this._impl.concat(other));
  }

  /**
   * Map each element to a new value
   *
   * @param fn - The mapping function
   * @returns A new list with the mapped elements
   */
  map<U>(fn: (value: T, index: number) => U): IList<U> {
    return new List<U>(this._impl.map(fn));
  }

  /**
   * Filter elements based on a predicate
   *
   * @param fn - The filter predicate
   * @returns A new list with the filtered elements
   */
  filter(fn: (value: T, index: number) => boolean): IList<T> {
    return new List<T>(this._impl.filter(fn));
  }

  /**
   * Reduce the list to a single value
   *
   * @param fn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  reduce<U>(fn: (accumulator: U, value: T, index: number) => U, initial: U): U {
    return this._impl.reduce(fn, initial);
  }

  /**
   * Convert the list to an array
   *
   * @returns An array containing the elements of the list
   */
  toArray(): T[] {
    return this._impl.toArray();
  }

  /**
   * Create a string representation of the list
   *
   * @returns A string representation of the list
   */
  toString(): string {
    return `List(${this.size}) [ ${this.toArray().slice(0, 3).join(', ')}${this.size > 3 ? ', ...' : ''} ]`;
  }

  /**
   * Find the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The first element that satisfies the predicate, or undefined if none is found
   */
  find(fn: (value: T, index: number) => boolean): T | undefined {
    return this._impl.find(fn);
  }

  /**
   * Find the index of the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The index of the first element that satisfies the predicate, or -1 if none is found
   */
  findIndex(fn: (value: T, index: number) => boolean): number {
    return this._impl.findIndex(fn);
  }

  /**
   * Create a transient (temporarily mutable) version of the list
   *
   * @returns A transient list with the current values
   */
  transient(): TransientList<T> {
    return this._impl.transient();
  }

  /**
   * Get the first element in the list
   *
   * @returns The first element, or undefined if the list is empty
   */
  first(): T | undefined {
    return this._impl.first();
  }

  /**
   * Get the last element in the list
   *
   * @returns The last element, or undefined if the list is empty
   */
  last(): T | undefined {
    return this._impl.last();
  }

  /**
   * Optimized implementation for map and slice operations in a single pass
   *
   * @param mapFn - The mapping function
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new list with mapped and sliced elements
   */
  mapSlice<U>(
    mapFn: (value: T, index: number) => U,
    start: number = 0,
    end: number = this.size
  ): IList<U> {
    // Normalize indices
    start = start < 0 ? Math.max(0, this.size + start) : Math.min(this.size, start);
    end = end < 0 ? Math.max(0, this.size + end) : Math.min(this.size, end);

    if (start >= end) {
      return List.empty<U>();
    }

    const result: U[] = [];

    for (let i = start; i < end; i++) {
      const value = this.get(i);
      if (value !== undefined) {
        result.push(mapFn(value, i));
      }
    }

    return List.from(result);
  }

  /**
   * Optimized implementation for slice and map operations in a single pass
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @param mapFn - The mapping function
   * @returns A new list with sliced and mapped elements
   */
  sliceMap<U>(
    start: number,
    end: number | undefined,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    return this.mapSlice(mapFn, start, end);
  }

  /**
   * Optimized implementation for filter and slice operations in a single pass
   *
   * @param filterFn - The filter predicate
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new list with filtered and sliced elements
   */
  filterSlice(
    filterFn: (value: T, index: number) => boolean,
    start: number = 0,
    end: number = this.size
  ): IList<T> {
    // Normalize indices
    start = start < 0 ? Math.max(0, this.size + start) : Math.min(this.size, start);
    end = end < 0 ? Math.max(0, this.size + end) : Math.min(this.size, end);

    if (start >= end) {
      return List.empty<T>();
    }

    const result: T[] = [];

    for (let i = start; i < end; i++) {
      const value = this.get(i);
      if (value !== undefined && filterFn(value, i)) {
        result.push(value);
      }
    }

    return List.from(result);
  }

  /**
   * Optimized implementation for slice and filter operations in a single pass
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @param filterFn - The filter predicate
   * @returns A new list with sliced and filtered elements
   */
  sliceFilter(
    start: number,
    end: number | undefined,
    filterFn: (value: T, index: number) => boolean
  ): IList<T> {
    return this.filterSlice(filterFn, start, end);
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
    // Use specialized implementation if available
    if ('mapFilter' in this._impl) {
      return new List<U>((this._impl as any).mapFilter(mapFn, filterFn));
    }

    // Fallback implementation
    const mapped = this.map(mapFn);
    return mapped instanceof List ? mapped.filter(filterFn) : new List<U>(mapped.filter(filterFn));
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
    // Use specialized implementation if available
    if ('filterMap' in this._impl) {
      return new List<U>((this._impl as any).filterMap(filterFn, mapFn));
    }

    // Fallback implementation
    const filtered = this.filter(filterFn);
    return filtered instanceof List ? filtered.map(mapFn) : new List<U>(filtered.map(mapFn));
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
    // Use specialized implementation if available
    if ('mapReduce' in this._impl) {
      return (this._impl as any).mapReduce(mapFn, reduceFn, initial);
    }

    // Optimized implementation
    let result = initial;

    for (let i = 0; i < this.size; i++) {
      const value = this.get(i);
      if (value !== undefined) {
        const mappedValue = mapFn(value, i);
        result = reduceFn(result, mappedValue, i);
      }
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
    // Use specialized implementation if available
    if ('filterReduce' in this._impl) {
      return (this._impl as any).filterReduce(filterFn, reduceFn, initial);
    }

    // Optimized implementation
    let result = initial;
    let resultIndex = 0;

    for (let i = 0; i < this.size; i++) {
      const value = this.get(i);
      if (value !== undefined && filterFn(value, i)) {
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
    // Use specialized implementation if available
    if ('mapFilterReduce' in this._impl) {
      return (this._impl as any).mapFilterReduce(mapFn, filterFn, reduceFn, initial);
    }

    // Optimized implementation
    let result = initial;
    let resultIndex = 0;

    for (let i = 0; i < this.size; i++) {
      const value = this.get(i);
      if (value !== undefined) {
        const mappedValue = mapFn(value, i);
        if (filterFn(mappedValue, i)) {
          result = reduceFn(result, mappedValue, resultIndex++);
        }
      }
    }

    return result;
  }

  /**
   * Optimized implementation for concat and map operations in a single pass
   *
   * @param other - The list to concatenate
   * @param mapFn - The mapping function
   * @returns A new list with concatenated and mapped elements
   */
  concatMap<U>(
    other: IList<T>,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    const result: U[] = [];
    let index = 0;

    // Map this list
    for (let i = 0; i < this.size; i++) {
      const value = this.get(i);
      if (value !== undefined) {
        result.push(mapFn(value, index++));
      }
    }

    // Map other list
    for (let i = 0; i < other.size; i++) {
      const value = other.get(i);
      if (value !== undefined) {
        result.push(mapFn(value, index++));
      }
    }

    return List.from(result);
  }

  /**
   * Optimized implementation for map and concat operations in a single pass
   *
   * @param other - The list to concatenate
   * @param mapFn - The mapping function
   * @returns A new list with mapped and concatenated elements
   */
  mapConcat<U>(
    other: IList<T>,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    return this.concatMap(other, mapFn);
  }

  /**
   * Optimized batch update operation
   *
   * @param updates - Array of [index, value] pairs
   * @returns A new list with all updates applied
   */
  batchUpdate(updates: Array<[number, T]>): IList<T> {
    // Use specialized implementation if available
    if ('batchUpdate' in this._impl) {
      return new List<T>((this._impl as any).batchUpdate(updates));
    }

    // Fallback implementation - create a new array with all updates applied at once
    const newData = this.toArray();

    for (const [index, value] of updates) {
      if (index >= 0 && index < this.size) {
        newData[index] = value;
      }
    }

    return List.from(newData);
  }

  /**
   * Create a slice of the list
   *
   * @param start - The start index
   * @param end - The end index (exclusive)
   * @returns A new list with the sliced elements
   */
  slice(start: number = 0, end: number = this.size): IList<T> {
    // Use specialized implementation if available
    if ('slice' in this._impl) {
      return new List<T>((this._impl as any).slice(start, end));
    }

    // Fallback implementation
    const result: T[] = [];

    // Normalize indices
    start = start < 0 ? Math.max(0, this.size + start) : Math.min(this.size, start);
    end = end < 0 ? Math.max(0, this.size + end) : Math.min(this.size, end);

    for (let i = start; i < end; i++) {
      const value = this.get(i);
      if (value !== undefined) {
        result.push(value);
      }
    }

    return List.from(result);
  }

  /**
   * Check if this list is a numeric list
   *
   * @returns True if this is a numeric list
   */
  isNumericList(): boolean {
    return this._impl instanceof NumericList ||
           (this._impl.constructor && this._impl.constructor.name === 'WasmNumericList') ||
           (this._impl.constructor && this._impl.constructor.name === 'WasmHAMTPersistentVector');
  }

  /**
   * Check if this list is a string list
   *
   * @returns True if this is a string list
   */
  isStringList(): boolean {
    return this._impl instanceof StringList;
  }

  /**
   * Get specialized numeric operations if this is a numeric list
   *
   * @returns Numeric operations or undefined
   */
  asNumeric(): NumericOperations | undefined {
    if (this.isNumericList()) {
      const numericList = this._impl as any;
      const ops: NumericOperations = {
        sum: () => numericList.sum(),
        average: () => numericList.average(),
        min: () => numericList.min(),
        max: () => numericList.max()
      };

      // Add statistical operations if available
      if (typeof numericList.median === 'function') {
        ops.median = () => numericList.median();
      }

      if (typeof numericList.standardDeviation === 'function') {
        ops.standardDeviation = () => numericList.standardDeviation();
      }

      if (typeof numericList.percentile === 'function') {
        ops.percentile = (percentile: number) => numericList.percentile(percentile);
      }

      if (typeof numericList.sort === 'function') {
        ops.sort = (compareFn?: (a: number, b: number) => number) =>
          new List<number>(numericList.sort(compareFn));
      }

      return ops;
    }
    return undefined;
  }

  /**
   * Get specialized string operations if this is a string list
   *
   * @returns String operations or undefined
   */
  asString(): StringOperations | undefined {
    if (this.isStringList()) {
      const stringList = this._impl as unknown as StringList;
      return {
        join: (separator?: string) => stringList.join(separator),
        toUpperCase: () => new List<string>(stringList.toUpperCase()),
        toLowerCase: () => new List<string>(stringList.toLowerCase())
      };
    }
    return undefined;
  }
}

/**
 * Specialized operations for numeric lists
 */
export interface NumericOperations {
  sum(): number;
  average(): number;
  min(): number;
  max(): number;
  median?(): number;
  standardDeviation?(): number;
  percentile?(percentile: number): number;
  sort?(compareFn?: (a: number, b: number) => number): IList<number>;
}

/**
 * Specialized operations for string lists
 */
export interface StringOperations {
  join(separator?: string): string;
  toUpperCase(): IList<string>;
  toLowerCase(): IList<string>;
}
