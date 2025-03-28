/**
 * Linear Search implementation
 *
 * A functional implementation of the linear search algorithm.
 *
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 *
 * @packageDocumentation
 */

import { Option, some, none } from '@reduct/core';
import { List } from '@reduct/data-structures';

/**
 * Searches for an element in an array using linear search.
 *
 * @param items - The array to search in
 * @param target - The element to find
 * @param compareFn - Optional function to determine equality
 * @returns The index of the element if found, or -1 if not found
 *
 * @example
 * ```typescript
 * linearSearch([1, 2, 3, 4, 5], 3); // 2
 * ```
 */
export function linearSearch<T>(
  items: readonly T[],
  target: T,
  compareFn: (a: T, b: T) => boolean = (a, b) => a === b,
): number {
  for (let i = 0; i < items.length; i++) {
    if (compareFn(items[i], target)) {
      return i;
    }
  }

  return -1;
}

/**
 * Searches for all occurrences of an element in an array.
 *
 * @param items - The array to search in
 * @param target - The element to find
 * @param compareFn - Optional function to determine equality
 * @returns An array of all indices where the element appears
 *
 * @example
 * ```typescript
 * findAll([1, 2, 3, 2, 4], 2); // [1, 3]
 * ```
 */
export function findAll<T>(
  items: readonly T[],
  target: T,
  compareFn: (a: T, b: T) => boolean = (a, b) => a === b,
): number[] {
  const indices: number[] = [];

  for (let i = 0; i < items.length; i++) {
    if (compareFn(items[i], target)) {
      indices.push(i);
    }
  }

  return indices;
}

/**
 * Searches for an element in a List using linear search.
 *
 * @param list - The List to search in
 * @param target - The element to find
 * @param compareFn - Optional function to determine equality
 * @returns An Option containing the index if found, or None if not found
 *
 * @example
 * ```typescript
 * const list = List.of(1, 2, 3, 4, 5);
 * linearSearchList(list, 3); // Some(2)
 * ```
 */
export function linearSearchList<T>(
  list: List<T>,
  target: T,
  compareFn: (a: T, b: T) => boolean = (a, b) => a === b,
): Option<number> {
  const index = linearSearch(list.toArray(), target, compareFn);
  return index >= 0 ? some(index) : none;
}

/**
 * Finds the first element in an array that satisfies a predicate.
 *
 * @param items - The array to search in
 * @param predicate - Function to test elements
 * @returns The index of the first matching element, or -1 if none match
 *
 * @example
 * ```typescript
 * findIndex([1, 2, 3, 4], x => x > 2); // 2
 * ```
 */
export function findIndex<T>(
  items: readonly T[],
  predicate: (item: T, index: number) => boolean,
): number {
  for (let i = 0; i < items.length; i++) {
    if (predicate(items[i], i)) {
      return i;
    }
  }

  return -1;
}

/**
 * Finds the first element in a List that satisfies a predicate.
 *
 * @param list - The List to search in
 * @param predicate - Function to test elements
 * @returns An Option containing the index if found, or None if not found
 *
 * @example
 * ```typescript
 * const list = List.of(1, 2, 3, 4);
 * findIndexList(list, x => x > 2); // Some(2)
 * ```
 */
export function findIndexList<T>(
  list: List<T>,
  predicate: (item: T, index: number) => boolean,
): Option<number> {
  const index = findIndex(list.toArray(), predicate);
  return index >= 0 ? some(index) : none;
}
