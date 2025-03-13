import { describe, it, expect } from 'vitest';
import { ImmutableMap } from './map';

describe('ImmutableMap', () => {
  describe('Construction', () => {
    it('should create an empty map', () => {
      const map = ImmutableMap.empty<string, number>();
      expect(map.size).toBe(0);
      expect(map.isEmpty).toBe(true);
    });

    it('should create a map from entries', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      expect(map.size).toBe(3);
      expect(map.isEmpty).toBe(false);
      expect(map.get('a').get()).toBe(1);
      expect(map.get('b').get()).toBe(2);
      expect(map.get('c').get()).toBe(3);
    });

    it('should create a map from an object', () => {
      const map = ImmutableMap.fromObject({
        a: 1,
        b: 2,
        c: 3,
      });

      expect(map.size).toBe(3);
      expect(map.get('a').get()).toBe(1);
      expect(map.get('b').get()).toBe(2);
      expect(map.get('c').get()).toBe(3);
    });
  });

  describe('Basic operations', () => {
    it('should get existing values', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
      ]);

      expect(map.get('a').isSome()).toBe(true);
      expect(map.get('a').get()).toBe(1);
      expect(map.get('b').get()).toBe(2);
    });

    it('should return None for non-existent keys', () => {
      const map = ImmutableMap.from([['a', 1]]);

      expect(map.get('x').isNone()).toBe(true);
    });

    it('should check if a key exists', () => {
      const map = ImmutableMap.from([['a', 1]]);

      expect(map.has('a')).toBe(true);
      expect(map.has('x')).toBe(false);
    });

    it('should set key-value pairs', () => {
      const map = ImmutableMap.empty<string, number>();

      const map1 = map.set('a', 1);
      expect(map1.get('a').get()).toBe(1);
      expect(map1.size).toBe(1);

      const map2 = map1.set('b', 2);
      expect(map2.get('a').get()).toBe(1);
      expect(map2.get('b').get()).toBe(2);
      expect(map2.size).toBe(2);

      // Updating an existing key
      const map3 = map2.set('a', 42);
      expect(map3.get('a').get()).toBe(42);
      expect(map3.size).toBe(2);
    });

    it('should delete keys', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      const map1 = map.delete('b');
      expect(map1.has('b')).toBe(false);
      expect(map1.size).toBe(2);
      expect(map1.get('a').get()).toBe(1);
      expect(map1.get('c').get()).toBe(3);

      // Deleting a non-existent key should return the same map
      const map2 = map1.delete('x');
      expect(map2).toBe(map1);
    });
  });

  describe('Collection operations', () => {
    it('should get all keys', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      const keys = map.keys().toArray();
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain('c');
      expect(keys.length).toBe(3);
    });

    it('should get all values', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      const values = map.values().toArray();
      expect(values).toContain(1);
      expect(values).toContain(2);
      expect(values).toContain(3);
      expect(values.length).toBe(3);
    });

    it('should get all entries', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
      ]);

      const entries = map.entries().toArray();
      expect(entries).toContainEqual(['a', 1]);
      expect(entries).toContainEqual(['b', 2]);
      expect(entries.length).toBe(2);
    });

    it('should map values', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      const doubled = map.map(x => x * 2);

      expect(doubled.get('a').get()).toBe(2);
      expect(doubled.get('b').get()).toBe(4);
      expect(doubled.get('c').get()).toBe(6);
    });

    it('should provide keys in map callback', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
      ]);

      const keysAndValues = map.map((value, key) => `${key}:${value}`);

      expect(keysAndValues.get('a').get()).toBe('a:1');
      expect(keysAndValues.get('b').get()).toBe('b:2');
    });

    it('should filter entries', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
        ['c', 3],
        ['d', 4],
      ]);

      const evens = map.filter(x => x % 2 === 0);

      expect(evens.size).toBe(2);
      expect(evens.has('a')).toBe(false);
      expect(evens.has('b')).toBe(true);
      expect(evens.has('c')).toBe(false);
      expect(evens.has('d')).toBe(true);
    });

    it('should provide keys in filter callback', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      const aAndC = map.filter((_, key) => key === 'a' || key === 'c');

      expect(aAndC.size).toBe(2);
      expect(aAndC.has('a')).toBe(true);
      expect(aAndC.has('b')).toBe(false);
      expect(aAndC.has('c')).toBe(true);
    });

    it('should merge maps', () => {
      const map1 = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      const map2 = ImmutableMap.from([
        ['b', 20], // Overwrites
        ['c', 30], // Overwrites
        ['d', 40], // New entry
      ]);

      const merged = map1.merge(map2);

      expect(merged.size).toBe(4);
      expect(merged.get('a').get()).toBe(1); // From map1
      expect(merged.get('b').get()).toBe(20); // From map2 (overwrites)
      expect(merged.get('c').get()).toBe(30); // From map2 (overwrites)
      expect(merged.get('d').get()).toBe(40); // From map2 (new)
    });

    it('should execute forEach', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      const result: Record<string, number> = {};

      map.forEach((value, key) => {
        result[key] = value;
      });

      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('Conversion operations', () => {
    it('should convert to an object', () => {
      const map = ImmutableMap.from<string, number>([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);

      const obj = map.toObject();

      expect(obj).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should convert to a string representation', () => {
      const map = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
      ]);

      // Order might vary, so check parts separately
      const str = map.toString();

      expect(str).toContain('Map({');
      expect(str).toContain('a: 1');
      expect(str).toContain('b: 2');
      expect(str).toContain('})');
    });
  });

  describe('Immutability', () => {
    it('should not modify the original map when transformed', () => {
      const original = ImmutableMap.from([
        ['a', 1],
        ['b', 2],
      ]);

      const withC = original.set('c', 3);

      expect(original.size).toBe(2);
      expect(original.has('c')).toBe(false);
      expect(withC.size).toBe(3);
      expect(withC.has('c')).toBe(true);

      const withoutA = original.delete('a');

      expect(original.size).toBe(2);
      expect(original.has('a')).toBe(true);
      expect(withoutA.size).toBe(1);
      expect(withoutA.has('a')).toBe(false);
    });
  });
});
