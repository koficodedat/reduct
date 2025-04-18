/**
 * Lazy List implementation
 *
 * This module provides a lazy, immutable list implementation
 * that defers computation until values are actually needed.
 *
 * @packageDocumentation
 */

import { Option, some, none } from '@reduct/core';
import { OptimizedList } from './list';
import { PersistentVector } from './persistent-vector';

/**
 * Represents a lazy operation that will be applied to a list
 */
type LazyOperation<T, U> = {
  type: 'map' | 'filter' | 'take' | 'drop' | 'flatten';
  fn?: (value: T, index: number) => any;
  count?: number;
};

/**
 * LazyList class - A lazy immutable list implementation
 *
 * @typeparam T - The type of elements in the list
 */
export class LazyList<T> {
  /**
   * @internal
   * The source list that operations will be applied to
   */
  private readonly source: OptimizedList<any>;

  /**
   * @internal
   * The chain of operations to apply when the list is realized
   */
  private readonly operations: LazyOperation<any, any>[];

  /**
   * @internal
   * The realized list (cached after first computation)
   */
  private realized: OptimizedList<T> | null;

  /**
   * Creates a new LazyList
   *
   * @param source - The source list
   * @param operations - The chain of operations to apply
   */
  private constructor(
    source: OptimizedList<any>,
    operations: LazyOperation<any, any>[] = []
  ) {
    this.source = source;
    this.operations = operations;
    this.realized = null;
  }

  /**
   * Creates a LazyList from an OptimizedList
   */
  static from<T>(list: OptimizedList<T>): LazyList<T> {
    return new LazyList<T>(list);
  }

  /**
   * Creates a LazyList from an array
   */
  static fromArray<T>(array: ReadonlyArray<T>): LazyList<T> {
    return LazyList.from(OptimizedList.from(array));
  }

  /**
   * Creates an empty LazyList
   */
  static empty<T>(): LazyList<T> {
    return LazyList.from(OptimizedList.empty<T>());
  }

  /**
   * Realizes the list by applying all pending operations
   * This is called automatically when a terminal operation is performed
   */
  private realize(): OptimizedList<T> {
    if (this.realized) {
      return this.realized;
    }

    // Optimize the operation chain before execution
    const optimizedOps = this.optimizeOperations(this.operations);

    // If we have no operations, just return the source
    if (optimizedOps.length === 0) {
      this.realized = this.source as OptimizedList<T>;
      return this.realized;
    }

    // For small lists, use array operations which are faster
    if (this.source.size < 1000) {
      let array = this.source.toArray();

      for (const op of optimizedOps) {
        switch (op.type) {
          case 'map':
            array = array.map(op.fn!);
            break;
          case 'filter':
            array = array.filter(op.fn!);
            break;
          case 'take':
            array = array.slice(0, op.count);
            break;
          case 'drop':
            array = array.slice(op.count || 0);
            break;
          case 'flatten':
            array = array.flat(1);
            break;
        }
      }

      this.realized = OptimizedList.from(array) as OptimizedList<T>;
      return this.realized;
    }

    // For larger lists, use the transient approach for better performance
    let result: OptimizedList<any> = this.source;

    for (const op of optimizedOps) {
      switch (op.type) {
        case 'map':
          result = result.map(op.fn!);
          break;
        case 'filter':
          result = result.filter(op.fn!);
          break;
        case 'take':
          result = result.slice(0, op.count);
          break;
        case 'drop':
          result = result.slice(op.count);
          break;
        case 'flatten':
          // Flatten one level of nesting
          result = result.reduce(
            (acc, val) => acc.concat(OptimizedList.from(val)),
            OptimizedList.empty()
          );
          break;
      }
    }

    this.realized = result as OptimizedList<T>;
    return this.realized;
  }

  /**
   * Optimizes the operation chain by combining or reordering operations
   * @private
   */
  private optimizeOperations(operations: LazyOperation<any, any>[]): LazyOperation<any, any>[] {
    if (operations.length <= 1) {
      return operations;
    }

    const result: LazyOperation<any, any>[] = [];
    let i = 0;

    while (i < operations.length) {
      const current = operations[i];

      // Look ahead for optimizations
      if (i < operations.length - 1) {
        const next = operations[i + 1];

        // Optimize consecutive take operations
        if (current.type === 'take' && next.type === 'take') {
          // Take the smaller of the two counts
          result.push({
            type: 'take',
            count: Math.min(current.count!, next.count!)
          });
          i += 2;
          continue;
        }

        // Optimize consecutive drop operations
        if (current.type === 'drop' && next.type === 'drop') {
          // Combine the drop counts
          result.push({
            type: 'drop',
            count: (current.count || 0) + (next.count || 0)
          });
          i += 2;
          continue;
        }

        // Optimize take after drop
        if (current.type === 'drop' && next.type === 'take') {
          result.push(current);
          result.push(next);
          i += 2;
          continue;
        }
      }

      // No optimization found, add the current operation as is
      result.push(current);
      i++;
    }

    return result;
  }

  /**
   * Returns the number of elements in the list
   * This is a terminal operation that realizes the list
   */
  get size(): number {
    return this.realize().size;
  }

  /**
   * Returns true if the list is empty
   * This is a terminal operation that realizes the list
   */
  get isEmpty(): boolean {
    return this.realize().isEmpty;
  }

  /**
   * Returns the element at the specified index, or None if the index is out of bounds
   * This is a terminal operation that realizes the list
   *
   * @param index - Zero-based index of the element to get
   * @returns An Option containing the element, or None if not found
   */
  get(index: number): Option<T> {
    return this.realize().get(index);
  }

  /**
   * Returns the first element of the list, or None if the list is empty
   * This is a terminal operation that realizes the list
   */
  get head(): Option<T> {
    return this.realize().head;
  }

  /**
   * Returns a new LazyList with all elements except the first, or an empty list if already empty
   * This is a terminal operation that realizes the list
   */
  get tail(): LazyList<T> {
    return LazyList.from(this.realize().tail);
  }

  /**
   * Returns an array containing all elements of the list
   * This is a terminal operation that realizes the list
   */
  toArray(): T[] {
    return this.realize().toArray();
  }

  /**
   * Creates a new LazyList with the given element added to the beginning
   * This is a terminal operation that realizes the list
   *
   * @param element - Element to prepend
   * @returns A new LazyList with the element at the beginning
   */
  prepend(element: T): LazyList<T> {
    return LazyList.from(this.realize().prepend(element));
  }

  /**
   * Creates a new LazyList with the given element added to the end
   * This is a terminal operation that realizes the list
   *
   * @param element - Element to append
   * @returns A new LazyList with the element at the end
   */
  append(element: T): LazyList<T> {
    return LazyList.from(this.realize().append(element));
  }

  /**
   * Creates a new LazyList with the element at the specified index replaced
   * This is a terminal operation that realizes the list
   *
   * @param index - Index of the element to replace
   * @param element - New element value
   * @returns A new LazyList with the element replaced, or this list if index is out of bounds
   */
  set(index: number, element: T): LazyList<T> {
    return LazyList.from(this.realize().set(index, element));
  }

  /**
   * Creates a new LazyList with an element inserted at the specified index
   * This is a terminal operation that realizes the list
   *
   * @param index - Index at which to insert the element
   * @param element - Element to insert
   * @returns A new LazyList with the element inserted
   */
  insert(index: number, element: T): LazyList<T> {
    return LazyList.from(this.realize().insert(index, element));
  }

  /**
   * Creates a new LazyList with the element at the specified index removed
   * This is a terminal operation that realizes the list
   *
   * @param index - Index of the element to remove
   * @returns A new LazyList with the element removed, or this list if index is out of bounds
   */
  remove(index: number): LazyList<T> {
    return LazyList.from(this.realize().remove(index));
  }

  /**
   * Creates a new LazyList by transforming each element with the provided function
   * This is a lazy operation that doesn't compute anything until a terminal operation is called
   *
   * @param fn - Mapping function
   * @returns A new LazyList with the mapping operation added to the chain
   */
  map<U>(fn: (element: T, index: number) => U): LazyList<U> {
    return new LazyList<U>(
      this.source,
      [...this.operations, { type: 'map', fn }]
    );
  }

  /**
   * Creates a new LazyList containing only elements that match the predicate
   * This is a lazy operation that doesn't compute anything until a terminal operation is called
   *
   * @param predicate - Function to test elements
   * @returns A new LazyList with the filter operation added to the chain
   */
  filter(predicate: (element: T, index: number) => boolean): LazyList<T> {
    return new LazyList<T>(
      this.source,
      [...this.operations, { type: 'filter', fn: predicate }]
    );
  }

  /**
   * Takes the first n elements from the list
   * This is a lazy operation that doesn't compute anything until a terminal operation is called
   *
   * @param count - Number of elements to take
   * @returns A new LazyList with the take operation added to the chain
   */
  take(count: number): LazyList<T> {
    return new LazyList<T>(
      this.source,
      [...this.operations, { type: 'take', count }]
    );
  }

  /**
   * Drops the first n elements from the list
   * This is a lazy operation that doesn't compute anything until a terminal operation is called
   *
   * @param count - Number of elements to drop
   * @returns A new LazyList with the drop operation added to the chain
   */
  drop(count: number): LazyList<T> {
    return new LazyList<T>(
      this.source,
      [...this.operations, { type: 'drop', count }]
    );
  }

  /**
   * Flattens one level of nesting in the list
   * This is a lazy operation that doesn't compute anything until a terminal operation is called
   *
   * @returns A new LazyList with the flatten operation added to the chain
   */
  flatten<U>(this: LazyList<U[]>): LazyList<U> {
    return new LazyList<U>(
      this.source,
      [...this.operations, { type: 'flatten' }]
    );
  }

  /**
   * Accumulates a single value by applying a function to each element
   * This is a terminal operation that realizes the list
   *
   * @param fn - Function to apply to each element
   * @param initialValue - Starting value for the accumulation
   * @returns The final accumulated value
   */
  reduce<U>(fn: (accumulator: U, element: T, index: number) => U, initialValue: U): U {
    // For small lists with simple operations, optimize by using native array methods
    if (this.source.size < 1000 && this.operations.length <= 2) {
      // Check if we have a simple map-reduce or filter-reduce chain
      if (this.operations.length === 1) {
        const op = this.operations[0];
        const array = this.source.toArray();

        if (op.type === 'map') {
          // Optimize map-reduce chain
          return array.reduce((acc, val, idx) => {
            return fn(acc, op.fn!(val, idx), idx);
          }, initialValue);
        } else if (op.type === 'filter') {
          // Optimize filter-reduce chain
          return array.reduce((acc, val, idx) => {
            return op.fn!(val, idx) ? fn(acc, val, idx) : acc;
          }, initialValue);
        }
      } else if (this.operations.length === 2) {
        // Check for map-filter-reduce or filter-map-reduce chains
        const op1 = this.operations[0];
        const op2 = this.operations[1];
        const array = this.source.toArray();

        if (op1.type === 'map' && op2.type === 'filter') {
          // Optimize map-filter-reduce chain
          return array.reduce((acc, val, idx) => {
            const mappedVal = op1.fn!(val, idx);
            return op2.fn!(mappedVal, idx) ? fn(acc, mappedVal, idx) : acc;
          }, initialValue);
        } else if (op1.type === 'filter' && op2.type === 'map') {
          // Optimize filter-map-reduce chain
          return array.reduce((acc, val, idx) => {
            if (op1.fn!(val, idx)) {
              const mappedVal = op2.fn!(val, idx);
              return fn(acc, mappedVal, idx);
            }
            return acc;
          }, initialValue);
        }
      }
    }

    // Fall back to the standard approach for more complex cases
    return this.realize().reduce(fn, initialValue);
  }

  /**
   * Combines two lists into a new list
   * This is a terminal operation that realizes the list
   *
   * @param other - List to concatenate
   * @returns A new LazyList containing elements from both lists
   */
  concat(other: LazyList<T>): LazyList<T> {
    return LazyList.from(this.realize().concat(other.realize()));
  }

  /**
   * Returns a slice of the list as a new LazyList
   * This is a terminal operation that realizes the list
   *
   * @param start - Start index (inclusive)
   * @param end - End index (exclusive)
   * @returns A new LazyList with the specified elements
   */
  slice(start?: number, end?: number): LazyList<T> {
    return LazyList.from(this.realize().slice(start, end));
  }

  /**
   * Returns true if the predicate returns true for any element
   * This is a terminal operation that realizes the list
   *
   * @param predicate - Function to test elements
   * @returns True if any element matches
   */
  some(predicate: (element: T, index: number) => boolean): boolean {
    return this.realize().some(predicate);
  }

  /**
   * Returns true if the predicate returns true for all elements
   * This is a terminal operation that realizes the list
   *
   * @param predicate - Function to test elements
   * @returns True if all elements match
   */
  every(predicate: (element: T, index: number) => boolean): boolean {
    return this.realize().every(predicate);
  }

  /**
   * Returns the index of the first occurrence of the element, or -1 if not found
   * This is a terminal operation that realizes the list
   *
   * @param element - Element to find
   * @returns The index or -1
   */
  indexOf(element: T): number {
    return this.realize().indexOf(element);
  }

  /**
   * Returns true if the element is in the list
   * This is a terminal operation that realizes the list
   *
   * @param element - Element to check
   * @returns True if the element is found
   */
  includes(element: T): boolean {
    return this.realize().includes(element);
  }

  /**
   * Executes a function for each element in the list
   * This is a terminal operation that realizes the list
   *
   * @param fn - Function to execute
   */
  forEach(fn: (element: T, index: number) => void): void {
    this.realize().forEach(fn);
  }

  /**
   * Creates a new sorted LazyList
   * This is a terminal operation that realizes the list
   *
   * @param compareFn - Function to determine sort order
   * @returns A new sorted LazyList
   */
  sort(compareFn?: (a: T, b: T) => number): LazyList<T> {
    return LazyList.from(this.realize().sort(compareFn));
  }

  /**
   * Returns a new LazyList with elements in reverse order
   * This is a terminal operation that realizes the list
   *
   * @returns A new reversed LazyList
   */
  reverse(): LazyList<T> {
    return LazyList.from(this.realize().reverse());
  }

  /**
   * Returns a string representation of the list
   * This is a terminal operation that realizes the list
   */
  toString(): string {
    return `LazyList(${this.realize().toString()})`;
  }

  /**
   * Returns an iterator for the list elements
   * This is a terminal operation that realizes the list
   */
  [Symbol.iterator](): Iterator<T> {
    return this.realize()[Symbol.iterator]();
  }
}
