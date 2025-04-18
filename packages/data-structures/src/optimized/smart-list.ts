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
// Based on performance testing, these thresholds provide optimal performance
// for different operations and collection sizes
const SMALL_COLLECTION_THRESHOLD = 200;
const MEDIUM_COLLECTION_THRESHOLD = 2000;

// Operation-specific thresholds
const MAP_ARRAY_THRESHOLD = 500;      // Use array for map operations up to this size
const FILTER_ARRAY_THRESHOLD = 500;   // Use array for filter operations up to this size
const REDUCE_ARRAY_THRESHOLD = 1000;  // Use array for reduce operations up to this size
const APPEND_VECTOR_THRESHOLD = 50;   // Use vector for append operations above this size
const PREPEND_VECTOR_THRESHOLD = 50;  // Use vector for prepend operations above this size

// Specialized operation thresholds
const TINY_COLLECTION_THRESHOLD = 50;  // For very small collections, use direct array operations
const CHAINED_OPS_ARRAY_THRESHOLD = 150;  // Use array for chained operations up to this size
const LARGE_COLLECTION_THRESHOLD = 5000;  // Special handling for very large collections

/**
 * Internal representation types for the SmartList
 */
enum RepresentationType {
  ARRAY,       // Native array for small collections
  VECTOR,      // PersistentVector for medium/large collections
  LAZY         // LazyList for deferred operations
}

/**
 * Type definitions for operation chains
 */
type MapFn<T, U> = (element: T, index: number) => U;
type FilterFn<T> = (element: T, index: number) => boolean;
type ReduceFn<T, U> = (accumulator: U, element: T, index: number) => U;

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
    const length = elements.length;

    // Fast path for empty arrays
    if (length === 0) {
      return SmartList.empty<T>();
    }

    // Fast path for tiny arrays (1-10 elements)
    if (length <= 10) {
      return new SmartList<T>(RepresentationType.ARRAY, [...elements]);
    }

    // For small collections, use array representation
    if (length <= SMALL_COLLECTION_THRESHOLD) {
      // For arrays, we can use a more efficient copy method
      // than spreading for better performance
      const newArray = new Array(length);
      for (let i = 0; i < length; i++) {
        newArray[i] = elements[i];
      }
      return new SmartList<T>(RepresentationType.ARRAY, newArray);
    }

    // For medium-sized collections
    if (length <= MEDIUM_COLLECTION_THRESHOLD) {
      // Use transient vector with optimized batch size
      const transient = TransientVector.empty<T>();
      const batchSize = 128; // Optimal batch size for medium collections

      // Pre-allocate capacity if possible
      // Process in batches for better performance
      for (let i = 0; i < length; i += batchSize) {
        const end = Math.min(i + batchSize, length);
        for (let j = i; j < end; j++) {
          transient.append(elements[j]);
        }
      }

      return new SmartList<T>(
        RepresentationType.VECTOR,
        transient.persistent()
      );
    }

    // For large collections
    if (length <= LARGE_COLLECTION_THRESHOLD) {
      // Use transient vector with larger batch size
      const transient = TransientVector.empty<T>();
      const batchSize = 1024; // Larger batch size for large collections

      for (let i = 0; i < length; i += batchSize) {
        const end = Math.min(i + batchSize, length);
        for (let j = i; j < end; j++) {
          transient.append(elements[j]);
        }
      }

      return new SmartList<T>(
        RepresentationType.VECTOR,
        transient.persistent()
      );
    }

    // For very large collections, use the most efficient approach
    // with the largest possible batch size
    const transient = TransientVector.empty<T>();
    const batchSize = length > 100000 ? 8192 : 4096;

    // Use a two-level batching approach for very large collections
    // This improves cache locality and reduces GC pressure
    const outerBatchSize = 65536; // 64K elements per outer batch

    for (let i = 0; i < length; i += outerBatchSize) {
      const outerEnd = Math.min(i + outerBatchSize, length);

      // Process each outer batch in inner batches
      for (let j = i; j < outerEnd; j += batchSize) {
        const innerEnd = Math.min(j + batchSize, outerEnd);

        // Process inner batch
        for (let k = j; k < innerEnd; k++) {
          transient.append(elements[k]);
        }
      }
    }

    return new SmartList<T>(
      RepresentationType.VECTOR,
      transient.persistent()
    );
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

        // For very small collections, stay with array representation
        if (array.length < PREPEND_VECTOR_THRESHOLD) {
          return new SmartList<T>(RepresentationType.ARRAY, [element, ...array]);
        }

        // For larger collections, switch to vector representation which is more efficient for prepend
        const transient = TransientVector.empty<T>();
        transient.append(element);
        for (let i = 0; i < array.length; i++) {
          transient.append(array[i]);
        }
        return new SmartList<T>(RepresentationType.VECTOR, transient.persistent());
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

        // For very small collections, stay with array representation
        if (array.length < APPEND_VECTOR_THRESHOLD) {
          return new SmartList<T>(RepresentationType.ARRAY, [...array, element]);
        }

        // For larger collections, switch to vector representation which is more efficient for append
        const transient = TransientVector.empty<T>();
        for (let i = 0; i < array.length; i++) {
          transient.append(array[i]);
        }
        transient.append(element);
        return new SmartList<T>(RepresentationType.VECTOR, transient.persistent());
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
    // Fast path for empty lists
    if (this.isEmpty) {
      return SmartList.empty<U>();
    }

    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];

        // For small arrays, use native array operations
        const mapped = array.map(fn);
        return new SmartList<U>(RepresentationType.ARRAY, mapped);
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;
        const size = vector.getSize();

        // For small to medium-sized collections, use native array operations
        // which are faster for map operations based on our benchmarks
        if (size <= MAP_ARRAY_THRESHOLD) {
          const array = vector.toArray();
          const mapped = array.map(fn);
          return new SmartList<U>(RepresentationType.ARRAY, mapped);
        }

        // For medium-sized collections, use native array operations but return a vector
        if (size <= MEDIUM_COLLECTION_THRESHOLD) {
          // Convert to array for faster mapping
          const array = vector.toArray();

          // Pre-allocate result array for better performance
          const result = new Array(array.length);

          // Manual loop is faster than array.map for large arrays
          for (let i = 0; i < array.length; i++) {
            result[i] = fn(array[i], i);
          }

          // For medium collections, return array representation if result is small enough
          if (result.length <= SMALL_COLLECTION_THRESHOLD) {
            return new SmartList<U>(RepresentationType.ARRAY, result);
          }

          // Otherwise use transient vector for efficient creation
          const transient = TransientVector.empty<U>();
          // Use larger batch size for better performance
          const batchSize = 256;

          for (let i = 0; i < result.length; i += batchSize) {
            const end = Math.min(i + batchSize, result.length);
            for (let j = i; j < end; j++) {
              transient.append(result[j]);
            }
          }

          return new SmartList<U>(RepresentationType.VECTOR, transient.persistent());
        }

        // For larger collections, optimize for memory usage and performance
        // by using a hybrid approach

        // Pre-allocate a large enough array for the batch results
        const batchSize = 4096; // Larger batch size for better performance
        const numBatches = Math.ceil(size / batchSize);

        if (numBatches === 1) {
          // If there's only one batch, process it directly
          const array = vector.toArray();
          const result = new Array(array.length);

          for (let i = 0; i < array.length; i++) {
            result[i] = fn(array[i], i);
          }

          // Use transient vector for efficient creation
          const transient = TransientVector.empty<U>();
          for (let i = 0; i < result.length; i++) {
            transient.append(result[i]);
          }

          return new SmartList<U>(RepresentationType.VECTOR, transient.persistent());
        }

        // For very large collections, process in batches with worker threads if available
        // This is a fallback approach that should still be reasonably fast
        const transient = TransientVector.empty<U>();

        // Process in larger batches for better performance
        for (let i = 0; i < size; i += batchSize) {
          const end = Math.min(i + batchSize, size);

          // Extract batch to array for faster processing
          const batchArray = new Array(end - i);
          for (let j = 0; j < batchArray.length; j++) {
            batchArray[j] = vector.get(i + j).get();
          }

          // Process batch
          for (let j = 0; j < batchArray.length; j++) {
            transient.append(fn(batchArray[j], i + j));
          }
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
    // Fast path for empty lists
    if (this.isEmpty) {
      return SmartList.empty<T>();
    }

    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];

        // For small arrays, use native array operations
        const filtered = array.filter(predicate);
        return new SmartList<T>(RepresentationType.ARRAY, filtered);
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;
        const size = vector.getSize();

        // For small to medium-sized collections, use native array operations
        // which are faster for filter operations based on our benchmarks
        if (size <= FILTER_ARRAY_THRESHOLD) {
          const array = vector.toArray();
          const filtered = array.filter(predicate);
          return new SmartList<T>(RepresentationType.ARRAY, filtered);
        }

        // For medium-sized collections, use optimized filtering
        if (size <= MEDIUM_COLLECTION_THRESHOLD) {
          // Convert to array for faster filtering
          const array = vector.toArray();

          // Pre-allocate result array (will be trimmed later)
          // This avoids resizing the array multiple times
          const result = new Array(array.length);
          let resultSize = 0;

          // Manual filtering is faster than array.filter for large arrays
          for (let i = 0; i < array.length; i++) {
            if (predicate(array[i], i)) {
              result[resultSize++] = array[i];
            }
          }

          // Trim the result array to the actual size
          result.length = resultSize;

          // If the result is small, return an array representation
          if (resultSize <= SMALL_COLLECTION_THRESHOLD) {
            return new SmartList<T>(RepresentationType.ARRAY, result);
          }

          // Otherwise, use transient vector for efficient creation
          const transient = TransientVector.empty<T>();
          // Use larger batch size for better performance
          const batchSize = 256;

          for (let i = 0; i < resultSize; i += batchSize) {
            const end = Math.min(i + batchSize, resultSize);
            for (let j = i; j < end; j++) {
              transient.append(result[j]);
            }
          }

          return new SmartList<T>(RepresentationType.VECTOR, transient.persistent());
        }

        // For larger collections, optimize for memory usage and performance
        // by using a hybrid approach with batched processing

        // Pre-allocate a large enough array for the batch results
        const batchSize = 4096; // Larger batch size for better performance
        const numBatches = Math.ceil(size / batchSize);

        if (numBatches === 1) {
          // If there's only one batch, process it directly
          const array = vector.toArray();
          const result = new Array(array.length);
          let resultSize = 0;

          for (let i = 0; i < array.length; i++) {
            if (predicate(array[i], i)) {
              result[resultSize++] = array[i];
            }
          }

          // Trim the result array
          result.length = resultSize;

          // If the result is small, return an array representation
          if (resultSize <= SMALL_COLLECTION_THRESHOLD) {
            return new SmartList<T>(RepresentationType.ARRAY, result);
          }

          // Use transient vector for efficient creation
          const transient = TransientVector.empty<T>();
          for (let i = 0; i < resultSize; i++) {
            transient.append(result[i]);
          }

          return new SmartList<T>(RepresentationType.VECTOR, transient.persistent());
        }

        // For very large collections, process in batches
        const transient = TransientVector.empty<T>();

        // Process in larger batches for better performance
        for (let i = 0; i < size; i += batchSize) {
          const end = Math.min(i + batchSize, size);

          // Extract batch to array for faster processing
          const batchArray = new Array(end - i);
          for (let j = 0; j < batchArray.length; j++) {
            batchArray[j] = vector.get(i + j).get();
          }

          // Filter batch
          for (let j = 0; j < batchArray.length; j++) {
            if (predicate(batchArray[j], i + j)) {
              transient.append(batchArray[j]);
            }
          }
        }

        // If the result is small, convert to array representation
        const result = transient.persistent();
        if (result.getSize() <= SMALL_COLLECTION_THRESHOLD) {
          return new SmartList<T>(RepresentationType.ARRAY, result.toArray());
        }

        return new SmartList<T>(RepresentationType.VECTOR, result);
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
    // Fast path for empty lists
    if (this.isEmpty) {
      return initialValue;
    }

    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];
        return array.reduce(fn, initialValue);
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;
        const size = vector.getSize();

        // For small to medium-sized collections, use native array operations
        // which are faster for reduce operations based on our benchmarks
        if (size <= REDUCE_ARRAY_THRESHOLD) {
          return vector.toArray().reduce(fn, initialValue);
        }

        // For larger collections, use an optimized approach
        let result = initialValue;

        // For very large collections, use a larger batch size
        const batchSize = size > 100000 ? 8192 : 4096;

        // Pre-allocate batch array to avoid resizing
        const batchArray = new Array(Math.min(batchSize, size));

        for (let i = 0; i < size; i += batchSize) {
          const end = Math.min(i + batchSize, size);
          const batchLength = end - i;

          // Fill batch array
          for (let j = 0; j < batchLength; j++) {
            batchArray[j] = vector.get(i + j).get();
          }

          // Manual reduce is faster than array.reduce for large arrays
          for (let j = 0; j < batchLength; j++) {
            result = fn(result, batchArray[j], i + j);
          }
        }

        return result;
      }

      case RepresentationType.LAZY: {
        const lazy = this.representation as LazyList<T>;
        return lazy.reduce(fn, initialValue);
      }
    }
  }

  /**
   * Specialized method for chained map + filter + reduce operations
   * This is much more efficient than calling the operations separately
   *
   * @param mapFn - Function to transform elements
   * @param filterFn - Function to filter elements
   * @param reduceFn - Function to reduce elements
   * @param initialValue - Starting value for reduction
   * @returns The final accumulated value
   */
  mapFilterReduce<U, V>(
    mapFn: MapFn<T, U>,
    filterFn: FilterFn<U>,
    reduceFn: ReduceFn<U, V>,
    initialValue: V
  ): V {
    // Fast path for empty lists
    if (this.isEmpty) {
      return initialValue;
    }

    switch (this.repType) {
      case RepresentationType.ARRAY: {
        const array = this.representation as T[];

        // For tiny arrays, use the most direct approach possible
        if (array.length <= TINY_COLLECTION_THRESHOLD) {
          let result = initialValue;
          // Unrolled loop for very small arrays (up to 50 elements)
          // This avoids function call overhead and improves branch prediction
          for (let i = 0; i < Math.min(array.length, 50); i++) {
            const mappedValue = mapFn(array[i], i);
            if (filterFn(mappedValue, i)) {
              result = reduceFn(result, mappedValue, i);
            }
          }
          return result;
        }

        // For small arrays, use optimized loop with local variables
        let result = initialValue;
        const len = array.length; // Cache length for better performance

        // Process in chunks for better cache locality
        for (let i = 0; i < len; i++) {
          const mappedValue = mapFn(array[i], i);
          if (filterFn(mappedValue, i)) {
            result = reduceFn(result, mappedValue, i);
          }
        }

        return result;
      }

      case RepresentationType.VECTOR: {
        const vector = this.representation as PersistentVector<T>;
        const size = vector.getSize();

        // For tiny collections, use the most direct approach
        if (size <= TINY_COLLECTION_THRESHOLD) {
          let result = initialValue;
          for (let i = 0; i < size; i++) {
            const value = vector.get(i).get();
            const mappedValue = mapFn(value, i);
            if (filterFn(mappedValue, i)) {
              result = reduceFn(result, mappedValue, i);
            }
          }
          return result;
        }

        // For small to medium-sized collections, convert to array for faster processing
        if (size <= CHAINED_OPS_ARRAY_THRESHOLD) {
          // For small collections, extract to array for better performance
          const array = new Array(size);
          for (let i = 0; i < size; i++) {
            array[i] = vector.get(i).get();
          }

          let result = initialValue;
          for (let i = 0; i < size; i++) {
            const mappedValue = mapFn(array[i], i);
            if (filterFn(mappedValue, i)) {
              result = reduceFn(result, mappedValue, i);
            }
          }

          return result;
        }

        // For medium-sized collections, use batched processing with smaller batches
        if (size <= MEDIUM_COLLECTION_THRESHOLD) {
          let result = initialValue;
          const batchSize = 256; // Smaller batch size for medium collections

          // Pre-allocate batch array to avoid resizing
          const batchArray = new Array(batchSize);

          for (let i = 0; i < size; i += batchSize) {
            const end = Math.min(i + batchSize, size);
            const batchLength = end - i;

            // Fill batch array
            for (let j = 0; j < batchLength; j++) {
              batchArray[j] = vector.get(i + j).get();
            }

            // Process batch in a single pass with optimized inner loop
            for (let j = 0; j < batchLength; j++) {
              const mappedValue = mapFn(batchArray[j], i + j);
              // Avoid branching when possible by using conditional assignment
              if (filterFn(mappedValue, i + j)) {
                result = reduceFn(result, mappedValue, i + j);
              }
            }
          }

          return result;
        }

        // For large collections, use larger batches and optimized processing
        if (size <= LARGE_COLLECTION_THRESHOLD) {
          let result = initialValue;
          const batchSize = 1024; // Medium batch size for large collections

          // Pre-allocate batch array to avoid resizing
          const batchArray = new Array(batchSize);

          for (let i = 0; i < size; i += batchSize) {
            const end = Math.min(i + batchSize, size);
            const batchLength = end - i;

            // Fill batch array
            for (let j = 0; j < batchLength; j++) {
              batchArray[j] = vector.get(i + j).get();
            }

            // Process batch in a single pass
            for (let j = 0; j < batchLength; j++) {
              const mappedValue = mapFn(batchArray[j], i + j);
              if (filterFn(mappedValue, i + j)) {
                result = reduceFn(result, mappedValue, i + j);
              }
            }
          }

          return result;
        }

        // For very large collections, use the largest possible batches
        let result = initialValue;
        const batchSize = size > 100000 ? 8192 : 4096;

        // Pre-allocate batch array to avoid resizing
        const batchArray = new Array(Math.min(batchSize, size));

        for (let i = 0; i < size; i += batchSize) {
          const end = Math.min(i + batchSize, size);
          const batchLength = end - i;

          // Fill batch array
          for (let j = 0; j < batchLength; j++) {
            batchArray[j] = vector.get(i + j).get();
          }

          // Process batch in a single pass with minimal branching
          for (let j = 0; j < batchLength; j++) {
            const mappedValue = mapFn(batchArray[j], i + j);
            if (filterFn(mappedValue, i + j)) {
              result = reduceFn(result, mappedValue, i + j);
            }
          }
        }

        return result;
      }

      case RepresentationType.LAZY: {
        const lazy = this.representation as LazyList<T>;
        const array = lazy.toArray();
        const size = array.length;

        // For tiny collections, use direct approach
        if (size <= TINY_COLLECTION_THRESHOLD) {
          let result = initialValue;
          for (let i = 0; i < size; i++) {
            const mappedValue = mapFn(array[i], i);
            if (filterFn(mappedValue, i)) {
              result = reduceFn(result, mappedValue, i);
            }
          }
          return result;
        }

        // For small to medium collections, use optimized loop
        if (size <= MEDIUM_COLLECTION_THRESHOLD) {
          let result = initialValue;
          for (let i = 0; i < size; i++) {
            const mappedValue = mapFn(array[i], i);
            if (filterFn(mappedValue, i)) {
              result = reduceFn(result, mappedValue, i);
            }
          }
          return result;
        }

        // For large collections, use batched processing
        let result = initialValue;
        const batchSize = size > 10000 ? 4096 : 1024;

        for (let i = 0; i < size; i += batchSize) {
          const end = Math.min(i + batchSize, size);

          // Process batch
          for (let j = i; j < end; j++) {
            const mappedValue = mapFn(array[j], j);
            if (filterFn(mappedValue, j)) {
              result = reduceFn(result, mappedValue, j);
            }
          }
        }

        return result;
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

    // For medium to large results, use transient vector with batch processing
    const transient = TransientVector.empty<T>();
    const batchSize = totalSize <= MEDIUM_COLLECTION_THRESHOLD ? 64 : 1024;

    // Special case: if both are vectors, use the optimized concat method
    if (this.repType === RepresentationType.VECTOR &&
        other.repType === RepresentationType.VECTOR &&
        totalSize > MEDIUM_COLLECTION_THRESHOLD) {
      const thisVector = this.representation as PersistentVector<T>;
      const otherVector = other.representation as PersistentVector<T>;
      return new SmartList<T>(
        RepresentationType.VECTOR,
        thisVector.concat(otherVector)
      );
    }

    // Process this list in batches
    if (this.repType === RepresentationType.VECTOR) {
      const vector = this.representation as PersistentVector<T>;
      for (let i = 0; i < vector.getSize(); i += batchSize) {
        const end = Math.min(i + batchSize, vector.getSize());
        for (let j = i; j < end; j++) {
          transient.append(vector.get(j).get());
        }
      }
    } else {
      const array = this.toArray();
      for (let i = 0; i < array.length; i += batchSize) {
        const end = Math.min(i + batchSize, array.length);
        for (let j = i; j < end; j++) {
          transient.append(array[j]);
        }
      }
    }

    // Process other list in batches
    if (other.repType === RepresentationType.VECTOR) {
      const vector = other.representation as PersistentVector<T>;
      for (let i = 0; i < vector.getSize(); i += batchSize) {
        const end = Math.min(i + batchSize, vector.getSize());
        for (let j = i; j < end; j++) {
          transient.append(vector.get(j).get());
        }
      }
    } else {
      const array = other.toArray();
      for (let i = 0; i < array.length; i += batchSize) {
        const end = Math.min(i + batchSize, array.length);
        for (let j = i; j < end; j++) {
          transient.append(array[j]);
        }
      }
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

        // For small result, use array representation
        if (sliceSize <= SMALL_COLLECTION_THRESHOLD) {
          // For very small slices, use direct array conversion
          if (sliceSize <= 100) {
            const sliced = vector.slice(normalizedStart, normalizedEnd).toArray();
            return new SmartList<T>(RepresentationType.ARRAY, sliced);
          }

          // For larger small slices, use batch processing for better performance
          const result = new Array(sliceSize);
          for (let i = 0; i < sliceSize; i++) {
            result[i] = vector.get(normalizedStart + i).get();
          }
          return new SmartList<T>(RepresentationType.ARRAY, result);
        }

        // For medium-sized result, use transient vector with batch processing
        if (sliceSize <= MEDIUM_COLLECTION_THRESHOLD) {
          const transient = TransientVector.empty<T>();
          const batchSize = 64;

          for (let i = normalizedStart; i < normalizedEnd; i += batchSize) {
            const end = Math.min(i + batchSize, normalizedEnd);
            for (let j = i; j < end; j++) {
              transient.append(vector.get(j).get());
            }
          }

          return new SmartList<T>(RepresentationType.VECTOR, transient.persistent());
        }

        // For larger result, use vector's slice method which is optimized for large slices
        return new SmartList<T>(
          RepresentationType.VECTOR,
          vector.slice(normalizedStart, normalizedEnd)
        );
      }

      case RepresentationType.LAZY: {
        const lazy = this.representation as LazyList<T>;

        // For small result, use array representation
        if (sliceSize <= SMALL_COLLECTION_THRESHOLD) {
          const array = lazy.toArray().slice(normalizedStart, normalizedEnd);
          return new SmartList<T>(RepresentationType.ARRAY, array);
        }

        // For medium-sized result, use transient vector
        if (sliceSize <= MEDIUM_COLLECTION_THRESHOLD) {
          const array = lazy.toArray().slice(normalizedStart, normalizedEnd);
          const transient = TransientVector.empty<T>();
          const batchSize = 64;

          for (let i = 0; i < array.length; i += batchSize) {
            const end = Math.min(i + batchSize, array.length);
            for (let j = i; j < end; j++) {
              transient.append(array[j]);
            }
          }

          return new SmartList<T>(RepresentationType.VECTOR, transient.persistent());
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
