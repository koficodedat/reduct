/**
 * Operation fusion for common patterns
 * 
 * This module provides optimized implementations for common operation patterns
 * by fusing multiple operations into a single pass.
 */

import { IList } from './types';
import List from './index';
import { getPooledArray, releasePooledArray } from '../memory/pool';

/**
 * Fused map and filter operations
 * 
 * @param list - The source list
 * @param mapFn - The mapping function
 * @param filterFn - The filter predicate
 * @returns A new list with the mapped and filtered values
 */
export function mapFilter<T, R>(
  list: IList<T>,
  mapFn: (value: T, index: number) => R,
  filterFn: (value: R, index: number) => boolean
): IList<R> {
  if (list.isEmpty) {
    return List.empty<R>();
  }

  const size = list.size;
  const result: R[] = [];

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
 * Fused filter and map operations
 * 
 * @param list - The source list
 * @param filterFn - The filter predicate
 * @param mapFn - The mapping function
 * @returns A new list with the filtered and mapped values
 */
export function filterMap<T, R>(
  list: IList<T>,
  filterFn: (value: T, index: number) => boolean,
  mapFn: (value: T, index: number) => R
): IList<R> {
  if (list.isEmpty) {
    return List.empty<R>();
  }

  const size = list.size;
  const result: R[] = [];

  for (let i = 0; i < size; i++) {
    const value = list.get(i);
    if (value !== undefined && filterFn(value, i)) {
      result.push(mapFn(value, i));
    }
  }

  return List.from(result);
}

/**
 * Fused map, filter, and reduce operations
 * 
 * @param list - The source list
 * @param mapFn - The mapping function
 * @param filterFn - The filter predicate
 * @param reduceFn - The reducer function
 * @param initial - The initial value
 * @returns The reduced value
 */
export function mapFilterReduce<T, R, U>(
  list: IList<T>,
  mapFn: (value: T, index: number) => R,
  filterFn: (value: R, index: number) => boolean,
  reduceFn: (acc: U, value: R, index: number) => U,
  initial: U
): U {
  if (list.isEmpty) {
    return initial;
  }

  const size = list.size;
  let result = initial;
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
 * Fused filter and reduce operations
 * 
 * @param list - The source list
 * @param filterFn - The filter predicate
 * @param reduceFn - The reducer function
 * @param initial - The initial value
 * @returns The reduced value
 */
export function filterReduce<T, U>(
  list: IList<T>,
  filterFn: (value: T, index: number) => boolean,
  reduceFn: (acc: U, value: T, index: number) => U,
  initial: U
): U {
  if (list.isEmpty) {
    return initial;
  }

  const size = list.size;
  let result = initial;
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
 * Fused map and reduce operations
 * 
 * @param list - The source list
 * @param mapFn - The mapping function
 * @param reduceFn - The reducer function
 * @param initial - The initial value
 * @returns The reduced value
 */
export function mapReduce<T, R, U>(
  list: IList<T>,
  mapFn: (value: T, index: number) => R,
  reduceFn: (acc: U, value: R, index: number) => U,
  initial: U
): U {
  if (list.isEmpty) {
    return initial;
  }

  const size = list.size;
  let result = initial;

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
 * Fused map and slice operations
 * 
 * @param list - The source list
 * @param mapFn - The mapping function
 * @param start - The start index
 * @param end - The end index
 * @returns A new list with the mapped and sliced values
 */
export function mapSlice<T, R>(
  list: IList<T>,
  mapFn: (value: T, index: number) => R,
  start: number = 0,
  end: number = list.size
): IList<R> {
  if (list.isEmpty) {
    return List.empty<R>();
  }

  // Normalize start and end indices
  const size = list.size;
  start = start < 0 ? Math.max(0, size + start) : Math.min(size, start);
  end = end < 0 ? Math.max(0, size + end) : Math.min(size, end);

  if (start >= end) {
    return List.empty<R>();
  }

  const resultSize = end - start;
  const result = getPooledArray<R>(resultSize);

  for (let i = 0; i < resultSize; i++) {
    const sourceIndex = start + i;
    const value = list.get(sourceIndex);
    if (value !== undefined) {
      result[i] = mapFn(value, sourceIndex);
    }
  }

  const resultList = List.from(result);
  releasePooledArray(result);
  return resultList;
}

/**
 * Fused slice and map operations
 * 
 * @param list - The source list
 * @param start - The start index
 * @param end - The end index
 * @param mapFn - The mapping function
 * @returns A new list with the sliced and mapped values
 */
export function sliceMap<T, R>(
  list: IList<T>,
  start: number = 0,
  end: number = list.size,
  mapFn: (value: T, index: number) => R
): IList<R> {
  if (list.isEmpty) {
    return List.empty<R>();
  }

  // Normalize start and end indices
  const size = list.size;
  start = start < 0 ? Math.max(0, size + start) : Math.min(size, start);
  end = end < 0 ? Math.max(0, size + end) : Math.min(size, end);

  if (start >= end) {
    return List.empty<R>();
  }

  const resultSize = end - start;
  const result = getPooledArray<R>(resultSize);

  for (let i = 0; i < resultSize; i++) {
    const sourceIndex = start + i;
    const value = list.get(sourceIndex);
    if (value !== undefined) {
      result[i] = mapFn(value, i);
    }
  }

  const resultList = List.from(result);
  releasePooledArray(result);
  return resultList;
}

/**
 * Fused filter and slice operations
 * 
 * @param list - The source list
 * @param filterFn - The filter predicate
 * @param start - The start index
 * @param end - The end index
 * @returns A new list with the filtered and sliced values
 */
export function filterSlice<T>(
  list: IList<T>,
  filterFn: (value: T, index: number) => boolean,
  start: number = 0,
  end: number = list.size
): IList<T> {
  if (list.isEmpty) {
    return List.empty<T>();
  }

  // Normalize start and end indices
  const size = list.size;
  start = start < 0 ? Math.max(0, size + start) : Math.min(size, start);
  end = end < 0 ? Math.max(0, size + end) : Math.min(size, end);

  if (start >= end) {
    return List.empty<T>();
  }

  const result: T[] = [];

  for (let i = start; i < end; i++) {
    const value = list.get(i);
    if (value !== undefined && filterFn(value, i)) {
      result.push(value);
    }
  }

  return List.from(result);
}

/**
 * Fused slice and filter operations
 * 
 * @param list - The source list
 * @param start - The start index
 * @param end - The end index
 * @param filterFn - The filter predicate
 * @returns A new list with the sliced and filtered values
 */
export function sliceFilter<T>(
  list: IList<T>,
  start: number = 0,
  end: number = list.size,
  filterFn: (value: T, index: number) => boolean
): IList<T> {
  if (list.isEmpty) {
    return List.empty<T>();
  }

  // Normalize start and end indices
  const size = list.size;
  start = start < 0 ? Math.max(0, size + start) : Math.min(size, start);
  end = end < 0 ? Math.max(0, size + end) : Math.min(size, end);

  if (start >= end) {
    return List.empty<T>();
  }

  const result: T[] = [];

  for (let i = start; i < end; i++) {
    const value = list.get(i);
    if (value !== undefined && filterFn(value, i - start)) {
      result.push(value);
    }
  }

  return List.from(result);
}

/**
 * Fused map and concat operations
 * 
 * @param list1 - The first list
 * @param list2 - The second list
 * @param mapFn - The mapping function
 * @returns A new list with the concatenated and mapped values
 */
export function concatMap<T, R>(
  list1: IList<T>,
  list2: IList<T>,
  mapFn: (value: T, index: number) => R
): IList<R> {
  if (list1.isEmpty && list2.isEmpty) {
    return List.empty<R>();
  }

  const size1 = list1.size;
  const size2 = list2.size;
  const totalSize = size1 + size2;
  const result = getPooledArray<R>(totalSize);

  for (let i = 0; i < size1; i++) {
    const value = list1.get(i);
    if (value !== undefined) {
      result[i] = mapFn(value, i);
    }
  }

  for (let i = 0; i < size2; i++) {
    const value = list2.get(i);
    if (value !== undefined) {
      result[size1 + i] = mapFn(value, size1 + i);
    }
  }

  const resultList = List.from(result);
  releasePooledArray(result);
  return resultList;
}

/**
 * Fused map and concat operations
 * 
 * @param list1 - The first list
 * @param mapFn - The mapping function
 * @param list2 - The second list
 * @returns A new list with the mapped and concatenated values
 */
export function mapConcat<T, R>(
  list1: IList<T>,
  mapFn: (value: T, index: number) => R,
  list2: IList<R>
): IList<R> {
  if (list1.isEmpty && list2.isEmpty) {
    return List.empty<R>();
  }

  const size1 = list1.size;
  const size2 = list2.size;
  const totalSize = size1 + size2;
  const result = getPooledArray<R>(totalSize);

  for (let i = 0; i < size1; i++) {
    const value = list1.get(i);
    if (value !== undefined) {
      result[i] = mapFn(value, i);
    }
  }

  for (let i = 0; i < size2; i++) {
    const value = list2.get(i);
    if (value !== undefined) {
      result[size1 + i] = value;
    }
  }

  const resultList = List.from(result);
  releasePooledArray(result);
  return resultList;
}

/**
 * Fused filter and concat operations
 * 
 * @param list1 - The first list
 * @param list2 - The second list
 * @param filterFn - The filter predicate
 * @returns A new list with the concatenated and filtered values
 */
export function concatFilter<T>(
  list1: IList<T>,
  list2: IList<T>,
  filterFn: (value: T, index: number) => boolean
): IList<T> {
  if (list1.isEmpty && list2.isEmpty) {
    return List.empty<T>();
  }

  const result: T[] = [];
  let resultIndex = 0;

  for (let i = 0; i < list1.size; i++) {
    const value = list1.get(i);
    if (value !== undefined && filterFn(value, resultIndex)) {
      result.push(value);
      resultIndex++;
    }
  }

  for (let i = 0; i < list2.size; i++) {
    const value = list2.get(i);
    if (value !== undefined && filterFn(value, resultIndex)) {
      result.push(value);
      resultIndex++;
    }
  }

  return List.from(result);
}

/**
 * Fused filter and concat operations
 * 
 * @param list1 - The first list
 * @param filterFn - The filter predicate
 * @param list2 - The second list
 * @returns A new list with the filtered and concatenated values
 */
export function filterConcat<T>(
  list1: IList<T>,
  filterFn: (value: T, index: number) => boolean,
  list2: IList<T>
): IList<T> {
  if (list1.isEmpty && list2.isEmpty) {
    return List.empty<T>();
  }

  const result: T[] = [];
  let resultIndex = 0;

  for (let i = 0; i < list1.size; i++) {
    const value = list1.get(i);
    if (value !== undefined && filterFn(value, i)) {
      result.push(value);
      resultIndex++;
    }
  }

  for (let i = 0; i < list2.size; i++) {
    const value = list2.get(i);
    if (value !== undefined) {
      result.push(value);
      resultIndex++;
    }
  }

  return List.from(result);
}

/**
 * Fused map, filter, and concat operations
 * 
 * @param list1 - The first list
 * @param list2 - The second list
 * @param mapFn - The mapping function
 * @param filterFn - The filter predicate
 * @returns A new list with the concatenated, mapped, and filtered values
 */
export function concatMapFilter<T, R>(
  list1: IList<T>,
  list2: IList<T>,
  mapFn: (value: T, index: number) => R,
  filterFn: (value: R, index: number) => boolean
): IList<R> {
  if (list1.isEmpty && list2.isEmpty) {
    return List.empty<R>();
  }

  const result: R[] = [];
  let resultIndex = 0;

  for (let i = 0; i < list1.size; i++) {
    const value = list1.get(i);
    if (value !== undefined) {
      const mappedValue = mapFn(value, i);
      if (filterFn(mappedValue, resultIndex)) {
        result.push(mappedValue);
        resultIndex++;
      }
    }
  }

  for (let i = 0; i < list2.size; i++) {
    const value = list2.get(i);
    if (value !== undefined) {
      const mappedValue = mapFn(value, list1.size + i);
      if (filterFn(mappedValue, resultIndex)) {
        result.push(mappedValue);
        resultIndex++;
      }
    }
  }

  return List.from(result);
}

/**
 * Fused batch update operation
 * 
 * @param list - The source list
 * @param updates - The updates to apply
 * @returns A new list with the updates applied
 */
export function batchUpdate<T>(
  list: IList<T>,
  updates: Array<[number, T]>
): IList<T> {
  if (list.isEmpty || updates.length === 0) {
    return list;
  }

  const size = list.size;
  const result = getPooledArray<T>(size);

  // Copy the original list
  for (let i = 0; i < size; i++) {
    result[i] = list.get(i)!;
  }

  // Apply updates
  for (const [index, value] of updates) {
    if (index >= 0 && index < size) {
      result[index] = value;
    }
  }

  const resultList = List.from(result);
  releasePooledArray(result);
  return resultList;
}

/**
 * Fused batch insert operation
 * 
 * @param list - The source list
 * @param inserts - The inserts to apply
 * @returns A new list with the inserts applied
 */
export function batchInsert<T>(
  list: IList<T>,
  inserts: Array<[number, T]>
): IList<T> {
  if (inserts.length === 0) {
    return list;
  }

  // Sort inserts by index (descending) to avoid shifting issues
  const sortedInserts = [...inserts].sort((a, b) => b[0] - a[0]);

  const size = list.size;
  const newSize = size + inserts.length;
  const result = getPooledArray<T>(newSize);

  // Copy the original list
  for (let i = 0; i < size; i++) {
    result[i] = list.get(i)!;
  }

  // Apply inserts
  for (const [index, value] of sortedInserts) {
    const normalizedIndex = Math.max(0, Math.min(size, index));
    
    // Shift elements to make room for the insert
    for (let i = newSize - 1; i > normalizedIndex; i--) {
      result[i] = result[i - 1];
    }
    
    // Insert the new value
    result[normalizedIndex] = value;
  }

  const resultList = List.from(result);
  releasePooledArray(result);
  return resultList;
}

/**
 * Fused batch remove operation
 * 
 * @param list - The source list
 * @param indices - The indices to remove
 * @returns A new list with the elements removed
 */
export function batchRemove<T>(
  list: IList<T>,
  indices: number[]
): IList<T> {
  if (list.isEmpty || indices.length === 0) {
    return list;
  }

  // Sort indices (ascending) and remove duplicates
  const sortedIndices = [...new Set(indices)].sort((a, b) => a - b);

  const size = list.size;
  const newSize = size - sortedIndices.length;
  
  if (newSize <= 0) {
    return List.empty<T>();
  }

  const result = getPooledArray<T>(newSize);
  let resultIndex = 0;

  // Copy elements that are not removed
  for (let i = 0; i < size; i++) {
    if (!sortedIndices.includes(i)) {
      result[resultIndex++] = list.get(i)!;
    }
  }

  const resultList = List.from(result);
  releasePooledArray(result);
  return resultList;
}
