/**
 * Currying and partial application utilities
 *
 * This module provides functions to transform multi-argument functions into
 * a sequence of functions that each take a single argument.
 *
 * @packageDocumentation
 */

/**
 * Curries a function of 2 arguments
 *
 * @example
 * ```typescript
 * const add = curry2((a: number, b: number) => a + b);
 * const add5 = add(5);
 * add5(3); // 8
 * ```
 */
export function curry2<A, B, C>(f: (a: A, b: B) => C): (a: A) => (b: B) => C {
  return (a: A) => (b: B) => f(a, b);
}

/**
 * Curries a function of 3 arguments
 *
 * @example
 * ```typescript
 * const addMultiply = curry3((a: number, b: number, c: number) => (a + b) * c);
 * const add5AndMultiply = addMultiply(5);
 * const add5And3ThenMultiply = add5AndMultiply(3);
 * add5And3ThenMultiply(2); // (5 + 3) * 2 = 16
 * ```
 */
export function curry3<A, B, C, D>(
  f: (a: A, b: B, c: C) => D
): (a: A) => (b: B) => (c: C) => D {
  return (a: A) => (b: B) => (c: C) => f(a, b, c);
}

/**
 * Curries a function of 4 arguments
 */
export function curry4<A, B, C, D, E>(
  f: (a: A, b: B, c: C, d: D) => E
): (a: A) => (b: B) => (c: C) => (d: D) => E {
  return (a: A) => (b: B) => (c: C) => (d: D) => f(a, b, c, d);
}

/**
 * Partially applies a function by providing some of its arguments
 *
 * @example
 * ```typescript
 * const greet = (greeting: string, name: string) => `${greeting}, ${name}!`;
 * const sayHello = partial(greet, "Hello");
 * sayHello("World"); // "Hello, World!"
 * ```
 */
export function partial<T1, T2, R>(
  fn: (arg1: T1, arg2: T2) => R,
  arg1: T1
): (arg2: T2) => R {
  return (arg2: T2) => fn(arg1, arg2);
}

/**
 * Partially applies a function of 3 arguments
 */
export function partial3<T1, T2, T3, R>(
  fn: (arg1: T1, arg2: T2, arg3: T3) => R,
  arg1: T1
): (arg2: T2, arg3: T3) => R {
  return (arg2: T2, arg3: T3) => fn(arg1, arg2, arg3);
}

/**
 * Flips the order of the first two arguments of a function
 *
 * @example
 * ```typescript
 * const divide = (a: number, b: number) => a / b;
 * const flippedDivide = flip(divide);
 * divide(10, 2); // 5
 * flippedDivide(10, 2); // 0.2 (equivalent to divide(2, 10))
 * ```
 */
export function flip<A, B, C>(fn: (a: A, b: B) => C): (b: B, a: A) => C {
  return (b: B, a: A) => fn(a, b);
}
