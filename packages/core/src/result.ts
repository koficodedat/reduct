/**
 * Result type for error handling
 *
 * This module provides a Result (Either) monad for functional error handling.
 *
 * @packageDocumentation
 */

/**
 * Result type representing a successful result or an error
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Ok class representing a successful result
 */
export class Ok<T> {
  readonly _tag: 'Ok' = 'Ok';

  constructor(private readonly value: T) {}

  /**
   * Returns the contained value
   */
  get(): T {
    return this.value;
  }

  /**
   * Returns the contained value or a default if the result is Err
   */
  getOrElse(_default: T): T {
    return this.value;
  }

  /**
   * Maps the contained value using the provided function
   */
  map<U>(f: (value: T) => U): Result<U, never> {
    return ok(f(this.value));
  }

  /**
   * Maps the error value (no-op for Ok)
   */
  mapErr<F>(_f: (error: never) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  /**
   * Applies a function to the contained value and flattens the result
   */
  flatMap<U, F>(f: (value: T) => Result<U, F>): Result<U, F> {
    return f(this.value);
  }

  /**
   * Returns whether the result is Ok
   */
  isOk(): this is Ok<T> {
    return true;
  }

  /**
   * Returns whether the result is Err
   */
  isErr(): boolean {
    return false;
  }

  /**
   * Executes a side effect if result is Ok
   */
  forEach(f: (value: T) => void): void {
    f(this.value);
  }
}

/**
 * Err class representing an error result
 */
export class Err<E> {
  readonly _tag: 'Err' = 'Err';

  constructor(private readonly error: E) {}

  /**
   * Throws the contained error
   */
  get(): never {
    throw this.error;
  }

  /**
   * Returns the default value
   */
  getOrElse<T>(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Returns Err since there is no value to map
   */
  map<U>(_f: (value: never) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  /**
   * Maps the error value using the provided function
   */
  mapErr<F>(f: (error: E) => F): Result<never, F> {
    return err(f(this.error));
  }

  /**
   * Returns Err since there is no value to flatMap
   */
  flatMap<U, F>(_f: (value: never) => Result<U, F>): Result<U, E | F> {
    return this as unknown as Result<U, E | F>;
  }

  /**
   * Returns whether the result is Ok
   */
  isOk(): boolean {
    return false;
  }

  /**
   * Returns whether the result is Err
   */
  isErr(): this is Err<E> {
    return true;
  }

  /**
   * Returns the contained error
   */
  getErr(): E {
    return this.error;
  }

  /**
   * Does nothing since there is no value
   */
  forEach(_f: (value: never) => void): void {
    // No operation
  }
}

/**
 * Creates an Ok result with the given value
 */
export function ok<T>(value: T): Result<T, never> {
  return new Ok(value);
}

/**
 * Creates an Err result with the given error
 */
export function err<E>(error: E): Result<never, E> {
  return new Err(error);
}

/**
 * Attempts to execute the function, catching any thrown errors
 *
 * @example
 * ```typescript
 * const result = tryCatch(
 *   () => JSON.parse(jsonString),
 *   (e) => `Failed to parse JSON: ${e.message}`
 * );
 * ```
 */
export function tryCatch<T, E>(
  f: () => T,
  onError: (error: unknown) => E
): Result<T, E> {
  try {
    return ok(f());
  } catch (error) {
    return err(onError(error));
  }
}
