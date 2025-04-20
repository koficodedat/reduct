/**
 * Specialized operations for string data
 *
 * These operations are optimized for lists containing only string values.
 */

import { IList } from './types';
import List from './index';

/**
 * Optimized map operation for string data
 *
 * @param list - The source list (must contain only strings)
 * @param fn - The mapping function
 * @returns A new list with the mapped values
 */
export function stringMap<R>(
  list: IList<string>,
  fn: (value: string, index: number) => R
): IList<R> {
  if (list.isEmpty) {
    return List.empty<R>();
  }

  const size = list.size;
  const result = new Array(size);

  // If the result is also strings, use string-specific optimizations
  if (typeof fn('', 0) === 'string') {
    const array = list.toArray();

    // Process strings with length information
    for (let i = 0; i < size; i++) {
      const value = array[i];
      result[i] = fn(value, i);
    }
  } else {
    // If the result is not strings, use regular mapping
    for (let i = 0; i < size; i++) {
      const value = list.get(i);
      if (value !== undefined) {
        result[i] = fn(value, i);
      }
    }
  }

  return List.from(result);
}

/**
 * Optimized filter operation for string data
 *
 * @param list - The source list (must contain only strings)
 * @param fn - The filter predicate
 * @returns A new list with the filtered values
 */
export function stringFilter(
  list: IList<string>,
  fn: (value: string, index: number) => boolean
): IList<string> {
  if (list.isEmpty) {
    return List.empty<string>();
  }

  const array = list.toArray();
  const result: string[] = [];

  // Filter strings with length information
  for (let i = 0; i < array.length; i++) {
    const value = array[i];
    if (fn(value, i)) {
      result.push(value);
    }
  }

  return List.from(result);
}

/**
 * Optimized join operation for string data
 *
 * @param list - The source list (must contain only strings)
 * @param separator - The separator to use
 * @returns The joined string
 */
export function join(
  list: IList<string>,
  separator: string = ','
): string {
  if (list.isEmpty) {
    return '';
  }

  // Use native array join for optimal performance
  return list.toArray().join(separator);
}

/**
 * Optimized concat operation for string data
 *
 * @param list - The source list (must contain only strings)
 * @param other - The list to concatenate (must contain only strings)
 * @returns A new list with the concatenated values
 */
export function stringConcat(
  list: IList<string>,
  other: IList<string>
): IList<string> {
  if (list.isEmpty) {
    return other;
  }

  if (other.isEmpty) {
    return list;
  }

  // Pre-allocate for better performance
  const result = new Array(list.size + other.size);
  const array1 = list.toArray();
  const array2 = other.toArray();

  // Copy first array
  for (let i = 0; i < array1.length; i++) {
    result[i] = array1[i];
  }

  // Copy second array
  for (let i = 0; i < array2.length; i++) {
    result[array1.length + i] = array2[i];
  }

  return List.from(result);
}

/**
 * Find strings containing a substring
 *
 * @param list - The source list (must contain only strings)
 * @param substring - The substring to search for
 * @returns A new list with strings containing the substring
 */
export function findContaining(
  list: IList<string>,
  substring: string
): IList<string> {
  if (list.isEmpty || !substring) {
    return list;
  }

  const array = list.toArray();
  const result: string[] = [];

  // Use indexOf for better performance
  for (let i = 0; i < array.length; i++) {
    const value = array[i];
    if (value.indexOf(substring) !== -1) {
      result.push(value);
    }
  }

  return List.from(result);
}

/**
 * Find strings starting with a prefix
 *
 * @param list - The source list (must contain only strings)
 * @param prefix - The prefix to search for
 * @returns A new list with strings starting with the prefix
 */
export function findStartingWith(
  list: IList<string>,
  prefix: string
): IList<string> {
  if (list.isEmpty || !prefix) {
    return list;
  }

  const array = list.toArray();
  const result: string[] = [];

  // Use startsWith for better performance
  for (let i = 0; i < array.length; i++) {
    const value = array[i];
    if (value.startsWith(prefix)) {
      result.push(value);
    }
  }

  return List.from(result);
}

/**
 * Find strings ending with a suffix
 *
 * @param list - The source list (must contain only strings)
 * @param suffix - The suffix to search for
 * @returns A new list with strings ending with the suffix
 */
export function findEndingWith(
  list: IList<string>,
  suffix: string
): IList<string> {
  if (list.isEmpty || !suffix) {
    return list;
  }

  const array = list.toArray();
  const result: string[] = [];

  // Use endsWith for better performance
  for (let i = 0; i < array.length; i++) {
    const value = array[i];
    if (value.endsWith(suffix)) {
      result.push(value);
    }
  }

  return List.from(result);
}
