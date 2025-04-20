/**
 * List Factory - Creates the optimal list implementation based on size and data type
 *
 * This factory analyzes the input data and creates the most efficient
 * list implementation based on our benchmark findings.
 */

import { IList } from '../types';
import { CompactList } from './compact-list';
import { NumericList } from './numeric-list';
import { StringList } from './string-list';
import { ObjectList } from './object-list';
import { WasmNumericList } from './wasm-numeric-list';
import { detectDataType, DataType, isObjectArray } from '../type-detection';
import { HAMTPersistentVector } from '../hamt-persistent-vector';
import { WasmHAMTPersistentVector } from '../wasm-hamt-persistent-vector';
// Import from our mock implementation
import { isWebAssemblySupported } from '../../utils/mock-wasm';

// Size threshold based on benchmark results
const SMALL_LIST_THRESHOLD = 100;

/**
 * Create an optimized list based on the input data
 *
 * @param data - The input data
 * @returns The most efficient list implementation for the data
 */
export function createOptimizedList<T>(data: T[]): IList<T> {
  const size = data.length;

  // For empty or very small lists, use CompactList
  if (size <= SMALL_LIST_THRESHOLD) {
    return new CompactList<T>(data);
  }

  // For medium-sized and large lists, use specialized implementations based on data type
  return createTypedOptimizedList(data);
}

/**
 * Create an optimized list based on the input data and data type
 *
 * @param data - The input data
 * @returns The most efficient list implementation for the data and type
 */
export function createTypedOptimizedList<T>(data: T[]): IList<T> {
  // Detect the data type
  const dataType = detectDataType(data);

  // Use specialized implementations based on data type
  switch (dataType) {
    case DataType.NUMERIC:
      // Use WebAssembly-accelerated NumericList if WebAssembly is supported
      try {
        if (isWebAssemblySupported()) {
          return new WasmNumericList(data as unknown as number[]) as unknown as IList<T>;
        }
      } catch (error) {
        console.warn('Error creating WebAssembly-accelerated NumericList:', error);
      }
      return new NumericList(data as unknown as number[]) as unknown as IList<T>;
    case DataType.STRING:
      return new StringList(data as unknown as string[]) as unknown as IList<T>;
    case DataType.OBJECT_REFERENCE:
      if (isObjectArray(data)) {
        return new ObjectList(data as unknown as object[]) as unknown as IList<T>;
      }
      return new CompactList<T>(data);
    default:
      return new CompactList<T>(data);
  }
}

/**
 * Create a numeric list optimized for number operations
 *
 * @param data - The input numeric data
 * @returns An optimized list for numeric operations
 */
export function createNumericList(data: number[]): IList<number> {
  // Use WebAssembly-accelerated NumericList if WebAssembly is supported
  try {
    if (isWebAssemblySupported()) {
      // For large lists, use WasmHAMTPersistentVector
      if (data.length > 1000) {
        return new WasmHAMTPersistentVector(data);
      }
      // For smaller lists, use WasmNumericList
      return new WasmNumericList(data);
    }
  } catch (error) {
    console.warn('Error creating WebAssembly-accelerated NumericList:', error);
  }

  // Fall back to regular NumericList
  return new NumericList(data);
}

/**
 * Create a persistent vector optimized for large collections
 *
 * @param data - The input data
 * @returns An optimized persistent vector
 */
export function createPersistentVector<T>(data: T[]): IList<T> {
  // For numeric data, use WebAssembly-accelerated HAMTPersistentVector if WebAssembly is supported
  if (detectDataType(data) === DataType.NUMERIC) {
    try {
      if (isWebAssemblySupported()) {
        return new WasmHAMTPersistentVector(data as unknown as number[]) as unknown as IList<T>;
      }
    } catch (error) {
      console.warn('Error creating WebAssembly-accelerated HAMTPersistentVector:', error);
    }
  }

  // Fall back to regular HAMTPersistentVector
  return HAMTPersistentVector.from(data);
}

/**
 * Create a string list optimized for string operations
 *
 * @param data - The input string data
 * @returns An optimized list for string operations
 */
export function createStringList(data: string[]): IList<string> {
  return new StringList(data);
}

/**
 * Create an object list optimized for object operations
 *
 * @param data - The input object data
 * @returns An optimized list for object operations
 */
export function createObjectList<T extends object>(data: T[]): IList<T> {
  return new ObjectList<T>(data);
}
