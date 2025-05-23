/**
 * List types
 *
 * Type definitions for the List data structure.
 *
 * @packageDocumentation
 */

import { RepresentationType as _RepresentationType } from '@reduct/shared-types/data-structures';

/**
 * Interface for a transient (temporarily mutable) list
 */
export interface TransientList<T> {
  /**
   * Append a value to the end of the list
   *
   * @param value - The value to append
   * @returns The updated transient list
   */
  append(value: T): TransientList<T>;

  /**
   * Prepend a value to the beginning of the list
   *
   * @param value - The value to prepend
   * @returns The updated transient list
   */
  prepend(value: T): TransientList<T>;

  /**
   * Set a value at a specific index
   *
   * @param index - The index to set
   * @param value - The value to set
   * @returns The updated transient list
   * @throws {RangeError} If the index is out of bounds
   */
  set(index: number, value: T): TransientList<T>;

  /**
   * Convert the transient list back to an immutable list
   *
   * @returns An immutable list with the current values
   */
  persistent(): IList<T>;
}

/**
 * List interface
 *
 * Represents an immutable, ordered collection of elements.
 */
export interface IList<T> {
  /**
   * The number of elements in the list.
   */
  readonly size: number;

  /**
   * Whether the list is empty.
   */
  readonly isEmpty: boolean;

  /**
   * Get the element at the specified index.
   *
   * @param index - The index of the element to get
   * @returns The element at the specified index, or undefined if the index is out of bounds
   */
  get(index: number): T | undefined;

  /**
   * Set the element at the specified index.
   *
   * @param index - The index of the element to set
   * @param value - The new value
   * @returns A new list with the element at the specified index set to the new value
   */
  set(index: number, value: T): IList<T>;

  /**
   * Insert an element at the specified index.
   *
   * @param index - The index at which to insert the element
   * @param value - The element to insert
   * @returns A new list with the element inserted at the specified index
   */
  insert(index: number, value: T): IList<T>;

  /**
   * Remove the element at the specified index.
   *
   * @param index - The index of the element to remove
   * @returns A new list with the element at the specified index removed
   */
  remove(index: number): IList<T>;

  /**
   * Append an element to the end of the list.
   *
   * @param value - The element to append
   * @returns A new list with the element appended
   */
  append(value: T): IList<T>;

  /**
   * Prepend an element to the beginning of the list.
   *
   * @param value - The element to prepend
   * @returns A new list with the element prepended
   */
  prepend(value: T): IList<T>;

  /**
   * Concatenate this list with another list.
   *
   * @param other - The list to concatenate with this list
   * @returns A new list containing all elements from this list followed by all elements from the other list
   */
  concat(other: IList<T>): IList<T>;

  /**
   * Map each element in the list to a new value.
   *
   * @param fn - The mapping function
   * @returns A new list with each element mapped to a new value
   */
  map<U>(fn: (value: T, index: number) => U): IList<U>;

  /**
   * Filter elements in the list based on a predicate.
   *
   * @param fn - The predicate function
   * @returns A new list containing only elements that satisfy the predicate
   */
  filter(fn: (value: T, index: number) => boolean): IList<T>;

  /**
   * Reduce the list to a single value.
   *
   * @param fn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U;

  /**
   * Find the first element in the list that satisfies a predicate.
   *
   * @param fn - The predicate function
   * @returns The first element that satisfies the predicate, or undefined if no element satisfies the predicate
   */
  find(fn: (value: T, index: number) => boolean): T | undefined;

  /**
   * Find the index of the first element in the list that satisfies a predicate.
   *
   * @param fn - The predicate function
   * @returns The index of the first element that satisfies the predicate, or -1 if no element satisfies the predicate
   */
  findIndex(fn: (value: T, index: number) => boolean): number;

  /**
   * Convert the list to an array.
   *
   * @returns An array containing all elements in the list
   */
  toArray(): T[];

  /**
   * Create a slice of the list.
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new list containing elements from start to end
   */
  slice(start?: number, end?: number): IList<T>;

  /**
   * Perform a map, filter, and reduce operation in a single pass.
   *
   * @param mapFn - The mapping function
   * @param filterFn - The filter predicate
   * @param reduceFn - The reducer function
   * @param initial - The initial value for reduction
   * @returns The reduced value
   */
  mapFilterReduce?<U, V>(
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V;

  /**
   * Perform a map and reduce operation in a single pass.
   *
   * @param mapFn - The mapping function
   * @param reduceFn - The reducer function
   * @param initial - The initial value for reduction
   * @returns The reduced value
   */
  mapReduce?<U, V>(
    mapFn: (value: T, index: number) => U,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V;

  /**
   * Perform a filter and map operation in a single pass.
   *
   * @param filterFn - The filter predicate
   * @param mapFn - The mapping function
   * @returns A new list with filtered and mapped elements
   */
  filterMap?<U>(
    filterFn: (value: T, index: number) => boolean,
    mapFn: (value: T, index: number) => U
  ): IList<U>;

  /**
   * Perform a map and filter operation in a single pass.
   *
   * @param mapFn - The mapping function
   * @param filterFn - The filter predicate
   * @returns A new list with mapped and filtered elements
   */
  mapFilter?<U>(
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean
  ): IList<U>;

  /**
   * Perform a map and slice operation in a single pass.
   *
   * @param mapFn - The mapping function
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new list with mapped and sliced elements
   */
  mapSlice?<U>(
    mapFn: (value: T, index: number) => U,
    start?: number,
    end?: number
  ): IList<U>;

  /**
   * Perform a slice and map operation in a single pass.
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @param mapFn - The mapping function
   * @returns A new list with sliced and mapped elements
   */
  sliceMap?<U>(
    start: number,
    end: number | undefined,
    mapFn: (value: T, index: number) => U
  ): IList<U>;

  /**
   * Perform a filter and slice operation in a single pass.
   *
   * @param filterFn - The filter predicate
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new list with filtered and sliced elements
   */
  filterSlice?(
    filterFn: (value: T, index: number) => boolean,
    start?: number,
    end?: number
  ): IList<T>;

  /**
   * Perform a slice and filter operation in a single pass.
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @param filterFn - The filter predicate
   * @returns A new list with sliced and filtered elements
   */
  sliceFilter?(
    start: number,
    end: number | undefined,
    filterFn: (value: T, index: number) => boolean
  ): IList<T>;

  /**
   * Perform a filter and reduce operation in a single pass.
   *
   * @param filterFn - The filter predicate
   * @param reduceFn - The reducer function
   * @param initial - The initial value for reduction
   * @returns The reduced value
   */
  filterReduce?<V>(
    filterFn: (value: T, index: number) => boolean,
    reduceFn: (acc: V, value: T, index: number) => V,
    initial: V
  ): V;

  /**
   * Perform a concat and map operation in a single pass.
   *
   * @param other - The list to concatenate
   * @param mapFn - The mapping function
   * @returns A new list with concatenated and mapped elements
   */
  concatMap?<U>(
    other: IList<T>,
    mapFn: (value: T, index: number) => U
  ): IList<U>;

  /**
   * Perform a map and concat operation in a single pass.
   *
   * @param other - The list to concatenate
   * @param mapFn - The mapping function
   * @returns A new list with mapped and concatenated elements
   */
  mapConcat?<U>(
    other: IList<T>,
    mapFn: (value: T, index: number) => U
  ): IList<U>;

  /**
   * Create a transient (temporarily mutable) version of the list
   *
   * @returns A transient list with the current values
   */
  transient(): TransientList<T>;

  /**
   * Get the first element in the list
   *
   * @returns The first element, or undefined if the list is empty
   */
  first(): T | undefined;

  /**
   * Get the last element in the list
   *
   * @returns The last element, or undefined if the list is empty
   */
  last(): T | undefined;

  /**
   * Create a lazy version of the list
   *
   * This method creates a lazy wrapper around the list that defers operations
   * until elements are accessed, which can significantly improve performance
   * for large collections and chains of operations.
   *
   * @returns A lazy version of the list
   */
  asLazy?(): IList<T>;

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
  lazyMap?<R>(fn: (value: T, index: number) => R): IList<R>;

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
  lazyFilter?(fn: (value: T, index: number) => boolean): IList<T>;

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
  lazySlice?(start: number, end?: number): IList<T>;

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
  lazyConcat?(other: IList<T>): IList<T>;
}

/**
 * List factory interface
 *
 * Represents a factory for creating List instances.
 */
export interface IListFactory<T> {
  /**
   * Create an empty list.
   *
   * @returns An empty list
   */
  empty(): IList<T>;

  /**
   * Create a list from an array of elements.
   *
   * @param elements - The elements to create the list from
   * @returns A new list containing the elements
   */
  from<U>(elements: U[]): IList<U>;

  /**
   * Create a list of the specified size with elements generated by a function.
   *
   * @param size - The size of the list
   * @param fn - The function to generate elements
   * @returns A new list with elements generated by the function
   */
  of<U>(size: number, fn: (index: number) => U): IList<U>;
}
