import { describe, it, expect } from 'vitest';
import * from '../../src/option';

describe('Option', () => {
  describe('Some', () => {
    it('should return the contained value with get', () => {
      const s = some(42);
      expect(s.get()).toBe(42);
    });

    it('should transform the value with map', () => {
      const s = some(42);
      const mapped = s.map(x => x * 2);
      expect(mapped.get()).toBe(84);
    });

    it('should return the contained value with getOrElse', () => {
      const s = some(42);
      expect(s.getOrElse(0)).toBe(42);
    });

    it('should flatMap correctly', () => {
      const s = some(42);
      const flatMapped = s.flatMap(x => some(x * 2));
      expect(flatMapped.get()).toBe(84);
    });

    it('should report isSome correctly', () => {
      const s = some(42);
      expect(s.isSome()).toBe(true);
      expect(s.isNone()).toBe(false);
    });

    it('should execute forEach with the value', () => {
      const s = some(42);
      let value = 0;
      s.forEach(x => { value = x; });
      expect(value).toBe(42);
    });

    it('should filter correctly', () => {
      const s = some(42);
      expect(s.filter((x: number) => x > 20).get()).toBe(42);
      expect(s.filter((x: number) => x < 20).isNone()).toBe(true);
    });
  });

  describe('None', () => {
    it('should throw when calling get', () => {
      expect(() => none.get()).toThrow();
    });

    it('should return None when mapping', () => {
      const mapped = none.map(x => x);
      expect(mapped.isNone()).toBe(true);
    });

    it('should return the default with getOrElse', () => {
      expect(none.getOrElse(42)).toBe(42);
    });

    it('should return None when flatMapping', () => {
      const flatMapped = none.flatMap(x => some(x));
      expect(flatMapped.isNone()).toBe(true);
    });

    it('should report isNone correctly', () => {
      expect(none.isSome()).toBe(false);
      expect(none.isNone()).toBe(true);
    });

    it('should not execute forEach', () => {
      let executed = false;
      none.forEach(() => { executed = true; });
      expect(executed).toBe(false);
    });

    it('should always return None when filtering', () => {
      expect(none.filter(() => true).isNone()).toBe(true);
    });
  });

  describe('fromNullable', () => {
    it('should create Some for non-null values', () => {
      expect(fromNullable(42).isSome()).toBe(true);
      expect(fromNullable('').isSome()).toBe(true);
      expect(fromNullable(0).isSome()).toBe(true);
      expect(fromNullable(false).isSome()).toBe(true);
    });

    it('should create None for null or undefined', () => {
      expect(fromNullable(null).isNone()).toBe(true);
      expect(fromNullable(undefined).isNone()).toBe(true);
    });
  });
});
