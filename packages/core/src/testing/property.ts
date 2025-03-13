/**
 * Property-based testing utilities for Reduct
 *
 * This module provides helpers for generating arbitrary data and
 * verifying properties of functions and data structures.
 *
 * @packageDocumentation
 */

import * as fc from 'fast-check';

/**
 * Options for property-based tests
 */
export interface PropertyOptions {
  /** Number of test runs */
  numRuns?: number;
  /** Random number generator seed */
  seed?: number;
  /** Path to replay a specific test scenario */
  path?: string;
}

/**
 * Default property test options
 */
const defaultOptions: PropertyOptions = {
  numRuns: 100,
  seed: undefined,
  path: undefined,
};

/**
 * Verifies a property with given arbitrary generators
 *
 * @param name - Description of the property
 * @param arbitraries - Arbitrary generators for test inputs
 * @param predicate - Function that should hold true for all generated inputs
 * @param options - Test configuration options
 *
 * @example
 * ```typescript
 * verifyProperty(
 *   'sort should return a sorted array',
 *   [fc.array(fc.integer())],
 *   (input) => {
 *     const sorted = quickSort(input);
 *     return isSorted(sorted);
 *   }
 * );
 * ```
 */
export function verifyProperty<Ts extends any[]>(
  name: string,
  arbitraries: fc.Arbitrary<any>[],
  predicate: (...args: any[]) => boolean | void,
  options: PropertyOptions = {},
): void {
  const opts = { ...defaultOptions, ...options };

  const fcOptions: fc.Parameters<any> = {
    numRuns: opts.numRuns,
  };

  if (opts.seed !== undefined) {
    fcOptions.seed = opts.seed;
  }

  if (opts.path !== undefined) {
    fcOptions.path = opts.path;
  }

  fc.assert(fc.property(...arbitraries, predicate), fcOptions);
}

/**
 * Verifies an asynchronous property with given arbitrary generators
 *
 * @param name - Description of the property
 * @param arbitraries - Arbitrary generators for test inputs
 * @param predicate - Async function that should hold true for all generated inputs
 * @param options - Test configuration options
 */
export async function verifyAsyncProperty<Ts extends any[]>(
  name: string,
  arbitraries: fc.Arbitrary<any>[],
  predicate: (...args: any[]) => Promise<boolean | void>,
  options: PropertyOptions = {},
): Promise<void> {
  const opts = { ...defaultOptions, ...options };

  const fcOptions: fc.Parameters<any> = {
    numRuns: opts.numRuns,
  };

  if (opts.seed !== undefined) {
    fcOptions.seed = opts.seed;
  }

  if (opts.path !== undefined) {
    fcOptions.path = opts.path;
  }

  await fc.assert(fc.asyncProperty(...arbitraries, predicate), fcOptions);
}

/**
 * Generates an arbitrary (random) instance of a type
 */
export const arbitrary = {
  /**
   * Generates a boolean value
   */
  boolean: fc.boolean,

  /**
   * Generates an integer in the given range (inclusive)
   */
  integer: (min = -100, max = 100) => fc.integer({ min, max }),

  /**
   * Generates a floating-point number in the given range (inclusive)
   */
  float: (min = -100, max = 100) => fc.float({ min, max }),

  /**
   * Generates a string with configurable options
   */
  string: (options?: fc.StringSharedConstraints) => fc.string(options),

  /**
   * Generates an array of values using the provided arbitrary
   */
  array: <T>(arbitrary: fc.Arbitrary<T>, options?: fc.ArrayConstraints) =>
    fc.array(arbitrary, options),

  /**
   * Generates a tuple of values using the provided arbitraries
   */
  tuple: <Ts extends any[]>(...arbitraries: fc.Arbitrary<any>[]) =>
    fc.tuple(...arbitraries) as fc.Arbitrary<Ts>,

  /**
   * Generates a record with the specified schema
   */
  record: <T>(schema: { [K in keyof T]: fc.Arbitrary<T[K]> }) =>
    fc.record(schema) as fc.Arbitrary<T>,

  /**
   * Generates a constant value
   */
  constant: <T>(value: T) => fc.constant(value),

  /**
   * Chooses randomly among provided arbitraries
   */
  oneof: <T>(...arbitraries: fc.Arbitrary<T>[]) => fc.oneof(...arbitraries),
};

/**
 * Common property checks for functions and data structures
 */
export const properties = {
  /**
   * Verifies that a function's output is deterministic (same input -> same output)
   */
  deterministic: <T, R>(fn: (input: T) => R, inputArb: fc.Arbitrary<T>) => {
    return verifyProperty('function should be deterministic', [inputArb], input => {
      const result1 = fn(input);
      const result2 = fn(input);
      return JSON.stringify(result1) === JSON.stringify(result2);
    });
  },

  /**
   * Verifies that a function obeys an identity law (fn(identity) === identity)
   */
  identity: <T>(fn: (input: T) => T, identityValue: T, inputArb: fc.Arbitrary<T>) => {
    return verifyProperty('function should preserve identity', [inputArb], input => {
      const result = fn(identityValue);
      return JSON.stringify(result) === JSON.stringify(identityValue);
    });
  },

  /**
   * Verifies that a function obeys associativity: fn(a, fn(b, c)) === fn(fn(a, b), c)
   */
  associative: <T>(fn: (a: T, b: T) => T, inputArb: fc.Arbitrary<T>) => {
    return verifyProperty(
      'function should be associative',
      [inputArb, inputArb, inputArb],
      (a, b, c) => {
        const left = fn(a, fn(b, c));
        const right = fn(fn(a, b), c);
        return JSON.stringify(left) === JSON.stringify(right);
      },
    );
  },

  /**
   * Verifies that a function obeys commutativity: fn(a, b) === fn(b, a)
   */
  commutative: <T>(fn: (a: T, b: T) => T, inputArb: fc.Arbitrary<T>) => {
    return verifyProperty('function should be commutative', [inputArb, inputArb], (a, b) => {
      const left = fn(a, b);
      const right = fn(b, a);
      return JSON.stringify(left) === JSON.stringify(right);
    });
  },

  /**
   * Verifies that a sort function produces sorted output
   */
  sortCorrectness: <T>(
    sortFn: (arr: readonly T[]) => T[],
    inputArb: fc.Arbitrary<T[]>,
    compareFn: (a: T, b: T) => number = (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  ) => {
    return verifyProperty('sort should produce sorted output', [inputArb], input => {
      const result = sortFn(input);

      // Check length is preserved
      if (result.length !== input.length) return false;

      // Check result is sorted
      for (let i = 1; i < result.length; i++) {
        if (compareFn(result[i - 1], result[i]) > 0) return false;
      }

      // Check all original elements are present (permutation check)
      const inputSorted = [...input].sort(compareFn);
      const resultSorted = [...result].sort(compareFn);
      return JSON.stringify(inputSorted) === JSON.stringify(resultSorted);
    });
  },

  /**
   * Verifies that a search function finds elements that exist in the input
   */
  searchCorrectness: <T>(
    searchFn: (arr: readonly T[], target: T) => number,
    inputArb: fc.Arbitrary<T[]>,
    elementArb: fc.Arbitrary<T>,
  ) => {
    return verifyProperty('search should find existing elements', [inputArb], input => {
      if (input.length === 0) return true;

      // Pick a random element from the input
      const randomIndex = Math.floor(Math.random() * input.length);
      const target = input[randomIndex];

      const foundIndex = searchFn(input, target);

      // Element should be found
      if (foundIndex === -1) return false;

      // Index should be valid
      if (foundIndex < 0 || foundIndex >= input.length) return false;

      // Element at the found index should match the target
      return JSON.stringify(input[foundIndex]) === JSON.stringify(target);
    });
  },

  /**
   * Verifies that a search function returns -1 for elements not in the input
   */
  searchNotFound: <T>(
    searchFn: (arr: readonly T[], target: T) => number,
    inputArb: fc.Arbitrary<T[]>,
    elementArb: fc.Arbitrary<T>,
  ) => {
    return verifyProperty(
      'search should return -1 for non-existing elements',
      [inputArb, elementArb],
      (input, target) => {
        // Only test if target is not in the input
        if (input.some(item => JSON.stringify(item) === JSON.stringify(target))) {
          return true;
        }

        const foundIndex = searchFn(input, target);
        return foundIndex === -1;
      },
    );
  },
};

/**
 * Export fast-check directly for advanced usage
 */
export { fc };
