import { describe, it, expect } from 'vitest';
import { SmartList } from '../../../src/optimized/smart-list';
import { some, none } from '@reduct/core';

describe('SmartList', () => {
  describe('empty', () => {
    it('should create an empty list', () => {
      const list = SmartList.empty<number>();
      expect(list.size).toBe(0);
      expect(list.isEmpty).toBe(true);
    });
  });

  describe('from', () => {
    it('should create a list from an array', () => {
      const array = [1, 2, 3, 4, 5];
      const list = SmartList.from(array);
      
      expect(list.size).toBe(array.length);
      expect(list.isEmpty).toBe(false);
      
      for (let i = 0; i < array.length; i++) {
        expect(list.get(i)).toEqual(some(array[i]));
      }
    });
    
    it('should create an empty list from an empty array', () => {
      const list = SmartList.from([]);
      expect(list.size).toBe(0);
      expect(list.isEmpty).toBe(true);
    });
  });

  describe('of', () => {
    it('should create a list from individual elements', () => {
      const list = SmartList.of(1, 2, 3, 4, 5);
      
      expect(list.size).toBe(5);
      expect(list.isEmpty).toBe(false);
      
      expect(list.get(0)).toEqual(some(1));
      expect(list.get(4)).toEqual(some(5));
    });
    
    it('should create an empty list when no elements are provided', () => {
      const list = SmartList.of();
      expect(list.size).toBe(0);
      expect(list.isEmpty).toBe(true);
    });
  });

  describe('get', () => {
    it('should return the element at the specified index', () => {
      const list = SmartList.of(10, 20, 30, 40, 50);
      
      expect(list.get(0)).toEqual(some(10));
      expect(list.get(2)).toEqual(some(30));
      expect(list.get(4)).toEqual(some(50));
    });
    
    it('should return None for out-of-bounds indices', () => {
      const list = SmartList.of(1, 2, 3);
      
      expect(list.get(-1)).toEqual(none);
      expect(list.get(3)).toEqual(none);
      expect(list.get(100)).toEqual(none);
    });
  });

  describe('head', () => {
    it('should return the first element', () => {
      const list = SmartList.of(10, 20, 30);
      expect(list.head).toEqual(some(10));
    });
    
    it('should return None for an empty list', () => {
      const list = SmartList.empty<number>();
      expect(list.head).toEqual(none);
    });
  });

  describe('tail', () => {
    it('should return a list with all elements except the first', () => {
      const list = SmartList.of(10, 20, 30);
      const tail = list.tail;
      
      expect(tail.size).toBe(2);
      expect(tail.get(0)).toEqual(some(20));
      expect(tail.get(1)).toEqual(some(30));
    });
    
    it('should return an empty list for a list with one element', () => {
      const list = SmartList.of(10);
      const tail = list.tail;
      
      expect(tail.size).toBe(0);
      expect(tail.isEmpty).toBe(true);
    });
    
    it('should return an empty list for an empty list', () => {
      const list = SmartList.empty<number>();
      const tail = list.tail;
      
      expect(tail.size).toBe(0);
      expect(tail.isEmpty).toBe(true);
    });
  });

  describe('toArray', () => {
    it('should convert the list to an array', () => {
      const original = [1, 2, 3, 4, 5];
      const list = SmartList.from(original);
      const array = list.toArray();
      
      expect(array).toEqual(original);
      expect(array).not.toBe(original); // Should be a new array
    });
    
    it('should return an empty array for an empty list', () => {
      const list = SmartList.empty<number>();
      const array = list.toArray();
      
      expect(array).toEqual([]);
    });
  });

  describe('prepend', () => {
    it('should add an element to the beginning of the list', () => {
      const list = SmartList.of(2, 3, 4);
      const result = list.prepend(1);
      
      expect(result.size).toBe(4);
      expect(result.get(0)).toEqual(some(1));
      expect(result.get(1)).toEqual(some(2));
      expect(result.get(3)).toEqual(some(4));
      
      // Original list should be unchanged
      expect(list.size).toBe(3);
      expect(list.get(0)).toEqual(some(2));
    });
    
    it('should create a list with one element when prepending to an empty list', () => {
      const list = SmartList.empty<number>();
      const result = list.prepend(1);
      
      expect(result.size).toBe(1);
      expect(result.get(0)).toEqual(some(1));
    });
  });

  describe('append', () => {
    it('should add an element to the end of the list', () => {
      const list = SmartList.of(1, 2, 3);
      const result = list.append(4);
      
      expect(result.size).toBe(4);
      expect(result.get(3)).toEqual(some(4));
      
      // Original list should be unchanged
      expect(list.size).toBe(3);
      expect(list.get(2)).toEqual(some(3));
    });
    
    it('should create a list with one element when appending to an empty list', () => {
      const list = SmartList.empty<number>();
      const result = list.append(1);
      
      expect(result.size).toBe(1);
      expect(result.get(0)).toEqual(some(1));
    });
  });

  describe('set', () => {
    it('should update an element and return a new list', () => {
      const list = SmartList.of(1, 2, 3, 4, 5);
      const result = list.set(2, 30);
      
      expect(result.size).toBe(5);
      expect(result.get(2)).toEqual(some(30));
      
      // Other elements should be unchanged
      expect(result.get(0)).toEqual(some(1));
      expect(result.get(4)).toEqual(some(5));
      
      // Original list should be unchanged
      expect(list.get(2)).toEqual(some(3));
    });
    
    it('should return the same list for out-of-bounds indices', () => {
      const list = SmartList.of(1, 2, 3);
      
      expect(list.set(-1, 10)).toBe(list);
      expect(list.set(3, 10)).toBe(list);
      expect(list.set(100, 10)).toBe(list);
    });
  });

  describe('insert', () => {
    it('should insert an element at the specified index', () => {
      const list = SmartList.of(1, 3, 4);
      const result = list.insert(1, 2);
      
      expect(result.size).toBe(4);
      expect(result.get(0)).toEqual(some(1));
      expect(result.get(1)).toEqual(some(2));
      expect(result.get(2)).toEqual(some(3));
      expect(result.get(3)).toEqual(some(4));
    });
    
    it('should insert at the beginning when index is negative', () => {
      const list = SmartList.of(2, 3);
      const result = list.insert(-1, 1);
      
      expect(result.size).toBe(3);
      expect(result.get(0)).toEqual(some(1));
      expect(result.get(1)).toEqual(some(2));
      expect(result.get(2)).toEqual(some(3));
    });
    
    it('should insert at the end when index is greater than size', () => {
      const list = SmartList.of(1, 2);
      const result = list.insert(10, 3);
      
      expect(result.size).toBe(3);
      expect(result.get(0)).toEqual(some(1));
      expect(result.get(1)).toEqual(some(2));
      expect(result.get(2)).toEqual(some(3));
    });
  });

  describe('remove', () => {
    it('should remove an element at the specified index', () => {
      const list = SmartList.of(1, 2, 3, 4);
      const result = list.remove(1);
      
      expect(result.size).toBe(3);
      expect(result.get(0)).toEqual(some(1));
      expect(result.get(1)).toEqual(some(3));
      expect(result.get(2)).toEqual(some(4));
    });
    
    it('should return the same list for out-of-bounds indices', () => {
      const list = SmartList.of(1, 2, 3);
      
      expect(list.remove(-1)).toBe(list);
      expect(list.remove(3)).toBe(list);
      expect(list.remove(100)).toBe(list);
    });
  });

  describe('map', () => {
    it('should transform each element using the provided function', () => {
      const list = SmartList.of(1, 2, 3, 4);
      const result = list.map(x => x * 2);
      
      expect(result.size).toBe(4);
      expect(result.get(0)).toEqual(some(2));
      expect(result.get(1)).toEqual(some(4));
      expect(result.get(2)).toEqual(some(6));
      expect(result.get(3)).toEqual(some(8));
    });
    
    it('should provide the index to the mapping function', () => {
      const list = SmartList.of('a', 'b', 'c');
      const result = list.map((_, i) => i);
      
      expect(result.size).toBe(3);
      expect(result.get(0)).toEqual(some(0));
      expect(result.get(1)).toEqual(some(1));
      expect(result.get(2)).toEqual(some(2));
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      const result = list.map(x => x * 2);
      
      expect(result.size).toBe(0);
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('filter', () => {
    it('should keep only elements that satisfy the predicate', () => {
      const list = SmartList.of(1, 2, 3, 4, 5, 6);
      const result = list.filter(x => x % 2 === 0);
      
      expect(result.size).toBe(3);
      expect(result.get(0)).toEqual(some(2));
      expect(result.get(1)).toEqual(some(4));
      expect(result.get(2)).toEqual(some(6));
    });
    
    it('should provide the index to the filter function', () => {
      const list = SmartList.of('a', 'b', 'c', 'd');
      const result = list.filter((_, i) => i % 2 === 0);
      
      expect(result.size).toBe(2);
      expect(result.get(0)).toEqual(some('a'));
      expect(result.get(1)).toEqual(some('c'));
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      const result = list.filter(x => x % 2 === 0);
      
      expect(result.size).toBe(0);
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('reduce', () => {
    it('should reduce the list to a single value', () => {
      const list = SmartList.of(1, 2, 3, 4);
      const sum = list.reduce((acc, x) => acc + x, 0);
      
      expect(sum).toBe(10);
    });
    
    it('should provide the index to the reducer function', () => {
      const list = SmartList.of('a', 'b', 'c');
      const result = list.reduce((acc, _, i) => acc + i, 0);
      
      expect(result).toBe(3); // 0 + 1 + 2
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      const sum = list.reduce((acc, x) => acc + x, 0);
      
      expect(sum).toBe(0);
    });
  });

  describe('concat', () => {
    it('should combine two lists', () => {
      const list1 = SmartList.of(1, 2, 3);
      const list2 = SmartList.of(4, 5, 6);
      const result = list1.concat(list2);
      
      expect(result.size).toBe(6);
      expect(result.get(0)).toEqual(some(1));
      expect(result.get(3)).toEqual(some(4));
      expect(result.get(5)).toEqual(some(6));
    });
    
    it('should handle empty lists', () => {
      const list1 = SmartList.of(1, 2, 3);
      const list2 = SmartList.empty<number>();
      
      expect(list1.concat(list2)).toEqual(list1);
      expect(list2.concat(list1)).toEqual(list1);
      
      const empty1 = SmartList.empty<number>();
      const empty2 = SmartList.empty<number>();
      expect(empty1.concat(empty2).isEmpty).toBe(true);
    });
  });

  describe('slice', () => {
    it('should return a slice of the list', () => {
      const list = SmartList.of(1, 2, 3, 4, 5);
      const result = list.slice(1, 4);
      
      expect(result.size).toBe(3);
      expect(result.get(0)).toEqual(some(2));
      expect(result.get(1)).toEqual(some(3));
      expect(result.get(2)).toEqual(some(4));
    });
    
    it('should handle empty slices', () => {
      const list = SmartList.of(1, 2, 3);
      const result = list.slice(1, 1);
      
      expect(result.size).toBe(0);
      expect(result.isEmpty).toBe(true);
    });
    
    it('should handle missing end parameter', () => {
      const list = SmartList.of(1, 2, 3, 4, 5);
      const result = list.slice(2);
      
      expect(result.size).toBe(3);
      expect(result.get(0)).toEqual(some(3));
      expect(result.get(2)).toEqual(some(5));
    });
    
    it('should handle missing start parameter', () => {
      const list = SmartList.of(1, 2, 3, 4, 5);
      const result = list.slice(undefined, 3);
      
      expect(result.size).toBe(3);
      expect(result.get(0)).toEqual(some(1));
      expect(result.get(2)).toEqual(some(3));
    });
  });

  describe('some', () => {
    it('should return true if any element matches the predicate', () => {
      const list = SmartList.of(1, 2, 3, 4);
      
      expect(list.some(x => x % 2 === 0)).toBe(true);
      expect(list.some(x => x > 3)).toBe(true);
    });
    
    it('should return false if no element matches the predicate', () => {
      const list = SmartList.of(1, 3, 5, 7);
      
      expect(list.some(x => x % 2 === 0)).toBe(false);
      expect(list.some(x => x > 10)).toBe(false);
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      
      expect(list.some(() => true)).toBe(false);
    });
  });

  describe('every', () => {
    it('should return true if all elements match the predicate', () => {
      const list = SmartList.of(2, 4, 6, 8);
      
      expect(list.every(x => x % 2 === 0)).toBe(true);
      expect(list.every(x => x > 0)).toBe(true);
    });
    
    it('should return false if any element does not match the predicate', () => {
      const list = SmartList.of(2, 3, 4, 6);
      
      expect(list.every(x => x % 2 === 0)).toBe(false);
      expect(list.every(x => x > 3)).toBe(false);
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      
      expect(list.every(() => false)).toBe(true);
    });
  });

  describe('indexOf', () => {
    it('should return the index of the first occurrence of the element', () => {
      const list = SmartList.of(1, 2, 3, 2, 1);
      
      expect(list.indexOf(1)).toBe(0);
      expect(list.indexOf(2)).toBe(1);
      expect(list.indexOf(3)).toBe(2);
    });
    
    it('should return -1 if the element is not found', () => {
      const list = SmartList.of(1, 2, 3);
      
      expect(list.indexOf(4)).toBe(-1);
      expect(list.indexOf(0)).toBe(-1);
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      
      expect(list.indexOf(1)).toBe(-1);
    });
  });

  describe('includes', () => {
    it('should return true if the element is in the list', () => {
      const list = SmartList.of(1, 2, 3);
      
      expect(list.includes(1)).toBe(true);
      expect(list.includes(2)).toBe(true);
      expect(list.includes(3)).toBe(true);
    });
    
    it('should return false if the element is not in the list', () => {
      const list = SmartList.of(1, 2, 3);
      
      expect(list.includes(0)).toBe(false);
      expect(list.includes(4)).toBe(false);
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      
      expect(list.includes(1)).toBe(false);
    });
  });

  describe('forEach', () => {
    it('should execute a function for each element', () => {
      const list = SmartList.of(1, 2, 3);
      const result: number[] = [];
      
      list.forEach(x => result.push(x));
      
      expect(result).toEqual([1, 2, 3]);
    });
    
    it('should provide the index to the function', () => {
      const list = SmartList.of('a', 'b', 'c');
      const result: number[] = [];
      
      list.forEach((_, i) => result.push(i));
      
      expect(result).toEqual([0, 1, 2]);
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      let called = false;
      
      list.forEach(() => { called = true; });
      
      expect(called).toBe(false);
    });
  });

  describe('sort', () => {
    it('should sort the list using the default sort order', () => {
      const list = SmartList.of(3, 1, 4, 2);
      const result = list.sort();
      
      expect(result.size).toBe(4);
      expect(result.get(0)).toEqual(some(1));
      expect(result.get(1)).toEqual(some(2));
      expect(result.get(2)).toEqual(some(3));
      expect(result.get(3)).toEqual(some(4));
    });
    
    it('should sort the list using a custom compare function', () => {
      const list = SmartList.of(1, 2, 3, 4);
      const result = list.sort((a, b) => b - a); // Descending order
      
      expect(result.size).toBe(4);
      expect(result.get(0)).toEqual(some(4));
      expect(result.get(1)).toEqual(some(3));
      expect(result.get(2)).toEqual(some(2));
      expect(result.get(3)).toEqual(some(1));
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      const result = list.sort();
      
      expect(result.size).toBe(0);
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('reverse', () => {
    it('should reverse the order of elements', () => {
      const list = SmartList.of(1, 2, 3, 4);
      const result = list.reverse();
      
      expect(result.size).toBe(4);
      expect(result.get(0)).toEqual(some(4));
      expect(result.get(1)).toEqual(some(3));
      expect(result.get(2)).toEqual(some(2));
      expect(result.get(3)).toEqual(some(1));
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      const result = list.reverse();
      
      expect(result.size).toBe(0);
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return a string representation of the list', () => {
      const list = SmartList.of(1, 2, 3);
      
      expect(list.toString()).toBe('List(1, 2, 3)');
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      
      expect(list.toString()).toBe('List()');
    });
  });

  describe('iteration', () => {
    it('should be iterable', () => {
      const list = SmartList.of(1, 2, 3);
      const result: number[] = [];
      
      for (const item of list) {
        result.push(item);
      }
      
      expect(result).toEqual([1, 2, 3]);
    });
    
    it('should handle empty lists', () => {
      const list = SmartList.empty<number>();
      const result: number[] = [];
      
      for (const item of list) {
        result.push(item);
      }
      
      expect(result).toEqual([]);
    });
  });
});
