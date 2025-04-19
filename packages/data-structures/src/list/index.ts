/**
 * Enhanced List Implementation
 *
 * An immutable list implementation that adapts its internal representation
 * based on collection size for optimal performance.
 *
 * @packageDocumentation
 */

import { IList, IListFactory, TransientList, RepresentationType } from './types';
import { ChunkedList } from './chunked-list';
import { PersistentVector } from './persistent-vector';

/**
 * Threshold for small collections
 * For collections smaller than this size, we use a simple array implementation
 * and directly leverage native array methods for optimal performance
 *
 * Based on benchmark results, 64 is a good balance between performance and memory usage
 */
const SMALL_COLLECTION_THRESHOLD = 64;

/**
 * Threshold for medium collections
 * For collections between SMALL_COLLECTION_THRESHOLD and this size,
 * we use a chunked array implementation
 *
 * Based on benchmark results, 2048 is a good threshold for switching to vector representation
 */
const MEDIUM_COLLECTION_THRESHOLD = 2048;



/**
 * Threshold for returning native arrays directly from operations
 * For collections smaller than this size, operations like map, filter
 * will return native arrays directly when possible for better performance
 *
 * Based on benchmark results, 32 is optimal for direct native array operations
 */
const NATIVE_RETURN_THRESHOLD = 32;

/**
 * Threshold for using native array methods for operations
 *
 * Based on benchmark results, 128 is optimal for leveraging native array methods
 */
const NATIVE_OPERATIONS_THRESHOLD = 128;

/**
 * TransientList implementation
 *
 * A mutable version of List for efficient batch operations.
 */
class TransientListImpl<T> implements TransientList<T> {
  /**
   * The underlying implementation
   */
  private _data: T[];

  /**
   * Create a new TransientList
   *
   * @param data - The initial data
   */
  constructor(data: T[]) {
    this._data = data;
  }

  /**
   * Append a value to the end of the list
   *
   * @param value - The value to append
   * @returns The updated transient list
   */
  append(value: T): TransientListImpl<T> {
    this._data.push(value);
    return this;
  }

  /**
   * Prepend a value to the beginning of the list
   *
   * @param value - The value to prepend
   * @returns The updated transient list
   */
  prepend(value: T): TransientListImpl<T> {
    this._data.unshift(value);
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
  set(index: number, value: T): TransientListImpl<T> {
    if (index < 0 || index >= this._data.length) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    this._data[index] = value;
    return this;
  }

  /**
   * Convert the transient list back to an immutable list
   *
   * @returns An immutable list with the current values
   */
  persistent(): IList<T> {
    return List.from([...this._data]);
  }
}



/**
 * Enhanced List implementation
 *
 * This implementation adapts its internal representation based on collection size:
 * - Small collections use a simple array
 * - Medium collections use a chunked array
 * - Large collections use a persistent vector trie
 */
export class List<T> implements IList<T> {
  private readonly _size: number;
  private readonly _representation: RepresentationType;
  private readonly _data: any; // Internal data structure

  /**
   * Create a new List
   *
   * @param size - The size of the list
   * @param representation - The representation type
   * @param data - The internal data structure
   */
  private constructor(
    size: number,
    representation: RepresentationType,
    data: any
  ) {
    this._size = size;
    this._representation = representation;
    this._data = data;
  }

  /**
   * Create an empty List
   */
  static empty<T>(): List<T> {
    return new List<T>(0, RepresentationType.ARRAY, []);
  }

  /**
   * Create a List from an array of elements
   *
   * @param elements - The elements to create the list from
   */
  static from<T>(elements: T[]): List<T> {
    const size = elements.length;

    if (size === 0) {
      return List.empty<T>();
    }

    if (size < SMALL_COLLECTION_THRESHOLD) {
      // For small collections, use a simple array copy for optimal performance
      return new List<T>(size, RepresentationType.ARRAY, [...elements]);
    } else if (size < MEDIUM_COLLECTION_THRESHOLD) {
      // For medium collections, use a ChunkedList for better performance
      // with operations that access elements by index
      const chunkedList = ChunkedList.from(elements);
      return new List<T>(size, RepresentationType.CHUNKED, chunkedList);
    } else {
      // For large collections, use a persistent vector trie
      // for optimal performance with structural sharing
      const persistentVector = PersistentVector.from(elements);
      return new List<T>(size, RepresentationType.VECTOR, persistentVector);
    }
  }

  /**
   * Create a List of the specified size with elements generated by a function
   *
   * @param size - The size of the list
   * @param fn - The function to generate elements
   */
  static of<T>(size: number, fn: (index: number) => T): List<T> {
    if (size === 0) {
      return List.empty<T>();
    }

    // Generate the elements using the provided function
    const data = Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = fn(i);
    }

    // Create the appropriate representation based on size
    if (size < SMALL_COLLECTION_THRESHOLD) {
      // For small collections, use a simple array
      return new List<T>(size, RepresentationType.ARRAY, data);
    } else if (size < MEDIUM_COLLECTION_THRESHOLD) {
      // For medium collections, use a ChunkedList
      const chunkedList = ChunkedList.from(data);
      return new List<T>(size, RepresentationType.CHUNKED, chunkedList);
    } else {
      // For large collections, use a persistent vector trie
      const persistentVector = PersistentVector.from(data);
      return new List<T>(size, RepresentationType.VECTOR, persistentVector);
    }
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
   * Get the element at the specified index
   *
   * @param index - The index of the element to get
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) {
      return undefined;
    }

    switch (this._representation) {
      case RepresentationType.ARRAY:
        // For array representation, direct access is fastest
        return this._data[index];
      case RepresentationType.CHUNKED:
        // For chunked list, use the chunked list's get method
        return (this._data as ChunkedList<T>).get(index);
      case RepresentationType.VECTOR:
        // For vector representation, use the vector's get method
        return (this._data as PersistentVector<T>).get(index);
    }
  }

  /**
   * Get the first element in the list
   *
   * @returns The first element, or undefined if the list is empty
   */
  first(): T | undefined {
    if (this.isEmpty) {
      return undefined;
    }

    return this.get(0);
  }

  /**
   * Get the last element in the list
   *
   * @returns The last element, or undefined if the list is empty
   */
  last(): T | undefined {
    if (this.isEmpty) {
      return undefined;
    }

    return this.get(this._size - 1);
  }

  /**
   * Set the element at the specified index
   *
   * @param index - The index of the element to set
   * @param value - The new value
   */
  set(index: number, value: T): List<T> {
    if (index < 0 || index >= this._size) {
      return this;
    }

    switch (this._representation) {
      case RepresentationType.ARRAY: {
        // For array representation, create a new array with the updated value
        const newData = [...this._data];
        newData[index] = value;
        return new List<T>(this._size, RepresentationType.ARRAY, newData);
      }
      case RepresentationType.CHUNKED: {
        // For chunked list, use the chunked list's set method
        const chunkedList = this._data as ChunkedList<T>;
        const newChunkedList = chunkedList.set(index, value);
        return new List<T>(this._size, RepresentationType.CHUNKED, newChunkedList);
      }
      case RepresentationType.VECTOR: {
        // For vector representation, use the vector's set method
        const vector = this._data as PersistentVector<T>;
        const newVector = vector.set(index, value);
        return new List<T>(this._size, RepresentationType.VECTOR, newVector);
      }
    }
  }

  /**
   * Insert an element at the specified index
   *
   * @param index - The index at which to insert the element
   * @param value - The element to insert
   */
  insert(index: number, value: T): List<T> {
    if (index < 0 || index > this._size) {
      return this;
    }

    if (index === 0) {
      return this.prepend(value);
    }

    if (index === this._size) {
      return this.append(value);
    }

    const newSize = this._size + 1;

    // Determine the new representation based on the new size
    let newRepresentation = this._representation;
    if (newSize >= MEDIUM_COLLECTION_THRESHOLD && this._representation === RepresentationType.CHUNKED) {
      newRepresentation = RepresentationType.VECTOR;
    } else if (newSize >= SMALL_COLLECTION_THRESHOLD && this._representation === RepresentationType.ARRAY) {
      newRepresentation = RepresentationType.CHUNKED;
    }

    // Convert to array for insertion operation
    const dataArray = this._representation === RepresentationType.CHUNKED
      ? (this._data as ChunkedList<T>).toArray()
      : [...this._data];

    // Insert the value
    const newDataArray = [...dataArray.slice(0, index), value, ...dataArray.slice(index)];

    // Create the appropriate representation based on the new size
    if (newRepresentation === RepresentationType.CHUNKED) {
      const chunkedList = ChunkedList.from(newDataArray);
      return new List<T>(newSize, RepresentationType.CHUNKED, chunkedList);
    } else {
      return new List<T>(newSize, newRepresentation, newDataArray);
    }
  }

  /**
   * Remove the element at the specified index
   *
   * @param index - The index of the element to remove
   */
  remove(index: number): List<T> {
    if (index < 0 || index >= this._size) {
      return this;
    }

    const newSize = this._size - 1;

    if (newSize === 0) {
      return List.empty<T>();
    }

    // Determine the new representation based on the new size
    let newRepresentation = this._representation;
    if (newSize < SMALL_COLLECTION_THRESHOLD && this._representation === RepresentationType.CHUNKED) {
      newRepresentation = RepresentationType.ARRAY;
    } else if (newSize < MEDIUM_COLLECTION_THRESHOLD && this._representation === RepresentationType.VECTOR) {
      newRepresentation = RepresentationType.CHUNKED;
    }

    // Convert to array for removal operation
    const dataArray = this._representation === RepresentationType.CHUNKED
      ? (this._data as ChunkedList<T>).toArray()
      : [...this._data];

    // Remove the element
    const newDataArray = [...dataArray.slice(0, index), ...dataArray.slice(index + 1)];

    // Create the appropriate representation based on the new size
    if (newRepresentation === RepresentationType.CHUNKED) {
      const chunkedList = ChunkedList.from(newDataArray);
      return new List<T>(newSize, RepresentationType.CHUNKED, chunkedList);
    } else {
      return new List<T>(newSize, newRepresentation, newDataArray);
    }
  }

  /**
   * Append an element to the end of the list
   *
   * @param value - The element to append
   */
  append(value: T): List<T> {
    const newSize = this._size + 1;

    // Determine the new representation based on the new size
    let newRepresentation = this._representation;
    if (newSize >= MEDIUM_COLLECTION_THRESHOLD && this._representation === RepresentationType.CHUNKED) {
      newRepresentation = RepresentationType.VECTOR;
    } else if (newSize >= SMALL_COLLECTION_THRESHOLD && this._representation === RepresentationType.ARRAY) {
      newRepresentation = RepresentationType.CHUNKED;
    }

    // For small collections, optimize for direct array operations
    if (this._representation === RepresentationType.ARRAY && newRepresentation === RepresentationType.ARRAY) {
      return new List<T>(newSize, RepresentationType.ARRAY, [...this._data, value]);
    }

    // Convert to array for append operation
    const dataArray = this._representation === RepresentationType.CHUNKED
      ? (this._data as ChunkedList<T>).toArray()
      : [...this._data];

    // Append the value
    const newDataArray = [...dataArray, value];

    // Create the appropriate representation based on the new size
    if (newRepresentation === RepresentationType.CHUNKED) {
      const chunkedList = ChunkedList.from(newDataArray);
      return new List<T>(newSize, RepresentationType.CHUNKED, chunkedList);
    } else {
      return new List<T>(newSize, newRepresentation, newDataArray);
    }
  }

  /**
   * Prepend an element to the beginning of the list
   *
   * @param value - The element to prepend
   */
  prepend(value: T): List<T> {
    const newSize = this._size + 1;

    // Determine the new representation based on the new size
    let newRepresentation = this._representation;
    if (newSize >= MEDIUM_COLLECTION_THRESHOLD && this._representation === RepresentationType.CHUNKED) {
      newRepresentation = RepresentationType.VECTOR;
    } else if (newSize >= SMALL_COLLECTION_THRESHOLD && this._representation === RepresentationType.ARRAY) {
      newRepresentation = RepresentationType.CHUNKED;
    }

    // For small collections, optimize for direct array operations
    if (this._representation === RepresentationType.ARRAY && newRepresentation === RepresentationType.ARRAY) {
      return new List<T>(newSize, RepresentationType.ARRAY, [value, ...this._data]);
    }

    // Convert to array for prepend operation
    const dataArray = this._representation === RepresentationType.CHUNKED
      ? (this._data as ChunkedList<T>).toArray()
      : [...this._data];

    // Prepend the value
    const newDataArray = [value, ...dataArray];

    // Create the appropriate representation based on the new size
    if (newRepresentation === RepresentationType.CHUNKED) {
      const chunkedList = ChunkedList.from(newDataArray);
      return new List<T>(newSize, RepresentationType.CHUNKED, chunkedList);
    } else {
      return new List<T>(newSize, newRepresentation, newDataArray);
    }
  }

  /**
   * Concatenate this list with another list
   *
   * @param other - The list to concatenate with this list
   */
  concat(other: IList<T>): List<T> {
    if (!other || other.isEmpty) {
      return this;
    }

    if (this.isEmpty) {
      return other instanceof List ? other : List.from(other.toArray());
    }

    const otherArray = other.toArray();
    const newSize = this._size + otherArray.length;

    // Determine the new representation based on the new size
    let newRepresentation = this._representation;
    if (newSize >= MEDIUM_COLLECTION_THRESHOLD && this._representation === RepresentationType.CHUNKED) {
      newRepresentation = RepresentationType.VECTOR;
    } else if (newSize >= SMALL_COLLECTION_THRESHOLD && this._representation === RepresentationType.ARRAY) {
      newRepresentation = RepresentationType.CHUNKED;
    }

    // For small collections, optimize for direct array operations
    if (this._representation === RepresentationType.ARRAY && newRepresentation === RepresentationType.ARRAY) {
      return new List<T>(newSize, RepresentationType.ARRAY, [...this._data, ...otherArray]);
    }

    // Convert to array for concat operation
    const dataArray = this._representation === RepresentationType.CHUNKED
      ? (this._data as ChunkedList<T>).toArray()
      : [...this._data];

    // Concatenate the arrays
    const newDataArray = [...dataArray, ...otherArray];

    // Create the appropriate representation based on the new size
    if (newRepresentation === RepresentationType.CHUNKED) {
      const chunkedList = ChunkedList.from(newDataArray);
      return new List<T>(newSize, RepresentationType.CHUNKED, chunkedList);
    } else {
      return new List<T>(newSize, newRepresentation, newDataArray);
    }
  }

  /**
   * Map each element in the list to a new value
   *
   * @param fn - The mapping function
   */
  map<U>(fn: (value: T, index: number) => U): List<U> {
    if (this.isEmpty) {
      return List.empty<U>();
    }

    // For very small collections, return native array directly
    if (this._size < NATIVE_RETURN_THRESHOLD && this._representation === RepresentationType.ARRAY) {
      // Use native array map for optimal performance
      return new List<U>(this._size, RepresentationType.ARRAY, this._data.map(fn));
    }

    // For chunked list, convert to array first
    if (this._representation === RepresentationType.CHUNKED) {
      const dataArray = (this._data as ChunkedList<T>).toArray();
      const mappedArray = dataArray.map(fn);

      // Create the appropriate representation based on the size
      if (this._size >= MEDIUM_COLLECTION_THRESHOLD) {
        return new List<U>(this._size, RepresentationType.VECTOR, mappedArray);
      } else if (this._size >= SMALL_COLLECTION_THRESHOLD) {
        const chunkedList = ChunkedList.from(mappedArray);
        return new List<U>(this._size, RepresentationType.CHUNKED, chunkedList);
      } else {
        return new List<U>(this._size, RepresentationType.ARRAY, mappedArray);
      }
    }

    // For array representation
    // For small collections, use native array methods for better performance
    if (this._representation === RepresentationType.ARRAY && this._size < NATIVE_OPERATIONS_THRESHOLD) {
      const newData = this._data.map(fn);
      return List.from(newData);
    }

    // For vector representation, use the vector's toArray method
    if (this._representation === RepresentationType.VECTOR) {
      const dataArray = (this._data as PersistentVector<T>).toArray();
      const mappedArray = dataArray.map(fn);

      // Create the appropriate representation based on the size
      if (this._size >= MEDIUM_COLLECTION_THRESHOLD) {
        const persistentVector = PersistentVector.from(mappedArray);
        return new List<U>(this._size, RepresentationType.VECTOR, persistentVector);
      } else if (this._size >= SMALL_COLLECTION_THRESHOLD) {
        const chunkedList = ChunkedList.from(mappedArray);
        return new List<U>(this._size, RepresentationType.CHUNKED, chunkedList);
      } else {
        return new List<U>(this._size, RepresentationType.ARRAY, mappedArray);
      }
    }

    // For array representation with larger collections
    const newDataArray = [...this._data].map(fn);

    // Create the appropriate representation based on the size
    if (this._size >= MEDIUM_COLLECTION_THRESHOLD) {
      return new List<U>(this._size, RepresentationType.VECTOR, newDataArray);
    } else if (this._size >= SMALL_COLLECTION_THRESHOLD) {
      const chunkedList = ChunkedList.from(newDataArray);
      return new List<U>(this._size, RepresentationType.CHUNKED, chunkedList);
    } else {
      return new List<U>(this._size, RepresentationType.ARRAY, newDataArray);
    }
  }

  /**
   * Filter elements in the list based on a predicate
   *
   * @param fn - The predicate function
   */
  filter(fn: (value: T, index: number) => boolean): List<T> {
    if (this.isEmpty) {
      return List.empty<T>();
    }

    // For very small collections, optimize for native array operations
    if (this._size < NATIVE_RETURN_THRESHOLD && this._representation === RepresentationType.ARRAY) {
      const filtered = this._data.filter(fn);
      // If all elements pass the filter, return this list
      if (filtered.length === this._size) {
        return this;
      }
      // If no elements pass the filter, return empty list
      if (filtered.length === 0) {
        return List.empty<T>();
      }
      // Otherwise, create a new list with the filtered elements
      return new List<T>(filtered.length, RepresentationType.ARRAY, filtered);
    }

    // For chunked list, convert to array first
    if (this._representation === RepresentationType.CHUNKED) {
      const dataArray = (this._data as ChunkedList<T>).toArray();
      const filteredArray = dataArray.filter(fn);

      // If all elements pass the filter, return this list
      if (filteredArray.length === this._size) {
        return this;
      }

      // If no elements pass the filter, return empty list
      if (filteredArray.length === 0) {
        return List.empty<T>();
      }

      // Create the appropriate representation based on the filtered size
      return List.from(filteredArray);
    }

    // For vector representation, use the vector's toArray method
    if (this._representation === RepresentationType.VECTOR) {
      const dataArray = (this._data as PersistentVector<T>).toArray();
      const filteredArray = dataArray.filter(fn);

      // If all elements pass the filter, return this list
      if (filteredArray.length === this._size) {
        return this;
      }

      // If no elements pass the filter, return empty list
      if (filteredArray.length === 0) {
        return List.empty<T>();
      }

      // Create the appropriate representation based on the filtered size
      return List.from(filteredArray);
    }

    // For array representation
    // For small collections, use native array methods for better performance
    if (this._size < NATIVE_OPERATIONS_THRESHOLD) {
      const newData = this._data.filter(fn);
      return List.from(newData);
    }

    // For larger collections, filter the array
    const filteredArray = [...this._data].filter(fn);

    // If all elements pass the filter, return this list
    if (filteredArray.length === this._size) {
      return this;
    }

    // If no elements pass the filter, return empty list
    if (filteredArray.length === 0) {
      return List.empty<T>();
    }

    // Create the appropriate representation based on the filtered size
    return List.from(filteredArray);
  }

  /**
   * Reduce the list to a single value
   *
   * @param fn - The reducer function
   * @param initial - The initial value
   */
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U {
    if (this.isEmpty) {
      return initial;
    }

    // For chunked list, convert to array first
    if (this._representation === RepresentationType.CHUNKED) {
      const dataArray = (this._data as ChunkedList<T>).toArray();
      return dataArray.reduce(fn, initial);
    }

    // For other representations, use native array reduce for optimal performance
    // JavaScript engines are highly optimized for this operation
    return this._data.reduce(fn, initial);
  }

  /**
   * Find the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   */
  find(fn: (value: T, index: number) => boolean): T | undefined {
    if (this.isEmpty) {
      return undefined;
    }

    // For chunked list, convert to array first
    if (this._representation === RepresentationType.CHUNKED) {
      const dataArray = (this._data as ChunkedList<T>).toArray();
      return dataArray.find(fn);
    }

    // For other representations, use native array find for optimal performance
    return this._data.find(fn);
  }

  /**
   * Find the index of the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   */
  findIndex(fn: (value: T, index: number) => boolean): number {
    if (this.isEmpty) {
      return -1;
    }

    // For chunked list, convert to array first
    if (this._representation === RepresentationType.CHUNKED) {
      const dataArray = (this._data as ChunkedList<T>).toArray();
      return dataArray.findIndex(fn);
    }

    // For other representations, use native array findIndex for optimal performance
    return this._data.findIndex(fn);
  }

  /**
   * Convert the list to an array
   */
  toArray(): T[] {
    if (this.isEmpty) {
      return [];
    }

    switch (this._representation) {
      case RepresentationType.ARRAY:
        // For array representation, return a copy of the array
        return [...this._data];
      case RepresentationType.CHUNKED:
        // For chunked list, use the chunked list's toArray method
        return (this._data as ChunkedList<T>).toArray();
      case RepresentationType.VECTOR:
        // For vector representation, use the vector's toArray method
        return (this._data as PersistentVector<T>).toArray();
    }
  }

  /**
   * Create a slice of the list
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   */
  slice(start?: number, end?: number): List<T> {
    if (this.isEmpty) {
      return List.empty<T>();
    }

    const normalizedStart = start === undefined ? 0 : start < 0 ? Math.max(0, this._size + start) : start;
    const normalizedEnd = end === undefined ? this._size : end < 0 ? Math.max(0, this._size + end) : end;

    if (normalizedStart >= this._size || normalizedEnd <= 0 || normalizedStart >= normalizedEnd) {
      return List.empty<T>();
    }

    // If we're slicing the entire list, return this list
    if (normalizedStart === 0 && normalizedEnd === this._size) {
      return this;
    }

    // Convert to array for slice operation
    const dataArray = this._representation === RepresentationType.CHUNKED
      ? (this._data as ChunkedList<T>).toArray()
      : [...this._data];

    // Slice the array
    const slicedArray = dataArray.slice(normalizedStart, normalizedEnd);
    const sliceSize = slicedArray.length;

    // For small slices, use array representation
    if (sliceSize < SMALL_COLLECTION_THRESHOLD) {
      return new List<T>(sliceSize, RepresentationType.ARRAY, slicedArray);
    }
    // For medium slices, use chunked list
    else if (sliceSize < MEDIUM_COLLECTION_THRESHOLD) {
      const chunkedList = ChunkedList.from(slicedArray);
      return new List<T>(sliceSize, RepresentationType.CHUNKED, chunkedList);
    }
    // For large slices, use vector
    else {
      return new List<T>(sliceSize, RepresentationType.VECTOR, slicedArray);
    }
  }

  /**
   * Perform a map, filter, and reduce operation in a single pass
   *
   * @param mapFn - The mapping function
   * @param filterFn - The filter predicate
   * @param reduceFn - The reducer function
   * @param initial - The initial value for reduction
   */
  mapFilterReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    if (this.isEmpty) {
      return initial;
    }

    // For chunked list, convert to array first
    if (this._representation === RepresentationType.CHUNKED) {
      const dataArray = (this._data as ChunkedList<T>).toArray();

      // For very small collections, use separate native operations
      if (this._size < NATIVE_RETURN_THRESHOLD) {
        return dataArray
          .map(mapFn)
          .filter(filterFn)
          .reduce((acc: V, val: U, idx: number) => reduceFn(acc, val, idx), initial);
      }

      // For larger collections, use a single-pass implementation
      let result = initial;
      let filteredIndex = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const mappedValue = mapFn(dataArray[i], i);
        if (filterFn(mappedValue, i)) {
          result = reduceFn(result, mappedValue, filteredIndex++);
        }
      }

      return result;
    }

    // For array and vector representations
    // For very small collections, use separate native operations
    // JavaScript engines might optimize this better in some cases
    if (this._size < NATIVE_RETURN_THRESHOLD) {
      return this._data
        .map(mapFn)
        .filter(filterFn)
        .reduce((acc: V, val: U, idx: number) => reduceFn(acc, val, idx), initial);
    }

    // For larger collections, use a single-pass implementation for better performance
    let result = initial;
    let filteredIndex = 0;

    for (let i = 0; i < this._size; i++) {
      const mappedValue = mapFn(this._data[i], i);
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
   * @param initial - The initial value for reduction
   */
  mapReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    if (this.isEmpty) {
      return initial;
    }

    // For chunked list, convert to array first
    if (this._representation === RepresentationType.CHUNKED) {
      const dataArray = (this._data as ChunkedList<T>).toArray();

      // For very small collections, use separate native operations
      if (this._size < NATIVE_RETURN_THRESHOLD) {
        return dataArray
          .map(mapFn)
          .reduce((acc: V, val: U, idx: number) => reduceFn(acc, val, idx), initial);
      }

      // For larger collections, use a single-pass implementation
      let result = initial;

      for (let i = 0; i < dataArray.length; i++) {
        const mappedValue = mapFn(dataArray[i], i);
        result = reduceFn(result, mappedValue, i);
      }

      return result;
    }

    // For array and vector representations
    // For very small collections, use separate native operations
    if (this._size < NATIVE_RETURN_THRESHOLD) {
      return this._data
        .map(mapFn)
        .reduce((acc: V, val: U, idx: number) => reduceFn(acc, val, idx), initial);
    }

    // For larger collections, use a single-pass implementation for better performance
    let result = initial;

    for (let i = 0; i < this._size; i++) {
      const mappedValue = mapFn(this._data[i], i);
      result = reduceFn(result, mappedValue, i);
    }

    return result;
  }

  /**
   * Perform a filter and map operation in a single pass
   *
   * @param filterFn - The filter predicate
   * @param mapFn - The mapping function
   */
  filterMap<U>(
    filterFn: (value: T, index: number) => boolean,
    mapFn: (value: T, index: number) => U
  ): List<U> {
    if (this.isEmpty) {
      return List.empty<U>();
    }

    // For very small collections, optimize for native array operations
    if (this._size < NATIVE_RETURN_THRESHOLD) {
      const filtered = [];
      for (let i = 0; i < this._size; i++) {
        if (filterFn(this._data[i], i)) {
          filtered.push(mapFn(this._data[i], i));
        }
      }
      return new List<U>(filtered.length, RepresentationType.ARRAY, filtered);
    }

    // For chunked list, convert to array first
    if (this._representation === RepresentationType.CHUNKED) {
      const dataArray = (this._data as ChunkedList<T>).toArray();
      const result: U[] = [];

      for (let i = 0; i < dataArray.length; i++) {
        if (filterFn(dataArray[i], i)) {
          result.push(mapFn(dataArray[i], i));
        }
      }

      return List.from(result);
    }

    // For array and vector representations
    const result: U[] = [];

    for (let i = 0; i < this._size; i++) {
      if (filterFn(this._data[i], i)) {
        result.push(mapFn(this._data[i], i));
      }
    }

    return List.from(result);
  }

  /**
   * Create a transient (temporarily mutable) version of the list
   *
   * @returns A transient list with the current values
   */
  transient(): TransientList<T> {
    // Convert to array for transient operations
    const dataArray = this._representation === RepresentationType.CHUNKED
      ? (this._data as ChunkedList<T>).toArray()
      : [...this._data];

    return new TransientListImpl<T>(dataArray);
  }
}

// Export the List class as both a class and a factory
export default List as unknown as IListFactory<unknown> & typeof List;
