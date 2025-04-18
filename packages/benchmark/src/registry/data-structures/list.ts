/**
 * List registry
 *
 * Registers List implementations for benchmarking.
 *
 * @packageDocumentation
 */

import { List } from '@reduct/data-structures';
import { Registry, Implementation } from '../types';
import { generateRandomArray } from '../../utils';

/**
 * Reduct List implementation
 */
const reductList: Implementation<any> = {
  name: 'List',
  description: 'Immutable List implementation with size-based adaptation',
  category: 'data-structure',
  type: 'list',
  create: (size) => {
    // Create a List with random elements
    return List.from(generateRandomArray(size));
  },
  operations: {
    get: (list, index) => list.get(index),
    map: (list, fn) => list.map(fn),
    filter: (list, fn) => list.filter(fn),
    reduce: (list, fn, initial) => list.reduce(fn, initial),
    append: (list, value) => list.append(value),
    prepend: (list, value) => list.prepend(value),
    concat: (list, other) => list.concat(other),
    toArray: (list) => list.toArray(),
    size: (list) => list.size,
    isEmpty: (list) => list.isEmpty,
  },
};

/**
 * Native Array implementation
 */
const nativeArray: Implementation<number[]> = {
  name: 'Native Array',
  description: 'JavaScript native Array',
  category: 'data-structure',
  type: 'list',
  create: (size) => generateRandomArray(size),
  operations: {
    get: (arr, index) => arr[index],
    map: (arr, fn) => arr.map(fn),
    filter: (arr, fn) => arr.filter(fn),
    reduce: (arr, fn, initial) => arr.reduce(fn, initial),
    append: (arr, value) => [...arr, value],
    prepend: (arr, value) => [value, ...arr],
    concat: (arr, other) => arr.concat(other),
    toArray: (arr) => [...arr],
    size: (arr) => arr.length,
    isEmpty: (arr) => arr.length === 0,
  },
};

/**
 * List registry
 */
export const listRegistry: Registry = {
  'reduct-list': reductList,
  'native-array': nativeArray,
};
