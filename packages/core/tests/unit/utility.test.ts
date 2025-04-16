import { describe, it, expect } from 'vitest';
import * from '../../src/utility';

describe('Utility Functions', () => {
  describe('identity', () => {
    it('should return the input value unchanged', () => {
      expect(identity(5)).toBe(5);
      expect(identity('hello')).toBe('hello');

      const obj = { name: 'test' };
      expect(identity(obj)).toBe(obj);
    });

    it('should work with arrays', () => {
      const arr = [1, 2, 3];
      expect(arr.map(identity)).toEqual([1, 2, 3]);
    });
  });

  describe('constant', () => {
    it('should return a function that always returns the same value', () => {
      const alwaysTrue = constant(true);
      expect(alwaysTrue()).toBe(true);
      expect(alwaysTrue(1, 2, 3)).toBe(true);

      const alwaysHello = constant('hello');
      expect(alwaysHello()).toBe('hello');
      expect(alwaysHello('ignored')).toBe('hello');
    });
  });

  describe('prop', () => {
    it('should return a function that accesses the property', () => {
      type Person = { name: string; age: number };

      const getName = prop<Person, 'name'>('name');
      const getAge = prop<Person, 'age'>('age');

      const person = { name: 'Alice', age: 30 };

      expect(getName(person)).toBe('Alice');
      expect(getAge(person)).toBe(30);
    });

    it('should work with arrays of objects', () => {
      type Person = { name: string };

      const people = [
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' }
      ];

      const names = people.map(prop<Person, 'name'>('name'));
      expect(names).toEqual(['Alice', 'Bob', 'Charlie']);
    });
  });

  describe('not', () => {
    it('should negate a predicate function', () => {
      const isEven = (n: number) => n % 2 === 0;
      const isOdd = not(isEven);

      expect(isEven(2)).toBe(true);
      expect(isOdd(2)).toBe(false);

      expect(isEven(3)).toBe(false);
      expect(isOdd(3)).toBe(true);
    });
  });

  describe('anyPass', () => {
    it('should return true if any predicate passes', () => {
      const isPositive = (n: number) => n > 0;
      const isEven = (n: number) => n % 2 === 0;
      const isPositiveOrEven = anyPass([isPositive, isEven]);

      expect(isPositiveOrEven(2)).toBe(true); // positive and even
      expect(isPositiveOrEven(3)).toBe(true); // positive but not even
      expect(isPositiveOrEven(-2)).toBe(true); // not positive but even
      expect(isPositiveOrEven(-3)).toBe(false); // neither positive nor even
    });

    it('should return false for empty predicates', () => {
      const noPredicates = anyPass<number>([]);
      expect(noPredicates(5)).toBe(false);
    });
  });

  describe('allPass', () => {
    it('should return true only if all predicates pass', () => {
      const isPositive = (n: number) => n > 0;
      const isEven = (n: number) => n % 2 === 0;
      const isPositiveAndEven = allPass([isPositive, isEven]);

      expect(isPositiveAndEven(2)).toBe(true); // positive and even
      expect(isPositiveAndEven(3)).toBe(false); // positive but not even
      expect(isPositiveAndEven(-2)).toBe(false); // not positive but even
      expect(isPositiveAndEven(-3)).toBe(false); // neither positive nor even
    });

    it('should return true for empty predicates', () => {
      const noPredicates = allPass<number>([]);
      expect(noPredicates(5)).toBe(true);
    });
  });

  describe('uncurry', () => {
    it('should convert a function to take a tuple', () => {
      const add = (a: number, b: number) => a + b;
      const addTuple = uncurry(add);

      expect(addTuple([1, 2])).toBe(3);
    });

    it('should work with different argument types', () => {
      const formatPerson = (name: string, age: number) => `${name} is ${age} years old`;
      const formatPersonTuple = uncurry(formatPerson);

      expect(formatPersonTuple(['Alice', 30])).toBe('Alice is 30 years old');
    });
  });
});
