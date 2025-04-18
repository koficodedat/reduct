import { describe, it, expect } from 'vitest';
import { PersistentVector } from '../../../src/optimized/persistent-vector';
import { TransientVector } from '../../../src/optimized/transient-vector';
import { some, none } from '@reduct/core';

describe('TransientVector', () => {
  describe('from', () => {
    it('should create a transient vector from a persistent vector', () => {
      const persistent = PersistentVector.from([1, 2, 3, 4, 5]);
      const transient = TransientVector.from(persistent);
      
      expect(transient.getSize()).toBe(persistent.size);
      
      for (let i = 0; i < persistent.size; i++) {
        expect(transient.get(i)).toEqual(persistent.get(i));
      }
    });
    
    it('should create an empty transient vector from an empty persistent vector', () => {
      const persistent = PersistentVector.empty<number>();
      const transient = TransientVector.from(persistent);
      
      expect(transient.getSize()).toBe(0);
      expect(transient.isEmpty()).toBe(true);
    });
  });

  describe('empty', () => {
    it('should create an empty transient vector', () => {
      const transient = TransientVector.empty<number>();
      
      expect(transient.getSize()).toBe(0);
      expect(transient.isEmpty()).toBe(true);
    });
  });

  describe('persistent', () => {
    it('should convert a transient vector back to a persistent vector', () => {
      const original = PersistentVector.from([1, 2, 3, 4, 5]);
      const transient = TransientVector.from(original);
      const persistent = transient.persistent();
      
      expect(persistent.size).toBe(original.size);
      
      for (let i = 0; i < original.size; i++) {
        expect(persistent.get(i)).toEqual(original.get(i));
      }
    });
    
    it('should throw an error when using a transient vector after calling persistent', () => {
      const transient = TransientVector.from(PersistentVector.from([1, 2, 3]));
      transient.persistent();
      
      expect(() => transient.get(0)).toThrow();
      expect(() => transient.set(0, 10)).toThrow();
      expect(() => transient.append(4)).toThrow();
    });
  });

  describe('get', () => {
    it('should return the element at the specified index', () => {
      const transient = TransientVector.from(PersistentVector.from([10, 20, 30, 40, 50]));
      
      expect(transient.get(0)).toEqual(some(10));
      expect(transient.get(2)).toEqual(some(30));
      expect(transient.get(4)).toEqual(some(50));
    });
    
    it('should return None for out-of-bounds indices', () => {
      const transient = TransientVector.from(PersistentVector.from([1, 2, 3]));
      
      expect(transient.get(-1)).toEqual(none);
      expect(transient.get(3)).toEqual(none);
      expect(transient.get(100)).toEqual(none);
    });
  });

  describe('set', () => {
    it('should update the element at the specified index', () => {
      const transient = TransientVector.from(PersistentVector.from([10, 20, 30, 40, 50]));
      
      transient.set(2, 300);
      
      expect(transient.get(2)).toEqual(some(300));
      expect(transient.get(0)).toEqual(some(10));
      expect(transient.get(4)).toEqual(some(50));
    });
    
    it('should throw an error for out-of-bounds indices', () => {
      const transient = TransientVector.from(PersistentVector.from([1, 2, 3]));
      
      expect(() => transient.set(-1, 10)).toThrow();
      expect(() => transient.set(3, 10)).toThrow();
      expect(() => transient.set(100, 10)).toThrow();
    });
  });

  describe('append', () => {
    it('should add an element to the end of the vector', () => {
      const transient = TransientVector.from(PersistentVector.from([1, 2, 3]));
      
      transient.append(4);
      
      expect(transient.getSize()).toBe(4);
      expect(transient.get(3)).toEqual(some(4));
    });
    
    it('should handle appending to an empty vector', () => {
      const transient = TransientVector.empty<number>();
      
      transient.append(1);
      
      expect(transient.getSize()).toBe(1);
      expect(transient.get(0)).toEqual(some(1));
    });
    
    it('should handle appending many elements', () => {
      const transient = TransientVector.empty<number>();
      const count = 1000;
      
      for (let i = 0; i < count; i++) {
        transient.append(i);
      }
      
      expect(transient.getSize()).toBe(count);
      
      for (let i = 0; i < count; i++) {
        expect(transient.get(i)).toEqual(some(i));
      }
    });
  });

  describe('toArray', () => {
    it('should convert the vector to an array', () => {
      const original = [1, 2, 3, 4, 5];
      const transient = TransientVector.from(PersistentVector.from(original));
      const array = transient.toArray();
      
      expect(array).toEqual(original);
    });
    
    it('should return an empty array for an empty vector', () => {
      const transient = TransientVector.empty<number>();
      const array = transient.toArray();
      
      expect(array).toEqual([]);
    });
  });

  describe('performance', () => {
    it('should be more efficient for batch operations', () => {
      const size = 10000;
      const array = Array.from({ length: size }, (_, i) => i);
      
      // Measure time for operations using persistent vectors
      const persistentStart = performance.now();
      let persistent = PersistentVector.empty<number>();
      for (let i = 0; i < size; i++) {
        persistent = persistent.append(i);
      }
      const persistentEnd = performance.now();
      const persistentTime = persistentEnd - persistentStart;
      
      // Measure time for operations using transient vectors
      const transientStart = performance.now();
      const transient = TransientVector.empty<number>();
      for (let i = 0; i < size; i++) {
        transient.append(i);
      }
      transient.persistent();
      const transientEnd = performance.now();
      const transientTime = transientEnd - transientStart;
      
      // The transient version should be significantly faster
      console.log(`Persistent time: ${persistentTime}ms`);
      console.log(`Transient time: ${transientTime}ms`);
      console.log(`Improvement: ${((persistentTime - transientTime) / persistentTime * 100).toFixed(2)}%`);
      
      expect(transientTime).toBeLessThan(persistentTime);
    });
  });
});
