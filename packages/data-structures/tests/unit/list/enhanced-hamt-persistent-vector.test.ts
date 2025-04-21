/**
 * Tests for EnhancedHAMTPersistentVector
 */

import { describe, it, expect } from 'vitest';
import { EnhancedHAMTPersistentVector } from '../../../src/list/enhanced-hamt-persistent-vector';

describe('EnhancedHAMTPersistentVector', () => {
  describe('creation', () => {
    it('should create an empty vector', () => {
      const vector = EnhancedHAMTPersistentVector.empty<number>();
      expect(vector.size).toBe(0);
      expect(vector.isEmpty).toBe(true);
    });

    it('should create a vector from an array', () => {
      const array = [1, 2, 3, 4, 5];
      const vector = EnhancedHAMTPersistentVector.from(array);
      expect(vector.size).toBe(5);
      expect(vector.isEmpty).toBe(false);
      expect(vector.get(0)).toBe(1);
      expect(vector.get(4)).toBe(5);
    });

    it('should create a vector with a single element', () => {
      const vector = EnhancedHAMTPersistentVector.of(42);
      expect(vector.size).toBe(1);
      expect(vector.isEmpty).toBe(false);
      expect(vector.get(0)).toBe(42);
    });
  });

  describe('basic operations', () => {
    it('should get elements at specific indices', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      expect(vector.get(0)).toBe(1);
      expect(vector.get(2)).toBe(3);
      expect(vector.get(4)).toBe(5);
      expect(vector.get(-1)).toBeUndefined();
      expect(vector.get(5)).toBeUndefined();
    });

    it('should set elements at specific indices', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const newVector = vector.set(2, 42);

      // Original vector should be unchanged
      expect(vector.get(2)).toBe(3);

      // New vector should have the updated value
      expect(newVector.get(2)).toBe(42);
      expect(newVector.size).toBe(5);
    });

    it('should append elements', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3]);
      const newVector = vector.append(4);

      // Original vector should be unchanged
      expect(vector.size).toBe(3);
      expect(vector.get(3)).toBeUndefined();

      // New vector should have the appended value
      expect(newVector.size).toBe(4);
      expect(newVector.get(3)).toBe(4);
    });

    it('should prepend elements', () => {
      const vector = EnhancedHAMTPersistentVector.from([2, 3, 4]);
      const newVector = vector.prepend(1);

      // Original vector should be unchanged
      expect(vector.size).toBe(3);
      expect(vector.get(0)).toBe(2);

      // New vector should have the prepended value
      expect(newVector.size).toBe(4);
      expect(newVector.get(0)).toBe(1);
      expect(newVector.get(1)).toBe(2);
    });

    it('should insert elements at specific indices', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 3, 4]);
      const newVector = vector.insert(1, 2);

      // Original vector should be unchanged
      expect(vector.size).toBe(3);
      expect(vector.get(1)).toBe(3);

      // New vector should have the inserted value
      expect(newVector.size).toBe(4);
      expect(newVector.get(0)).toBe(1);
      expect(newVector.get(1)).toBe(2);
      expect(newVector.get(2)).toBe(3);
      expect(newVector.get(3)).toBe(4);
    });

    it('should remove elements at specific indices', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const newVector = vector.remove(2);

      // Original vector should be unchanged
      expect(vector.size).toBe(5);
      expect(vector.get(2)).toBe(3);

      // New vector should have the removed value
      expect(newVector.size).toBe(4);
      expect(newVector.get(0)).toBe(1);
      expect(newVector.get(1)).toBe(2);
      expect(newVector.get(2)).toBe(4);
      expect(newVector.get(3)).toBe(5);
    });
  });

  describe('advanced operations', () => {
    it('should update elements using a function', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const newVector = vector.update(2, value => value * 2);

      // Original vector should be unchanged
      expect(vector.get(2)).toBe(3);

      // New vector should have the updated value
      expect(newVector.get(2)).toBe(6);
    });

    it('should slice the vector', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const sliced = vector.slice(1, 4);

      expect(sliced.size).toBe(3);
      expect(sliced.get(0)).toBe(2);
      expect(sliced.get(1)).toBe(3);
      expect(sliced.get(2)).toBe(4);
    });

    it('should concatenate vectors', () => {
      const vector1 = EnhancedHAMTPersistentVector.from([1, 2, 3]);
      const vector2 = EnhancedHAMTPersistentVector.from([4, 5, 6]);
      const concatenated = vector1.concat(vector2);

      expect(concatenated.size).toBe(6);
      expect(concatenated.get(0)).toBe(1);
      expect(concatenated.get(3)).toBe(4);
      expect(concatenated.get(5)).toBe(6);
    });

    it('should find elements', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const found = vector.find(value => value > 3);

      expect(found).toBe(4);
    });

    it('should find indices', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const foundIndex = vector.findIndex(value => value > 3);

      expect(foundIndex).toBe(3);
    });

    it('should filter elements', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const filtered = vector.filter(value => value % 2 === 0);

      expect(filtered.size).toBe(2);
      expect(filtered.get(0)).toBe(2);
      expect(filtered.get(1)).toBe(4);
    });

    it('should map elements', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const mapped = vector.map(value => value * 2);

      expect(mapped.size).toBe(5);
      expect(mapped.get(0)).toBe(2);
      expect(mapped.get(4)).toBe(10);
    });

    it('should reduce elements', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const sum = vector.reduce((acc, value) => acc + value, 0);

      expect(sum).toBe(15);
    });

    it('should check if every element satisfies a predicate', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);

      expect(vector.every(value => value > 0)).toBe(true);
      expect(vector.every(value => value % 2 === 0)).toBe(false);
    });

    it('should check if some element satisfies a predicate', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);

      expect(vector.some(value => value > 3)).toBe(true);
      expect(vector.some(value => value < 0)).toBe(false);
    });

    it('should convert to an array', () => {
      const array = [1, 2, 3, 4, 5];
      const vector = EnhancedHAMTPersistentVector.from(array);
      const result = vector.toArray();

      expect(result).toEqual(array);
    });
  });

  describe('combined operations', () => {
    it('should perform mapFilterReduce', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const result = vector.mapFilterReduce(
        value => value * 2,
        value => value > 5,
        (acc, value) => acc + value,
        0
      );

      expect(result).toBe(24); // (2*3) + (2*4) + (2*5) = 6 + 8 + 10 = 24
    });

    it('should perform mapReduce', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const result = vector.mapReduce(
        value => value * 2,
        (acc, value) => acc + value,
        0
      );

      expect(result).toBe(30); // 2 + 4 + 6 + 8 + 10 = 30
    });

    it('should perform filterReduce', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const result = vector.filterReduce(
        value => value % 2 === 0,
        (acc, value) => acc + value,
        0
      );

      expect(result).toBe(6); // 2 + 4 = 6
    });

    it('should perform filterMap', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const result = vector.filterMap(
        value => value % 2 === 0,
        value => value * 2
      );

      expect(result.size).toBe(2);
      expect(result.get(0)).toBe(4);
      expect(result.get(1)).toBe(8);
    });

    it('should perform mapFilter', () => {
      const vector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const result = vector.mapFilter(
        value => value * 2,
        value => value > 5
      );

      expect(result.size).toBe(3);
      expect(result.get(0)).toBe(6);
      expect(result.get(1)).toBe(8);
      expect(result.get(2)).toBe(10);
    });
  });
});
