import { describe, it, expect } from 'vitest';
import { OptimizedList } from '../../../src/optimized/list';
import { some, none } from '@reduct/core';

describe('OptimizedList', () => {
  describe('empty', () => {
    it('should create an empty list', () => {
      const list = OptimizedList.empty<number>();
      expect(list.size).toBe(0);
      expect(list.isEmpty).toBe(true);
    });
  });

  describe('from', () => {
    it('should create a list from an array', () => {
      const array = [1, 2, 3, 4, 5];
      const list = OptimizedList.from(array);
      
      expect(list.size).toBe(array.length);
      expect(list.isEmpty).toBe(false);
      
      for (let i = 0; i < array.length; i++) {
        expect(list.get(i)).toEqual(some(array[i]));
      }
    });
    
    it('should create an empty list from an empty array', () => {
      const list = OptimizedList.from([]);
      expect(list.size).toBe(0);
      expect(list.isEmpty).toBe(true);
    });
  });

  describe('of', () => {
    it('should create a list from individual elements', () => {
      const list = OptimizedList.of(1, 2, 3, 4, 5);
      
      expect(list.size).toBe(5);
      expect(list.isEmpty).toBe(false);
      
      expect(list.get(0)).toEqual(some(1));
      expect(list.get(4)).toEqual(some(5));
    });
    
    it('should create an empty list when no elements are provided', () => {
      const list = OptimizedList.of();
      expect(list.size).toBe(0);
      expect(list.isEmpty).toBe(true);
    });
  });

  describe('get', () => {
    it('should return the element at the specified index', () => {
      const list = OptimizedList.from([10, 20, 30, 40, 50]);
      
      expect(list.get(0)).toEqual(some(10));
      expect(list.get(2)).toEqual(some(30));
      expect(list.get(4)).toEqual(some(50));
    });
    
    it('should return None for out-of-bounds indices', () => {
      const list = OptimizedList.from([1, 2, 3]);
      
      expect(list.get(-1)).toEqual(none);
      expect(list.get(3)).toEqual(none);
      expect(list.get(100)).toEqual(none);
    });
  });

  describe('head', () => {
    it('should return the first element', () => {
      const list = OptimizedList.from([10, 20, 30]);
      expect(list.head).toEqual(some(10));
    });
    
    it('should return None for an empty list', () => {
      const list = OptimizedList.empty<number>();
      expect(list.head).toEqual(none);
    });
  });

  describe('tail', () => {
    it('should return a list with all elements except the first', () => {
      const list = OptimizedList.from([10, 20, 30]);
      const tail = list.tail;
      
      expect(tail.size).toBe(2);
      expect(tail.get(0)).toEqual(some(20));
      expect(tail.get(1)).toEqual(some(30));
    });
    
    it('should return an empty list for a list with one element', () => {
      const list = OptimizedList.from([10]);
      const tail = list.tail;
      
      expect(tail.size).toBe(0);
      expect(tail.isEmpty).toBe(true);
    });
    
    it('should return an empty list for an empty list', () => {
      const list = OptimizedList.empty<number>();
      const tail = list.tail;
      
      expect(tail.size).toBe(0);
      expect(tail.isEmpty).toBe(true);
    });
  });

  describe('toArray', () => {
    it('should convert the list to an array', () => {
      const original = [1, 2, 3, 4, 5];
      const list = OptimizedList.from(original);
      const array = list.toArray();
      
      expect(array).toEqual(original);
      expect(array).not.toBe(original); // Should be a new array
    });
    
    it('should return an empty array for an empty list', () => {
      const list = OptimizedList.empty<number>();
      const array = list.toArray();
      
      expect(array).toEqual([]);
    });
  });

  describe('prepend', () => {
    it('should add an element to the beginning of the list', () => {
      const list = OptimizedList.from([2, 3, 4]);
      const prepended = list.prepend(1);
      
      expect(prepended.size).toBe(4);
      expect(prepended.get(0)).toEqual(some(1));
      expect(prepended.get(1)).toEqual(some(2));
      
      // Original should be unchanged
      expect(list.size).toBe(3);
      expect(list.get(0)).toEqual(some(2));
    });
    
    it('should create a list with one element when prepending to an empty list', () => {
      const list = OptimizedList.empty<number>();
      const prepended = list.prepend(1);
      
      expect(prepended.size).toBe(1);
      expect(prepended.get(0)).toEqual(some(1));
    });
  });

  describe('append', () => {
    it('should add an element to the end of the list', () => {
      const list = OptimizedList.from([1, 2, 3]);
      const appended = list.append(4);
      
      expect(appended.size).toBe(4);
      expect(appended.get(3)).toEqual(some(4));
      
      // Original should be unchanged
      expect(list.size).toBe(3);
      expect(list.get(3)).toEqual(none);
    });
    
    it('should create a list with one element when appending to an empty list', () => {
      const list = OptimizedList.empty<number>();
      const appended = list.append(1);
      
      expect(appended.size).toBe(1);
      expect(appended.get(0)).toEqual(some(1));
    });
  });

  describe('set', () => {
    it('should update an element and return a new list', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      const updated = list.set(2, 30);
      
      // Original should be unchanged
      expect(list.get(2)).toEqual(some(3));
      
      // Updated should have the new value
      expect(updated.get(2)).toEqual(some(30));
      
      // Other elements should be the same
      expect(updated.get(0)).toEqual(some(1));
      expect(updated.get(4)).toEqual(some(5));
      
      // Size should be the same
      expect(updated.size).toBe(list.size);
    });
    
    it('should return the same list for out-of-bounds indices', () => {
      const list = OptimizedList.from([1, 2, 3]);
      
      expect(list.set(-1, 10)).toBe(list);
      expect(list.set(3, 10)).toBe(list);
      expect(list.set(100, 10)).toBe(list);
    });
  });

  describe('insert', () => {
    it('should insert an element at the specified index', () => {
      const list = OptimizedList.from([1, 2, 4, 5]);
      const inserted = list.insert(2, 3);
      
      expect(inserted.size).toBe(5);
      expect(inserted.get(2)).toEqual(some(3));
      
      // Elements after the insertion point should be shifted
      expect(inserted.get(3)).toEqual(some(4));
      expect(inserted.get(4)).toEqual(some(5));
      
      // Original should be unchanged
      expect(list.size).toBe(4);
      expect(list.get(2)).toEqual(some(4));
    });
    
    it('should insert at the beginning when index is negative', () => {
      const list = OptimizedList.from([2, 3]);
      const inserted = list.insert(-1, 1);
      
      expect(inserted.size).toBe(3);
      expect(inserted.get(0)).toEqual(some(1));
    });
    
    it('should insert at the end when index is greater than size', () => {
      const list = OptimizedList.from([1, 2]);
      const inserted = list.insert(100, 3);
      
      expect(inserted.size).toBe(3);
      expect(inserted.get(2)).toEqual(some(3));
    });
  });

  describe('remove', () => {
    it('should remove an element at the specified index', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      const removed = list.remove(2);
      
      expect(removed.size).toBe(4);
      expect(removed.get(2)).toEqual(some(4));
      
      // Original should be unchanged
      expect(list.size).toBe(5);
      expect(list.get(2)).toEqual(some(3));
    });
    
    it('should return the same list for out-of-bounds indices', () => {
      const list = OptimizedList.from([1, 2, 3]);
      
      expect(list.remove(-1)).toBe(list);
      expect(list.remove(3)).toBe(list);
      expect(list.remove(100)).toBe(list);
    });
  });

  describe('map', () => {
    it('should transform each element using the provided function', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      const doubled = list.map(x => x * 2);
      
      expect(doubled.size).toBe(5);
      expect(doubled.get(0)).toEqual(some(2));
      expect(doubled.get(2)).toEqual(some(6));
      expect(doubled.get(4)).toEqual(some(10));
      
      // Original should be unchanged
      expect(list.get(0)).toEqual(some(1));
    });
    
    it('should provide the index to the mapping function', () => {
      const list = OptimizedList.from(['a', 'b', 'c']);
      const withIndices = list.map((x, i) => `${x}${i}`);
      
      expect(withIndices.get(0)).toEqual(some('a0'));
      expect(withIndices.get(1)).toEqual(some('b1'));
      expect(withIndices.get(2)).toEqual(some('c2'));
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      const mapped = list.map(x => x * 2);
      
      expect(mapped.isEmpty).toBe(true);
    });
  });

  describe('filter', () => {
    it('should keep only elements that satisfy the predicate', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5, 6]);
      const evens = list.filter(x => x % 2 === 0);
      
      expect(evens.size).toBe(3);
      expect(evens.get(0)).toEqual(some(2));
      expect(evens.get(1)).toEqual(some(4));
      expect(evens.get(2)).toEqual(some(6));
      
      // Original should be unchanged
      expect(list.size).toBe(6);
    });
    
    it('should provide the index to the filter function', () => {
      const list = OptimizedList.from(['a', 'b', 'c', 'd', 'e']);
      const evenIndices = list.filter((_, i) => i % 2 === 0);
      
      expect(evenIndices.size).toBe(3);
      expect(evenIndices.get(0)).toEqual(some('a'));
      expect(evenIndices.get(1)).toEqual(some('c'));
      expect(evenIndices.get(2)).toEqual(some('e'));
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      const filtered = list.filter(x => x > 0);
      
      expect(filtered.isEmpty).toBe(true);
    });
  });

  describe('reduce', () => {
    it('should reduce the list to a single value', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      const sum = list.reduce((acc, x) => acc + x, 0);
      
      expect(sum).toBe(15);
    });
    
    it('should provide the index to the reducer function', () => {
      const list = OptimizedList.from(['a', 'b', 'c']);
      const result = list.reduce((acc, x, i) => acc + x + i, '');
      
      expect(result).toBe('a0b1c2');
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      const result = list.reduce((acc, x) => acc + x, 0);
      
      expect(result).toBe(0);
    });
  });

  describe('concat', () => {
    it('should combine two lists', () => {
      const list1 = OptimizedList.from([1, 2, 3]);
      const list2 = OptimizedList.from([4, 5, 6]);
      const combined = list1.concat(list2);
      
      expect(combined.size).toBe(6);
      expect(combined.get(0)).toEqual(some(1));
      expect(combined.get(3)).toEqual(some(4));
      expect(combined.get(5)).toEqual(some(6));
      
      // Original lists should be unchanged
      expect(list1.size).toBe(3);
      expect(list2.size).toBe(3);
    });
    
    it('should handle empty lists', () => {
      const list1 = OptimizedList.empty<number>();
      const list2 = OptimizedList.from([1, 2, 3]);
      
      expect(list1.concat(list2).size).toBe(3);
      expect(list2.concat(list1).size).toBe(3);
      expect(list1.concat(list1).size).toBe(0);
    });
  });

  describe('slice', () => {
    it('should return a slice of the list', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      const sliced = list.slice(1, 4);
      
      expect(sliced.size).toBe(3);
      expect(sliced.get(0)).toEqual(some(2));
      expect(sliced.get(2)).toEqual(some(4));
      
      // Original should be unchanged
      expect(list.size).toBe(5);
    });
    
    it('should handle empty slices', () => {
      const list = OptimizedList.from([1, 2, 3]);
      
      expect(list.slice(1, 1).size).toBe(0);
      expect(list.slice(10, 20).size).toBe(0);
    });
    
    it('should handle missing end parameter', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      const sliced = list.slice(2);
      
      expect(sliced.size).toBe(3);
      expect(sliced.get(0)).toEqual(some(3));
    });
    
    it('should handle missing start parameter', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      const sliced = list.slice(undefined, 3);
      
      expect(sliced.size).toBe(3);
      expect(sliced.get(0)).toEqual(some(1));
    });
  });

  describe('some', () => {
    it('should return true if any element matches the predicate', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      
      expect(list.some(x => x > 3)).toBe(true);
      expect(list.some(x => x % 2 === 0)).toBe(true);
    });
    
    it('should return false if no element matches the predicate', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      
      expect(list.some(x => x > 10)).toBe(false);
      expect(list.some(x => x < 0)).toBe(false);
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      
      expect(list.some(x => true)).toBe(false);
    });
  });

  describe('every', () => {
    it('should return true if all elements match the predicate', () => {
      const list = OptimizedList.from([2, 4, 6, 8]);
      
      expect(list.every(x => x % 2 === 0)).toBe(true);
      expect(list.every(x => x > 0)).toBe(true);
    });
    
    it('should return false if any element does not match the predicate', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      
      expect(list.every(x => x % 2 === 0)).toBe(false);
      expect(list.every(x => x > 2)).toBe(false);
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      
      expect(list.every(x => false)).toBe(true);
    });
  });

  describe('indexOf', () => {
    it('should return the index of the first occurrence of the element', () => {
      const list = OptimizedList.from([10, 20, 30, 20, 40]);
      
      expect(list.indexOf(20)).toBe(1);
      expect(list.indexOf(40)).toBe(4);
    });
    
    it('should return -1 if the element is not found', () => {
      const list = OptimizedList.from([10, 20, 30]);
      
      expect(list.indexOf(50)).toBe(-1);
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      
      expect(list.indexOf(10)).toBe(-1);
    });
  });

  describe('includes', () => {
    it('should return true if the element is in the list', () => {
      const list = OptimizedList.from([10, 20, 30, 40]);
      
      expect(list.includes(20)).toBe(true);
      expect(list.includes(40)).toBe(true);
    });
    
    it('should return false if the element is not in the list', () => {
      const list = OptimizedList.from([10, 20, 30]);
      
      expect(list.includes(50)).toBe(false);
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      
      expect(list.includes(10)).toBe(false);
    });
  });

  describe('forEach', () => {
    it('should execute a function for each element', () => {
      const list = OptimizedList.from([1, 2, 3]);
      const result: number[] = [];
      
      list.forEach(x => result.push(x * 2));
      
      expect(result).toEqual([2, 4, 6]);
    });
    
    it('should provide the index to the function', () => {
      const list = OptimizedList.from(['a', 'b', 'c']);
      const result: string[] = [];
      
      list.forEach((x, i) => result.push(`${x}${i}`));
      
      expect(result).toEqual(['a0', 'b1', 'c2']);
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      const result: number[] = [];
      
      list.forEach(x => result.push(x));
      
      expect(result).toEqual([]);
    });
  });

  describe('sort', () => {
    it('should sort the list using the default sort order', () => {
      const list = OptimizedList.from([3, 1, 4, 2, 5]);
      const sorted = list.sort();
      
      expect(sorted.toArray()).toEqual([1, 2, 3, 4, 5]);
      
      // Original should be unchanged
      expect(list.toArray()).toEqual([3, 1, 4, 2, 5]);
    });
    
    it('should sort the list using a custom compare function', () => {
      const list = OptimizedList.from([3, 1, 4, 2, 5]);
      const sorted = list.sort((a, b) => b - a); // Descending order
      
      expect(sorted.toArray()).toEqual([5, 4, 3, 2, 1]);
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      const sorted = list.sort();
      
      expect(sorted.isEmpty).toBe(true);
    });
  });

  describe('reverse', () => {
    it('should reverse the order of elements', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      const reversed = list.reverse();
      
      expect(reversed.toArray()).toEqual([5, 4, 3, 2, 1]);
      
      // Original should be unchanged
      expect(list.toArray()).toEqual([1, 2, 3, 4, 5]);
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      const reversed = list.reverse();
      
      expect(reversed.isEmpty).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return a string representation of the list', () => {
      const list = OptimizedList.from([1, 2, 3]);
      
      expect(list.toString()).toBe('List(1, 2, 3)');
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      
      expect(list.toString()).toBe('List()');
    });
  });

  describe('iteration', () => {
    it('should be iterable', () => {
      const list = OptimizedList.from([1, 2, 3, 4, 5]);
      const result: number[] = [];
      
      for (const value of list) {
        result.push(value);
      }
      
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
    
    it('should handle empty lists', () => {
      const list = OptimizedList.empty<number>();
      const result: number[] = [];
      
      for (const value of list) {
        result.push(value);
      }
      
      expect(result).toEqual([]);
    });
  });
});
