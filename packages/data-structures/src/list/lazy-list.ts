/**
 * Lazy List implementation for the Reduct library
 *
 * This module provides a lazy implementation of the List data structure,
 * which defers operations until elements are accessed.
 *
 * @packageDocumentation
 */

import { IList } from './types';
import * as specializedOps from './specialized-operations';

/**
 * Type of lazy operation
 */
export enum LazyOperationType {
  MAP = 'map',
  FILTER = 'filter',
  SLICE = 'slice',
  CONCAT = 'concat'
}

/**
 * Lazy operation definition
 */
export interface LazyOperation<T, R> {
  /**
   * Type of operation
   */
  type: LazyOperationType;

  /**
   * Function to apply for map operations
   */
  mapFn?: (value: T, index: number) => R;

  /**
   * Function to apply for filter operations
   */
  filterFn?: (value: T, index: number) => boolean;

  /**
   * Start index for slice operations
   */
  sliceStart?: number;

  /**
   * End index for slice operations
   */
  sliceEnd?: number;

  /**
   * List to concatenate for concat operations
   */
  concatList?: IList<T>;
}

/**
 * A lazy implementation of the List data structure
 *
 * This class defers operations until elements are accessed,
 * which can significantly improve performance for large collections
 * and chains of operations.
 *
 * @typeParam T - The type of elements in the list
 */
export class LazyList<T> implements IList<T> {
  /**
   * The source list
   */
  private readonly _source: IList<T>;

  /**
   * The chain of lazy operations to apply
   */
  private readonly _operations: Array<LazyOperation<any, any>>;

  /**
   * The cached result of applying all operations
   */
  private _cachedResult: IList<T> | null = null;

  /**
   * The cached size of the list
   */
  private _cachedSize: number | null = null;

  /**
   * Create a new lazy list
   *
   * @param source - The source list
   * @param operations - The chain of lazy operations to apply
   */
  constructor(source: IList<T>, operations: Array<LazyOperation<any, any>> = []) {
    this._source = source;
    this._operations = operations;
  }

  /**
   * Get the size of the list
   *
   * This property forces evaluation of the lazy operations
   * to determine the size of the resulting list.
   */
  get size(): number {
    if (this._cachedSize !== null) {
      return this._cachedSize;
    }

    // If we have filter operations, we need to evaluate the list
    // to determine the size
    if (this._operations.some(op => op.type === LazyOperationType.FILTER)) {
      this._cachedSize = this.evaluate().size;
      return this._cachedSize;
    }

    // Otherwise, we can calculate the size without evaluating the list
    let size = this._source.size;

    for (const op of this._operations) {
      switch (op.type) {
        case LazyOperationType.MAP:
          // Map doesn't change the size
          break;
        case LazyOperationType.SLICE:
          const start = op.sliceStart || 0;
          const end = op.sliceEnd !== undefined ? op.sliceEnd : size;
          size = Math.max(0, Math.min(size, end) - Math.max(0, start));
          break;
        case LazyOperationType.CONCAT:
          size += op.concatList?.size || 0;
          break;
      }
    }

    this._cachedSize = size;
    return size;
  }

  /**
   * Check if the list is empty
   *
   * This property can often be determined without evaluating the lazy operations.
   */
  get isEmpty(): boolean {
    // If we have a cached size, use it
    if (this._cachedSize !== null) {
      return this._cachedSize === 0;
    }

    // If the source is empty and we don't have concat operations,
    // the result will be empty
    if (this._source.isEmpty && !this._operations.some(op => op.type === LazyOperationType.CONCAT)) {
      return true;
    }

    // If we have filter operations, we need to evaluate the list
    // to determine if it's empty
    if (this._operations.some(op => op.type === LazyOperationType.FILTER)) {
      return this.size === 0;
    }

    // If we have concat operations with non-empty lists,
    // the result won't be empty
    if (this._operations.some(op => op.type === LazyOperationType.CONCAT && !(op.concatList?.isEmpty ?? true))) {
      return false;
    }

    // Otherwise, we need to calculate the size
    return this.size === 0;
  }

  /**
   * Get an element at the specified index
   *
   * This method evaluates only the operations needed to get the element
   * at the specified index, which can be more efficient than evaluating
   * the entire list.
   *
   * @param index - The index of the element to get
   * @returns The element at the specified index, or undefined if the index is out of bounds
   */
  get(index: number): T | undefined {
    // If we have a cached result, use it
    if (this._cachedResult !== null) {
      return this._cachedResult.get(index);
    }

    // If the index is out of bounds, return undefined
    if (index < 0 || index >= this.size) {
      return undefined;
    }

    // If we have filter operations, we need to evaluate the list
    // to get the element at the specified index
    if (this._operations.some(op => op.type === LazyOperationType.FILTER)) {
      return this.evaluate().get(index);
    }

    // Otherwise, we can get the element without evaluating the entire list
    let currentIndex = index;
    let currentSource: IList<any> = this._source;

    // Apply operations in reverse order to find the source index
    for (let i = this._operations.length - 1; i >= 0; i--) {
      const op = this._operations[i];

      switch (op.type) {
        case LazyOperationType.MAP:
          // Map doesn't change the index
          break;
        case LazyOperationType.SLICE:
          const start = op.sliceStart || 0;
          currentIndex += start;
          break;
        case LazyOperationType.CONCAT:
          if (op.concatList && currentIndex >= currentSource.size) {
            currentIndex -= currentSource.size;
            currentSource = op.concatList;
          }
          break;
      }
    }

    // Get the element from the source
    let result: any = currentSource.get(currentIndex);

    // Apply map operations in forward order
    for (const op of this._operations) {
      if (op.type === LazyOperationType.MAP && op.mapFn && result !== undefined) {
        result = op.mapFn(result, index);
      }
    }

    return result;
  }

  /**
   * Set an element at the specified index
   *
   * This method forces evaluation of the lazy operations
   * to create a new list with the updated element.
   *
   * @param index - The index of the element to set
   * @param value - The new value
   * @returns A new list with the updated element
   */
  set(index: number, value: T): IList<T> {
    return this.evaluate().set(index, value);
  }

  /**
   * Insert an element at the specified index
   *
   * This method forces evaluation of the lazy operations
   * to create a new list with the inserted element.
   *
   * @param index - The index at which to insert the element
   * @param value - The value to insert
   * @returns A new list with the inserted element
   */
  insert(index: number, value: T): IList<T> {
    return this.evaluate().insert(index, value);
  }

  /**
   * Remove an element at the specified index
   *
   * This method forces evaluation of the lazy operations
   * to create a new list with the element removed.
   *
   * @param index - The index of the element to remove
   * @returns A new list with the element removed
   */
  remove(index: number): IList<T> {
    return this.evaluate().remove(index);
  }

  /**
   * Append a value to the end of the list
   *
   * This method creates a new lazy list with a concat operation
   * that appends the value to the end of the list.
   *
   * @param value - The value to append
   * @returns A new list with the appended value
   */
  append(value: T): IList<T> {
    // Create a single-element array list
    const singleElementList: IList<T> = {
      size: 1,
      isEmpty: false,
      get: (index: number) => index === 0 ? value : undefined,
      set: () => { throw new Error('Not implemented'); },
      insert: () => { throw new Error('Not implemented'); },
      remove: () => { throw new Error('Not implemented'); },
      append: () => { throw new Error('Not implemented'); },
      prepend: () => { throw new Error('Not implemented'); },
      map: () => { throw new Error('Not implemented'); },
      filter: () => { throw new Error('Not implemented'); },
      reduce: <R>(fn: (acc: R, val: T, idx: number) => R, initial: R) => fn(initial, value, 0),
      slice: () => { throw new Error('Not implemented'); },
      concat: () => { throw new Error('Not implemented'); },
      find: (fn: (val: T, idx: number) => boolean) => fn(value, 0) ? value : undefined,
      findIndex: (fn: (val: T, idx: number) => boolean) => fn(value, 0) ? 0 : -1,
      toArray: () => [value],
      mapFilterReduce: () => { throw new Error('Not implemented'); },
      mapReduce: () => { throw new Error('Not implemented'); },
      filterMap: () => { throw new Error('Not implemented'); },
      transient: () => { throw new Error('Not implemented'); },
      first: () => value,
      last: () => value
    };

    return this.concat(singleElementList);
  }

  /**
   * Prepend a value to the beginning of the list
   *
   * This method forces evaluation of the lazy operations
   * to create a new list with the prepended value.
   *
   * @param value - The value to prepend
   * @returns A new list with the prepended value
   */
  prepend(value: T): IList<T> {
    return this.evaluate().prepend(value);
  }

  /**
   * Map the elements of the list to new values
   *
   * This method creates a new lazy list with a map operation
   * that transforms each element of the list.
   *
   * @typeParam R - The type of elements in the resulting list
   * @param fn - The function to apply to each element
   * @returns A new list with the mapped values
   */
  map<R>(fn: (value: T, index: number) => R): IList<R> {
    return new LazyList<R>(
      this._source as any,
      [
        ...this._operations,
        { type: LazyOperationType.MAP, mapFn: fn }
      ]
    );
  }

  /**
   * Filter the elements of the list
   *
   * This method creates a new lazy list with a filter operation
   * that includes only elements that satisfy the predicate.
   *
   * @param fn - The predicate function
   * @returns A new list with the filtered elements
   */
  filter(fn: (value: T, index: number) => boolean): IList<T> {
    return new LazyList<T>(
      this._source,
      [
        ...this._operations,
        { type: LazyOperationType.FILTER, filterFn: fn }
      ]
    );
  }

  /**
   * Reduce the elements of the list to a single value
   *
   * This method forces evaluation of the lazy operations
   * to reduce the list to a single value.
   *
   * @typeParam R - The type of the accumulated value
   * @param fn - The reducer function
   * @param initial - The initial value
   * @returns The accumulated value
   */
  reduce<R>(fn: (accumulator: R, value: T, index: number) => R, initial: R): R {
    return this.evaluate().reduce(fn, initial);
  }

  /**
   * Get a slice of the list
   *
   * This method creates a new lazy list with a slice operation
   * that includes only elements in the specified range.
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new list with the elements in the specified range
   */
  slice(start: number, end?: number): IList<T> {
    return new LazyList<T>(
      this._source,
      [
        ...this._operations,
        { type: LazyOperationType.SLICE, sliceStart: start, sliceEnd: end }
      ]
    );
  }

  /**
   * Concatenate this list with another list
   *
   * This method creates a new lazy list with a concat operation
   * that appends the elements of the other list to this list.
   *
   * @param other - The list to concatenate
   * @returns A new list with the elements of both lists
   */
  concat(other: IList<T>): IList<T> {
    return new LazyList<T>(
      this._source,
      [
        ...this._operations,
        { type: LazyOperationType.CONCAT, concatList: other }
      ]
    );
  }

  /**
   * Find the first element that satisfies the predicate
   *
   * This method evaluates only the operations needed to find the element,
   * which can be more efficient than evaluating the entire list.
   *
   * @param fn - The predicate function
   * @returns The first element that satisfies the predicate, or undefined if none is found
   */
  find(fn: (value: T, index: number) => boolean): T | undefined {
    // If we have a cached result, use it
    if (this._cachedResult !== null) {
      return this._cachedResult.find(fn);
    }

    // If we have filter operations, we need to evaluate the list
    // to find the element
    if (this._operations.some(op => op.type === LazyOperationType.FILTER)) {
      return this.evaluate().find(fn);
    }

    // Otherwise, we can find the element without evaluating the entire list
    const index = this.findIndex(fn);
    return index !== -1 ? this.get(index) : undefined;
  }

  /**
   * Find the index of the first element that satisfies the predicate
   *
   * This method evaluates only the operations needed to find the index,
   * which can be more efficient than evaluating the entire list.
   *
   * @param fn - The predicate function
   * @returns The index of the first element that satisfies the predicate, or -1 if none is found
   */
  findIndex(fn: (value: T, index: number) => boolean): number {
    // If we have a cached result, use it
    if (this._cachedResult !== null) {
      return this._cachedResult.findIndex(fn);
    }

    // If we have filter operations, we need to evaluate the list
    // to find the index
    if (this._operations.some(op => op.type === LazyOperationType.FILTER)) {
      return this.evaluate().findIndex(fn);
    }

    // Otherwise, we can find the index without evaluating the entire list
    const size = this.size;

    for (let i = 0; i < size; i++) {
      const value = this.get(i);
      if (value !== undefined && fn(value, i)) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Convert the list to an array
   *
   * This method forces evaluation of the lazy operations
   * to create an array with all elements.
   *
   * @returns An array with all elements
   */
  toArray(): T[] {
    return this.evaluate().toArray();
  }

  /**
   * Create a transient version of the list
   *
   * This method forces evaluation of the lazy operations
   * to create a transient list.
   *
   * @returns A transient version of the list
   */
  transient(): any {
    return this.evaluate().transient();
  }

  /**
   * Perform a map, filter, and reduce operation in a single pass
   *
   * This method forces evaluation of the lazy operations
   * to perform the map, filter, and reduce operations.
   *
   * @param mapFn - The mapping function
   * @param filterFn - The filter predicate
   * @param reduceFn - The reducer function
   * @param initial - The initial value for reduction
   * @returns The reduced value
   */
  mapFilterReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    return this.evaluate().mapFilterReduce(mapFn, filterFn, reduceFn, initial);
  }

  /**
   * Perform a map and reduce operation in a single pass
   *
   * This method forces evaluation of the lazy operations
   * to perform the map and reduce operations.
   *
   * @param mapFn - The mapping function
   * @param reduceFn - The reducer function
   * @param initial - The initial value for reduction
   * @returns The reduced value
   */
  mapReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    return this.evaluate().mapReduce(mapFn, reduceFn, initial);
  }

  /**
   * Perform a filter and map operation in a single pass
   *
   * This method forces evaluation of the lazy operations
   * to perform the filter and map operations.
   *
   * @param filterFn - The filter predicate
   * @param mapFn - The mapping function
   * @returns A new list with filtered and mapped elements
   */
  filterMap<U>(
    filterFn: (value: T, index: number) => boolean,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    return this.evaluate().filterMap(filterFn, mapFn);
  }

  /**
   * Get the first element in the list
   *
   * This method evaluates only the operations needed to get the first element,
   * which can be more efficient than evaluating the entire list.
   *
   * @returns The first element, or undefined if the list is empty
   */
  first(): T | undefined {
    return this.get(0);
  }

  /**
   * Get the last element in the list
   *
   * This method evaluates only the operations needed to get the last element,
   * which can be more efficient than evaluating the entire list.
   *
   * @returns The last element, or undefined if the list is empty
   */
  last(): T | undefined {
    return this.get(this.size - 1);
  }

  /**
   * Create a lazy version of the list
   *
   * Since this list is already lazy, this method returns this list.
   *
   * @returns This lazy list
   */
  asLazy(): LazyList<T> {
    return this;
  }

  /**
   * Create a lazy map operation
   *
   * This method creates a lazy wrapper around the list that defers the map operation
   * until elements are accessed, which can significantly improve performance
   * for large collections and chains of operations.
   *
   * @typeParam R - The type of elements in the resulting list
   * @param fn - The function to apply to each element
   * @returns A lazy list with the map operation
   */
  lazyMap<R>(fn: (value: T, index: number) => R): LazyList<R> {
    return this.map(fn) as LazyList<R>;
  }

  /**
   * Create a lazy filter operation
   *
   * This method creates a lazy wrapper around the list that defers the filter operation
   * until elements are accessed, which can significantly improve performance
   * for large collections and chains of operations.
   *
   * @param fn - The predicate function
   * @returns A lazy list with the filter operation
   */
  lazyFilter(fn: (value: T, index: number) => boolean): LazyList<T> {
    return this.filter(fn) as LazyList<T>;
  }

  /**
   * Create a lazy slice operation
   *
   * This method creates a lazy wrapper around the list that defers the slice operation
   * until elements are accessed, which can significantly improve performance
   * for large collections and chains of operations.
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A lazy list with the slice operation
   */
  lazySlice(start: number, end?: number): LazyList<T> {
    return this.slice(start, end) as LazyList<T>;
  }

  /**
   * Create a lazy concat operation
   *
   * This method creates a lazy wrapper around the list that defers the concat operation
   * until elements are accessed, which can significantly improve performance
   * for large collections and chains of operations.
   *
   * @param other - The list to concatenate
   * @returns A lazy list with the concat operation
   */
  lazyConcat(other: IList<T>): LazyList<T> {
    return this.concat(other) as LazyList<T>;
  }

  /**
   * Perform a map and filter operation in a single pass
   *
   * This method forces evaluation of the lazy operations
   * to perform the map and filter operations.
   *
   * @param mapFn - The mapping function
   * @param filterFn - The filter predicate
   * @returns A new list with mapped and filtered elements
   */
  mapFilter<U>(
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean
  ): IList<U> {
    return specializedOps.mapFilter(this.evaluate(), mapFn, filterFn);
  }

  /**
   * Perform a map and slice operation in a single pass
   *
   * This method forces evaluation of the lazy operations
   * to perform the map and slice operations.
   *
   * @param mapFn - The mapping function
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new list with mapped and sliced elements
   */
  mapSlice<U>(
    mapFn: (value: T, index: number) => U,
    start?: number,
    end?: number
  ): IList<U> {
    return specializedOps.mapSlice(this.evaluate(), mapFn, start, end);
  }

  /**
   * Perform a slice and map operation in a single pass
   *
   * This method forces evaluation of the lazy operations
   * to perform the slice and map operations.
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
    return specializedOps.sliceMap(this.evaluate(), start, end, mapFn);
  }

  /**
   * Perform a filter and slice operation in a single pass
   *
   * This method forces evaluation of the lazy operations
   * to perform the filter and slice operations.
   *
   * @param filterFn - The filter predicate
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new list with filtered and sliced elements
   */
  filterSlice(
    filterFn: (value: T, index: number) => boolean,
    start?: number,
    end?: number
  ): IList<T> {
    return specializedOps.filterSlice(this.evaluate(), filterFn, start, end);
  }

  /**
   * Perform a slice and filter operation in a single pass
   *
   * This method forces evaluation of the lazy operations
   * to perform the slice and filter operations.
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
    return specializedOps.sliceFilter(this.evaluate(), start, end, filterFn);
  }

  /**
   * Perform a filter and reduce operation in a single pass
   *
   * This method forces evaluation of the lazy operations
   * to perform the filter and reduce operations.
   *
   * @param filterFn - The filter predicate
   * @param reduceFn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  filterReduce<V>(
    filterFn: (value: T, index: number) => boolean,
    reduceFn: (acc: V, value: T, index: number) => V,
    initial: V
  ): V {
    return specializedOps.filterReduce(this.evaluate(), filterFn, reduceFn, initial);
  }

  /**
   * Perform a concat and map operation in a single pass
   *
   * This method forces evaluation of the lazy operations
   * to perform the concat and map operations.
   *
   * @param other - The list to concatenate
   * @param mapFn - The mapping function
   * @returns A new list with concatenated and mapped elements
   */
  concatMap<U>(
    other: IList<T>,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    return specializedOps.concatMap(this.evaluate(), other, mapFn);
  }

  /**
   * Perform a map and concat operation in a single pass
   *
   * This method forces evaluation of the lazy operations
   * to perform the map and concat operations.
   *
   * @param other - The list to concatenate
   * @param mapFn - The mapping function
   * @returns A new list with mapped and concatenated elements
   */
  mapConcat<U>(
    other: IList<T>,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    return specializedOps.mapConcat(this.evaluate(), other, mapFn);
  }

  /**
   * Evaluate all lazy operations and return the resulting list
   *
   * This method applies all lazy operations to the source list
   * and returns the resulting list.
   *
   * @returns The evaluated list
   */
  evaluate(): IList<T> {
    // If we have a cached result, return it
    if (this._cachedResult !== null) {
      return this._cachedResult;
    }

    // Apply all operations to the source list
    let result: IList<any> = this._source;

    for (const op of this._operations) {
      switch (op.type) {
        case LazyOperationType.MAP:
          if (op.mapFn) {
            result = result.map(op.mapFn);
          }
          break;
        case LazyOperationType.FILTER:
          if (op.filterFn) {
            result = result.filter(op.filterFn);
          }
          break;
        case LazyOperationType.SLICE:
          result = result.slice(op.sliceStart || 0, op.sliceEnd);
          break;
        case LazyOperationType.CONCAT:
          if (op.concatList) {
            result = result.concat(op.concatList);
          }
          break;
      }
    }

    // Cache the result
    this._cachedResult = result as IList<T>;
    return this._cachedResult;
  }

  /**
   * Create a string representation of the list
   *
   * This method forces evaluation of the lazy operations
   * to create a string representation of the list.
   *
   * @returns A string representation of the list
   */
  toString(): string {
    return this.evaluate().toString();
  }
}

/**
 * Create a lazy list from an existing list
 *
 * @typeParam T - The type of elements in the list
 * @param list - The source list
 * @returns A lazy list wrapping the source list
 */
export function lazy<T>(list: IList<T>): LazyList<T> {
  // If the list is already a LazyList, return it
  if (list instanceof LazyList) {
    return list;
  }

  // Otherwise, create a new LazyList
  return new LazyList<T>(list);
}

export default LazyList;
