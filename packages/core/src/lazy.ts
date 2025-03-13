/**
 * Lazy evaluation mechanisms
 *
 * This module provides utilities for delaying computation until needed,
 * which can improve performance for expensive operations.
 *
 * @packageDocumentation
 */

/**
 * Represents a value that will be computed on demand
 */
export class Lazy<T> {
  private value: T | undefined;
  private computed = false;

  /**
   * Creates a new lazy value
   *
   * @param factory - Function that produces the value when needed
   */
  constructor(private readonly factory: () => T) {}

  /**
   * Force computation and return the value
   */
  get(): T {
    if (!this.computed) {
      this.value = this.factory();
      this.computed = true;
    }

    return this.value as T;
  }

  /**
   * Check if the value has been computed
   */
  isComputed(): boolean {
    return this.computed;
  }

  /**
   * Transform the lazy value with a mapping function
   *
   * @param fn - Function to transform the value
   * @returns A new lazy value
   */
  map<U>(fn: (value: T) => U): Lazy<U> {
    return Lazy.of(() => fn(this.get()));
  }

  /**
   * Apply a lazy function to a lazy value
   *
   * @param lazyFn - Lazy function to apply
   * @returns A new lazy value
   */
  ap<U>(lazyFn: Lazy<(value: T) => U>): Lazy<U> {
    return Lazy.of(() => lazyFn.get()(this.get()));
  }

  /**
   * Chain operations on lazy values
   *
   * @param fn - Function that returns a new lazy value
   * @returns A new lazy value
   */
  flatMap<U>(fn: (value: T) => Lazy<U>): Lazy<U> {
    return Lazy.of(() => fn(this.get()).get());
  }

  /**
   * Creates a new lazy value
   *
   * @param factory - Function that produces the value when needed
   * @returns A new lazy value
   */
  static of<T>(factory: () => T): Lazy<T> {
    return new Lazy<T>(factory);
  }

  /**
   * Creates a lazy value that's already computed
   *
   * @param value - The eagerly computed value
   * @returns A new lazy value
   */
  static from<T>(value: T): Lazy<T> {
    const lazy = new Lazy<T>(() => value);
    lazy.value = value;
    lazy.computed = true;
    return lazy;
  }
}

/**
 * Creates a lazy sequence that computes elements on demand
 */
export class LazySequence<T> {
  /**
   * @internal
   */
  private readonly source: Iterable<T>;

  /**
   * @internal
   */
  constructor(source: Iterable<T>) {
    this.source = source;
  }

  /**
   * Creates a new lazy sequence from an iterable
   *
   * @param source - The source iterable
   * @returns A new lazy sequence
   */
  static from<T>(source: Iterable<T>): LazySequence<T> {
    return new LazySequence<T>(source);
  }

  /**
   * Creates a new lazy sequence from multiple values
   *
   * @param items - Values to include in the sequence
   * @returns A new lazy sequence
   */
  static of<T>(...items: T[]): LazySequence<T> {
    return new LazySequence<T>(items);
  }

  /**
   * Transforms each element in the sequence
   *
   * @param fn - Mapping function
   * @returns A new lazy sequence with transformed elements
   */
  map<U>(fn: (item: T, index: number) => U): LazySequence<U> {
    const self = this;

    function* generator(): Generator<U> {
      let index = 0;
      for (const item of self.source) {
        yield fn(item, index++);
      }
    }

    return new LazySequence<U>(generator());
  }

  /**
   * Filters elements in the sequence
   *
   * @param predicate - Filter function
   * @returns A new lazy sequence with filtered elements
   */
  filter(predicate: (item: T, index: number) => boolean): LazySequence<T> {
    const self = this;

    function* generator(): Generator<T> {
      let index = 0;
      for (const item of self.source) {
        if (predicate(item, index++)) {
          yield item;
        }
      }
    }

    return new LazySequence<T>(generator());
  }

  /**
   * Limits the sequence to a specific number of elements
   *
   * @param count - Maximum number of elements
   * @returns A new limited lazy sequence
   */
  take(count: number): LazySequence<T> {
    const self = this;

    function* generator(): Generator<T> {
      if (count <= 0) return;

      let i = 0;
      for (const item of self.source) {
        yield item;
        i++;
        if (i >= count) break;
      }
    }

    return new LazySequence<T>(generator());
  }

  /**
   * Skips a specific number of elements in the sequence
   *
   * @param count - Number of elements to skip
   * @returns A new lazy sequence starting after the skipped elements
   */
  skip(count: number): LazySequence<T> {
    const self = this;

    function* generator(): Generator<T> {
      let i = 0;
      for (const item of self.source) {
        if (i >= count) {
          yield item;
        }
        i++;
      }
    }

    return new LazySequence<T>(generator());
  }

  /**
   * Applies a function to each element and flattens the results
   *
   * @param fn - Function that returns an iterable
   * @returns A new flattened lazy sequence
   */
  flatMap<U>(fn: (item: T, index: number) => Iterable<U>): LazySequence<U> {
    const self = this;

    function* generator(): Generator<U> {
      let index = 0;
      for (const item of self.source) {
        const nestedItems = fn(item, index++);
        for (const nestedItem of nestedItems) {
          yield nestedItem;
        }
      }
    }

    return new LazySequence<U>(generator());
  }

  /**
   * Combines this sequence with another using a zipper function
   *
   * @param other - The other sequence
   * @param fn - Function to combine elements
   * @returns A new zipped lazy sequence
   */
  zipWith<U, R>(other: Iterable<U>, fn: (a: T, b: U) => R): LazySequence<R> {
    const self = this;

    function* generator(): Generator<R> {
      const iteratorA = self.source[Symbol.iterator]();
      const iteratorB = other[Symbol.iterator]();

      while (true) {
        const resultA = iteratorA.next();
        const resultB = iteratorB.next();

        if (resultA.done || resultB.done) break;

        yield fn(resultA.value, resultB.value);
      }
    }

    return new LazySequence<R>(generator());
  }

  /**
   * Eagerly executes a function for each item in the sequence
   *
   * @param fn - Function to execute for each item
   */
  forEach(fn: (item: T, index: number) => void): void {
    let index = 0;
    for (const item of this.source) {
      fn(item, index++);
    }
  }

  /**
   * Eagerly evaluates the sequence and collects the results in an array
   *
   * @returns An array with all elements
   */
  toArray(): T[] {
    const result: T[] = [];
    for (const item of this.source) {
      result.push(item);
    }
    return result;
  }

  /**
   * Reduces the sequence to a single value
   *
   * @param fn - Reducer function
   * @param initialValue - Initial accumulator value
   * @returns The final accumulator value
   */
  reduce<U>(fn: (accumulator: U, item: T, index: number) => U, initialValue: U): U {
    let result = initialValue;
    let index = 0;

    for (const item of this.source) {
      result = fn(result, item, index++);
    }

    return result;
  }

  /**
   * Returns an iterator for the sequence
   */
  [Symbol.iterator](): Iterator<T> {
    return this.source[Symbol.iterator]();
  }
}

/**
 * Creates an infinite sequence of values
 *
 * @param generator - Function that produces values for the sequence
 * @returns A lazy infinite sequence
 *
 * @example
 * ```typescript
 * // Infinite sequence of incrementing numbers
 * const numbers = infiniteSequence(i => i);
 * const first10 = numbers.take(10).toArray(); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
 * ```
 */
export function infiniteSequence<T>(generator: (index: number) => T): LazySequence<T> {
  function* infiniteGenerator(): Generator<T> {
    let i = 0;
    while (true) {
      yield generator(i++);
    }
  }

  return new LazySequence<T>(infiniteGenerator());
}

/**
 * Creates a sequence from a range of numbers
 *
 * @param start - Start of the range (inclusive)
 * @param end - End of the range (exclusive)
 * @param step - Increment between values
 * @returns A lazy sequence of numbers
 *
 * @example
 * ```typescript
 * const range = rangeSequence(1, 10); // Sequence of [1, 2, 3, 4, 5, 6, 7, 8, 9]
 * const evenNumbers = rangeSequence(0, 10, 2); // Sequence of [0, 2, 4, 6, 8]
 * ```
 */
export function rangeSequence(start: number, end: number, step: number = 1): LazySequence<number> {
  if (step === 0) {
    throw new Error('Step cannot be zero');
  }

  function* rangeGenerator(): Generator<number> {
    if (step > 0) {
      for (let i = start; i < end; i += step) {
        yield i;
      }
    } else {
      for (let i = start; i > end; i += step) {
        yield i;
      }
    }
  }

  return new LazySequence<number>(rangeGenerator());
}

/**
 * Creates a cached version of an expensive function
 *
 * Unlike memoize, this delays computation until needed.
 *
 * @param fn - Function to lazily compute
 * @returns A function that returns a lazy value
 *
 * @example
 * ```typescript
 * const expensiveOperation = lazyFunction(() => computeExpensiveResult());
 *
 * // Computation not performed yet
 * const result = expensiveOperation();
 *
 * // Computation performed here
 * console.log(result.get());
 * ```
 */
export function lazyFunction<Args extends any[], R>(
  fn: (...args: Args) => R,
): (...args: Args) => Lazy<R> {
  return (...args: Args) => Lazy.of(() => fn(...args));
}
