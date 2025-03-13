/**
 * Immutable List implementation
 *
 * This module provides a persistent, immutable list implementation
 * with structural sharing for efficient updates.
 *
 * @packageDocumentation
 */

import { Option, some, none } from '@reduct/core';

/**
 * Immutable List class
 *
 * @typeparam T - The type of elements in the list
 */
export class List<T> {
  /**
   * @internal
   * Internal array for element storage
   */
  private readonly elements: ReadonlyArray<T>;

  /**
   * Creates a new List
   *
   * @param elements - Array of elements to initialize the list with
   */
  private constructor(elements: ReadonlyArray<T>) {
    this.elements = elements;
  }

  /**
   * Creates an empty List
   *
   * @returns An empty List
   */
  static empty<T>(): List<T> {
    return new List<T>([]);
  }

  /**
   * Creates a List from an array
   *
   * @param elements - Array of elements
   * @returns A new List containing the array elements
   */
  static from<T>(elements: ReadonlyArray<T>): List<T> {
    return new List<T>([...elements]);
  }

  /**
   * Creates a List with the given elements
   *
   * @param elements - Elements to include in the list
   * @returns A new List containing the elements
   */
  static of<T>(...elements: T[]): List<T> {
    return new List<T>([...elements]);
  }

  /**
   * Returns the number of elements in the list
   */
  get size(): number {
    return this.elements.length;
  }

  /**
   * Returns true if the list is empty
   */
  get isEmpty(): boolean {
    return this.elements.length === 0;
  }

  /**
   * Returns the element at the specified index, or None if the index is out of bounds
   *
   * @param index - Zero-based index of the element to get
   * @returns An Option containing the element, or None if not found
   */
  get(index: number): Option<T> {
    if (index < 0 || index >= this.elements.length) {
      return none;
    }
    return some(this.elements[index]);
  }

  /**
   * Returns the first element of the list, or None if the list is empty
   */
  get head(): Option<T> {
    return this.get(0);
  }

  /**
   * Returns a new List with all elements except the first, or an empty list if already empty
   */
  get tail(): List<T> {
    if (this.isEmpty) {
      return List.empty<T>();
    }
    return new List<T>(this.elements.slice(1));
  }

  /**
   * Returns an array containing all elements of the list
   */
  toArray(): T[] {
    return [...this.elements];
  }

  /**
   * Creates a new List with the given element added to the beginning
   *
   * @param element - Element to prepend
   * @returns A new List with the element at the beginning
   */
  prepend(element: T): List<T> {
    return new List<T>([element, ...this.elements]);
  }

  /**
   * Creates a new List with the given element added to the end
   *
   * @param element - Element to append
   * @returns A new List with the element at the end
   */
  append(element: T): List<T> {
    return new List<T>([...this.elements, element]);
  }

  /**
   * Creates a new List with the element at the specified index replaced
   *
   * @param index - Index of the element to replace
   * @param element - New element value
   * @returns A new List with the element replaced, or this list if index is out of bounds
   */
  set(index: number, element: T): List<T> {
    if (index < 0 || index >= this.elements.length) {
      return this;
    }

    const newElements = [...this.elements];
    newElements[index] = element;
    return new List<T>(newElements);
  }

  /**
   * Creates a new List with an element inserted at the specified index
   *
   * @param index - Index at which to insert the element
   * @param element - Element to insert
   * @returns A new List with the element inserted
   */
  insert(index: number, element: T): List<T> {
    if (index < 0) {
      index = 0;
    } else if (index > this.elements.length) {
      index = this.elements.length;
    }

    const newElements = [
      ...this.elements.slice(0, index),
      element,
      ...this.elements.slice(index)
    ];

    return new List<T>(newElements);
  }

  /**
   * Creates a new List with the element at the specified index removed
   *
   * @param index - Index of the element to remove
   * @returns A new List with the element removed, or this list if index is out of bounds
   */
  remove(index: number): List<T> {
    if (index < 0 || index >= this.elements.length) {
      return this;
    }

    const newElements = [
      ...this.elements.slice(0, index),
      ...this.elements.slice(index + 1)
    ];

    return new List<T>(newElements);
  }

  /**
   * Creates a new List by transforming each element with the provided function
   *
   * @param fn - Mapping function
   * @returns A new List with transformed elements
   */
  map<U>(fn: (element: T, index: number) => U): List<U> {
    return new List<U>(this.elements.map(fn));
  }

  /**
   * Creates a new List containing only elements that match the predicate
   *
   * @param predicate - Function to test elements
   * @returns A filtered List
   */
  filter(predicate: (element: T, index: number) => boolean): List<T> {
    return new List<T>(this.elements.filter(predicate));
  }

  /**
   * Accumulates a single value by applying a function to each element
   *
   * @param fn - Function to apply to each element
   * @param initialValue - Starting value for the accumulation
   * @returns The final accumulated value
   */
  reduce<U>(fn: (accumulator: U, element: T, index: number) => U, initialValue: U): U {
    return this.elements.reduce(fn, initialValue);
  }

  /**
   * Combines two lists into a new list
   *
   * @param other - List to concatenate
   * @returns A new List containing elements from both lists
   */
  concat(other: List<T>): List<T> {
    return new List<T>([...this.elements, ...other.elements]);
  }

  /**
   * Returns a slice of the list as a new List
   *
   * @param start - Start index (inclusive)
   * @param end - End index (exclusive)
   * @returns A new List with the specified elements
   */
  slice(start?: number, end?: number): List<T> {
    return new List<T>(this.elements.slice(start, end));
  }

  /**
   * Returns true if the predicate returns true for any element
   *
   * @param predicate - Function to test elements
   * @returns True if any element matches
   */
  some(predicate: (element: T, index: number) => boolean): boolean {
    return this.elements.some(predicate);
  }

  /**
   * Returns true if the predicate returns true for all elements
   *
   * @param predicate - Function to test elements
   * @returns True if all elements match
   */
  every(predicate: (element: T, index: number) => boolean): boolean {
    return this.elements.every(predicate);
  }

  /**
   * Returns the index of the first occurrence of the element, or -1 if not found
   *
   * @param element - Element to find
   * @returns The index or -1
   */
  indexOf(element: T): number {
    return this.elements.indexOf(element);
  }

  /**
   * Returns true if the element is in the list
   *
   * @param element - Element to check
   * @returns True if the element is found
   */
  includes(element: T): boolean {
    return this.elements.includes(element);
  }

  /**
   * Executes a function for each element in the list
   *
   * @param fn - Function to execute
   */
  forEach(fn: (element: T, index: number) => void): void {
    this.elements.forEach(fn);
  }

  /**
   * Creates a new sorted List
   *
   * @param compareFn - Function to determine sort order
   * @returns A new sorted List
   */
  sort(compareFn?: (a: T, b: T) => number): List<T> {
    return new List<T>([...this.elements].sort(compareFn));
  }

  /**
   * Returns a new List with elements in reverse order
   *
   * @returns A new reversed List
   */
  reverse(): List<T> {
    return new List<T>([...this.elements].reverse());
  }

  /**
   * Returns a string representation of the list
   */
  toString(): string {
    return `List(${this.elements.join(', ')})`;
  }

  /**
   * Returns an iterator for the list elements
   */
  [Symbol.iterator](): Iterator<T> {
    return this.elements[Symbol.iterator]();
  }
}
