import { describe, it, expect } from 'vitest';
import { numericList, stringList, objectList, specializedList } from '../../../src/list';

describe('Specialized List Implementations', () => {
  describe('NumericList', () => {
    it('should provide specialized numeric operations', () => {
      const numbers = numericList([1, 2, 3, 4, 5]);
      
      // Test specialized operations
      expect(numbers.sum()).toBe(15);
      expect(numbers.average()).toBe(3);
      expect(numbers.min()).toBe(1);
      expect(numbers.max()).toBe(5);
      
      // Test that standard operations still work
      expect(numbers.size).toBe(5);
      expect(numbers.get(2)).toBe(3);
      
      // Test optimized map operation
      const doubled = numbers.map(x => x * 2);
      expect(doubled.toArray()).toEqual([2, 4, 6, 8, 10]);
      
      // Test optimized filter operation
      const evens = numbers.filter(x => x % 2 === 0);
      expect(evens.toArray()).toEqual([2, 4]);
    });
  });
  
  describe('StringList', () => {
    it('should provide specialized string operations', () => {
      const strings = stringList(['apple', 'banana', 'cherry', 'date', 'elderberry']);
      
      // Test specialized operations
      expect(strings.join(', ')).toBe('apple, banana, cherry, date, elderberry');
      expect(strings.findContaining('a').toArray()).toEqual(['apple', 'banana', 'date']);
      expect(strings.findStartingWith('b').toArray()).toEqual(['banana']);
      expect(strings.findEndingWith('y').toArray()).toEqual(['cherry', 'elderberry']);
      
      // Test that standard operations still work
      expect(strings.size).toBe(5);
      expect(strings.get(2)).toBe('cherry');
      
      // Test optimized map operation
      const uppercased = strings.map(s => s.toUpperCase());
      expect(uppercased.toArray()).toEqual(['APPLE', 'BANANA', 'CHERRY', 'DATE', 'ELDERBERRY']);
      
      // Test optimized filter operation
      const longStrings = strings.filter(s => s.length > 5);
      expect(longStrings.toArray()).toEqual(['banana', 'cherry', 'elderberry']);
    });
  });
  
  describe('ObjectList', () => {
    interface Person {
      id: number;
      name: string;
      age: number;
    }
    
    const people: Person[] = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
      { id: 3, name: 'Charlie', age: 35 },
      { id: 4, name: 'David', age: 25 },
      { id: 5, name: 'Eve', age: 30 }
    ];
    
    it('should provide specialized object operations', () => {
      const personList = objectList(people);
      
      // Test specialized operations
      expect(personList.findByProperty('age', 25).size).toBe(2);
      expect(personList.pluck('name').toArray()).toEqual(['Alice', 'Bob', 'Charlie', 'David', 'Eve']);
      expect(personList.unique('age').size).toBe(3);
      
      // Test groupByProperty
      const groupedByAge = personList.groupByProperty('age');
      expect(groupedByAge.size).toBe(3);
      expect(groupedByAge.get(25)?.size).toBe(2);
      expect(groupedByAge.get(30)?.size).toBe(2);
      expect(groupedByAge.get(35)?.size).toBe(1);
      
      // Test that standard operations still work
      expect(personList.size).toBe(5);
      expect(personList.get(2)?.name).toBe('Charlie');
      
      // Test optimized map operation
      const names = personList.map(p => p.name);
      expect(names.toArray()).toEqual(['Alice', 'Bob', 'Charlie', 'David', 'Eve']);
      
      // Test optimized filter operation
      const youngPeople = personList.filter(p => p.age < 30);
      expect(youngPeople.size).toBe(2);
    });
  });
  
  describe('SpecializedList', () => {
    it('should create the appropriate specialized list based on data type', () => {
      // Numeric data
      const numbers = specializedList([1, 2, 3, 4, 5]);
      expect(numbers.size).toBe(5);
      
      // String data
      const strings = specializedList(['apple', 'banana', 'cherry']);
      expect(strings.size).toBe(3);
      
      // Object data
      const objects = specializedList([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(objects.size).toBe(3);
      
      // Mixed data
      const mixed = specializedList([1, 'string', { id: 3 }]);
      expect(mixed.size).toBe(3);
    });
  });
});
