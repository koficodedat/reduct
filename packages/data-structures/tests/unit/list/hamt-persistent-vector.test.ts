import { describe, it, expect } from 'vitest';
import { HAMTPersistentVector } from '../../../src/list/hamt-persistent-vector';
import { List } from '../../../src';

describe('HAMTPersistentVector', () => {
  describe('creation', () => {
    it('should create an empty vector', () => {
      const vector = HAMTPersistentVector.empty<number>();
      expect(vector.size).toBe(0);
      expect(vector.isEmpty).toBe(true);
    });

    it('should create a vector from an array', () => {
      const array = [1, 2, 3, 4, 5];
      const vector = HAMTPersistentVector.from(array);
      expect(vector.size).toBe(5);
      expect(vector.isEmpty).toBe(false);
      expect(vector.get(0)).toBe(1);
      expect(vector.get(4)).toBe(5);
    });
  });

  describe('operations', () => {
    it('should get elements correctly', () => {
      const vector = HAMTPersistentVector.from([1, 2, 3, 4, 5]);
      expect(vector.get(0)).toBe(1);
      expect(vector.get(2)).toBe(3);
      expect(vector.get(4)).toBe(5);
      expect(vector.get(-1)).toBeUndefined();
      expect(vector.get(5)).toBeUndefined();
    });

    it('should set elements correctly', () => {
      const vector = HAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const newVector = vector.set(2, 10);

      // Original vector should be unchanged
      expect(vector.get(2)).toBe(3);

      // New vector should have the updated value
      expect(newVector.get(2)).toBe(10);
      expect(newVector.size).toBe(5);
    });

    it('should append elements correctly', () => {
      const vector = HAMTPersistentVector.from([1, 2, 3]);
      const newVector = vector.append(4);

      // Original vector should be unchanged
      expect(vector.size).toBe(3);
      expect(vector.get(3)).toBeUndefined();

      // New vector should have the appended value
      expect(newVector.size).toBe(4);
      expect(newVector.get(3)).toBe(4);
    });

    it('should prepend elements correctly', () => {
      const vector = HAMTPersistentVector.from([2, 3, 4]);
      const newVector = vector.prepend(1);

      // Original vector should be unchanged
      expect(vector.size).toBe(3);
      expect(vector.get(0)).toBe(2);

      // New vector should have the prepended value
      expect(newVector.size).toBe(4);
      expect(newVector.get(0)).toBe(1);
      expect(newVector.get(1)).toBe(2);
    });

    it('should map elements correctly', () => {
      const vector = HAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const newVector = vector.map(x => x * 2);

      // Original vector should be unchanged
      expect(vector.get(0)).toBe(1);

      // New vector should have the mapped values
      expect(newVector.get(0)).toBe(2);
      expect(newVector.get(2)).toBe(6);
      expect(newVector.size).toBe(5);
    });

    it('should filter elements correctly', () => {
      const vector = HAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const newVector = vector.filter(x => x % 2 === 0);

      // Original vector should be unchanged
      expect(vector.size).toBe(5);

      // New vector should have only the filtered values
      expect(newVector.size).toBe(2);
      expect(newVector.get(0)).toBe(2);
      expect(newVector.get(1)).toBe(4);
    });

    it('should reduce elements correctly', () => {
      const vector = HAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const sum = vector.reduce((acc, x) => acc + x, 0);
      expect(sum).toBe(15);
    });

    it('should convert to array correctly', () => {
      const array = [1, 2, 3, 4, 5];
      const vector = HAMTPersistentVector.from(array);
      const result = vector.toArray();
      expect(result).toEqual(array);
    });
  });

  // We'll implement integration tests in a future update
  // This is a placeholder for now
});
