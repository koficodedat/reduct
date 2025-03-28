import { describe, it, expect } from 'vitest';
import { linearSearch, findAll, linearSearchList, findIndex, findIndexList } from './linear-search';
import { List } from '@reduct/data-structures';

describe('Linear Search', () => {
  describe('linearSearch', () => {
    it('should find an element in an array', () => {
      const array = [1, 2, 3, 4, 5];

      expect(linearSearch(array, 1)).toBe(0);
      expect(linearSearch(array, 3)).toBe(2);
      expect(linearSearch(array, 5)).toBe(4);
    });

    it('should return -1 if the element is not found', () => {
      const array = [1, 2, 3, 4, 5];

      expect(linearSearch(array, 0)).toBe(-1);
      expect(linearSearch(array, 6)).toBe(-1);
    });

    it('should handle empty arrays', () => {
      expect(linearSearch([], 1)).toBe(-1);
    });

    it('should use custom compare function', () => {
      const people = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ];

      const result = linearSearch(
        people,
        { id: 2, name: 'Different' }, // Different object but same id
        (a, b) => a.id === b.id,
      );

      expect(result).toBe(1);
    });
  });

  describe('findAll', () => {
    it('should find all occurrences of an element', () => {
      const array = [1, 2, 3, 2, 4, 2, 5];

      expect(findAll(array, 2)).toEqual([1, 3, 5]);
      expect(findAll(array, 1)).toEqual([0]);
      expect(findAll(array, 6)).toEqual([]);
    });

    it('should handle empty arrays', () => {
      expect(findAll([], 1)).toEqual([]);
    });

    it('should use custom compare function', () => {
      const people = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 1, name: 'Anna' },
        { id: 3, name: 'Charlie' },
      ];

      const results = findAll(
        people,
        { id: 1, name: 'Test' }, // Different object but same id
        (a, b) => a.id === b.id,
      );

      expect(results).toEqual([0, 2]);
    });
  });

  describe('linearSearchList', () => {
    it('should find an element in a List', () => {
      const list = List.of(1, 2, 3, 4, 5);

      expect(linearSearchList(list, 1).get()).toBe(0);
      expect(linearSearchList(list, 3).get()).toBe(2);
      expect(linearSearchList(list, 5).get()).toBe(4);
    });

    it('should return None if the element is not found', () => {
      const list = List.of(1, 2, 3, 4, 5);

      expect(linearSearchList(list, 0).isNone()).toBe(true);
      expect(linearSearchList(list, 6).isNone()).toBe(true);
    });

    it('should handle empty Lists', () => {
      expect(linearSearchList(List.empty(), 1).isNone()).toBe(true);
    });
  });

  describe('findIndex', () => {
    it('should find the first element matching a predicate', () => {
      const array = [1, 2, 3, 4, 5];

      expect(findIndex(array, x => x > 3)).toBe(3); // First element > 3 is at index 3
      expect(findIndex(array, x => x % 2 === 0)).toBe(1); // First even number is at index 1
      expect(findIndex(array, x => x < 0)).toBe(-1); // No element < 0
    });

    it('should provide index in the predicate', () => {
      const array = ['a', 'b', 'c', 'd'];

      expect(findIndex(array, (_, i) => i > 2)).toBe(3);
    });

    it('should handle empty arrays', () => {
      expect(findIndex([], () => true)).toBe(-1);
    });
  });

  describe('findIndexList', () => {
    it('should find the first element matching a predicate in a List', () => {
      const list = List.of(1, 2, 3, 4, 5);

      expect(findIndexList(list, x => x > 3).get()).toBe(3);
      expect(findIndexList(list, x => x % 2 === 0).get()).toBe(1);
      expect(findIndexList(list, x => x < 0).isNone()).toBe(true);
    });

    it('should handle empty Lists', () => {
      expect(findIndexList(List.empty(), () => true).isNone()).toBe(true);
    });
  });
});
