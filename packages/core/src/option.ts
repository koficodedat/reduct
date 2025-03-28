/**
 * Option type for handling nullable values
 *
 * This module provides an Option (Maybe) monad for safe handling of potentially undefined or null values.
 *
 * @packageDocumentation
 */

/**
 * Option type representing a value that may or may not be present
 */
export type Option<T> = Some<T> | None;

/**
 * Some class representing a present value
 */
export class Some<T> {
  readonly _tag = 'Some' as const;

  constructor(private readonly value: T) {}

  /**
   * Returns the contained value
   */
  get(): T {
    return this.value;
  }

  /**
   * Maps the contained value using the provided function
   */
  map<U>(f: (value: T) => U): Option<U> {
    return some(f(this.value));
  }

  /**
   * Returns the contained value or a default if the value is None
   */
  getOrElse(_default: T): T {
    return this.value;
  }

  /**
   * Applies a function to the contained value and flattens the result
   */
  flatMap<U>(f: (value: T) => Option<U>): Option<U> {
    return f(this.value);
  }

  /**
   * Returns whether the option contains a value
   */
  isSome(): this is Some<T> {
    return true;
  }

  /**
   * Returns whether the option does not contain a value
   */
  isNone(): boolean {
    return false;
  }

  /**
   * Executes a side effect if a value is present
   */
  forEach(f: (value: T) => void): void {
    f(this.value);
  }

  /**
   * Returns a new Option containing the value if the predicate returns true
   */
  filter(predicate: (value: T) => boolean): Option<T> {
    return predicate(this.value) ? this : none;
  }
}

/**
 * None class representing an absent value
 */
export class None {
  readonly _tag = 'None' as const;

  /**
   * Throws an error because there is no value to return
   */
  get(): never {
    throw new Error('Cannot extract value from None');
  }

  /**
   * Returns None since there is no value to map
   */
  map<U>(_f: (value: never) => U): Option<U> {
    return none;
  }

  /**
   * Returns the default value
   */
  getOrElse<T>(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Returns None since there is no value to flatMap
   */
  flatMap<U>(_f: (value: never) => Option<U>): Option<U> {
    return none;
  }

  /**
   * Returns whether the option contains a value
   */
  isSome(): boolean {
    return false;
  }

  /**
   * Returns whether the option does not contain a value
   */
  isNone(): this is None {
    return true;
  }

  /**
   * Does nothing since there is no value
   */
  forEach(_f: (value: never) => void): void {
    // No operation
  }

  /**
   * Returns None since there is no value to filter
   */
  filter<T>(_predicate: (value: T) => boolean): Option<T> {
    return none;
  }
}

/**
 * Singleton instance of None
 */
export const none: None = new None();

/**
 * Creates a Some containing the given value
 */
export function some<T>(value: T): Option<T> {
  return new Some(value);
}

/**
 * Creates an Option from a nullable value
 *
 * @example
 * ```typescript
 * const maybeString = fromNullable(possiblyNullString);
 * const length = maybeString.map(s => s.length).getOrElse(0);
 * ```
 */
export function fromNullable<T>(value: T | null | undefined): Option<T> {
  return value === null || value === undefined ? none : some(value);
}
