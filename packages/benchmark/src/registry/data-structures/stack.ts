/**
 * Stack registry
 *
 * Registers Stack implementations for benchmarking.
 *
 * @packageDocumentation
 */

import { Stack } from '@reduct/data-structures';
import { Registry, Implementation } from '../types';
import { generateRandomArray } from '../../utils';

/**
 * Reduct Stack implementation
 */
const reductStack: Implementation<Stack<number>> = {
  name: 'Reduct Stack',
  description: 'Immutable Stack implementation from @reduct/data-structures',
  category: 'data-structure',
  type: 'stack',
  create: (size) => Stack.from(generateRandomArray(size)),
  operations: {
    peek: (stack) => stack.peek(),
    push: (stack, value) => stack.push(value),
    pop: (stack) => stack.pop(),
    map: (stack, fn) => stack.map(fn),
    filter: (stack, fn) => stack.filter(fn),
    toArray: (stack) => stack.toArray(),
    size: (stack) => stack.size,
    isEmpty: (stack) => stack.isEmpty,
  },
};

/**
 * Native Array as Stack implementation
 */
const nativeArrayStack: Implementation<number[]> = {
  name: 'Native Array Stack',
  description: 'JavaScript native Array used as a stack',
  category: 'data-structure',
  type: 'stack',
  create: (size) => generateRandomArray(size),
  operations: {
    peek: (arr) => arr[arr.length - 1],
    push: (arr, value) => [...arr, value],
    pop: (arr) => arr.slice(0, -1),
    map: (arr, fn) => arr.map(fn),
    filter: (arr, fn) => arr.filter(fn),
    toArray: (arr) => [...arr],
    size: (arr) => arr.length,
    isEmpty: (arr) => arr.length === 0,
  },
};

/**
 * Stack registry
 */
export const stackRegistry: Registry = {
  'reduct-stack': reductStack,
  'native-array-stack': nativeArrayStack,
};
