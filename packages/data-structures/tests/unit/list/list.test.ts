import { describe, it, expect } from 'vitest';
import { List } from '../../../src/list/index';

describe('Immutable List', () => {
  describe('Construction', () => {
    it('should create an empty list', () => {
      const list = List.empty<number>();
      expect(list.size).toBe(0);
      expect(list.isEmpty).toBe(true);
    });

    it('should create a list from an array', () => {
      const list = List.from([1, 2, 3]);
      expect(list.size).toBe(3);
      expect(list.isEmpty).toBe(false);
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    it('should create a list with provided elements', () => {
      const list = List.of('a', 'b', 'c');
      expect(list.size).toBe(3);
      expect(list.isEmpty).toBe(false);
      expect(list.toArray()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Element access', () => {
    it('should get an element at a valid index', () => {
      const list = List.of(10, 20, 30);

      expect(list.get(0).isSome()).toBe(true);
      expect(list.get(0).get()).toBe(10);

      expect(list.get(1).isSome()).toBe(true);
      expect(list.get(1).get()).toBe(20);

      expect(list.get(2).isSome()).toBe(true);
      expect(list.get(2).get()).toBe(30);
    });

    it('should return None for invalid indices', () => {
      const list = List.of(10, 20, 30);

      expect(list.get(-1).isNone()).toBe(true);
      expect(list.get(3).isNone()).toBe(true);
      expect(list.get(100).isNone()).toBe(true);
    });

    it('should get the head of a non-empty list', () => {
      const list = List.of(10, 20, 30);
      expect(list.head.isSome()).toBe(true);
      expect(list.head.get()).toBe(10);
    });

    it('should return None for the head of an empty list', () => {
      const list = List.empty<number>();
      expect(list.head.isNone()).toBe(true);
    });

    it('should get the tail of a non-empty list', () => {
      const list = List.of(10, 20, 30);
      const tail = list.tail;

      expect(tail.size).toBe(2);
      expect(tail.toArray()).toEqual([20, 30]);
    });

    it('should return an empty list for the tail of an empty list', () => {
      const list = List.empty<number>();
      const tail = list.tail;

      expect(tail.isEmpty).toBe(true);
    });
  });

  describe('Immutability', () => {
    it('should not modify the original list when transformed', () => {
      const original = List.of(1, 2, 3);
      const appended = original.append(4);

      expect(original.toArray()).toEqual([1, 2, 3]);
      expect(appended.toArray()).toEqual([1, 2, 3, 4]);
      expect(original).not.toBe(appended);
    });

    it('should create a new list for all modification operations', () => {
      const original = List.of(1, 2, 3);

      const prepended = original.prepend(0);
      const replaced = original.set(1, 42);
      const removed = original.remove(0);
      const mapped = original.map(x => x * 2);

      expect(original.toArray()).toEqual([1, 2, 3]);
      expect(prepended.toArray()).toEqual([0, 1, 2, 3]);
      expect(replaced.toArray()).toEqual([1, 42, 3]);
      expect(removed.toArray()).toEqual([2, 3]);
      expect(mapped.toArray()).toEqual([2, 4, 6]);
    });
  });

  describe('Modification operations', () => {
    it('should prepend an element', () => {
      const list = List.of(2, 3);
      const result = list.prepend(1);

      expect(result.toArray()).toEqual([1, 2, 3]);
    });

    it('should append an element', () => {
      const list = List.of(1, 2);
      const result = list.append(3);

      expect(result.toArray()).toEqual([1, 2, 3]);
    });

    it('should set an element at a valid index', () => {
      const list = List.of(1, 2, 3);
      const result = list.set(1, 42);

      expect(result.toArray()).toEqual([1, 42, 3]);
    });

    it('should do nothing when setting an element at an invalid index', () => {
      const list = List.of(1, 2, 3);
      const result1 = list.set(-1, 42);
      const result2 = list.set(3, 42);

      expect(result1).toBe(list);
      expect(result2).toBe(list);
    });

    it('should insert an element at a specific index', () => {
      const list = List.of(1, 3);

      const result1 = list.insert(1, 2);
      expect(result1.toArray()).toEqual([1, 2, 3]);

      const result2 = list.insert(0, 0);
      expect(result2.toArray()).toEqual([0, 1, 3]);

      const result3 = list.insert(2, 4);
      expect(result3.toArray()).toEqual([1, 3, 4]);
    });

    it('should handle insertion at boundary indices', () => {
      const list = List.of(1, 2, 3);

      const result1 = list.insert(-1, 0);
      expect(result1.toArray()).toEqual([0, 1, 2, 3]);

      const result2 = list.insert(100, 4);
      expect(result2.toArray()).toEqual([1, 2, 3, 4]);
    });

    it('should remove an element at a valid index', () => {
      const list = List.of(1, 2, 3);

      const result1 = list.remove(0);
      expect(result1.toArray()).toEqual([2, 3]);

      const result2 = list.remove(1);
      expect(result2.toArray()).toEqual([1, 3]);

      const result3 = list.remove(2);
      expect(result3.toArray()).toEqual([1, 2]);
    });

    it('should do nothing when removing an element at an invalid index', () => {
      const list = List.of(1, 2, 3);

      const result1 = list.remove(-1);
      const result2 = list.remove(3);

      expect(result1).toBe(list);
      expect(result2).toBe(list);
    });
  });

  describe('Transformation operations', () => {
    it('should map elements', () => {
      const list = List.of(1, 2, 3);
      const result = list.map(x => x * 2);

      expect(result.toArray()).toEqual([2, 4, 6]);
    });

    it('should provide index in map callback', () => {
      const list = List.of('a', 'b', 'c');
      const result = list.map((element, index) => `${element}${index}`);

      expect(result.toArray()).toEqual(['a0', 'b1', 'c2']);
    });

    it('should filter elements', () => {
      const list = List.of(1, 2, 3, 4, 5);
      const result = list.filter(x => x % 2 === 0);

      expect(result.toArray()).toEqual([2, 4]);
    });

    it('should provide index in filter callback', () => {
      const list = List.of(1, 2, 3, 4, 5);
      const result = list.filter((_, index) => index % 2 === 0);

      expect(result.toArray()).toEqual([1, 3, 5]);
    });

    it('should reduce elements', () => {
      const list = List.of(1, 2, 3, 4);
      const sum = list.reduce((acc, x) => acc + x, 0);

      expect(sum).toBe(10);
    });

    it('should provide index in reduce callback', () => {
      const list = List.of('a', 'b', 'c');
      const result = list.reduce((acc, element, index) => {
        acc[index] = element;
        return acc;
      }, {} as Record<number, string>);

      expect(result).toEqual({ 0: 'a', 1: 'b', 2: 'c' });
    });

    it('should concatenate lists', () => {
      const list1 = List.of(1, 2);
      const list2 = List.of(3, 4);
      const result = list1.concat(list2);

      expect(result.toArray()).toEqual([1, 2, 3, 4]);
    });

    it('should slice a list', () => {
      const list = List.of(1, 2, 3, 4, 5);

      expect(list.slice(1, 4).toArray()).toEqual([2, 3, 4]);
      expect(list.slice(0, 2).toArray()).toEqual([1, 2]);
      expect(list.slice(3).toArray()).toEqual([4, 5]);
      expect(list.slice(0).toArray()).toEqual([1, 2, 3, 4, 5]);
    });

    it('should sort elements', () => {
      const list = List.of(3, 1, 4, 2);

      const ascendingResult = list.sort();
      expect(ascendingResult.toArray()).toEqual([1, 2, 3, 4]);

      const descendingResult = list.sort((a, b) => b - a);
      expect(descendingResult.toArray()).toEqual([4, 3, 2, 1]);
    });

    it('should reverse elements', () => {
      const list = List.of(1, 2, 3);
      const result = list.reverse();

      expect(result.toArray()).toEqual([3, 2, 1]);
    });
  });

  describe('Query operations', () => {
    it('should check if some elements match a predicate', () => {
      const list = List.of(1, 2, 3, 4);

      expect(list.some(x => x % 2 === 0)).toBe(true);
      expect(list.some(x => x > 10)).toBe(false);
    });

    it('should provide index in some callback', () => {
      const list = List.of(1, 2, 3);
      expect(list.some((_, index) => index === 1)).toBe(true);
      expect(list.some((_, index) => index > 2)).toBe(false);
    });

    it('should check if all elements match a predicate', () => {
      const list = List.of(2, 4, 6, 8);

      expect(list.every(x => x % 2 === 0)).toBe(true);
      expect(list.every(x => x > 5)).toBe(false);
    });

    it('should provide index in every callback', () => {
      const list = List.of(1, 2, 3);
      expect(list.every((_, index) => index >= 0)).toBe(true);
      expect(list.every((_, index) => index < 2)).toBe(false);
    });

    it('should find the index of an element', () => {
      const list = List.of('a', 'b', 'c', 'b');

      expect(list.indexOf('a')).toBe(0);
      expect(list.indexOf('b')).toBe(1);
      expect(list.indexOf('z')).toBe(-1);
    });

    it('should check if list includes an element', () => {
      const list = List.of(1, 2, 3);

      expect(list.includes(2)).toBe(true);
      expect(list.includes(4)).toBe(false);
    });
  });

  describe('Iteration', () => {
    it('should iterate over elements using forEach', () => {
      const list = List.of(1, 2, 3);
      const results: number[] = [];

      list.forEach(x => {
        results.push(x);
      });

      expect(results).toEqual([1, 2, 3]);
    });

    it('should provide index in forEach callback', () => {
      const list = List.of('a', 'b', 'c');
      const results: string[] = [];

      list.forEach((element, index) => {
        results.push(`${element}${index}`);
      });

      expect(results).toEqual(['a0', 'b1', 'c2']);
    });

    it('should be iterable with for...of', () => {
      const list = List.of(1, 2, 3);
      const results: number[] = [];

      for (const element of list) {
        results.push(element);
      }

      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe('Utility methods', () => {
    it('should convert to string representation', () => {
      const list = List.of(1, 2, 3);
      expect(list.toString()).toBe('List(1, 2, 3)');
    });
  });
});
