/**
 * SmallList implementation
 *
 * A simple array-backed implementation of the List interface optimized for small collections.
 */

import { IList, TransientList } from './types';

/**
 * TransientSmallList implementation
 *
 * A mutable version of SmallList for efficient batch operations.
 */
export class TransientSmallList<T> implements TransientList<T> {
  /**
   * The mutable array of items
   */
  private items: T[];

  /**
   * Create a new TransientSmallList
   *
   * @param items - The initial items
   */
  constructor(items: T[]) {
    this.items = items;
  }

  /**
   * Append a value to the end of the list
   *
   * @param value - The value to append
   * @returns The updated transient list
   */
  append(value: T): TransientSmallList<T> {
    this.items.push(value);
    return this;
  }

  /**
   * Prepend a value to the beginning of the list
   *
   * @param value - The value to prepend
   * @returns The updated transient list
   */
  prepend(value: T): TransientSmallList<T> {
    this.items.unshift(value);
    return this;
  }

  /**
   * Set a value at a specific index
   *
   * @param index - The index to set
   * @param value - The value to set
   * @returns The updated transient list
   * @throws {RangeError} If the index is out of bounds
   */
  set(index: number, value: T): TransientSmallList<T> {
    if (index < 0 || index >= this.items.length) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    this.items[index] = value;
    return this;
  }

  /**
   * Convert the transient list back to an immutable list
   *
   * @returns An immutable list with the current values
   */
  persistent(): IList<T> {
    return new SmallList<T>([...this.items]);
  }
}

/**
 * SmallList implementation
 *
 * A simple array-backed implementation of the List interface optimized for small collections.
 */
export class SmallList<T> implements IList<T> {
  /**
   * The immutable array of items
   */
  private readonly items: ReadonlyArray<T>;

  /**
   * The size of the list
   */
  private readonly _size: number;

  /**
   * Create a new SmallList
   *
   * @param items - The initial items
   */
  constructor(items: ReadonlyArray<T>) {
    this.items = items;
    this._size = items.length;
  }

  /**
   * The number of elements in the list
   */
  get size(): number {
    return this._size;
  }

  /**
   * Whether the list is empty
   */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Get a value at a specific index
   *
   * @param index - The index to get
   * @returns The value at the index, or undefined if the index is out of bounds
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) {
      return undefined;
    }
    return this.items[index];
  }

  /**
   * Get the first element in the list
   *
   * @returns The first element, or undefined if the list is empty
   */
  first(): T | undefined {
    return this.isEmpty ? undefined : this.items[0];
  }

  /**
   * Get the last element in the list
   *
   * @returns The last element, or undefined if the list is empty
   */
  last(): T | undefined {
    return this.isEmpty ? undefined : this.items[this._size - 1];
  }

  /**
   * Set a value at a specific index
   *
   * @param index - The index to set
   * @param value - The value to set
   * @returns A new list with the updated value
   * @throws {RangeError} If the index is out of bounds
   */
  set(index: number, value: T): SmallList<T> {
    if (index < 0 || index >= this._size) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    const newItems = [...this.items];
    newItems[index] = value;
    return new SmallList<T>(newItems);
  }

  /**
   * Insert a value at a specific index
   *
   * @param index - The index to insert at
   * @param value - The value to insert
   * @returns A new list with the inserted value
   * @throws {RangeError} If the index is out of bounds
   */
  insert(index: number, value: T): SmallList<T> {
    if (index < 0 || index > this._size) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    const newItems = [...this.items];
    newItems.splice(index, 0, value);
    return new SmallList<T>(newItems);
  }

  /**
   * Remove a value at a specific index
   *
   * @param index - The index to remove
   * @returns A new list with the value removed
   * @throws {RangeError} If the index is out of bounds
   */
  remove(index: number): SmallList<T> {
    if (index < 0 || index >= this._size) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    const newItems = [...this.items];
    newItems.splice(index, 1);
    return new SmallList<T>(newItems);
  }

  /**
   * Append a value to the end of the list
   *
   * @param value - The value to append
   * @returns A new list with the appended value
   */
  append(value: T): SmallList<T> {
    return new SmallList<T>([...this.items, value]);
  }

  /**
   * Prepend a value to the beginning of the list
   *
   * @param value - The value to prepend
   * @returns A new list with the prepended value
   */
  prepend(value: T): SmallList<T> {
    return new SmallList<T>([value, ...this.items]);
  }

  /**
   * Concatenate another list to this list
   *
   * @param other - The list to concatenate
   * @returns A new list with the concatenated values
   */
  concat(other: IList<T>): SmallList<T> {
    return new SmallList<T>([...this.items, ...other.toArray()]);
  }

  /**
   * Map each element in the list to a new value
   *
   * @param fn - The mapping function
   * @returns A new list with the mapped values
   */
  map<U>(fn: (value: T, index: number) => U): SmallList<U> {
    // For very small collections, use native array map
    return new SmallList<U>(this.items.map(fn));
  }

  /**
   * Filter elements in the list based on a predicate
   *
   * @param fn - The predicate function
   * @returns A new list with the filtered values
   */
  filter(fn: (value: T, index: number) => boolean): SmallList<T> {
    // For very small collections, use native array filter
    return new SmallList<T>(this.items.filter(fn));
  }

  /**
   * Reduce the list to a single value
   *
   * @param fn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U {
    // For very small collections, use native array reduce
    return this.items.reduce(fn, initial);
  }

  /**
   * Find the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The first element that satisfies the predicate, or undefined if no element satisfies the predicate
   */
  find(fn: (value: T, index: number) => boolean): T | undefined {
    // For very small collections, use native array find
    return this.items.find(fn);
  }

  /**
   * Find the index of the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The index of the first element that satisfies the predicate, or -1 if no element satisfies the predicate
   */
  findIndex(fn: (value: T, index: number) => boolean): number {
    // For very small collections, use native array findIndex
    return this.items.findIndex(fn);
  }

  /**
   * Convert the list to an array
   *
   * @returns An array with the current values
   */
  toArray(): T[] {
    return [...this.items];
  }

  /**
   * Create a slice of the list
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new list with the sliced values
   */
  slice(start?: number, end?: number): SmallList<T> {
    return new SmallList<T>(this.items.slice(start, end));
  }

  /**
   * Perform a map, filter, and reduce operation in a single pass
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
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    // For very small collections, use separate native operations
    // JavaScript engines might optimize this better in some cases
    if (this._size < 16) {
      return this.items
        .map(mapFn)
        .filter(filterFn)
        .reduce((acc: V, val: U, idx: number) => reduceFn(acc, val, idx), initial);
    }

    // For larger collections, use a single-pass implementation
    let result = initial;
    let filteredIndex = 0;

    for (let i = 0; i < this._size; i++) {
      const mappedValue = mapFn(this.items[i], i);
      if (filterFn(mappedValue, i)) {
        result = reduceFn(result, mappedValue, filteredIndex++);
      }
    }

    return result;
  }

  /**
   * Perform a map and reduce operation in a single pass
   *
   * @param mapFn - The mapping function
   * @param reduceFn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  mapReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    // For very small collections, use separate native operations
    if (this._size < 16) {
      return this.items
        .map(mapFn)
        .reduce((acc: V, val: U, idx: number) => reduceFn(acc, val, idx), initial);
    }

    // For larger collections, use a single-pass implementation
    let result = initial;

    for (let i = 0; i < this._size; i++) {
      const mappedValue = mapFn(this.items[i], i);
      result = reduceFn(result, mappedValue, i);
    }

    return result;
  }

  /**
   * Perform a filter and map operation in a single pass
   *
   * @param filterFn - The filter predicate
   * @param mapFn - The mapping function
   * @returns A new list with the filtered and mapped values
   */
  filterMap<U>(
    filterFn: (value: T, index: number) => boolean,
    mapFn: (value: T, index: number) => U
  ): SmallList<U> {
    // For very small collections, use separate native operations
    if (this._size < 16) {
      return new SmallList<U>(
        this.items
          .filter(filterFn)
          .map(mapFn)
      );
    }

    // For larger collections, use a single-pass implementation
    const result: U[] = [];

    for (let i = 0; i < this._size; i++) {
      if (filterFn(this.items[i], i)) {
        result.push(mapFn(this.items[i], i));
      }
    }

    return new SmallList<U>(result);
  }

  /**
   * Create a transient (temporarily mutable) version of the list
   *
   * @returns A transient list with the current values
   */
  transient(): TransientList<T> {
    return new TransientSmallList<T>([...this.items]);
  }

  /**
   * Iterate through the list
   */
  *[Symbol.iterator](): Iterator<T> {
    yield* this.items;
  }
}
