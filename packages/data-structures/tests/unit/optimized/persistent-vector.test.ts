import { describe, it, expect } from 'vitest';
import { PersistentVector } from '../../../src/optimized/persistent-vector';
import { some, none } from '@reduct/core';

describe('PersistentVector', () => {
  describe('empty', () => {
    it('should create an empty vector', () => {
      const vector = PersistentVector.empty<number>();
      expect(vector.getSize()).toBe(0);
      expect(vector.isEmpty()).toBe(true);
    });
  });

  describe('from', () => {
    it('should create a vector from an array', () => {
      const array = [1, 2, 3, 4, 5];
      const vector = PersistentVector.from(array);

      expect(vector.getSize()).toBe(array.length);
      expect(vector.isEmpty()).toBe(false);

      for (let i = 0; i < array.length; i++) {
        expect(vector.get(i)).toEqual(some(array[i]));
      }
    });

    it('should create an empty vector from an empty array', () => {
      const vector = PersistentVector.from([]);
      expect(vector.getSize()).toBe(0);
      expect(vector.isEmpty()).toBe(true);
    });
  });

  describe('get', () => {
    it('should return the element at the specified index', () => {
      const vector = PersistentVector.from([10, 20, 30, 40, 50]);

      expect(vector.get(0)).toEqual(some(10));
      expect(vector.get(2)).toEqual(some(30));
      expect(vector.get(4)).toEqual(some(50));
    });

    it('should return None for out-of-bounds indices', () => {
      const vector = PersistentVector.from([1, 2, 3]);

      expect(vector.get(-1)).toEqual(none);
      expect(vector.get(3)).toEqual(none);
      expect(vector.get(100)).toEqual(none);
    });

    it('should handle large vectors', () => {
      // Create a vector with more than 32 elements to test trie structure
      const array = Array.from({ length: 100 }, (_, i) => i);
      const vector = PersistentVector.from(array);

      expect(vector.getSize()).toBe(100);

      // Test elements at different levels of the trie
      expect(vector.get(0)).toEqual(some(0));
      expect(vector.get(31)).toEqual(some(31));
      expect(vector.get(32)).toEqual(some(32));
      expect(vector.get(64)).toEqual(some(64));
      expect(vector.get(99)).toEqual(some(99));
    });
  });

  describe('set', () => {
    it('should update an element and return a new vector', () => {
      const original = PersistentVector.from([1, 2, 3, 4, 5]);
      const updated = original.set(2, 30);

      // Original should be unchanged
      expect(original.get(2)).toEqual(some(3));

      // Updated should have the new value
      expect(updated.get(2)).toEqual(some(30));

      // Other elements should be the same
      expect(updated.get(0)).toEqual(some(1));
      expect(updated.get(4)).toEqual(some(5));

      // Size should be the same
      expect(updated.getSize()).toBe(original.getSize());
    });

    it('should throw for out-of-bounds indices', () => {
      const vector = PersistentVector.from([1, 2, 3]);

      expect(() => vector.set(-1, 10)).toThrow();
      expect(() => vector.set(3, 10)).toThrow();
      expect(() => vector.set(100, 10)).toThrow();
    });

    it('should handle updates in the tail', () => {
      // Create a vector with 32 elements (full node) plus 5 in the tail
      const array = Array.from({ length: 37 }, (_, i) => i);
      const vector = PersistentVector.from(array);

      // Update an element in the tail
      const updated = vector.set(35, 350);

      expect(updated.get(35)).toEqual(some(350));
      expect(vector.get(35)).toEqual(some(35)); // Original unchanged
    });

    it('should handle updates in the trie', () => {
      // Create a vector with 100 elements
      const array = Array.from({ length: 100 }, (_, i) => i);
      const vector = PersistentVector.from(array);

      // Update elements at different levels of the trie
      const updated1 = vector.set(0, 1000);
      const updated2 = updated1.set(31, 1031);
      const updated3 = updated2.set(32, 1032);
      const updated4 = updated3.set(64, 1064);

      expect(updated4.get(0)).toEqual(some(1000));
      expect(updated4.get(31)).toEqual(some(1031));
      expect(updated4.get(32)).toEqual(some(1032));
      expect(updated4.get(64)).toEqual(some(1064));

      // Original should be unchanged
      expect(vector.get(0)).toEqual(some(0));
      expect(vector.get(31)).toEqual(some(31));
      expect(vector.get(32)).toEqual(some(32));
      expect(vector.get(64)).toEqual(some(64));
    });
  });

  describe('append', () => {
    it('should add an element to the end of the vector', () => {
      const vector = PersistentVector.from([1, 2, 3]);
      const appended = vector.append(4);

      expect(appended.getSize()).toBe(4);
      expect(appended.get(3)).toEqual(some(4));

      // Original should be unchanged
      expect(vector.getSize()).toBe(3);
      expect(vector.get(3)).toEqual(none);
    });

    it('should handle appending to an empty vector', () => {
      const empty = PersistentVector.empty<number>();
      const appended = empty.append(42);

      expect(appended.getSize()).toBe(1);
      expect(appended.get(0)).toEqual(some(42));
    });

    it('should handle tail overflow', () => {
      // Create a vector with 32 elements (full tail)
      const array = Array.from({ length: 32 }, (_, i) => i);
      const vector = PersistentVector.from(array);

      // Append one more element, which should cause the tail to be incorporated into the trie
      const appended = vector.append(32);

      expect(appended.getSize()).toBe(33);
      expect(appended.get(32)).toEqual(some(32));

      // All original elements should still be accessible
      for (let i = 0; i < 32; i++) {
        expect(appended.get(i)).toEqual(some(i));
      }
    });

    it('should handle multiple appends efficiently', () => {
      // Start with an empty vector
      let vector = PersistentVector.empty<number>();

      // Append 1000 elements
      for (let i = 0; i < 1000; i++) {
        vector = vector.append(i);
      }

      expect(vector.getSize()).toBe(1000);

      // Check some elements
      expect(vector.get(0)).toEqual(some(0));
      expect(vector.get(500)).toEqual(some(500));
      expect(vector.get(999)).toEqual(some(999));
    });
  });

  describe('map', () => {
    it('should transform each element using the provided function', () => {
      const vector = PersistentVector.from([1, 2, 3, 4, 5]);
      const doubled = vector.map(x => x * 2);

      expect(doubled.getSize()).toBe(5);
      expect(doubled.get(0)).toEqual(some(2));
      expect(doubled.get(2)).toEqual(some(6));
      expect(doubled.get(4)).toEqual(some(10));

      // Original should be unchanged
      expect(vector.get(0)).toEqual(some(1));
    });

    it('should provide the index to the mapping function', () => {
      const vector = PersistentVector.from(['a', 'b', 'c']);
      const withIndices = vector.map((x, i) => `${x}${i}`);

      expect(withIndices.get(0)).toEqual(some('a0'));
      expect(withIndices.get(1)).toEqual(some('b1'));
      expect(withIndices.get(2)).toEqual(some('c2'));
    });

    it('should handle empty vectors', () => {
      const empty = PersistentVector.empty<number>();
      const mapped = empty.map(x => x * 2);

      expect(mapped.isEmpty()).toBe(true);
    });
  });

  describe('filter', () => {
    it('should keep only elements that satisfy the predicate', () => {
      const vector = PersistentVector.from([1, 2, 3, 4, 5, 6]);
      const evens = vector.filter(x => x % 2 === 0);

      expect(evens.getSize()).toBe(3);
      expect(evens.get(0)).toEqual(some(2));
      expect(evens.get(1)).toEqual(some(4));
      expect(evens.get(2)).toEqual(some(6));

      // Original should be unchanged
      expect(vector.getSize()).toBe(6);
    });

    it('should provide the index to the filter function', () => {
      const vector = PersistentVector.from(['a', 'b', 'c', 'd', 'e']);
      const evenIndices = vector.filter((_, i) => i % 2 === 0);

      expect(evenIndices.getSize()).toBe(3);
      expect(evenIndices.get(0)).toEqual(some('a'));
      expect(evenIndices.get(1)).toEqual(some('c'));
      expect(evenIndices.get(2)).toEqual(some('e'));
    });

    it('should handle empty vectors', () => {
      const empty = PersistentVector.empty<number>();
      const filtered = empty.filter(x => x > 0);

      expect(filtered.isEmpty()).toBe(true);
    });

    it('should handle filtering all elements', () => {
      const vector = PersistentVector.from([1, 2, 3]);
      const none = vector.filter(() => false);
      const all = vector.filter(() => true);

      expect(none.isEmpty()).toBe(true);
      expect(all.getSize()).toBe(vector.getSize());
    });
  });

  describe('reduce', () => {
    it('should reduce the vector to a single value', () => {
      const vector = PersistentVector.from([1, 2, 3, 4, 5]);
      const sum = vector.reduce((acc, x) => acc + x, 0);

      expect(sum).toBe(15);
    });

    it('should provide the index to the reducer function', () => {
      const vector = PersistentVector.from(['a', 'b', 'c']);
      const result = vector.reduce((acc, x, i) => acc + x + i, '');

      expect(result).toBe('a0b1c2');
    });

    it('should handle empty vectors', () => {
      const empty = PersistentVector.empty<number>();
      const result = empty.reduce((acc, x) => acc + x, 0);

      expect(result).toBe(0);
    });
  });

  describe('toArray', () => {
    it('should convert the vector to an array', () => {
      const original = [1, 2, 3, 4, 5];
      const vector = PersistentVector.from(original);
      const array = vector.toArray();

      expect(array).toEqual(original);
      expect(array).not.toBe(original); // Should be a new array
    });

    it('should handle empty vectors', () => {
      const empty = PersistentVector.empty<number>();
      const array = empty.toArray();

      expect(array).toEqual([]);
    });

    it('should handle large vectors', () => {
      const original = Array.from({ length: 100 }, (_, i) => i);
      const vector = PersistentVector.from(original);
      const array = vector.toArray();

      expect(array).toEqual(original);
    });
  });

  describe('iteration', () => {
    it('should be iterable', () => {
      const vector = PersistentVector.from([1, 2, 3, 4, 5]);
      const result: number[] = [];

      for (const value of vector) {
        result.push(value);
      }

      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty vectors', () => {
      const empty = PersistentVector.empty<number>();
      const result: number[] = [];

      for (const value of empty) {
        result.push(value);
      }

      expect(result).toEqual([]);
    });
  });
});
