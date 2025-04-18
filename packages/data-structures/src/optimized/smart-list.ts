/**
 * SmartList - A selectively optimized immutable list implementation
 *
 * This implementation intelligently selects the most efficient approach based on:
 * - Collection size
 * - Operation type
 * - Expected usage patterns
 *
 * It provides:
 * - Native array performance for small collections
 * - Immutability guarantees for all collection sizes
 * - Structural sharing benefits for large collections
 *
 * @packageDocumentation
 */

import { Option, some, none } from '@reduct/core';
import { PersistentVector } from './persistent-vector';
import { TransientVector } from './transient-vector';
import { LazyList } from './lazy-list';

// Size thresholds for different optimization strategies
const SMALL_COLLECTION_THRESHOLD = 100;
const MEDIUM_COLLECTION_THRESHOLD = 1000;

/**
 * Internal representation types for the SmartList
 */
enum RepresentationType {
  ARRAY,       // Native array for small collections
  VECTOR,      // PersistentVector for medium/large collections
  LAZY         // LazyList for deferred operations
}

/**
 * SmartList class - A selectively optimized immutable list implementation
 *
 * @typeparam T - The type of elements in the list
 */
export class SmartList<T> {
  /**
   * @internal
   * The type of internal representation being used
   */
  private readonly repType: RepresentationType;

  /**
   * @internal
   * The internal representation of the list
   */
  private readonly representation: T[] | PersistentVector<T> | LazyList<T>;

  /**
   * Private constructor - use static factory methods to create instances
   */
  private constructor(
    repType: RepresentationType,
    representation: T[] | PersistentVector<T> | LazyList<T>
  ) {
    this.repType = repType;
    this.representation = representation;
  }

  /**
   * Creates an empty SmartList
   */
  static empty<T>(): SmartList<T> {
    // For empty lists, use array representation
    return new SmartList<T>(RepresentationType.ARRAY, []);
  }

  /**
   * Creates a SmartList from an array of elements
   */
  static from<T>(elements: ReadonlyArray<T>): SmartList<T> {
    if (elements.length === 0) {
      return SmartList.empty<T>();
    }

    if (elements.length <= SMALL_COLLECTION_THRESHOLD) {
      // For small collections, use array representation
      return new SmartList<T>(RepresentationType.ARRAY, [...elements]);
    } else {
      // For larger collections, use vector representation with transient optimization
      // Use transient vector for efficient batch creation
      const transient = TransientVector.empty<T>();
      for (let i = 0; i < elements.length; i++) {
        transient.append(elements[i]);
      }
      return new SmartList<T>(
        RepresentationType.VECTOR,
        transient.persistent()
      );
    }
  }

  /**
   * Creates a SmartList with the given elements
   */
  static of<T>(...elements: T[]): SmartList<T> {
    return SmartList.from(elements);
  }

  /**
   * Returns the number of elements in the list
   */
  get size(): number {
    switch (this.repType) {
      case RepresentationType.ARRAY:
        return (this.representation as T[]).length;
      case RepresentationType.VECTOR:
        return (this.representation as PersistentVector<T>).getSize();
      case RepresentationType.LAZY:
        return (this.representation as LazyList<T>).size;
    }
  }

  /**
   * Returns true if the list is empty
   */
  get isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Returns the element at the specified index, or None if the index is out of bounds
   *
   * @param index - Zero-based index of the element to get
   * @returns An Option containing the element, or None if not found
   */
  get(index: number): Option<T> {
    if (index < 0 || index >= this.size) {
      return none;
    }

    switch (this.repType) {
      case RepresentationType.ARRAY:
        return some((this.representation as T[])[index]);
      case RepresentationType.VECTOR:
        return (this.representation as PersistentVector<T>).get(index);
      case RepresentationType.LAZY:
        return (this.representation as LazyList<T>).get(index);
    }
  }

  /**
   * Returns the first element of the list, or None if the list is empty
   */
  get head(): Option<T> {
    return this.get(0);
  }

  /**
   * Returns a new SmartList with all elements except the first, or an empty list if already empty
   */
  get tail(): SmartList<T> {
    if (this.isEmpty) {
      return SmartList.empty<T>();
    }
    return this.slice(1);
  }

  /**
   * Returns an array containing all elements of the list
   */
  toArray(): T[] {
    switch (this.repType) {
      case RepresentationType.ARRAY:
        return [...this.representation as T[]];
      case RepresentationType.VECTOR:
        return (this.representation as PersistentVector<T>).toArray();
      case RepresentationType.LAZY:
        return (this.representation as LazyList<T>).toArray();
    }
  }

  /**
   * Creates a new SmartList with the given element added to the beginning
   *
   * @param element - Element to prepend
   * @returns A new SmartList with the element at the beginning
   */
  prepend(element: T): SmartList<T> {
    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];

        // If adding one element would exceed the small collection threshold,
        // switch to vector representation
        if (array.length >= SMALL_COLLECTION_THRESHOLD) {
          const vector = PersistentVector.from([element, ...array]);
          return new SmartList<T>(RepresentationType.VECTOR, vector);
        }

        // Otherwise, stay with array representation
        return new SmartList<T>(RepresentationType.ARRAY, [element, ...array]);
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;
        return new SmartList<T>(RepresentationType.VECTOR, vector.prepend(element));
      }

      case RepresentationType.LAZY: {
        const lazy = this.representation as LazyList<T>;
        return new SmartList<T>(RepresentationType.LAZY, lazy.prepend(element));
      }
    }
  }

  /**
   * Creates a new SmartList with the given element added to the end
   *
   * @param element - Element to append
   * @returns A new SmartList with the element at the end
   */
  append(element: T): SmartList<T> {
    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];

        // If adding one element would exceed the small collection threshold,
        // switch to vector representation
        if (array.length >= SMALL_COLLECTION_THRESHOLD) {
          const vector = PersistentVector.from([...array, element]);
          return new SmartList<T>(RepresentationType.VECTOR, vector);
        }

        // Otherwise, stay with array representation
        return new SmartList<T>(RepresentationType.ARRAY, [...array, element]);
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;
        return new SmartList<T>(RepresentationType.VECTOR, vector.append(element));
      }

      case RepresentationType.LAZY: {
        const lazy = this.representation as LazyList<T>;
        return new SmartList<T>(RepresentationType.LAZY, lazy.append(element));
      }
    }
  }

  /**
   * Creates a new SmartList with the element at the specified index replaced
   *
   * @param index - Index of the element to replace
   * @param element - New element value
   * @returns A new SmartList with the element replaced, or this list if index is out of bounds
   */
  set(index: number, element: T): SmartList<T> {
    if (index < 0 || index >= this.size) {
      return this;
    }

    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];
        const newArray = [...array];
        newArray[index] = element;
        return new SmartList<T>(RepresentationType.ARRAY, newArray);
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;
        return new SmartList<T>(RepresentationType.VECTOR, vector.set(index, element));
      }

      case RepresentationType.LAZY: {
        // For lazy lists, we need to realize the list first
        const lazy = this.representation as LazyList<T>;
        const array = lazy.toArray();

        // Then decide based on the realized size
        if (array.length <= SMALL_COLLECTION_THRESHOLD) {
          const newArray = [...array];
          newArray[index] = element;
          return new SmartList<T>(RepresentationType.ARRAY, newArray);
        } else {
          const vector = PersistentVector.from(array).set(index, element);
          return new SmartList<T>(RepresentationType.VECTOR, vector);
        }
      }
    }
  }

  /**
   * Creates a new SmartList with an element inserted at the specified index
   *
   * @param index - Index at which to insert the element
   * @param element - Element to insert
   * @returns A new SmartList with the element inserted
   */
  insert(index: number, element: T): SmartList<T> {
    if (index < 0) {
      return this.prepend(element);
    } else if (index >= this.size) {
      return this.append(element);
    }

    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];
        const newArray = [
          ...array.slice(0, index),
          element,
          ...array.slice(index)
        ];

        // If inserting would exceed the small collection threshold,
        // switch to vector representation
        if (array.length >= SMALL_COLLECTION_THRESHOLD) {
          const vector = PersistentVector.from(newArray);
          return new SmartList<T>(RepresentationType.VECTOR, vector);
        }

        return new SmartList<T>(RepresentationType.ARRAY, newArray);
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;
        const firstPart = vector.slice(0, index);
        const secondPart = vector.slice(index);
        const result = firstPart.append(element).concat(secondPart);
        return new SmartList<T>(RepresentationType.VECTOR, result);
      }

      case RepresentationType.LAZY: {
        // For lazy lists, we need to realize the list first
        const lazy = this.representation as LazyList<T>;
        const array = lazy.toArray();

        // Then decide based on the realized size
        if (array.length < SMALL_COLLECTION_THRESHOLD) {
          const newArray = [
            ...array.slice(0, index),
            element,
            ...array.slice(index)
          ];
          return new SmartList<T>(RepresentationType.ARRAY, newArray);
        } else {
          const vector = PersistentVector.from(array);
          const firstPart = vector.slice(0, index);
          const secondPart = vector.slice(index);
          const result = firstPart.append(element).concat(secondPart);
          return new SmartList<T>(RepresentationType.VECTOR, result);
        }
      }
    }
  }

  /**
   * Creates a new SmartList with the element at the specified index removed
   *
   * @param index - Index of the element to remove
   * @returns A new SmartList with the element removed, or this list if index is out of bounds
   */
  remove(index: number): SmartList<T> {
    if (index < 0 || index >= this.size) {
      return this;
    }

    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];
        const newArray = [
          ...array.slice(0, index),
          ...array.slice(index + 1)
        ];
        return new SmartList<T>(RepresentationType.ARRAY, newArray);
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;
        const firstPart = vector.slice(0, index);
        const secondPart = vector.slice(index + 1);
        const result = firstPart.concat(secondPart);

        // If removing would bring us below the medium collection threshold,
        // consider switching back to array representation
        if (vector.getSize() <= MEDIUM_COLLECTION_THRESHOLD &&
            vector.getSize() > SMALL_COLLECTION_THRESHOLD) {
          const array = result.toArray();
          if (array.length <= SMALL_COLLECTION_THRESHOLD) {
            return new SmartList<T>(RepresentationType.ARRAY, array);
          }
        }

        return new SmartList<T>(RepresentationType.VECTOR, result);
      }

      case RepresentationType.LAZY: {
        // For lazy lists, we need to realize the list first
        const lazy = this.representation as LazyList<T>;
        const array = lazy.toArray();

        // Then decide based on the realized size
        if (array.length <= MEDIUM_COLLECTION_THRESHOLD) {
          const newArray = [
            ...array.slice(0, index),
            ...array.slice(index + 1)
          ];
          return new SmartList<T>(RepresentationType.ARRAY, newArray);
        } else {
          const vector = PersistentVector.from(array);
          const firstPart = vector.slice(0, index);
          const secondPart = vector.slice(index + 1);
          const result = firstPart.concat(secondPart);
          return new SmartList<T>(RepresentationType.VECTOR, result);
        }
      }
    }
  }

  /**
   * Creates a new SmartList by transforming each element with the provided function
   *
   * @param fn - Mapping function
   * @returns A new SmartList with transformed elements
   */
  map<U>(fn: (element: T, index: number) => U): SmartList<U> {
    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];

        // For small arrays, use native array operations
        const mapped = array.map(fn);
        return new SmartList<U>(RepresentationType.ARRAY, mapped);
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;

        // For medium-sized collections, use native array operations
        if (vector.getSize() <= MEDIUM_COLLECTION_THRESHOLD) {
          const array = vector.toArray();
          const mapped = array.map(fn);
          return new SmartList<U>(RepresentationType.ARRAY, mapped);
        }

        // For larger collections, use transient vector for efficient batch operations
        const transient = TransientVector.empty<U>();
        for (let i = 0; i < vector.getSize(); i++) {
          const value = vector.get(i).get();
          transient.append(fn(value, i));
        }
        return new SmartList<U>(RepresentationType.VECTOR, transient.persistent());
      }

      case RepresentationType.LAZY: {
        const lazy = this.representation as LazyList<T>;
        return new SmartList<U>(RepresentationType.LAZY, lazy.map(fn));
      }
    }
  }

  /**
   * Creates a new SmartList containing only elements that match the predicate
   *
   * @param predicate - Function to test elements
   * @returns A filtered SmartList
   */
  filter(predicate: (element: T, index: number) => boolean): SmartList<T> {
    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];

        // For small arrays, use native array operations
        const filtered = array.filter(predicate);
        return new SmartList<T>(RepresentationType.ARRAY, filtered);
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;

        // For medium-sized collections, use native array operations
        if (vector.getSize() <= MEDIUM_COLLECTION_THRESHOLD) {
          const array = vector.toArray();
          const filtered = array.filter(predicate);
          return new SmartList<T>(RepresentationType.ARRAY, filtered);
        }

        // For larger collections, use transient vector for efficient batch operations
        const transient = TransientVector.empty<T>();
        for (let i = 0; i < vector.getSize(); i++) {
          const value = vector.get(i).get();
          if (predicate(value, i)) {
            transient.append(value);
          }
        }
        return new SmartList<T>(RepresentationType.VECTOR, transient.persistent());
      }

      case RepresentationType.LAZY: {
        const lazy = this.representation as LazyList<T>;
        return new SmartList<T>(RepresentationType.LAZY, lazy.filter(predicate));
      }
    }
  }

  /**
   * Accumulates a single value by applying a function to each element
   *
   * @param fn - Function to apply to each element
   * @param initialValue - Starting value for the accumulation
   * @returns The final accumulated value
   */
  reduce<U>(fn: (accumulator: U, element: T, index: number) => U, initialValue: U): U {
    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];
        return array.reduce(fn, initialValue);
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;

        // For medium-sized collections, use native array operations
        if (vector.getSize() <= MEDIUM_COLLECTION_THRESHOLD) {
          return vector.toArray().reduce(fn, initialValue);
        }

        // For larger collections, use the vector's reduce method
        return vector.reduce(fn, initialValue);
      }

      case RepresentationType.LAZY: {
        const lazy = this.representation as LazyList<T>;
        return lazy.reduce(fn, initialValue);
      }
    }
  }

  /**
   * Combines two lists into a new list
   *
   * @param other - List to concatenate
   * @returns A new SmartList containing elements from both lists
   */
  concat(other: SmartList<T>): SmartList<T> {
    // Special cases
    if (other.isEmpty) return this;
    if (this.isEmpty) return other;

    const totalSize = this.size + other.size;

    // For small result, use array representation
    if (totalSize <= SMALL_COLLECTION_THRESHOLD) {
      return new SmartList<T>(
        RepresentationType.ARRAY,
        [...this.toArray(), ...other.toArray()]
      );
    }

    // For medium result, use vector representation with transient optimization
    if (totalSize <= MEDIUM_COLLECTION_THRESHOLD) {
      const transient = TransientVector.empty<T>();
      const thisArray = this.toArray();
      const otherArray = other.toArray();

      // Add elements from both arrays
      for (let i = 0; i < thisArray.length; i++) {
        transient.append(thisArray[i]);
      }
      for (let i = 0; i < otherArray.length; i++) {
        transient.append(otherArray[i]);
      }

      return new SmartList<T>(
        RepresentationType.VECTOR,
        transient.persistent()
      );
    }

    // For large result, use the most efficient approach based on current representations
    if (this.repType === RepresentationType.VECTOR &&
        other.repType === RepresentationType.VECTOR) {
      const thisVector = this.representation as PersistentVector<T>;
      const otherVector = other.representation as PersistentVector<T>;
      return new SmartList<T>(
        RepresentationType.VECTOR,
        thisVector.concat(otherVector)
      );
    }

    // Default case: use transient vector for efficient batch operations
    const transient = TransientVector.empty<T>();
    const thisArray = this.toArray();
    const otherArray = other.toArray();

    // Add elements from both arrays
    for (let i = 0; i < thisArray.length; i++) {
      transient.append(thisArray[i]);
    }
    for (let i = 0; i < otherArray.length; i++) {
      transient.append(otherArray[i]);
    }

    return new SmartList<T>(
      RepresentationType.VECTOR,
      transient.persistent()
    );
  }

  /**
   * Returns a slice of the list as a new SmartList
   *
   * @param start - Start index (inclusive)
   * @param end - End index (exclusive)
   * @returns A new SmartList with the specified elements
   */
  slice(start?: number, end?: number): SmartList<T> {
    // Handle undefined parameters
    const startIndex = start !== undefined ? start : 0;
    const endIndex = end !== undefined ? end : this.size;

    // Normalize indices
    const normalizedStart = Math.max(0, startIndex < 0 ? this.size + startIndex : startIndex);
    const normalizedEnd = Math.min(this.size, endIndex < 0 ? this.size + endIndex : endIndex);

    // Handle empty slice
    if (normalizedStart >= normalizedEnd) {
      return SmartList.empty<T>();
    }

    const sliceSize = normalizedEnd - normalizedStart;

    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];
        return new SmartList<T>(
          RepresentationType.ARRAY,
          array.slice(normalizedStart, normalizedEnd)
        );
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;

        // For small result, consider using array representation
        if (sliceSize <= SMALL_COLLECTION_THRESHOLD) {
          const sliced = vector.slice(normalizedStart, normalizedEnd).toArray();
          return new SmartList<T>(RepresentationType.ARRAY, sliced);
        }

        // For larger result, use vector representation
        return new SmartList<T>(
          RepresentationType.VECTOR,
          vector.slice(normalizedStart, normalizedEnd)
        );
      }

      case RepresentationType.LAZY: {
        const lazy = this.representation as LazyList<T>;

        // For small result, consider using array representation
        if (sliceSize <= SMALL_COLLECTION_THRESHOLD) {
          const array = lazy.toArray().slice(normalizedStart, normalizedEnd);
          return new SmartList<T>(RepresentationType.ARRAY, array);
        }

        // For larger result, use lazy representation
        return new SmartList<T>(
          RepresentationType.LAZY,
          lazy.slice(normalizedStart, normalizedEnd)
        );
      }
    }
  }

  /**
   * Returns true if the predicate returns true for any element
   *
   * @param predicate - Function to test elements
   * @returns True if any element matches
   */
  some(predicate: (element: T, index: number) => boolean): boolean {
    switch (this.repType) {
      case RepresentationType.ARRAY:
        return (this.representation as T[]).some(predicate);
      case RepresentationType.VECTOR:
        return (this.representation as PersistentVector<T>).some(predicate);
      case RepresentationType.LAZY:
        return (this.representation as LazyList<T>).some(predicate);
    }
  }

  /**
   * Returns true if the predicate returns true for all elements
   *
   * @param predicate - Function to test elements
   * @returns True if all elements match
   */
  every(predicate: (element: T, index: number) => boolean): boolean {
    switch (this.repType) {
      case RepresentationType.ARRAY:
        return (this.representation as T[]).every(predicate);
      case RepresentationType.VECTOR:
        return (this.representation as PersistentVector<T>).every(predicate);
      case RepresentationType.LAZY:
        return (this.representation as LazyList<T>).every(predicate);
    }
  }

  /**
   * Returns the index of the first occurrence of the element, or -1 if not found
   *
   * @param element - Element to find
   * @returns The index or -1
   */
  indexOf(element: T): number {
    switch (this.repType) {
      case RepresentationType.ARRAY:
        return (this.representation as T[]).indexOf(element);
      case RepresentationType.VECTOR:
        return (this.representation as PersistentVector<T>).indexOf(element);
      case RepresentationType.LAZY:
        return (this.representation as LazyList<T>).indexOf(element);
    }
  }

  /**
   * Returns true if the element is in the list
   *
   * @param element - Element to check
   * @returns True if the element is found
   */
  includes(element: T): boolean {
    return this.indexOf(element) !== -1;
  }

  /**
   * Executes a function for each element in the list
   *
   * @param fn - Function to execute
   */
  forEach(fn: (element: T, index: number) => void): void {
    switch (this.repType) {
      case RepresentationType.ARRAY:
        (this.representation as T[]).forEach(fn);
        break;
      case RepresentationType.VECTOR:
        (this.representation as PersistentVector<T>).forEach(fn);
        break;
      case RepresentationType.LAZY:
        (this.representation as LazyList<T>).forEach(fn);
        break;
    }
  }

  /**
   * Creates a new sorted SmartList
   *
   * @param compareFn - Function to determine sort order
   * @returns A new sorted SmartList
   */
  sort(compareFn?: (a: T, b: T) => number): SmartList<T> {
    const array = this.toArray().sort(compareFn);

    // Choose representation based on size
    if (array.length <= SMALL_COLLECTION_THRESHOLD) {
      return new SmartList<T>(RepresentationType.ARRAY, array);
    } else {
      return new SmartList<T>(
        RepresentationType.VECTOR,
        PersistentVector.from(array)
      );
    }
  }

  /**
   * Returns a new SmartList with elements in reverse order
   *
   * @returns A new reversed SmartList
   */
  reverse(): SmartList<T> {
    const array = this.toArray().reverse();

    // Choose representation based on size
    if (array.length <= SMALL_COLLECTION_THRESHOLD) {
      return new SmartList<T>(RepresentationType.ARRAY, array);
    } else {
      return new SmartList<T>(
        RepresentationType.VECTOR,
        PersistentVector.from(array)
      );
    }
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
    const array = this.toArray();
    let index = 0;

    return {
      next: (): IteratorResult<T> => {
        if (index < array.length) {
          const value = array[index];
          index++;
          return { value, done: false };
        }
        return { value: undefined as any, done: true };
      }
    };
  }
}
