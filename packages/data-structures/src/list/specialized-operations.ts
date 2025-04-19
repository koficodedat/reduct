/**
 * Specialized batch operations for the List data structure
 *
 * This module provides optimized implementations of common operation chains
 * that avoid creating intermediate collections, resulting in better performance
 * and reduced memory usage.
 *
 * @packageDocumentation
 */

import { IList } from './types';
import List from './index';


/**
 * Map and filter in a single pass
 *
 * This operation is equivalent to `list.map(mapFn).filter(filterFn)` but
 * avoids creating an intermediate collection.
 *
 * @param list - The source list
 * @param mapFn - The mapping function
 * @param filterFn - The filter predicate
 * @returns A new list with mapped and filtered elements
 */
export function mapFilter<T, R>(
  list: IList<T>,
  mapFn: (value: T, index: number) => R,
  filterFn: (value: R, index: number) => boolean
): IList<R> {
  if (list.isEmpty) {
    return List.empty<R>();
  }

  const result: R[] = [];
  const size = list.size;

  for (let i = 0; i < size; i++) {
    const value = list.get(i);
    if (value !== undefined) {
      const mappedValue = mapFn(value, i);
      if (filterFn(mappedValue, i)) {
        result.push(mappedValue);
      }
    }
  }


  return List.from(result);
}

/**
 * Filter and map in a single pass
 *
 * This operation is equivalent to `list.filter(filterFn).map(mapFn)` but
 * avoids creating an intermediate collection.
 *
 * @param list - The source list
 * @param filterFn - The filter predicate
 * @param mapFn - The mapping function
 * @returns A new list with filtered and mapped elements
 */
export function filterMap<T, R>(
  list: IList<T>,
  filterFn: (value: T, index: number) => boolean,
  mapFn: (value: T, index: number) => R
): IList<R> {
  if (list.isEmpty) {
    return List.empty<R>();
  }

  const result: R[] = [];
  const size = list.size;

  for (let i = 0; i < size; i++) {
    const value = list.get(i);
    if (value !== undefined && filterFn(value, i)) {
      result.push(mapFn(value, i));
    }
  }


  return List.from(result);
}

/**
 * Map and slice in a single pass
 *
 * This operation is equivalent to `list.map(mapFn).slice(start, end)` but
 * avoids creating an intermediate collection.
 *
 * @param list - The source list
 * @param mapFn - The mapping function
 * @param start - The start index (inclusive)
 * @param end - The end index (exclusive)
 * @returns A new list with mapped and sliced elements
 */
export function mapSlice<T, R>(
  list: IList<T>,
  mapFn: (value: T, index: number) => R,
  start: number = 0,
  end?: number
): IList<R> {
  if (list.isEmpty) {
    return List.empty<R>();
  }

  const size = list.size;
  const actualStart = Math.max(0, start);
  const actualEnd = end !== undefined ? Math.min(size, end) : size;

  if (actualStart >= actualEnd) {
    return List.empty<R>();
  }

  const result: R[] = [];

  for (let i = actualStart; i < actualEnd; i++) {
    const value = list.get(i);
    if (value !== undefined) {
      result.push(mapFn(value, i));
    }
  }


  return List.from(result);
}

/**
 * Slice and map in a single pass
 *
 * This operation is equivalent to `list.slice(start, end).map(mapFn)` but
 * avoids creating an intermediate collection.
 *
 * @param list - The source list
 * @param start - The start index (inclusive)
 * @param end - The end index (exclusive)
 * @param mapFn - The mapping function
 * @returns A new list with sliced and mapped elements
 */
export function sliceMap<T, R>(
  list: IList<T>,
  start: number = 0,
  end: number | undefined,
  mapFn: (value: T, index: number) => R
): IList<R> {
  // This is functionally equivalent to mapSlice, but with a different parameter order
  return mapSlice(list, mapFn, start, end);
}

/**
 * Filter and slice in a single pass
 *
 * This operation is equivalent to `list.filter(filterFn).slice(start, end)` but
 * avoids creating an intermediate collection.
 *
 * @param list - The source list
 * @param filterFn - The filter predicate
 * @param start - The start index (inclusive)
 * @param end - The end index (exclusive)
 * @returns A new list with filtered and sliced elements
 */
export function filterSlice<T>(
  list: IList<T>,
  filterFn: (value: T, index: number) => boolean,
  start: number = 0,
  end?: number
): IList<T> {
  if (list.isEmpty) {
    return List.empty<T>();
  }

  // First, filter the list
  const filtered: T[] = [];
  const size = list.size;

  for (let i = 0; i < size; i++) {
    const value = list.get(i);
    if (value !== undefined && filterFn(value, i)) {
      filtered.push(value);
    }
  }

  // Then, slice the filtered result
  const filteredSize = filtered.length;
  const actualStart = Math.max(0, start);
  const actualEnd = end !== undefined ? Math.min(filteredSize, end) : filteredSize;

  if (actualStart >= actualEnd) {
    return List.empty<T>();
  }

  const result = filtered.slice(actualStart, actualEnd);


  return List.from(result);
}

/**
 * Slice and filter in a single pass
 *
 * This operation is equivalent to `list.slice(start, end).filter(filterFn)` but
 * avoids creating an intermediate collection.
 *
 * @param list - The source list
 * @param start - The start index (inclusive)
 * @param end - The end index (exclusive)
 * @param filterFn - The filter predicate
 * @returns A new list with sliced and filtered elements
 */
export function sliceFilter<T>(
  list: IList<T>,
  start: number = 0,
  end: number | undefined,
  filterFn: (value: T, index: number) => boolean
): IList<T> {
  if (list.isEmpty) {
    return List.empty<T>();
  }

  const size = list.size;
  const actualStart = Math.max(0, start);
  const actualEnd = end !== undefined ? Math.min(size, end) : size;

  if (actualStart >= actualEnd) {
    return List.empty<T>();
  }

  const result: T[] = [];

  for (let i = actualStart; i < actualEnd; i++) {
    const value = list.get(i);
    if (value !== undefined && filterFn(value, i - actualStart)) {
      result.push(value);
    }
  }


  return List.from(result);
}

/**
 * Map, filter, and reduce in a single pass
 *
 * This operation is equivalent to `list.map(mapFn).filter(filterFn).reduce(reduceFn, initial)`
 * but avoids creating intermediate collections.
 *
 * @param list - The source list
 * @param mapFn - The mapping function
 * @param filterFn - The filter predicate
 * @param reduceFn - The reducer function
 * @param initial - The initial value
 * @returns The reduced value
 */
export function mapFilterReduce<T, R, V>(
  list: IList<T>,
  mapFn: (value: T, index: number) => R,
  filterFn: (value: R, index: number) => boolean,
  reduceFn: (accumulator: V, value: R, index: number) => V,
  initial: V
): V {
  if (list.isEmpty) {
    return initial;
  }

  let result = initial;
  const size = list.size;
  let resultIndex = 0;

  for (let i = 0; i < size; i++) {
    const value = list.get(i);
    if (value !== undefined) {
      const mappedValue = mapFn(value, i);
      if (filterFn(mappedValue, i)) {
        result = reduceFn(result, mappedValue, resultIndex++);
      }
    }
  }


  return result;
}

/**
 * Map and reduce in a single pass
 *
 * This operation is equivalent to `list.map(mapFn).reduce(reduceFn, initial)`
 * but avoids creating an intermediate collection.
 *
 * @param list - The source list
 * @param mapFn - The mapping function
 * @param reduceFn - The reducer function
 * @param initial - The initial value
 * @returns The reduced value
 */
export function mapReduce<T, R, V>(
  list: IList<T>,
  mapFn: (value: T, index: number) => R,
  reduceFn: (accumulator: V, value: R, index: number) => V,
  initial: V
): V {
  if (list.isEmpty) {
    return initial;
  }

  let result = initial;
  const size = list.size;

  for (let i = 0; i < size; i++) {
    const value = list.get(i);
    if (value !== undefined) {
      const mappedValue = mapFn(value, i);
      result = reduceFn(result, mappedValue, i);
    }
  }


  return result;
}

/**
 * Filter and reduce in a single pass
 *
 * This operation is equivalent to `list.filter(filterFn).reduce(reduceFn, initial)`
 * but avoids creating an intermediate collection.
 *
 * @param list - The source list
 * @param filterFn - The filter predicate
 * @param reduceFn - The reducer function
 * @param initial - The initial value
 * @returns The reduced value
 */
export function filterReduce<T, V>(
  list: IList<T>,
  filterFn: (value: T, index: number) => boolean,
  reduceFn: (accumulator: V, value: T, index: number) => V,
  initial: V
): V {
  if (list.isEmpty) {
    return initial;
  }

  let result = initial;
  const size = list.size;
  let resultIndex = 0;

  for (let i = 0; i < size; i++) {
    const value = list.get(i);
    if (value !== undefined && filterFn(value, i)) {
      result = reduceFn(result, value, resultIndex++);
    }
  }


  return result;
}

/**
 * Concat and map in a single pass
 *
 * This operation is equivalent to `list.concat(other).map(mapFn)` but
 * avoids creating an intermediate collection.
 *
 * @param list - The first list
 * @param other - The second list
 * @param mapFn - The mapping function
 * @returns A new list with concatenated and mapped elements
 */
export function concatMap<T, R>(
  list: IList<T>,
  other: IList<T>,
  mapFn: (value: T, index: number) => R
): IList<R> {
  if (list.isEmpty && other.isEmpty) {
    return List.empty<R>();
  }

  const result: R[] = [];
  const size1 = list.size;
  const size2 = other.size;

  // Map elements from the first list
  for (let i = 0; i < size1; i++) {
    const value = list.get(i);
    if (value !== undefined) {
      result.push(mapFn(value, i));
    }
  }

  // Map elements from the second list
  for (let i = 0; i < size2; i++) {
    const value = other.get(i);
    if (value !== undefined) {
      result.push(mapFn(value, i + size1));
    }
  }


  return List.from(result);
}

/**
 * Map and concat in a single pass
 *
 * This operation is equivalent to `list.map(mapFn).concat(other.map(mapFn))` but
 * avoids creating intermediate collections.
 *
 * @param list - The first list
 * @param other - The second list
 * @param mapFn - The mapping function
 * @returns A new list with mapped and concatenated elements
 */
export function mapConcat<T, R>(
  list: IList<T>,
  other: IList<T>,
  mapFn: (value: T, index: number) => R
): IList<R> {
  // This is functionally equivalent to concatMap, but with a different semantic meaning
  return concatMap(list, other, mapFn);
}
