/**
 * PersistentVector tests
 *
 * Tests for the PersistentVector implementation.
 */

import { describe, it, expect } from 'vitest';
import { PersistentVector, TransientPersistentVector } from '../../../src/list/persistent-vector';

describe('PersistentVector', () => {
  describe('basic operations', () => {
    it('should create an empty vector', () => {
      const vector = PersistentVector.from<number>([]);
      expect(vector.size).toBe(0);
      expect(vector.isEmpty).toBe(true);
    });

    it('should create a vector with elements', () => {
      const vector = PersistentVector.from<number>([1, 2, 3]);
      expect(vector.size).toBe(3);
      expect(vector.isEmpty).toBe(false);
    });

    it('should get elements by index', () => {
      const vector = PersistentVector.from<number>([1, 2, 3]);
      expect(vector.get(0)).toBe(1);
      expect(vector.get(1)).toBe(2);
      expect(vector.get(2)).toBe(3);
      expect(vector.get(-1)).toBeUndefined();
      expect(vector.get(3)).toBeUndefined();
    });

    it('should get first and last elements', () => {
      const vector = PersistentVector.from<number>([1, 2, 3]);
      expect(vector.first()).toBe(1);
      expect(vector.last()).toBe(3);

      const emptyVector = PersistentVector.from<number>([]);
      expect(emptyVector.first()).toBeUndefined();
      expect(emptyVector.last()).toBeUndefined();
    });

    it('should set elements by index', () => {
      const vector = PersistentVector.from<number>([1, 2, 3]);
      const newVector = vector.set(1, 5);
      
      // Original vector should be unchanged
      expect(vector.get(1)).toBe(2);
      
      // New vector should have the updated value
      expect(newVector.get(0)).toBe(1);
      expect(newVector.get(1)).toBe(5);
      expect(newVector.get(2)).toBe(3);
      
      // Setting out of bounds should throw
      expect(() => vector.set(-1, 5)).toThrow();
      expect(() => vector.set(3, 5)).toThrow();
    });

    it('should append elements', () => {
      const vector = PersistentVector.from<number>([1, 2, 3]);
      const newVector = vector.append(4);
      
      // Original vector should be unchanged
      expect(vector.size).toBe(3);
      
      // New vector should have the appended value
      expect(newVector.size).toBe(4);
      expect(newVector.get(3)).toBe(4);
    });

    it('should convert to array', () => {
      const vector = PersistentVector.from<number>([1, 2, 3]);
      const array = vector.toArray();
      
      expect(array).toEqual([1, 2, 3]);
      
      // The returned array should be a copy
      array[0] = 5;
      expect(vector.get(0)).toBe(1);
    });
  });

  describe('transient operations', () => {
    it('should create a transient vector', () => {
      const vector = PersistentVector.from<number>([1, 2, 3]);
      const transient = vector.transient();
      
      expect(transient).toBeInstanceOf(TransientPersistentVector);
    });

    it('should append to a transient vector', () => {
      const vector = PersistentVector.from<number>([1, 2, 3]);
      const transient = vector.transient();
      
      transient.append(4).append(5);
      const persistent = transient.persistent();
      
      expect(persistent.size).toBe(5);
      expect(persistent.get(3)).toBe(4);
      expect(persistent.get(4)).toBe(5);
    });

    it('should prepend to a transient vector', () => {
      const vector = PersistentVector.from<number>([3, 4, 5]);
      const transient = vector.transient();
      
      transient.prepend(2).prepend(1);
      const persistent = transient.persistent();
      
      expect(persistent.size).toBe(5);
      expect(persistent.get(0)).toBe(1);
      expect(persistent.get(1)).toBe(2);
    });

    it('should set values in a transient vector', () => {
      const vector = PersistentVector.from<number>([1, 2, 3, 4, 5]);
      const transient = vector.transient();
      
      transient.set(1, 10).set(3, 20);
      const persistent = transient.persistent();
      
      expect(persistent.size).toBe(5);
      expect(persistent.get(1)).toBe(10);
      expect(persistent.get(3)).toBe(20);
    });
  });

  describe('large collections', () => {
    it('should handle large collections efficiently', () => {
      // Create a large vector (1000 elements)
      const elements = Array.from({ length: 1000 }, (_, i) => i);
      const vector = PersistentVector.from(elements);
      
      expect(vector.size).toBe(1000);
      
      // Test random access
      expect(vector.get(0)).toBe(0);
      expect(vector.get(500)).toBe(500);
      expect(vector.get(999)).toBe(999);
      
      // Test updates
      const updatedVector = vector.set(500, 5000);
      expect(vector.get(500)).toBe(500); // Original unchanged
      expect(updatedVector.get(500)).toBe(5000);
      
      // Test appends
      const appendedVector = vector.append(1000);
      expect(appendedVector.size).toBe(1001);
      expect(appendedVector.get(1000)).toBe(1000);
      
      // Test toArray
      const array = vector.toArray();
      expect(array.length).toBe(1000);
      expect(array[500]).toBe(500);
    });
  });
});
