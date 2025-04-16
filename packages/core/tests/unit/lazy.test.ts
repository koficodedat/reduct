import { describe, it, expect, vi } from 'vitest';
import {
  Lazy,
  LazySequence,
  infiniteSequence,
  rangeSequence,
  lazyFunction
} from './lazy';

describe('Lazy Evaluation', () => {
  describe('Lazy', () => {
    it('should not compute value until get() is called', () => {
      const factory = vi.fn(() => 42);
      const lazy = Lazy.of(factory);

      expect(factory).not.toHaveBeenCalled();
      expect(lazy.isComputed()).toBe(false);

      const value = lazy.get();

      expect(factory).toHaveBeenCalledTimes(1);
      expect(lazy.isComputed()).toBe(true);
      expect(value).toBe(42);
    });

    it('should compute value only once', () => {
      const factory = vi.fn(() => 42);
      const lazy = Lazy.of(factory);

      lazy.get(); // First call
      lazy.get(); // Second call
      lazy.get(); // Third call

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should transform values with map()', () => {
      const factory = vi.fn(() => 10);
      const lazy = Lazy.of(factory);
      const doubled = lazy.map(x => x * 2);

      expect(factory).not.toHaveBeenCalled();

      const value = doubled.get();

      expect(factory).toHaveBeenCalledTimes(1);
      expect(value).toBe(20);
    });

    it('should chain transformations with flatMap()', () => {
      const lazy = Lazy.of(() => 10);
      const result = lazy.flatMap(x => Lazy.of(() => x * 2));

      expect(result.get()).toBe(20);
    });

    it('should apply lazy functions with ap()', () => {
      const value = Lazy.of(() => 10);
      const fn = Lazy.of(() => (x: number) => x * 2);

      const result = value.ap(fn);

      expect(result.get()).toBe(20);
    });

    it('should create pre-computed values with from()', () => {
      const lazy = Lazy.from(42);

      expect(lazy.isComputed()).toBe(true);
      expect(lazy.get()).toBe(42);
    });
  });

  describe('LazySequence', () => {
    it('should create sequences from iterables', () => {
      const array = [1, 2, 3];
      const sequence = LazySequence.from(array);

      expect(sequence.toArray()).toEqual([1, 2, 3]);
    });

    it('should create sequences from multiple values', () => {
      const sequence = LazySequence.of(1, 2, 3);

      expect(sequence.toArray()).toEqual([1, 2, 3]);
    });

    it('should map elements', () => {
      const sequence = LazySequence.from([1, 2, 3]);
      const doubled = sequence.map(x => x * 2);

      expect(doubled.toArray()).toEqual([2, 4, 6]);
    });

    it('should provide index in map callback', () => {
      const sequence = LazySequence.from(['a', 'b', 'c']);
      const result = sequence.map((item, index) => `${item}${index}`);

      expect(result.toArray()).toEqual(['a0', 'b1', 'c2']);
    });

    it('should filter elements', () => {
      const sequence = LazySequence.from([1, 2, 3, 4, 5]);
      const evens = sequence.filter(x => x % 2 === 0);

      expect(evens.toArray()).toEqual([2, 4]);
    });

    it('should provide index in filter callback', () => {
      const sequence = LazySequence.from(['a', 'b', 'c', 'd', 'e']);
      const result = sequence.filter((_, index) => index % 2 === 0);

      expect(result.toArray()).toEqual(['a', 'c', 'e']);
    });

    it('should limit sequence with take()', () => {
      const sequence = LazySequence.from([1, 2, 3, 4, 5]);
      const first3 = sequence.take(3);

      expect(first3.toArray()).toEqual([1, 2, 3]);
    });

    it('should skip elements with skip()', () => {
      const sequence = LazySequence.from([1, 2, 3, 4, 5]);
      const skipFirst2 = sequence.skip(2);

      expect(skipFirst2.toArray()).toEqual([3, 4, 5]);
    });

    it('should flatten nested sequences with flatMap()', () => {
      const sequence = LazySequence.from([1, 2, 3]);
      const result = sequence.flatMap(x => [x, x * 10]);

      expect(result.toArray()).toEqual([1, 10, 2, 20, 3, 30]);
    });

    it('should provide index in flatMap callback', () => {
      const sequence = LazySequence.from(['a', 'b']);
      const result = sequence.flatMap((item, index) => [`${item}${index}`, `${item}${index + 10}`]);

      expect(result.toArray()).toEqual(['a0', 'a10', 'b1', 'b11']);
    });

    it('should zip sequences with zipWith()', () => {
      const sequence1 = LazySequence.from([1, 2, 3]);
      const sequence2 = LazySequence.from(['a', 'b', 'c']);

      const zipped = sequence1.zipWith(sequence2, (a, b) => `${a}${b}`);

      expect(zipped.toArray()).toEqual(['1a', '2b', '3c']);
    });

    it('should stop zipping when either sequence ends', () => {
      const shorter = LazySequence.from([1, 2]);
      const longer = LazySequence.from(['a', 'b', 'c', 'd']);

      const zipped = shorter.zipWith(longer, (a, b) => `${a}${b}`);

      expect(zipped.toArray()).toEqual(['1a', '2b']);
    });

    it('should reduce to a single value', () => {
      const sequence = LazySequence.from([1, 2, 3, 4]);
      const sum = sequence.reduce((acc, x) => acc + x, 0);

      expect(sum).toBe(10);
    });

    it('should provide index in reduce callback', () => {
      const sequence = LazySequence.from(['a', 'b', 'c']);
      const result = sequence.reduce((acc, item, index) => {
        acc[index] = item;
        return acc;
      }, {} as Record<number, string>);

      expect(result).toEqual({ 0: 'a', 1: 'b', 2: 'c' });
    });

    it('should be iterable', () => {
      const sequence = LazySequence.from([1, 2, 3]);
      const result: number[] = [];

      for (const item of sequence) {
        result.push(item);
      }

      expect(result).toEqual([1, 2, 3]);
    });

    it('should chain operations lazily', () => {
      const mockFn = vi.fn((x: number) => x * 2);

      const sequence = LazySequence.from([1, 2, 3, 4, 5, 6])
        .filter(x => x % 2 === 0) // [2, 4, 6]
        .map(mockFn)              // [4, 8, 12]
        .take(2);                 // [4, 8]

      // No computations performed yet
      expect(mockFn).not.toHaveBeenCalled();

      const result = sequence.toArray();

      // Only compute what's needed after take(2)
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result).toEqual([4, 8]);
    });
  });

  describe('infiniteSequence', () => {
    it('should create an infinite sequence', () => {
      const numbers = infiniteSequence(i => i);
      const first5 = numbers.take(5).toArray();

      expect(first5).toEqual([0, 1, 2, 3, 4]);
    });

    it('should allow complex generation logic', () => {
      // Fibonacci sequence
      let prev = 0;
      let current = 1;

      const fibonacci = infiniteSequence(() => {
        const next = prev + current;
        prev = current;
        current = next;
        return prev;
      });

      const first8 = fibonacci.take(8).toArray();

      expect(first8).toEqual([1, 1, 2, 3, 5, 8, 13, 21]);
    });
  });

  describe('rangeSequence', () => {
    it('should create sequences with specified ranges', () => {
      const range1 = rangeSequence(1, 6).toArray();
      expect(range1).toEqual([1, 2, 3, 4, 5]);

      const range2 = rangeSequence(5, 1, -1).toArray();
      expect(range2).toEqual([5, 4, 3, 2]);
    });

    it('should allow custom step values', () => {
      const evenNumbers = rangeSequence(0, 10, 2).toArray();
      expect(evenNumbers).toEqual([0, 2, 4, 6, 8]);

      const countdown = rangeSequence(10, 0, -2).toArray();
      expect(countdown).toEqual([10, 8, 6, 4, 2]);
    });

    it('should throw error when step is zero', () => {
      expect(() => rangeSequence(1, 10, 0)).toThrow();
    });
  });

  describe('lazyFunction', () => {
    it('should create a function that returns lazy values', () => {
      const expensiveFn = vi.fn((x: number) => x * 2);
      const lazyFn = lazyFunction(expensiveFn);

      const result = lazyFn(5);

      // Function not called yet
      expect(expensiveFn).not.toHaveBeenCalled();

      // Value computed when needed
      expect(result.get()).toBe(10);
      expect(expensiveFn).toHaveBeenCalledTimes(1);
      expect(expensiveFn).toHaveBeenCalledWith(5);
    });

    it('should cache computed values', () => {
      const expensiveFn = vi.fn((x: number) => x * 2);
      const lazyFn = lazyFunction(expensiveFn);

      const result = lazyFn(5);

      result.get(); // First call
      result.get(); // Second call

      expect(expensiveFn).toHaveBeenCalledTimes(1);
    });
  });
});
