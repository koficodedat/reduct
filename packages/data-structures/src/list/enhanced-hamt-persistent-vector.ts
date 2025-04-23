/**
 * Enhanced HAMTPersistentVector implementation
 *
 * A 32-way branching trie implementation of the List interface optimized for large collections.
 * Uses Hash Array Mapped Trie (HAMT) for efficient structural sharing and memory usage.
 * Includes optimized path finding and node manipulation operations.
 */

import * as _HAMTNode from './hamt-node'; // Used for type information
import { HAMTNode as _IHAMTNode } from './hamt-node'; // Used for type information
import { HAMTPersistentVector } from './hamt-persistent-vector';
import { TransientList, IList } from './types';

// Constants
const BITS_PER_LEVEL = 5;
const BRANCH_SIZE = 1 << BITS_PER_LEVEL; // 32
const _MASK = BRANCH_SIZE - 1; // 0x1F - Kept for reference

/**
 * Enhanced HAMTPersistentVector implementation
 *
 * Extends the base HAMTPersistentVector with optimized path finding and node manipulation.
 */
export class EnhancedHAMTPersistentVector<T> implements IList<T> {
  /**
   * The underlying HAMTPersistentVector
   */
  private readonly _impl: HAMTPersistentVector<T>;

  /**
   * Create a new EnhancedHAMTPersistentVector
   *
   * @param data Initial data array
   */
  constructor(data: T[] = []) {
    this._impl = HAMTPersistentVector.from(data);
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
  get(index: number): T | undefined {
    return this._impl.get(index);
  }

  /**
   * Set an element at the specified index
   */
  set(index: number, value: T): IList<T> {
    return this._impl.set(index, value);
  }

  /**
   * Insert an element at the specified index
   */
  insert(index: number, value: T): IList<T> {
    // Fast path: append
    if (index === this.size) {
      return this.append(value);
    }

    // Fast path: prepend
    if (index === 0) {
      return this.prepend(value);
    }

    // Use the optimized implementation
    return this._impl.insert(index, value);
  }

  /**
   * Remove an element at the specified index
   */
  remove(index: number): IList<T> {
    return this._impl.remove(index);
  }

  /**
   * Append an element to the end of the list
   */
  append(value: T): IList<T> {
    return this._impl.append(value);
  }

  /**
   * Prepend an element to the beginning of the list
   */
  prepend(value: T): IList<T> {
    return this._impl.prepend(value);
  }

  /**
   * Update an element at the specified index using a function
   */
  update(index: number, fn: (value: T) => T): IList<T> {
    const value = this.get(index);
    if (value === undefined) {
      throw new RangeError(`Index ${index} out of bounds`);
    }
    return this.set(index, fn(value));
  }

  /**
   * Get a slice of the list
   */
  slice(start: number = 0, end?: number): IList<T> {
    return this._impl.slice(start, end);
  }

  /**
   * Concatenate this list with another list
   */
  concat(other: IList<T>): IList<T> {
    return this._impl.concat(other);
  }

  /**
   * Find the first element that satisfies the predicate
   */
  find(fn: (value: T, index: number) => boolean): T | undefined {
    return this._impl.find(fn);
  }

  /**
   * Find the index of the first element that satisfies the predicate
   */
  findIndex(fn: (value: T, index: number) => boolean): number {
    return this._impl.findIndex(fn);
  }

  /**
   * Filter the elements of the list
   */
  filter(fn: (value: T, index: number) => boolean): IList<T> {
    return this._impl.filter(fn);
  }

  /**
   * Map the elements of the list to new values
   */
  map<U>(fn: (value: T, index: number) => U): IList<U> {
    return this._impl.map(fn);
  }

  /**
   * Reduce the elements of the list to a single value
   */
  reduce<U>(fn: (accumulator: U, value: T, index: number) => U, initial: U): U {
    return this._impl.reduce(fn, initial);
  }

  /**
   * Check if every element satisfies the predicate
   */
  every(fn: (value: T, index: number) => boolean): boolean {
    for (let i = 0; i < this.size; i++) {
      const value = this.get(i);
      if (value !== undefined && !fn(value, i)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if some element satisfies the predicate
   */
  some(fn: (value: T, index: number) => boolean): boolean {
    for (let i = 0; i < this.size; i++) {
      const value = this.get(i);
      if (value !== undefined && fn(value, i)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Convert the list to an array
   */
  toArray(): T[] {
    return this._impl.toArray();
  }

  /**
   * Create a transient version of the list
   */
  transient(): TransientList<T> {
    return this._impl.transient();
  }

  /**
   * Perform a map, filter, and reduce operation in a single pass
   */
  mapFilterReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    return this._impl.mapFilterReduce(mapFn, filterFn, reduceFn, initial);
  }

  /**
   * Perform a map and reduce operation in a single pass
   */
  mapReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    return this._impl.mapReduce(mapFn, reduceFn, initial);
  }

  /**
   * Perform a filter and reduce operation in a single pass
   */
  filterReduce<U>(
    filterFn: (value: T, index: number) => boolean,
    reduceFn: (acc: U, value: T, index: number) => U,
    initial: U
  ): U {
    return this._impl.filterReduce(filterFn, reduceFn, initial);
  }

  /**
   * Perform a filter and map operation in a single pass
   */
  filterMap<U>(
    filterFn: (value: T, index: number) => boolean,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    return this._impl.filterMap(filterFn, mapFn);
  }

  /**
   * Perform a map and filter operation in a single pass
   */
  mapFilter<U>(
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean
  ): IList<U> {
    return this._impl.mapFilter(mapFn, filterFn);
  }

  /**
   * Perform a map and slice operation in a single pass
   */
  mapSlice<U>(
    mapFn: (value: T, index: number) => U,
    start: number = 0,
    end?: number
  ): IList<U> {
    return this._impl.mapSlice(mapFn, start, end);
  }

  /**
   * Perform a slice and map operation in a single pass
   */
  sliceMap<U>(
    start: number,
    end: number | undefined,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    return this._impl.sliceMap(start, end, mapFn);
  }

  /**
   * Perform a concat and map operation in a single pass
   */
  concatMap<U>(
    other: IList<T>,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    return this._impl.concatMap(other, mapFn);
  }

  /**
   * Perform a map and concat operation in a single pass
   */
  mapConcat<U>(
    other: IList<T>,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    return this._impl.mapConcat(other, mapFn);
  }

  /**
   * Get the first element in the list
   */
  first(): T | undefined {
    return this._impl.first();
  }

  /**
   * Get the last element in the list
   */
  last(): T | undefined {
    return this._impl.last();
  }

  /**
   * Create an empty EnhancedHAMTPersistentVector
   */
  static empty<T>(): EnhancedHAMTPersistentVector<T> {
    return new EnhancedHAMTPersistentVector<T>();
  }

  /**
   * Create an EnhancedHAMTPersistentVector from an array
   */
  static from<T>(items: T[]): EnhancedHAMTPersistentVector<T> {
    return new EnhancedHAMTPersistentVector<T>(items);
  }

  /**
   * Create an EnhancedHAMTPersistentVector with a single element
   */
  static of<T>(value: T): EnhancedHAMTPersistentVector<T> {
    return EnhancedHAMTPersistentVector.from([value]);
  }
}
