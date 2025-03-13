/**
 * Persistent Stack implementation
 *
 * This module provides an immutable stack data structure with
 * efficient push and pop operations.
 *
 * @packageDocumentation
 */

import { Option, some, none } from '@reduct/core';

/**
 * Immutable Stack class
 *
 * @typeparam T - The type of elements in the stack
 */
export class Stack<T> {
  /**
   * @internal
   * Internal array for element storage
   */
  private readonly elements: ReadonlyArray<T>;

  /**
   * Creates a new Stack
   *
   * @param elements - Array of elements to initialize the stack with
   */
  private constructor(elements: ReadonlyArray<T>) {
    this.elements = elements;
  }

  /**
   * Creates an empty Stack
   *
   * @returns An empty Stack
   */
  static empty<T>(): Stack<T> {
    return new Stack<T>([]);
  }

  /**
   * Creates a Stack from an array
   *
   * @param elements - Array of elements
   * @returns A new Stack containing the array elements
   */
  static from<T>(elements: ReadonlyArray<T>): Stack<T> {
    return new Stack<T>([...elements]);
  }

  /**
   * Creates a Stack with the given elements
   *
   * @param elements - Elements to include in the stack (first element becomes the bottom)
   * @returns A new Stack containing the elements
   */
  static of<T>(...elements: T[]): Stack<T> {
    return new Stack<T>([...elements]);
  }

  /**
   * Returns the number of elements in the stack
   */
  get size(): number {
    return this.elements.length;
  }

  /**
   * Returns true if the stack is empty
   */
  get isEmpty(): boolean {
    return this.elements.length === 0;
  }

  /**
   * Returns the top element of the stack, or None if the stack is empty
   */
  peek(): Option<T> {
    if (this.isEmpty) {
      return none;
    }
    return some(this.elements[this.elements.length - 1]);
  }

  /**
   * Creates a new Stack with the given element added to the top
   *
   * @param element - Element to push
   * @returns A new Stack with the element at the top
   */
  push(element: T): Stack<T> {
    return new Stack<T>([...this.elements, element]);
  }

  /**
   * Creates a new Stack with the top element removed
   *
   * @returns A new Stack without the top element, or this stack if already empty
   */
  pop(): Stack<T> {
    if (this.isEmpty) {
      return this;
    }
    return new Stack<T>(this.elements.slice(0, this.elements.length - 1));
  }

  /**
   * Returns the top element and a new Stack with the top element removed
   *
   * @returns A tuple with the top element and a new Stack, or None and this stack if empty
   */
  popWithElement(): [Option<T>, Stack<T>] {
    if (this.isEmpty) {
      return [none, this];
    }

    const element = this.elements[this.elements.length - 1];
    const newStack = new Stack<T>(this.elements.slice(0, this.elements.length - 1));

    return [some(element), newStack];
  }

  /**
   * Returns an array containing all elements of the stack (bottom to top)
   */
  toArray(): T[] {
    return [...this.elements];
  }

  /**
   * Maps the stack elements using a transformation function
   *
   * @param fn - Function to transform elements
   * @returns A new Stack with transformed elements
   */
  map<U>(fn: (element: T) => U): Stack<U> {
    return new Stack<U>(this.elements.map(fn));
  }

  /**
   * Filters the stack elements using a predicate
   *
   * @param predicate - Function to test elements
   * @returns A new Stack with filtered elements
   */
  filter(predicate: (element: T) => boolean): Stack<T> {
    return new Stack<T>(this.elements.filter(predicate));
  }

  /**
   * Executes a function for each element in the stack (bottom to top)
   *
   * @param fn - Function to execute
   */
  forEach(fn: (element: T) => void): void {
    this.elements.forEach(fn);
  }

  /**
   * Returns a string representation of the stack
   */
  toString(): string {
    return `Stack(${this.elements.join(', ')})`;
  }
}
