/**
 * Specialized operations for numeric data
 * 
 * These operations are optimized for lists containing only numeric values.
 */

import { IList } from './types';
import List from './index';

/**
 * Optimized map operation for numeric data
 * 
 * @param list - The source list (must contain only numbers)
 * @param fn - The mapping function
 * @returns A new list with the mapped values
 */
export function numericMap<R>(
  list: IList<number>,
  fn: (value: number, index: number) => R
): IList<R> {
  // For empty lists, return an empty list
  if (list.isEmpty) {
    return List.empty<R>();
  }
  
  const size = list.size;
  const result = new Array(size);
  
  // Use a typed array for intermediate storage if the result is also numeric
  if (typeof fn(0, 0) === 'number') {
    // Create a typed array for better performance
    const typedArray = new Float64Array(size);
    
    // Fill the typed array
    for (let i = 0; i < size; i++) {
      const value = list.get(i);
      if (value !== undefined) {
        typedArray[i] = fn(value, i) as unknown as number;
      }
    }
    
    // Convert back to regular array
    for (let i = 0; i < size; i++) {
      result[i] = typedArray[i] as unknown as R;
    }
  } else {
    // If the result is not numeric, use a regular array
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
 * Optimized sum operation for numeric data
 * 
 * @param list - The source list (must contain only numbers)
 * @returns The sum of all values in the list
 */
export function sum(list: IList<number>): number {
  if (list.isEmpty) {
    return 0;
  }
  
  const size = list.size;
  let result = 0;
  
  // Use a typed array for better performance
  const array = list.toArray();
  const typedArray = new Float64Array(array);
  
  // Sum the values
  for (let i = 0; i < size; i++) {
    result += typedArray[i];
  }
  
  return result;
}

/**
 * Optimized average operation for numeric data
 * 
 * @param list - The source list (must contain only numbers)
 * @returns The average of all values in the list
 */
export function average(list: IList<number>): number {
  if (list.isEmpty) {
    return 0;
  }
  
  return sum(list) / list.size;
}

/**
 * Optimized min operation for numeric data
 * 
 * @param list - The source list (must contain only numbers)
 * @returns The minimum value in the list
 */
export function min(list: IList<number>): number {
  if (list.isEmpty) {
    return Infinity;
  }
  
  const size = list.size;
  let result = Infinity;
  
  // Use a typed array for better performance
  const array = list.toArray();
  const typedArray = new Float64Array(array);
  
  // Find the minimum value
  for (let i = 0; i < size; i++) {
    if (typedArray[i] < result) {
      result = typedArray[i];
    }
  }
  
  return result;
}

/**
 * Optimized max operation for numeric data
 * 
 * @param list - The source list (must contain only numbers)
 * @returns The maximum value in the list
 */
export function max(list: IList<number>): number {
  if (list.isEmpty) {
    return -Infinity;
  }
  
  const size = list.size;
  let result = -Infinity;
  
  // Use a typed array for better performance
  const array = list.toArray();
  const typedArray = new Float64Array(array);
  
  // Find the maximum value
  for (let i = 0; i < size; i++) {
    if (typedArray[i] > result) {
      result = typedArray[i];
    }
  }
  
  return result;
}

/**
 * Optimized filter operation for numeric data
 * 
 * @param list - The source list (must contain only numbers)
 * @param fn - The filter predicate
 * @returns A new list with the filtered values
 */
export function numericFilter(
  list: IList<number>,
  fn: (value: number, index: number) => boolean
): IList<number> {
  if (list.isEmpty) {
    return List.empty<number>();
  }
  
  const size = list.size;
  const result: number[] = [];
  
  // Use a typed array for better performance
  const array = list.toArray();
  const typedArray = new Float64Array(array);
  
  // Filter the values
  for (let i = 0; i < size; i++) {
    if (fn(typedArray[i], i)) {
      result.push(typedArray[i]);
    }
  }
  
  return List.from(result);
}

/**
 * Optimized reduce operation for numeric data
 * 
 * @param list - The source list (must contain only numbers)
 * @param fn - The reducer function
 * @param initial - The initial value
 * @returns The reduced value
 */
export function numericReduce<U>(
  list: IList<number>,
  fn: (acc: U, value: number, index: number) => U,
  initial: U
): U {
  if (list.isEmpty) {
    return initial;
  }
  
  const size = list.size;
  let result = initial;
  
  // Use a typed array for better performance
  const array = list.toArray();
  const typedArray = new Float64Array(array);
  
  // Reduce the values
  for (let i = 0; i < size; i++) {
    result = fn(result, typedArray[i], i);
  }
  
  return result;
}
