import { describe, it, expect } from 'vitest';
import { curry2, curry3, curry4, partial, partial3, flip } from './curry';

describe('Currying and Partial Application', () => {
  describe('curry2', () => {
    it('should curry a function of 2 arguments', () => {
      const add = (a: number, b: number) => a + b;
      const curriedAdd = curry2(add);

      expect(curriedAdd(2)(3)).toBe(5);

      const add5 = curriedAdd(5);
      expect(add5(10)).toBe(15);
    });

    it('should work with different argument types', () => {
      const concat = (a: string, b: number) => a + b;
      const curriedConcat = curry2(concat);

      expect(curriedConcat('value: ')(42)).toBe('value: 42');
    });
  });

  describe('curry3', () => {
    it('should curry a function of 3 arguments', () => {
      const addMultiply = (a: number, b: number, c: number) => (a + b) * c;
      const curriedAddMultiply = curry3(addMultiply);

      expect(curriedAddMultiply(2)(3)(4)).toBe(20); // (2 + 3) * 4

      const add2AndMultiply = curriedAddMultiply(2);
      const add2And3ThenMultiply = add2AndMultiply(3);
      expect(add2And3ThenMultiply(5)).toBe(25); // (2 + 3) * 5
    });
  });

  describe('curry4', () => {
    it('should curry a function of 4 arguments', () => {
      const complexCalc = (a: number, b: number, c: number, d: number) => (a + b) * (c + d);
      const curriedCalc = curry4(complexCalc);

      expect(curriedCalc(1)(2)(3)(4)).toBe(21); // (1 + 2) * (3 + 4)

      const step1 = curriedCalc(5);
      const step2 = step1(5);
      const step3 = step2(10);
      expect(step3(10)).toBe(200); // (5 + 5) * (10 + 10)
    });
  });

  describe('partial', () => {
    it('should partially apply first argument', () => {
      const greet = (greeting: string, name: string) => `${greeting}, ${name}!`;
      const sayHello = partial(greet, 'Hello');

      expect(sayHello('World')).toBe('Hello, World!');
      expect(sayHello('John')).toBe('Hello, John!');
    });

    it('should work with different argument types', () => {
      const repeat = (count: number, value: string) => value.repeat(count);
      const repeat3Times = partial(repeat, 3);

      expect(repeat3Times('abc')).toBe('abcabcabc');
    });
  });

  describe('partial3', () => {
    it('should partially apply first argument of 3-arg function', () => {
      const formatMessage = (level: string, timestamp: string, message: string) =>
        `[${level}] ${timestamp}: ${message}`;

      const logError = partial3(formatMessage, 'ERROR');

      expect(logError('2023-01-01', 'Something went wrong')).toBe(
        '[ERROR] 2023-01-01: Something went wrong'
      );
    });
  });

  describe('flip', () => {
    it('should swap the order of arguments', () => {
      const divide = (a: number, b: number) => a / b;
      const flippedDivide = flip(divide);

      expect(divide(10, 2)).toBe(5);
      expect(flippedDivide(10, 2)).toBe(0.2); // equivalent to divide(2, 10)
    });

    it('should work with different argument types', () => {
      const startsWith = (prefix: string, str: string) => str.startsWith(prefix);
      const hasPrefix = flip(startsWith);

      expect(startsWith('hello', 'hello world')).toBe(true);
      expect(hasPrefix('hello world', 'hello')).toBe(true);
    });
  });
});
