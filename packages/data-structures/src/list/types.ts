/**
 * List types
 *
 * Type definitions for the List data structure.
 *
 * @packageDocumentation
 */

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
  mapFilterReduce<U, V>(
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
  mapReduce<U, V>(
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
  filterMap<U>(
    filterFn: (value: T, index: number) => boolean,
    mapFn: (value: T, index: number) => U
  ): IList<U>;
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
