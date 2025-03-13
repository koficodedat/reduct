import { describe, it, expect } from 'vitest';
import {
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isNull,
  isUndefined,
  isFunction,
  isDate,
  isArrayOf,
  isObjectWithProps,
  isOneOf,
  isTuple,
  isLiteral,
  isEnum,
} from './types';

describe('Type Predicates', () => {
  describe('Basic Type Guards', () => {
    it('should correctly identify strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });

    it('should correctly identify numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-45.67)).toBe(true);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });

    it('should correctly identify booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean(null)).toBe(false);
    });

    it('should correctly identify arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(new Array(3))).toBe(true);
      expect(isArray({})).toBe(false);
      expect(isArray('array')).toBe(false);
      expect(isArray(null)).toBe(false);
    });

    it('should correctly identify objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ prop: 'value' })).toBe(true);
      expect(isObject(Object.create(null))).toBe(true);
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);
      expect(isObject('object')).toBe(false);
    });

    it('should correctly identify null', () => {
      expect(isNull(null)).toBe(true);
      expect(isNull(undefined)).toBe(false);
      expect(isNull({})).toBe(false);
      expect(isNull(0)).toBe(false);
      expect(isNull('')).toBe(false);
    });

    it('should correctly identify undefined', () => {
      expect(isUndefined(undefined)).toBe(true);
      expect(isUndefined(void 0)).toBe(true);
      expect(isUndefined(null)).toBe(false);
      expect(isUndefined({})).toBe(false);
      expect(isUndefined(0)).toBe(false);
      expect(isUndefined('')).toBe(false);
    });

    it('should correctly identify functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function () {})).toBe(true);
      expect(isFunction(Boolean)).toBe(true);
      expect(isFunction({})).toBe(false);
      expect(isFunction('function')).toBe(false);
    });

    it('should correctly identify Date objects', () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date('2023-01-01'))).toBe(true);
      expect(isDate(Date.now())).toBe(false);
      expect(isDate('2023-01-01')).toBe(false);
      expect(isDate({})).toBe(false);
    });
  });

  describe('Advanced Type Guards', () => {
    it('should check arrays with element type guards (isArrayOf)', () => {
      const isStringArray = isArrayOf(isString);

      expect(isStringArray(['a', 'b', 'c'])).toBe(true);
      expect(isStringArray([])).toBe(true);
      expect(isStringArray(['a', 1, 'c'])).toBe(false);
      expect(isStringArray(null)).toBe(false);
      expect(isStringArray('not an array')).toBe(false);

      const isNumberArray = isArrayOf(isNumber);

      expect(isNumberArray([1, 2, 3])).toBe(true);
      expect(isNumberArray([])).toBe(true);
      expect(isNumberArray([1, 'two', 3])).toBe(false);

      // Nested arrays
      const isArrayOfNumberArrays = isArrayOf(isArrayOf(isNumber));

      expect(
        isArrayOfNumberArrays([
          [1, 2],
          [3, 4],
        ]),
      ).toBe(true);
      expect(
        isArrayOfNumberArrays([
          [1, 2],
          [3, '4'],
        ]),
      ).toBe(false);
    });

    it('should check objects with property schema (isObjectWithProps)', () => {
      // Create a type guard for a Person object
      const isPerson = isObjectWithProps({
        name: isString,
        age: isNumber,
      });

      expect(isPerson({ name: 'Alice', age: 30 })).toBe(true);
      expect(isPerson({ name: 'Alice', age: 30, extra: 'prop' })).toBe(true);
      expect(isPerson({ name: 'Alice' })).toBe(false);
      expect(isPerson({ name: 'Alice', age: '30' })).toBe(false);
      expect(isPerson(null)).toBe(false);
      expect(isPerson([])).toBe(false);

      // Nested object schema
      const isEmployee = isObjectWithProps({
        person: isPerson,
        department: isString,
      });

      expect(
        isEmployee({
          person: { name: 'Alice', age: 30 },
          department: 'Engineering',
        }),
      ).toBe(true);

      expect(
        isEmployee({
          person: { name: 'Alice' }, // Missing age
          department: 'Engineering',
        }),
      ).toBe(false);
    });

    it('should check union types (isOneOf)', () => {
      const isStringOrNumber = isOneOf(isString, isNumber);

      expect(isStringOrNumber('hello')).toBe(true);
      expect(isStringOrNumber(123)).toBe(true);
      expect(isStringOrNumber(true)).toBe(false);
      expect(isStringOrNumber(null)).toBe(false);
      expect(isStringOrNumber([])).toBe(false);

      // Complex union
      const isValidValue = isOneOf(isString, isNumber, isArrayOf(isString));

      expect(isValidValue('string')).toBe(true);
      expect(isValidValue(42)).toBe(true);
      expect(isValidValue(['a', 'b'])).toBe(true);
      expect(isValidValue(['a', 1])).toBe(false);
      expect(isValidValue({})).toBe(false);
    });

    it('should check tuple types (isTuple)', () => {
      // [string, number] tuple
      const isStringNumberPair = isTuple(isString, isNumber);

      expect(isStringNumberPair(['hello', 123])).toBe(true);
      expect(isStringNumberPair(['hello', 'world'])).toBe(false);
      expect(isStringNumberPair([123, 456])).toBe(false);
      expect(isStringNumberPair(['hello', 123, 'extra'])).toBe(false);
      expect(isStringNumberPair(['hello'])).toBe(false);
      expect(isStringNumberPair(null)).toBe(false);

      // More complex tuple
      const isComplexTuple = isTuple(isString, isNumber, isArrayOf(isString), isBoolean);

      expect(isComplexTuple(['name', 42, ['a', 'b'], true])).toBe(true);
      expect(isComplexTuple(['name', 42, [1, 2], true])).toBe(false);
    });

    it('should check literal values (isLiteral)', () => {
      const isStatusOk = isLiteral('OK');

      expect(isStatusOk('OK')).toBe(true);
      expect(isStatusOk('ok')).toBe(false);
      expect(isStatusOk(null)).toBe(false);

      const isZero = isLiteral(0);

      expect(isZero(0)).toBe(true);
      expect(isZero('0')).toBe(false);
      expect(isZero(null)).toBe(false);

      const isNull_ = isLiteral(null);

      expect(isNull_(null)).toBe(true);
      expect(isNull_(undefined)).toBe(false);
      expect(isNull_(0)).toBe(false);
    });

    it('should check enum values (isEnum)', () => {
      enum Color {
        Red = 'RED',
        Green = 'GREEN',
        Blue = 'BLUE',
      }

      const isColor = isEnum(Color);

      expect(isColor(Color.Red)).toBe(true);
      expect(isColor(Color.Green)).toBe(true);
      expect(isColor(Color.Blue)).toBe(true);
      expect(isColor('RED')).toBe(true);
      expect(isColor('purple')).toBe(false);
      expect(isColor(null)).toBe(false);

      // Numeric enum
      enum Direction {
        Up,
        Down,
        Left,
        Right,
      }

      const isDirection = isEnum(Direction);

      expect(isDirection(Direction.Up)).toBe(true);
      expect(isDirection(Direction.Down)).toBe(true);
      expect(isDirection(0)).toBe(true); // Up = 0
      expect(isDirection(4)).toBe(false);
      expect(isDirection('Up')).toBe(false);
    });
  });
});
