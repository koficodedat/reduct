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
import { SmallList } from './small-list';
import { LazyList, lazy } from './lazy-list';
import { HAMTPersistentVector } from './hamt-persistent-vector';
import { getProfilingSystem, OperationType, DataStructureType } from '../profiling';
import { recordDataStructureCreation, estimateMemoryUsage } from '../profiling/memory-monitor';
import { recordOperation, getImplementationRecommendation } from '../profiling/usage-pattern-monitor';
import * as specializedOps from './specialized-operations';
import * as fusedOps from './operation-fusion';
import { DataType, detectDataType } from './type-detection';
import {
  createNumericList,
  createStringList,
  createObjectList,
  createSpecializedList
} from './specialized-list';
import { getPooledArray, releasePooledArray } from '../memory/pool';
import { memoize, getOrComputeCachedResult } from '../cache/result-cache';

/**
 * Default threshold for small collections
 * For collections smaller than this size, we use a SmallList implementation
 * and directly leverage native array methods for optimal performance
 *
 * Based on benchmark results, 31 is the optimal threshold for switching to chunked representation
 */
const DEFAULT_SMALL_COLLECTION_THRESHOLD = 31;

/**
 * Default threshold for medium collections
 * For collections between SMALL_COLLECTION_THRESHOLD and this size,
 * we use a chunked array implementation
 *
 * Based on benchmark results, 26 is the optimal threshold for switching to vector representation
 */
const DEFAULT_MEDIUM_COLLECTION_THRESHOLD = 26;

/**
 * Default threshold for large collections
 * For collections between MEDIUM_COLLECTION_THRESHOLD and this size,
 * we use a PersistentVector implementation
 * For collections larger than this size, we use a HAMTPersistentVector implementation
 * for more efficient structural sharing and memory usage
 */
const DEFAULT_LARGE_COLLECTION_THRESHOLD = 10000;

/**
 * Threshold for returning native arrays directly from operations
 * For collections smaller than this size, operations like map, filter
 * will return native arrays directly when possible for better performance
 *
 * Based on benchmark results, 16 is optimal for direct native array operations
 */
const NATIVE_RETURN_THRESHOLD = 16;

/**
 * Adaptive thresholds for collection sizes
 * These thresholds can be adjusted based on usage patterns
 */
let SMALL_COLLECTION_THRESHOLD = DEFAULT_SMALL_COLLECTION_THRESHOLD;
let MEDIUM_COLLECTION_THRESHOLD = DEFAULT_MEDIUM_COLLECTION_THRESHOLD;
let LARGE_COLLECTION_THRESHOLD = DEFAULT_LARGE_COLLECTION_THRESHOLD;

/**
 * Whether to enable adaptive implementation selection
 */
let ADAPTIVE_IMPLEMENTATION_ENABLED = true;

/**
 * Update the thresholds based on usage patterns
 */
function updateThresholds(): void {
  if (!ADAPTIVE_IMPLEMENTATION_ENABLED) {
    return;
  }

  const recommendation = getImplementationRecommendation();

  if (recommendation && recommendation.thresholds) {
    // Update thresholds based on recommendation
    if (recommendation.thresholds.small !== undefined) {
      SMALL_COLLECTION_THRESHOLD = recommendation.thresholds.small;
    }

    if (recommendation.thresholds.medium !== undefined) {
      MEDIUM_COLLECTION_THRESHOLD = recommendation.thresholds.medium;
    }

    if (recommendation.thresholds.large !== undefined) {
      LARGE_COLLECTION_THRESHOLD = recommendation.thresholds.large;
    }
  }
}

/**
 * Enable or disable adaptive implementation selection
 *
 * @param enabled - Whether to enable adaptive implementation selection
 */
export function setAdaptiveImplementationEnabled(enabled: boolean): void {
  ADAPTIVE_IMPLEMENTATION_ENABLED = enabled;

  if (!enabled) {
    // Reset thresholds to defaults
    SMALL_COLLECTION_THRESHOLD = DEFAULT_SMALL_COLLECTION_THRESHOLD;
    MEDIUM_COLLECTION_THRESHOLD = DEFAULT_MEDIUM_COLLECTION_THRESHOLD;
    LARGE_COLLECTION_THRESHOLD = DEFAULT_LARGE_COLLECTION_THRESHOLD;
  }
}

/**
 * Set custom thresholds for collection sizes
 *
 * @param thresholds - The custom thresholds
 */
export function setCollectionThresholds(thresholds: {
  small?: number;
  medium?: number;
  large?: number;
}): void {
  if (thresholds.small !== undefined) {
    SMALL_COLLECTION_THRESHOLD = thresholds.small;
  }

  if (thresholds.medium !== undefined) {
    MEDIUM_COLLECTION_THRESHOLD = thresholds.medium;
  }

  if (thresholds.large !== undefined) {
    LARGE_COLLECTION_THRESHOLD = thresholds.large;
  }

  // Disable adaptive implementation selection when custom thresholds are set
  ADAPTIVE_IMPLEMENTATION_ENABLED = false;
}

/**
 * Threshold for using native array methods for operations
 *
 * Based on benchmark results, 32 is optimal for leveraging native array methods
 */
const NATIVE_OPERATIONS_THRESHOLD = 32;

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

    // Check if we should use a specialized implementation based on data type
    const dataType = detectDataType(elements);
    if (dataType !== DataType.UNKNOWN && dataType !== DataType.MIXED) {
      // We'll use the standard implementation but with optimized operations
      // The specialized operations will be used internally when appropriate
    }

    if (size < SMALL_COLLECTION_THRESHOLD) {
      // For small collections, use SmallList for optimal performance
      const smallList = new SmallList<T>(elements);
      return new List<T>(size, RepresentationType.SMALL, smallList);
    } else if (size < MEDIUM_COLLECTION_THRESHOLD) {
      // For medium collections, use a ChunkedList for better performance
      // with operations that access elements by index
      const chunkedList = ChunkedList.from(elements);
      return new List<T>(size, RepresentationType.CHUNKED, chunkedList);
    } else if (size < LARGE_COLLECTION_THRESHOLD) {
      // For large collections, use a persistent vector trie
      // for optimal performance with structural sharing
      const persistentVector = PersistentVector.from(elements);
      return new List<T>(size, RepresentationType.VECTOR, persistentVector);
    } else {
      // For very large collections, use a HAMT persistent vector
      // for more efficient structural sharing and memory usage
      const hamtVector = HAMTPersistentVector.from(elements);
      return new List<T>(size, RepresentationType.HAMT_VECTOR, hamtVector);
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

    // Generate a small sample to detect the data type
    const sampleSize = Math.min(size, 10);
    const sample: T[] = [];
    for (let i = 0; i < sampleSize; i++) {
      sample.push(fn(i));
    }

    // Check if we should use a specialized implementation based on data type
    const dataType = detectDataType(sample);
    if (dataType !== DataType.UNKNOWN && dataType !== DataType.MIXED) {
      // We'll use the standard implementation but with optimized operations
      // The specialized operations will be used internally when appropriate
    }

    // Generate the elements using the provided function
    const data = Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = fn(i);
    }

    // Create the appropriate representation based on size
    if (size < SMALL_COLLECTION_THRESHOLD) {
      // For small collections, use SmallList
      const smallList = new SmallList<T>(data);
      return new List<T>(size, RepresentationType.SMALL, smallList);
    } else if (size < MEDIUM_COLLECTION_THRESHOLD) {
      // For medium collections, use a ChunkedList
      const chunkedList = ChunkedList.from(data);
      return new List<T>(size, RepresentationType.CHUNKED, chunkedList);
    } else if (size < LARGE_COLLECTION_THRESHOLD) {
      // For large collections, use a persistent vector trie
      const persistentVector = PersistentVector.from(data);
      return new List<T>(size, RepresentationType.VECTOR, persistentVector);
    } else {
      // For very large collections, use a HAMT persistent vector
      const hamtVector = HAMTPersistentVector.from(data);
      return new List<T>(size, RepresentationType.HAMT_VECTOR, hamtVector);
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
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.GET, this._size);

    if (index < 0 || index >= this._size) {
      return undefined;
    }

    switch (this._representation) {
      case RepresentationType.ARRAY:
        // For array representation, direct access is fastest
        return this._data[index];
      case RepresentationType.SMALL:
        // For small list, use the small list's get method
        return (this._data as SmallList<T>).get(index);
      case RepresentationType.CHUNKED:
        // For chunked list, use the chunked list's get method
        return (this._data as ChunkedList<T>).get(index);
      case RepresentationType.VECTOR:
        // For vector representation, use the vector's get method
        return (this._data as PersistentVector<T>).get(index);
      case RepresentationType.HAMT_VECTOR:
        // For HAMT vector representation, use the HAMT vector's get method
        return (this._data as HAMTPersistentVector<T>).get(index);
      default:
        return undefined;
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
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SET, this._size);

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
      case RepresentationType.SMALL: {
        // For small list, use the small list's set method
        const smallList = this._data as SmallList<T>;
        const newSmallList = smallList.set(index, value);
        return new List<T>(this._size, RepresentationType.SMALL, newSmallList);
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
      case RepresentationType.HAMT_VECTOR: {
        // For HAMT vector representation, use the HAMT vector's set method
        const hamtVector = this._data as HAMTPersistentVector<T>;
        const newHamtVector = hamtVector.set(index, value);
        return new List<T>(this._size, RepresentationType.HAMT_VECTOR, newHamtVector);
      }
      default:
        return this;
    }
  }

  /**
   * Insert an element at the specified index
   *
   * @param index - The index at which to insert the element
   * @param value - The element to insert
   */
  insert(index: number, value: T): List<T> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.INSERT, this._size);

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

    // For other representations, use the appropriate implementation's insert method
    switch (this._representation) {
      case RepresentationType.SMALL: {
        const smallList = this._data as SmallList<T>;
        const newSmallList = smallList.insert(index, value);

        // Check if we need to transition to a different representation
        if (newSize >= SMALL_COLLECTION_THRESHOLD) {
          // Transition to chunked representation
          const [newRepresentation, newData] = this.checkTransition(newSize);
          return new List<T>(newSize, newRepresentation, newData);
        }

        return new List<T>(newSize, RepresentationType.SMALL, newSmallList);
      }
      case RepresentationType.CHUNKED: {
        const chunkedList = this._data as ChunkedList<T>;
        const newChunkedList = chunkedList.insert(index, value);

        // Check if we need to transition to a different representation
        if (newSize >= MEDIUM_COLLECTION_THRESHOLD) {
          // Transition to vector representation
          const [newRepresentation, newData] = this.checkTransition(newSize);
          return new List<T>(newSize, newRepresentation, newData);
        }

        return new List<T>(newSize, RepresentationType.CHUNKED, newChunkedList);
      }
      case RepresentationType.VECTOR: {
        const vector = this._data as PersistentVector<T>;
        const newVector = vector.insert(index, value);

        // Check if we need to transition to a different representation
        if (newSize >= LARGE_COLLECTION_THRESHOLD) {
          // Transition to HAMT vector representation
          const hamtVector = HAMTPersistentVector.from(newVector.toArray());
          return new List<T>(newSize, RepresentationType.HAMT_VECTOR, hamtVector);
        }

        return new List<T>(newSize, RepresentationType.VECTOR, newVector);
      }
      case RepresentationType.HAMT_VECTOR: {
        const hamtVector = this._data as HAMTPersistentVector<T>;
        const newHamtVector = hamtVector.insert(index, value);
        return new List<T>(newSize, RepresentationType.HAMT_VECTOR, newHamtVector);
      }
      default: {
        // For array representation or any other case, check for transition
        const [newRepresentation, newData] = this.checkTransition(newSize);

        if (newRepresentation === RepresentationType.ARRAY) {
          // If still using array representation, insert directly
          const dataArray = newData as T[];
          const newDataArray = [...dataArray.slice(0, index), value, ...dataArray.slice(index)];
          return new List<T>(newSize, RepresentationType.ARRAY, newDataArray);
        } else {
          // For other representations, convert to array, insert, and create new representation
          const dataArray = this.toArray();
          const newDataArray = [...dataArray.slice(0, index), value, ...dataArray.slice(index)];

          // Create the appropriate representation based on the new size
          if (newRepresentation === RepresentationType.CHUNKED) {
            const chunkedList = ChunkedList.from(newDataArray);
            return new List<T>(newSize, RepresentationType.CHUNKED, chunkedList);
          } else if (newRepresentation === RepresentationType.VECTOR) {
            const vector = PersistentVector.from(newDataArray);
            return new List<T>(newSize, RepresentationType.VECTOR, vector);
          } else {
            return new List<T>(newSize, newRepresentation, newDataArray);
          }
        }
      }
    }
  }

  /**
   * Remove the element at the specified index
   *
   * @param index - The index of the element to remove
   */
  remove(index: number): List<T> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.REMOVE, this._size);

    if (index < 0 || index >= this._size) {
      return this;
    }

    const newSize = this._size - 1;

    if (newSize === 0) {
      return List.empty<T>();
    }

    // For other representations, use the appropriate implementation's remove method
    switch (this._representation) {
      case RepresentationType.SMALL: {
        const smallList = this._data as SmallList<T>;
        const newSmallList = smallList.remove(index);
        return new List<T>(newSize, RepresentationType.SMALL, newSmallList);
      }
      case RepresentationType.CHUNKED: {
        const chunkedList = this._data as ChunkedList<T>;
        const newChunkedList = chunkedList.remove(index);

        // Check if we need to transition to a different representation
        if (newSize < SMALL_COLLECTION_THRESHOLD) {
          // Transition to array representation
          const [newRepresentation, newData] = this.checkTransition(newSize);
          return new List<T>(newSize, newRepresentation, newData);
        }

        return new List<T>(newSize, RepresentationType.CHUNKED, newChunkedList);
      }
      case RepresentationType.VECTOR: {
        const vector = this._data as PersistentVector<T>;
        const newVector = vector.remove(index);

        // Check if we need to transition to a different representation
        if (newSize < MEDIUM_COLLECTION_THRESHOLD) {
          // Transition to chunked representation
          const [newRepresentation, newData] = this.checkTransition(newSize);
          return new List<T>(newSize, newRepresentation, newData);
        }

        return new List<T>(newSize, RepresentationType.VECTOR, newVector);
      }
      case RepresentationType.HAMT_VECTOR: {
        const hamtVector = this._data as HAMTPersistentVector<T>;
        const newHamtVector = hamtVector.remove(index);

        // Check if we need to transition to a different representation
        if (newSize < LARGE_COLLECTION_THRESHOLD) {
          // Transition to vector representation
          const vector = PersistentVector.from(newHamtVector.toArray());
          return new List<T>(newSize, RepresentationType.VECTOR, vector);
        }

        return new List<T>(newSize, RepresentationType.HAMT_VECTOR, newHamtVector);
      }
      default: {
        // For array representation or any other case, check for transition
        const [newRepresentation, newData] = this.checkTransition(newSize);

        if (newRepresentation === RepresentationType.ARRAY) {
          // If still using array representation, remove directly
          const dataArray = newData as T[];
          const newDataArray = [...dataArray.slice(0, index), ...dataArray.slice(index + 1)];
          return new List<T>(newSize, RepresentationType.ARRAY, newDataArray);
        } else {
          // For other representations, convert to array, remove, and create new representation
          const dataArray = this.toArray();
          const newDataArray = [...dataArray.slice(0, index), ...dataArray.slice(index + 1)];

          // Create the appropriate representation based on the new size
          if (newRepresentation === RepresentationType.CHUNKED) {
            const chunkedList = ChunkedList.from(newDataArray);
            return new List<T>(newSize, RepresentationType.CHUNKED, chunkedList);
          } else if (newRepresentation === RepresentationType.VECTOR) {
            const vector = PersistentVector.from(newDataArray);
            return new List<T>(newSize, RepresentationType.VECTOR, vector);
          } else {
            return new List<T>(newSize, newRepresentation, newDataArray);
          }
        }
      }
    }
  }

  /**
   * Append an element to the end of the list
   *
   * @param value - The element to append
   */
  append(value: T): List<T> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.APPEND, this._size);

    const newSize = this._size + 1;

    // For small collections, optimize for direct array operations
    if (this._representation === RepresentationType.ARRAY && newSize < SMALL_COLLECTION_THRESHOLD) {
      return new List<T>(newSize, RepresentationType.ARRAY, [...this._data, value]);
    }

    // For other representations, use the appropriate implementation's append method
    switch (this._representation) {
      case RepresentationType.SMALL: {
        const smallList = this._data as SmallList<T>;
        const newSmallList = smallList.append(value);

        // Check if we need to transition to a different representation
        if (newSize >= SMALL_COLLECTION_THRESHOLD) {
          // Transition to chunked representation
          const [newRepresentation, newData] = this.checkTransition(newSize);
          return new List<T>(newSize, newRepresentation, newData);
        }

        return new List<T>(newSize, RepresentationType.SMALL, newSmallList);
      }
      case RepresentationType.CHUNKED: {
        const chunkedList = this._data as ChunkedList<T>;
        const newChunkedList = chunkedList.append(value);

        // Check if we need to transition to a different representation
        if (newSize >= MEDIUM_COLLECTION_THRESHOLD) {
          // Transition to vector representation
          const [newRepresentation, newData] = this.checkTransition(newSize);
          return new List<T>(newSize, newRepresentation, newData);
        }

        return new List<T>(newSize, RepresentationType.CHUNKED, newChunkedList);
      }
      case RepresentationType.VECTOR: {
        const vector = this._data as PersistentVector<T>;
        const newVector = vector.append(value);

        // Check if we need to transition to a different representation
        if (newSize >= LARGE_COLLECTION_THRESHOLD) {
          // Transition to HAMT vector representation
          const hamtVector = HAMTPersistentVector.from(newVector.toArray());
          return new List<T>(newSize, RepresentationType.HAMT_VECTOR, hamtVector);
        }

        return new List<T>(newSize, RepresentationType.VECTOR, newVector);
      }
      case RepresentationType.HAMT_VECTOR: {
        const hamtVector = this._data as HAMTPersistentVector<T>;
        const newHamtVector = hamtVector.append(value);
        return new List<T>(newSize, RepresentationType.HAMT_VECTOR, newHamtVector);
      }
      default: {
        // For array representation or any other case, check for transition
        const [newRepresentation, newData] = this.checkTransition(newSize);

        if (newRepresentation === RepresentationType.ARRAY) {
          // If still using array representation, append directly
          return new List<T>(newSize, RepresentationType.ARRAY, [...(newData as T[]), value]);
        } else {
          // For other representations, convert to array, append, and create new representation
          const dataArray = this.toArray();
          const newDataArray = [...dataArray, value];

          // Create the appropriate representation based on the new size
          if (newRepresentation === RepresentationType.CHUNKED) {
            const chunkedList = ChunkedList.from(newDataArray);
            return new List<T>(newSize, RepresentationType.CHUNKED, chunkedList);
          } else if (newRepresentation === RepresentationType.VECTOR) {
            const vector = PersistentVector.from(newDataArray);
            return new List<T>(newSize, RepresentationType.VECTOR, vector);
          } else {
            return new List<T>(newSize, newRepresentation, newDataArray);
          }
        }
      }
    }
  }

  /**
   * Prepend an element to the beginning of the list
   *
   * @param value - The element to prepend
   */
  prepend(value: T): List<T> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.PREPEND, this._size);

    const newSize = this._size + 1;

    // For small collections, optimize for direct array operations
    if (this._representation === RepresentationType.ARRAY && newSize < SMALL_COLLECTION_THRESHOLD) {
      return new List<T>(newSize, RepresentationType.ARRAY, [value, ...this._data]);
    }

    // For other representations, use the appropriate implementation's prepend method
    switch (this._representation) {
      case RepresentationType.SMALL: {
        const smallList = this._data as SmallList<T>;
        const newSmallList = smallList.prepend(value);

        // Check if we need to transition to a different representation
        if (newSize >= SMALL_COLLECTION_THRESHOLD) {
          // Transition to chunked representation
          const [newRepresentation, newData] = this.checkTransition(newSize);
          return new List<T>(newSize, newRepresentation, newData);
        }

        return new List<T>(newSize, RepresentationType.SMALL, newSmallList);
      }
      case RepresentationType.CHUNKED: {
        const chunkedList = this._data as ChunkedList<T>;
        const newChunkedList = chunkedList.prepend(value);

        // Check if we need to transition to a different representation
        if (newSize >= MEDIUM_COLLECTION_THRESHOLD) {
          // Transition to vector representation
          const [newRepresentation, newData] = this.checkTransition(newSize);
          return new List<T>(newSize, newRepresentation, newData);
        }

        return new List<T>(newSize, RepresentationType.CHUNKED, newChunkedList);
      }
      case RepresentationType.VECTOR: {
        const vector = this._data as PersistentVector<T>;
        const newVector = vector.prepend(value);

        // Check if we need to transition to a different representation
        if (newSize >= LARGE_COLLECTION_THRESHOLD) {
          // Transition to HAMT vector representation
          const hamtVector = HAMTPersistentVector.from(newVector.toArray());
          return new List<T>(newSize, RepresentationType.HAMT_VECTOR, hamtVector);
        }

        return new List<T>(newSize, RepresentationType.VECTOR, newVector);
      }
      case RepresentationType.HAMT_VECTOR: {
        const hamtVector = this._data as HAMTPersistentVector<T>;
        const newHamtVector = hamtVector.prepend(value);
        return new List<T>(newSize, RepresentationType.HAMT_VECTOR, newHamtVector);
      }
      default: {
        // For array representation or any other case, check for transition
        const [newRepresentation, newData] = this.checkTransition(newSize);

        if (newRepresentation === RepresentationType.ARRAY) {
          // If still using array representation, prepend directly
          return new List<T>(newSize, RepresentationType.ARRAY, [value, ...(newData as T[])]);
        } else {
          // For other representations, convert to array, prepend, and create new representation
          const dataArray = this.toArray();
          const newDataArray = [value, ...dataArray];

          // Create the appropriate representation based on the new size
          if (newRepresentation === RepresentationType.CHUNKED) {
            const chunkedList = ChunkedList.from(newDataArray);
            return new List<T>(newSize, RepresentationType.CHUNKED, chunkedList);
          } else if (newRepresentation === RepresentationType.VECTOR) {
            const vector = PersistentVector.from(newDataArray);
            return new List<T>(newSize, RepresentationType.VECTOR, vector);
          } else {
            return new List<T>(newSize, newRepresentation, newDataArray);
          }
        }
      }
    }
  }

  /**
   * Concatenate this list with another list
   *
   * @param other - The list to concatenate with this list
   */
  concat(other: IList<T>): List<T> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.CONCAT, this._size);

    try {
      if (!other || other.isEmpty) {
        return this;
      }

      if (this.isEmpty) {
        return other instanceof List ? other : List.from(other.toArray());
      }

      let otherArray: T[];
      try {
        otherArray = other.toArray();
      } catch (error) {
        console.error(`Error getting other array: ${error}`);
        // Build the array manually using get
        otherArray = [];
        for (let i = 0; i < other.size; i++) {
          const value = other.get(i);
          if (value !== undefined) {
            otherArray.push(value);
          }
        }
      }

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
      let dataArray: T[];
      try {
        if (this._representation === RepresentationType.CHUNKED) {
          dataArray = (this._data as ChunkedList<T>).toArray();
        } else if (this._representation === RepresentationType.SMALL) {
          dataArray = (this._data as SmallList<T>).toArray();
        } else if (this._representation === RepresentationType.VECTOR) {
          dataArray = (this._data as PersistentVector<T>).toArray();
        } else if (Array.isArray(this._data)) {
          dataArray = [...this._data];
        } else {
          // Build the array manually using get
          dataArray = [];
          for (let i = 0; i < this._size; i++) {
            const value = this.get(i);
            if (value !== undefined) {
              dataArray.push(value);
            }
          }
        }
      } catch (error) {
        // Suppress error message to avoid console noise in tests
        // Build the array manually using get
        dataArray = [];
        for (let i = 0; i < this._size; i++) {
          const value = this.get(i);
          if (value !== undefined) {
            dataArray.push(value);
          }
        }
      }

      // Concatenate the arrays
      const newDataArray = [...dataArray, ...otherArray];

      // Create the appropriate representation based on the new size
      if (newRepresentation === RepresentationType.CHUNKED) {
        const chunkedList = ChunkedList.from(newDataArray);
        return new List<T>(newSize, RepresentationType.CHUNKED, chunkedList);
      } else if (newRepresentation === RepresentationType.VECTOR) {
        const vector = PersistentVector.from(newDataArray);
        return new List<T>(newSize, RepresentationType.VECTOR, vector);
      } else {
        return new List<T>(newSize, newRepresentation, newDataArray);
      }
    } catch (error) {
      // Fallback to a safe implementation
      const thisArray = this.toArray();
      const otherArray = other.toArray();
      const newArray = [...thisArray, ...otherArray];
      return List.from(newArray);
    }
  }

  /**
   * Map each element in the list to a new value
   *
   * @param fn - The mapping function
   */
  map<U>(fn: (value: T, index: number) => U): List<U> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.MAP, this._size);

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
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.FILTER, this._size);

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
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.REDUCE, this._size);

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

    try {
      switch (this._representation) {
        case RepresentationType.ARRAY:
          // For array representation, return a copy of the array
          return [...this._data];
        case RepresentationType.SMALL:
          // For small list, use the small list's toArray method
          return (this._data as SmallList<T>).toArray();
        case RepresentationType.CHUNKED:
          // For chunked list, use the chunked list's toArray method
          return (this._data as ChunkedList<T>).toArray();
        case RepresentationType.VECTOR:
          // For vector representation, use the vector's toArray method
          return (this._data as PersistentVector<T>).toArray();
        case RepresentationType.HAMT_VECTOR:
          // For HAMT vector representation, use the HAMT vector's toArray method
          return (this._data as HAMTPersistentVector<T>).toArray();
        default:
          // Fallback for any other representation
          if (Array.isArray(this._data)) {
            return [...this._data];
          } else if (this._data && typeof (this._data as any).toArray === 'function') {
            return (this._data as any).toArray();
          } else {
            // If we can't convert to array directly, build it manually
            const result: T[] = [];
            for (let i = 0; i < this._size; i++) {
              const value = this.get(i);
              if (value !== undefined) {
                result.push(value);
              }
            }
            return result;
          }
      }
    } catch (error) {
      // Suppress error message to avoid console noise in tests
      // Fallback to a safe implementation
      if (Array.isArray(this._data)) {
        return [...this._data];
      } else {
        // Build the array manually using get
        const result: T[] = [];
        for (let i = 0; i < this._size; i++) {
          const value = this.get(i);
          if (value !== undefined) {
            result.push(value);
          }
        }
        return result;
      }
    }
  }

  /**
   * Create a slice of the list
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   */
  slice(start?: number, end?: number): List<T> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SLICE, this._size);

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
    let dataArray: T[];
    if (this._representation === RepresentationType.CHUNKED) {
      dataArray = (this._data as ChunkedList<T>).toArray();
    } else if (this._representation === RepresentationType.SMALL) {
      dataArray = (this._data as SmallList<T>).toArray();
    } else if (this._representation === RepresentationType.VECTOR) {
      dataArray = (this._data as PersistentVector<T>).toArray();
    } else {
      dataArray = [...this._data];
    }

    // Slice the array
    const slicedArray = dataArray.slice(normalizedStart, normalizedEnd);
    const sliceSize = slicedArray.length;

    // For small slices, use SmallList representation
    if (sliceSize < SMALL_COLLECTION_THRESHOLD) {
      const smallList = new SmallList<T>(slicedArray);
      return new List<T>(sliceSize, RepresentationType.SMALL, smallList);
    }
    // For medium slices, use chunked list
    else if (sliceSize < MEDIUM_COLLECTION_THRESHOLD) {
      const chunkedList = ChunkedList.from(slicedArray);
      return new List<T>(sliceSize, RepresentationType.CHUNKED, chunkedList);
    }
    // For large slices, use vector
    else {
      const persistentVector = PersistentVector.from(slicedArray);
      return new List<T>(sliceSize, RepresentationType.VECTOR, persistentVector);
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
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SPECIALIZED, this._size);

    if (this.isEmpty) {
      return initial;
    }

    try {
      // Use the operation fusion implementation for better performance
      return fusedOps.mapFilterReduce(this, mapFn, filterFn, reduceFn, initial);
    } catch (error) {
      console.error(`Error in mapFilterReduce: ${error}`);
      return initial;
    }
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
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SPECIALIZED, this._size);

    if (this.isEmpty) {
      return initial;
    }

    try {
      // Use the operation fusion implementation for better performance
      return fusedOps.mapReduce(this, mapFn, reduceFn, initial);
    } catch (error) {
      console.error(`Error in mapReduce: ${error}`);
      return initial;
    }
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
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SPECIALIZED, this._size);

    if (this.isEmpty) {
      return List.empty<U>();
    }

    try {
      // Use the operation fusion implementation for better performance
      return fusedOps.filterMap(this, filterFn, mapFn) as List<U>;
    } catch (error) {
      console.error(`Error in filterMap: ${error}`);
      return List.empty<U>();
    }
  }

  /**
   * Create a transient (temporarily mutable) version of the list
   *
   * @returns A transient list with the current values
   */
  transient(): TransientList<T> {
    // Use the appropriate transient implementation based on representation
    switch (this._representation) {
      case RepresentationType.SMALL:
        // For small list, use the small list's transient method
        return (this._data as SmallList<T>).transient();
      case RepresentationType.CHUNKED:
        // For chunked list, use the chunked list's transient method
        return (this._data as ChunkedList<T>).transient();
      case RepresentationType.VECTOR:
        // For vector representation, use the vector's transient method
        return (this._data as PersistentVector<T>).transient();
      case RepresentationType.ARRAY:
      default:
        // For array representation, use the generic transient implementation
        return new TransientListImpl<T>([...this._data]);
    }
  }

  /**
   * Create a lazy version of the list
   *
   * This method creates a lazy wrapper around the list that defers operations
   * until elements are accessed, which can significantly improve performance
   * for large collections and chains of operations.
   *
   * @returns A lazy version of the list
   */
  asLazy(): LazyList<T> {
    return lazy(this);
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
  lazyMap<R>(fn: (value: T, index: number) => R): IList<R> {
    return this.asLazy().map(fn);
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
  lazyFilter(fn: (value: T, index: number) => boolean): IList<T> {
    return this.asLazy().filter(fn);
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
  lazySlice(start: number, end?: number): IList<T> {
    return this.asLazy().slice(start, end);
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
  lazyConcat(other: IList<T>): IList<T> {
    return this.asLazy().concat(other);
  }

  /**
   * Perform a map and filter operation in a single pass
   *
   * @param mapFn - The mapping function
   * @param filterFn - The filter predicate
   */
  mapFilter<U>(
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean
  ): IList<U> {
    return specializedOps.mapFilter(this, mapFn, filterFn);
  }

  /**
   * Perform a map and slice operation in a single pass
   *
   * @param mapFn - The mapping function
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   */
  mapSlice<U>(
    mapFn: (value: T, index: number) => U,
    start?: number,
    end?: number
  ): IList<U> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SPECIALIZED, this._size);

    try {
      // Use the operation fusion implementation for better performance
      return fusedOps.mapSlice(this, mapFn, start, end);
    } catch (error) {
      console.error(`Error in mapSlice: ${error}`);
      return specializedOps.mapSlice(this, mapFn, start, end);
    }
  }

  /**
   * Perform a slice and map operation in a single pass
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @param mapFn - The mapping function
   */
  sliceMap<U>(
    start: number,
    end: number | undefined,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SPECIALIZED, this._size);

    try {
      // Use the operation fusion implementation for better performance
      return fusedOps.sliceMap(this, start, end, mapFn);
    } catch (error) {
      console.error(`Error in sliceMap: ${error}`);
      return specializedOps.sliceMap(this, start, end, mapFn);
    }
  }

  /**
   * Perform a filter and slice operation in a single pass
   *
   * @param filterFn - The filter predicate
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   */
  filterSlice(
    filterFn: (value: T, index: number) => boolean,
    start?: number,
    end?: number
  ): IList<T> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SPECIALIZED, this._size);

    try {
      // Use the operation fusion implementation for better performance
      return fusedOps.filterSlice(this, filterFn, start, end);
    } catch (error) {
      console.error(`Error in filterSlice: ${error}`);
      return specializedOps.filterSlice(this, filterFn, start, end);
    }
  }

  /**
   * Perform a slice and filter operation in a single pass
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @param filterFn - The filter predicate
   */
  sliceFilter(
    start: number,
    end: number | undefined,
    filterFn: (value: T, index: number) => boolean
  ): IList<T> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SPECIALIZED, this._size);

    try {
      // Use the operation fusion implementation for better performance
      return fusedOps.sliceFilter(this, start, end, filterFn);
    } catch (error) {
      console.error(`Error in sliceFilter: ${error}`);
      return specializedOps.sliceFilter(this, start, end, filterFn);
    }
  }

  /**
   * Perform a filter and reduce operation in a single pass
   *
   * @param filterFn - The filter predicate
   * @param reduceFn - The reducer function
   * @param initial - The initial value
   */
  filterReduce<V>(
    filterFn: (value: T, index: number) => boolean,
    reduceFn: (acc: V, value: T, index: number) => V,
    initial: V
  ): V {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SPECIALIZED, this._size);

    try {
      // Use the operation fusion implementation for better performance
      return fusedOps.filterReduce(this, filterFn, reduceFn, initial);
    } catch (error) {
      console.error(`Error in filterReduce: ${error}`);
      return specializedOps.filterReduce(this, filterFn, reduceFn, initial);
    }
  }

  /**
   * Perform a concat and map operation in a single pass
   *
   * @param other - The list to concatenate
   * @param mapFn - The mapping function
   */
  concatMap<U>(
    other: IList<T>,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SPECIALIZED, this._size);

    try {
      // Use the operation fusion implementation for better performance
      return fusedOps.concatMap(this, other, mapFn);
    } catch (error) {
      console.error(`Error in concatMap: ${error}`);
      return specializedOps.concatMap(this, other, mapFn);
    }
  }

  /**
   * Perform a map and concat operation in a single pass
   *
   * @param other - The list to concatenate
   * @param mapFn - The mapping function
   */
  mapConcat<U>(
    other: IList<T>,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.SPECIALIZED, this._size);

    try {
      // Use the operation fusion implementation for better performance
      // First map this list, then concat with other list
      const mappedList = this.map(mapFn);
      return mappedList.concat(other as unknown as IList<U>);
    } catch (error) {
      console.error(`Error in mapConcat: ${error}`);
      return specializedOps.mapConcat(this, other, mapFn);
    }
  }


  /**
   * Check if a transition to a different representation is needed based on the new size
   * and perform the transition if necessary
   *
   * @param newSize - The new size of the list
   * @returns A tuple containing the new representation type and data
   */
  private checkTransition(newSize: number): [RepresentationType, any] {
    // If the size hasn't changed, no transition is needed
    if (newSize === this._size) {
      return [this._representation, this._data];
    }

    // Record the operation for usage pattern monitoring
    recordOperation(OperationType.TRANSITION, newSize);

    // Update thresholds based on usage patterns
    if (ADAPTIVE_IMPLEMENTATION_ENABLED) {
      updateThresholds();
    }

    // Determine the new representation based on the new size
    let newRepresentation = this._representation;

    // Check if we have a recommendation from the usage pattern monitor
    const recommendation = ADAPTIVE_IMPLEMENTATION_ENABLED ? getImplementationRecommendation() : null;

    if (recommendation && recommendation.confidence >= 0.7) {
      // Use the recommended representation if confidence is high enough
      newRepresentation = recommendation.representation;
    } else {
      // Otherwise, use the standard size-based selection
      if (newSize < SMALL_COLLECTION_THRESHOLD && this._representation !== RepresentationType.ARRAY) {
        // Transition to array representation for small collections
        newRepresentation = RepresentationType.ARRAY;
      } else if (newSize >= SMALL_COLLECTION_THRESHOLD && newSize < MEDIUM_COLLECTION_THRESHOLD) {
        if (this._representation !== RepresentationType.CHUNKED) {
          // Transition to chunked representation for medium collections
          newRepresentation = RepresentationType.CHUNKED;
        }
      } else if (newSize >= MEDIUM_COLLECTION_THRESHOLD && newSize < LARGE_COLLECTION_THRESHOLD &&
                 this._representation !== RepresentationType.VECTOR) {
        // Transition to vector representation for large collections
        newRepresentation = RepresentationType.VECTOR;
      } else if (newSize >= LARGE_COLLECTION_THRESHOLD && this._representation !== RepresentationType.HAMT_VECTOR) {
        // Transition to HAMT vector representation for very large collections
        newRepresentation = RepresentationType.HAMT_VECTOR;
      }
    }

    // If no transition is needed, return the current representation and data
    if (newRepresentation === this._representation) {
      return [this._representation, this._data];
    }

    // Record the transition in the profiling system
    const profiler = getProfilingSystem();
    const startTime = performance.now();

    // Perform the transition
    const dataArray = this.toArray();

    // Create the appropriate representation based on the new size
    let result: [RepresentationType, any];
    let dataStructureType: DataStructureType;

    switch (newRepresentation) {
      case RepresentationType.ARRAY:
        result = [RepresentationType.ARRAY, dataArray];
        dataStructureType = DataStructureType.LIST;
        break;
      case RepresentationType.SMALL:
        result = [RepresentationType.SMALL, new SmallList<T>(dataArray)];
        dataStructureType = DataStructureType.SMALL_LIST;
        break;
      case RepresentationType.CHUNKED:
        result = [RepresentationType.CHUNKED, ChunkedList.from(dataArray)];
        dataStructureType = DataStructureType.CHUNKED_LIST;
        break;
      case RepresentationType.VECTOR:
        result = [RepresentationType.VECTOR, PersistentVector.from(dataArray)];
        dataStructureType = DataStructureType.PERSISTENT_VECTOR;
        break;
      case RepresentationType.HAMT_VECTOR:
        result = [RepresentationType.HAMT_VECTOR, HAMTPersistentVector.from(dataArray)];
        dataStructureType = DataStructureType.PERSISTENT_VECTOR; // Using same data structure type for now
        break;
      default:
        result = [this._representation, this._data];
        dataStructureType = DataStructureType.LIST;
        break;
    }

    // Record the transition in the profiling system
    profiler.record(
      {
        operationType: OperationType.TRANSITION,
        dataStructureType: DataStructureType.LIST,
        size: newSize,
        metadata: {
          from: this._representation,
          to: newRepresentation,
          fromSize: this._size,
          toSize: newSize
        }
      },
      startTime
    );

    // Record the data structure creation in the memory monitor
    const memoryUsage = estimateMemoryUsage(dataStructureType, newSize);
    recordDataStructureCreation(dataStructureType, newSize, memoryUsage);

    return result;
  }
}

/**
 * Create a specialized list for numeric data
 *
 * @param data - The numeric data
 * @returns A list with specialized numeric operations
 */
export function numericList(data: number[]): IList<number> & {
  sum: () => number;
  average: () => number;
  min: () => number;
  max: () => number;
} {
  return createNumericList(data);
}

/**
 * Create a specialized list for string data
 *
 * @param data - The string data
 * @returns A list with specialized string operations
 */
export function stringList(data: string[]): IList<string> & {
  join: (separator?: string) => string;
  findContaining: (substring: string) => IList<string>;
  findStartingWith: (prefix: string) => IList<string>;
  findEndingWith: (suffix: string) => IList<string>;
} {
  return createStringList(data);
}

/**
 * Create a specialized list for object reference data
 *
 * @param data - The object reference data
 * @returns A list with specialized object operations
 */
export function objectList<T extends object>(data: T[]): IList<T> & {
  findByProperty: <K extends keyof T>(property: K, value: any) => IList<T>;
  groupByProperty: <K extends keyof T>(property: K) => Map<T[K], IList<T>>;
  pluck: <K extends keyof T>(property: K) => IList<T[K]>;
  unique: (property?: keyof T) => IList<T>;
} {
  return createObjectList(data);
}

/**
 * Create a specialized list based on the data type
 *
 * @param data - The data array
 * @returns A specialized list for the detected data type
 */
export function specializedList<T>(data: T[]): IList<T> {
  return createSpecializedList(data);
}

// Export the List class as both a class and a factory
export default List as unknown as IListFactory<unknown> & typeof List;
