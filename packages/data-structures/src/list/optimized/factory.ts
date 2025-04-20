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
import { detectDataType, DataType } from '../type-detection';

// Size thresholds based on benchmark results
const SMALL_LIST_THRESHOLD = 100;
const MEDIUM_LIST_THRESHOLD = 10000;

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

  // For medium-sized lists, use CompactList
  if (size <= MEDIUM_LIST_THRESHOLD) {
    return new CompactList<T>(data);
  }

  // For large lists, use CompactList for now
  // In the future, we'll add more specialized implementations
  return new CompactList<T>(data);
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
      return new NumericList(data as unknown as number[]) as unknown as IList<T>;
    case DataType.STRING:
      return new StringList(data as unknown as string[]) as unknown as IList<T>;
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
  return new NumericList(data);
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
  return new CompactList<T>(data);
}
