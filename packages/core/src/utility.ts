/**
 * Basic utility functions
 *
 * This module provides simple utility functions for functional programming.
 *
 * @packageDocumentation
 */

/**
 * The identity function returns its argument unchanged
 *
 * @example
 * ```typescript
 * identity(5); // 5
 * [1, 2, 3].map(identity); // [1, 2, 3]
 * ```
 */
export function identity<T>(value: T): T {
  return value;
}

/**
 * Creates a function that always returns the same value
 *
 * @example
 * ```typescript
 * const alwaysTrue = constant(true);
 * alwaysTrue(); // true
 * alwaysTrue(1, 2, 3); // true
 * ```
 */
export function constant<T>(value: T): (...args: any[]) => T {
  return () => value;
}

/**
 * Creates a function that returns the property at the given key
 *
 * @example
 * ```typescript
 * const getName = prop<{name: string}>('name');
 * getName({name: 'Alice'}); // 'Alice'
 * ```
 */
export function prop<T, K extends keyof T>(key: K): (obj: T) => T[K] {
  return (obj: T) => obj[key];
}

/**
 * Takes a predicate and returns a new predicate that negates the result
 *
 * @example
 * ```typescript
 * const isEven = (n: number) => n % 2 === 0;
 * const isOdd = not(isEven);
 * isOdd(3); // true
 * ```
 */
export function not<T>(predicate: (value: T) => boolean): (value: T) => boolean {
  return (value: T) => !predicate(value);
}

/**
 * Creates a function that applies the predicate to a value and returns true if any match
 *
 * @example
 * ```typescript
 * const isPositive = (n: number) => n > 0;
 * const isEven = (n: number) => n % 2 === 0;
 * const isPositiveOrEven = anyPass([isPositive, isEven]);
 * isPositiveOrEven(2); // true (even)
 * isPositiveOrEven(-3); // false (not positive or even)
 * ```
 */
export function anyPass<T>(predicates: Array<(value: T) => boolean>): (value: T) => boolean {
  return (value: T) => predicates.some(predicate => predicate(value));
}

/**
 * Creates a function that applies all predicates to a value and returns true only if all match
 *
 * @example
 * ```typescript
 * const isPositive = (n: number) => n > 0;
 * const isEven = (n: number) => n % 2 === 0;
 * const isPositiveAndEven = allPass([isPositive, isEven]);
 * isPositiveAndEven(2); // true
 * isPositiveAndEven(3); // false (not even)
 * ```
 */
export function allPass<T>(predicates: Array<(value: T) => boolean>): (value: T) => boolean {
  return (value: T) => predicates.every(predicate => predicate(value));
}

/**
 * Takes a binary function and returns a new function that can be applied to a tuple
 *
 * @example
 * ```typescript
 * const add = (a: number, b: number) => a + b;
 * const addTuple = uncurry(add);
 * addTuple([1, 2]); // 3
 * ```
 */
export function uncurry<A, B, C>(fn: (a: A, b: B) => C): (args: [A, B]) => C {
  return (args: [A, B]) => fn(args[0], args[1]);
}
