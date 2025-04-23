/**
 * Specialized operations for object reference data
 * 
 * These operations are optimized for lists containing object references.
 */

import { IList } from './types';

import List from './index';

/**
 * Optimized map operation for object references
 * 
 * @param list - The source list (must contain only objects)
 * @param fn - The mapping function
 * @returns A new list with the mapped values
 */
export function objectMap<T extends object, R>(
  list: IList<T>,
  fn: (value: T, index: number) => R
): IList<R> {
  if (list.isEmpty) {
    return List.empty<R>();
  }
  
  const size = list.size;
  const result = new Array(size);
  
  // Use a WeakMap to cache results for identical objects
  const cache = new WeakMap<T, R>();
  
  for (let i = 0; i < size; i++) {
    const value = list.get(i);
    if (value !== undefined) {
      // Check if we've already processed this exact object reference
      if (cache.has(value)) {
        result[i] = cache.get(value);
      } else {
        const mappedValue = fn(value, i);
        cache.set(value, mappedValue);
        result[i] = mappedValue;
      }
    }
  }
  
  return List.from(result);
}

/**
 * Optimized filter operation for object references
 * 
 * @param list - The source list (must contain only objects)
 * @param fn - The filter predicate
 * @returns A new list with the filtered values
 */
export function objectFilter<T extends object>(
  list: IList<T>,
  fn: (value: T, index: number) => boolean
): IList<T> {
  if (list.isEmpty) {
    return List.empty<T>();
  }
  
  const result: T[] = [];
  
  // Use a WeakMap to cache results for identical objects
  const cache = new WeakMap<T, boolean>();
  
  for (let i = 0; i < list.size; i++) {
    const value = list.get(i);
    if (value !== undefined) {
      // Check if we've already processed this exact object reference
      let shouldInclude: boolean;
      if (cache.has(value)) {
        shouldInclude = cache.get(value)!;
      } else {
        shouldInclude = fn(value, i);
        cache.set(value, shouldInclude);
      }
      
      if (shouldInclude) {
        result.push(value);
      }
    }
  }
  
  return List.from(result);
}

/**
 * Find objects with a specific property value
 * 
 * @param list - The source list (must contain only objects)
 * @param property - The property to check
 * @param value - The value to match
 * @returns A new list with objects matching the property value
 */
export function findByProperty<T extends object>(
  list: IList<T>,
  property: keyof T,
  value: any
): IList<T> {
  if (list.isEmpty) {
    return List.empty<T>();
  }
  
  const result: T[] = [];
  
  for (let i = 0; i < list.size; i++) {
    const obj = list.get(i);
    if (obj !== undefined && obj[property] === value) {
      result.push(obj);
    }
  }
  
  return List.from(result);
}

/**
 * Group objects by a property value
 * 
 * @param list - The source list (must contain only objects)
 * @param property - The property to group by
 * @returns A map of property values to lists of objects
 */
export function groupByProperty<T extends object, K extends keyof T>(
  list: IList<T>,
  property: K
): Map<T[K], IList<T>> {
  if (list.isEmpty) {
    return new Map<T[K], IList<T>>();
  }
  
  const groups = new Map<T[K], T[]>();
  
  for (let i = 0; i < list.size; i++) {
    const obj = list.get(i);
    if (obj !== undefined) {
      const key = obj[property];
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(obj);
    }
  }
  
  // Convert arrays to Lists
  const result = new Map<T[K], IList<T>>();
  groups.forEach((value, key) => {
    result.set(key, List.from(value));
  });
  
  return result;
}

/**
 * Extract a property from each object in the list
 * 
 * @param list - The source list (must contain only objects)
 * @param property - The property to extract
 * @returns A new list with the extracted property values
 */
export function pluck<T extends object, K extends keyof T>(
  list: IList<T>,
  property: K
): IList<T[K]> {
  if (list.isEmpty) {
    return List.empty<T[K]>();
  }
  
  const result: T[K][] = [];
  
  for (let i = 0; i < list.size; i++) {
    const obj = list.get(i);
    if (obj !== undefined) {
      result.push(obj[property]);
    }
  }
  
  return List.from(result);
}

/**
 * Find unique objects in the list
 * 
 * @param list - The source list (must contain only objects)
 * @param property - Optional property to use for uniqueness check
 * @returns A new list with unique objects
 */
export function unique<T extends object, K extends keyof T>(
  list: IList<T>,
  property?: K
): IList<T> {
  if (list.isEmpty) {
    return List.empty<T>();
  }
  
  if (property) {
    // Use property for uniqueness
    const seen = new Set<any>();
    const result: T[] = [];
    
    for (let i = 0; i < list.size; i++) {
      const obj = list.get(i);
      if (obj !== undefined) {
        const key = obj[property];
        if (!seen.has(key)) {
          seen.add(key);
          result.push(obj);
        }
      }
    }
    
    return List.from(result);
  } else {
    // Use object identity for uniqueness
    const seen = new Set<T>();
    const result: T[] = [];
    
    for (let i = 0; i < list.size; i++) {
      const obj = list.get(i);
      if (obj !== undefined && !seen.has(obj)) {
        seen.add(obj);
        result.push(obj);
      }
    }
    
    return List.from(result);
  }
}
