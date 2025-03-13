/**
 * Function composition utilities
 * 
 * This module provides utilities for composing functions in a functional programming style.
 * 
 * @packageDocumentation
 */

/**
 * Composes multiple functions from right to left.
 * 
 * @example
 * ```typescript
 * const add1 = (x: number) => x + 1;
 * const multiply2 = (x: number) => x * 2;
 * const add1ThenMultiply2 = compose(multiply2, add1);
 * add1ThenMultiply2(3); // (3 + 1) * 2 = 8
 * ```
 */
export function compose<A, B, C>(
    bc: (b: B) => C,
    ab: (a: A) => B
  ): (a: A) => C;
  export function compose<A, B, C, D>(
    cd: (c: C) => D,
    bc: (b: B) => C,
    ab: (a: A) => B
  ): (a: A) => D;
  export function compose<A, B, C, D, E>(
    de: (d: D) => E,
    cd: (c: C) => D,
    bc: (b: B) => C,
    ab: (a: A) => B
  ): (a: A) => E;
  export function compose<A, B, C, D, E, F>(
    ef: (e: E) => F,
    de: (d: D) => E,
    cd: (c: C) => D,
    bc: (b: B) => C,
    ab: (a: A) => B
  ): (a: A) => F;
  export function compose<T>(
    ...fns: Array<(arg: T) => T>
  ): (arg: T) => T;
  export function compose(
    ...fns: Array<(arg: any) => any>
  ): (arg: any) => any {
    return fns.reduce(
      (prevFn, nextFn) => (value) => prevFn(nextFn(value)),
      (value) => value
    );
  }
  
  /**
   * Pipes a value through a series of functions from left to right.
   * 
   * @example
   * ```typescript
   * const add1 = (x: number) => x + 1;
   * const multiply2 = (x: number) => x * 2;
   * pipe(3, add1, multiply2); // (3 + 1) * 2 = 8
   * ```
   */
  export function pipe<A, B>(a: A, ab: (a: A) => B): B;
  export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
  export function pipe<A, B, C, D>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D
  ): D;
  export function pipe<A, B, C, D, E>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E
  ): E;
  export function pipe<A, B, C, D, E, F>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F
  ): F;
  export function pipe<A>(a: A, ...fns: Array<(a: A) => A>): A;
  export function pipe(arg: any, ...fns: Array<(a: any) => any>): any {
    return fns.reduce((acc, fn) => fn(acc), arg);
}