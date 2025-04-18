/**
 * Optimized Immutable List implementation
 *
 * This module provides a persistent, immutable list implementation
 * that uses PersistentVector internally for better performance.
 *
 * @packageDocumentation
 */

import { Option } from '@reduct/core';
import { PersistentVector } from './persistent-vector';
import { TransientVector } from './transient-vector';

/**
 * Optimized Immutable List class
 *
 * @typeparam T - The type of elements in the list
 */
export class OptimizedList<T> {
  /**
   * @internal
   * Internal vector for element storage
   */
  private readonly vector: PersistentVector<T>;

  /**
   * Creates a new OptimizedList
   *
   * @param vector - PersistentVector to initialize the list with
   */
  private constructor(vector: PersistentVector<T>) {
    this.vector = vector;
  }

  /**
   * Creates an empty OptimizedList
   *
   * @returns An empty OptimizedList
   */
  static empty<T>(): OptimizedList<T> {
    return new OptimizedList<T>(PersistentVector.empty<T>());
  }

  /**
   * Creates an OptimizedList from an array
   *
   * @param elements - Array of elements
   * @returns A new OptimizedList containing the array elements
   */
  static from<T>(elements: ReadonlyArray<T>): OptimizedList<T> {
    // For small arrays, use the native array operations directly
    if (elements.length < 1000) {
      const list = new OptimizedList<T>(PersistentVector.empty<T>());
      (list as any).vector = PersistentVector.from(elements);
      return list;
    }

    // For larger arrays, use a transient vector for efficient batch operations
    const transient = TransientVector.empty<T>();
    for (let i = 0; i < elements.length; i++) {
      transient.append(elements[i]);
    }
    return new OptimizedList<T>(transient.persistent());
  }

  /**
   * Creates an OptimizedList with the given elements
   *
   * @param elements - Elements to include in the list
   * @returns A new OptimizedList containing the elements
   */
  static of<T>(...elements: T[]): OptimizedList<T> {
    return OptimizedList.from(elements);
  }

  /**
   * Returns the number of elements in the list
   */
  get size(): number {
    return this.vector.getSize();
  }

  /**
   * Returns true if the list is empty
   */
  get isEmpty(): boolean {
    return this.vector.isEmpty();
  }

  /**
   * Returns the element at the specified index, or None if the index is out of bounds
   *
   * @param index - Zero-based index of the element to get
   * @returns An Option containing the element, or None if not found
   */
  get(index: number): Option<T> {
    return this.vector.get(index);
  }

  /**
   * Returns the first element of the list, or None if the list is empty
   */
  get head(): Option<T> {
    return this.get(0);
  }

  /**
   * Returns a new OptimizedList with all elements except the first, or an empty list if already empty
   */
  get tail(): OptimizedList<T> {
    if (this.isEmpty) {
      return OptimizedList.empty<T>();
    }
    return this.slice(1);
  }

  /**
   * Returns an array containing all elements of the list
   */
  toArray(): T[] {
    return this.vector.toArray();
  }

  /**
   * Creates a new OptimizedList with the given element added to the beginning
   *
   * @param element - Element to prepend
   * @returns A new OptimizedList with the element at the beginning
   */
  prepend(element: T): OptimizedList<T> {
    return new OptimizedList<T>(this.vector.prepend(element));
  }

  /**
   * Creates a new OptimizedList with the given element added to the end
   *
   * @param element - Element to append
   * @returns A new OptimizedList with the element at the end
   */
  append(element: T): OptimizedList<T> {
    return new OptimizedList<T>(this.vector.append(element));
  }

  /**
   * Creates a new OptimizedList with the element at the specified index replaced
   *
   * @param index - Index of the element to replace
   * @param element - New element value
   * @returns A new OptimizedList with the element replaced, or this list if index is out of bounds
   */
  set(index: number, element: T): OptimizedList<T> {
    if (index < 0 || index >= this.size) {
      return this;
    }
    return new OptimizedList<T>(this.vector.set(index, element));
  }

  /**
   * Creates a new OptimizedList with an element inserted at the specified index
   *
   * @param index - Index at which to insert the element
   * @param element - Element to insert
   * @returns A new OptimizedList with the element inserted
   */
  insert(index: number, element: T): OptimizedList<T> {
    if (index < 0) {
      // Insert at the beginning
      return this.prepend(element);
    } else if (index >= this.size) {
      // Insert at the end
      return this.append(element);
    }

    // For now, use the split and concat approach which is more reliable
    // We'll optimize this further in the future
    const firstPart = this.slice(0, index);
    const secondPart = this.slice(index);

    return firstPart.append(element).concat(secondPart);
  }

  /**
   * Creates a new OptimizedList with the element at the specified index removed
   *
   * @param index - Index of the element to remove
   * @returns A new OptimizedList with the element removed, or this list if index is out of bounds
   */
  remove(index: number): OptimizedList<T> {
    if (index < 0 || index >= this.size) {
      return this;
    }

    // For now, use the split and concat approach which is more reliable
    // We'll optimize this further in the future
    const firstPart = this.slice(0, index);
    const secondPart = this.slice(index + 1);

    return firstPart.concat(secondPart);
  }

  /**
   * Creates a new OptimizedList by transforming each element with the provided function
   *
   * @param fn - Mapping function
   * @returns A new OptimizedList with transformed elements
   */
  map<U>(fn: (element: T, index: number) => U): OptimizedList<U> {
    // For small lists, use the native array operations which are faster
    if (this.size < 1000) {
      return OptimizedList.from(this.toArray().map(fn));
    }

    // For larger lists, use the optimized operation from PersistentVector
    return new OptimizedList<U>(this.vector.map(fn));
  }

  /**
   * Creates a new OptimizedList containing only elements that match the predicate
   *
   * @param predicate - Function to test elements
   * @returns A filtered OptimizedList
   */
  filter(predicate: (element: T, index: number) => boolean): OptimizedList<T> {
    // For small lists, use the native array operations which are faster
    if (this.size < 1000) {
      return OptimizedList.from(this.toArray().filter(predicate));
    }

    // For larger lists, use the optimized operation from PersistentVector
    return new OptimizedList<T>(this.vector.filter(predicate));
  }

  /**
   * Accumulates a single value by applying a function to each element
   *
   * @param fn - Function to apply to each element
   * @param initialValue - Starting value for the accumulation
   * @returns The final accumulated value
   */
  reduce<U>(fn: (accumulator: U, element: T, index: number) => U, initialValue: U): U {
    // For small lists, use the native array operations which are faster
    if (this.size < 1000) {
      return this.toArray().reduce(fn, initialValue);
    }

    // For larger lists, use the optimized operation from PersistentVector
    return this.vector.reduce(fn, initialValue);
  }

  /**
   * Combines two lists into a new list
   *
   * @param other - List to concatenate
   * @returns A new OptimizedList containing elements from both lists
   */
  concat(other: OptimizedList<T>): OptimizedList<T> {
    return new OptimizedList<T>(this.vector.concat(other.vector));
  }

  /**
   * Returns a slice of the list as a new OptimizedList
   *
   * @param start - Start index (inclusive)
   * @param end - End index (exclusive)
   * @returns A new OptimizedList with the specified elements
   */
  slice(start?: number, end?: number): OptimizedList<T> {
    return new OptimizedList<T>(this.vector.slice(start, end));
  }

  /**
   * Returns true if the predicate returns true for any element
   *
   * @param predicate - Function to test elements
   * @returns True if any element matches
   */
  some(predicate: (element: T, index: number) => boolean): boolean {
    return this.vector.some(predicate);
  }

  /**
   * Returns true if the predicate returns true for all elements
   *
   * @param predicate - Function to test elements
   * @returns True if all elements match
   */
  every(predicate: (element: T, index: number) => boolean): boolean {
    return this.vector.every(predicate);
  }

  /**
   * Returns the index of the first occurrence of the element, or -1 if not found
   *
   * @param element - Element to find
   * @returns The index or -1
   */
  indexOf(element: T): number {
    return this.vector.indexOf(element);
  }

  /**
   * Returns true if the element is in the list
   *
   * @param element - Element to check
   * @returns True if the element is found
   */
  includes(element: T): boolean {
    return this.vector.includes(element);
  }

  /**
   * Executes a function for each element in the list
   *
   * @param fn - Function to execute
   */
  forEach(fn: (element: T, index: number) => void): void {
    this.vector.forEach(fn);
  }

  /**
   * Creates a new sorted OptimizedList
   *
   * @param compareFn - Function to determine sort order
   * @returns A new sorted OptimizedList
   */
  sort(compareFn?: (a: T, b: T) => number): OptimizedList<T> {
    return OptimizedList.from([...this.toArray()].sort(compareFn));
  }

  /**
   * Returns a new OptimizedList with elements in reverse order
   *
   * @returns A new reversed OptimizedList
   */
  reverse(): OptimizedList<T> {
    return OptimizedList.from([...this.toArray()].reverse());
  }

  /**
   * Returns a string representation of the list
   */
  toString(): string {
    return `List(${this.toArray().join(', ')})`;
  }

  /**
   * Returns an iterator for the list elements
   */
  [Symbol.iterator](): Iterator<T> {
    return this.vector[Symbol.iterator]();
  }
}
