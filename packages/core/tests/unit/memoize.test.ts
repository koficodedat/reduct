import { describe, it, expect, vi } from 'vitest';
import { memoize, memoizeWith } from '../../src/memoize';

describe('Memoization', () => {
  describe('memoize', () => {
    it('should cache results of function calls', () => {
      const fn = vi.fn((x: number) => x * x);
      const memoized = memoize(fn);

      expect(memoized(4)).toBe(16);
      expect(memoized(4)).toBe(16);
      expect(fn).toHaveBeenCalledTimes(1);

      expect(memoized(5)).toBe(25);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple arguments', () => {
      const fn = vi.fn((a: number, b: number) => a + b);
      const memoized = memoize(fn);

      expect(memoized(2, 3)).toBe(5);
      expect(memoized(2, 3)).toBe(5);
      expect(fn).toHaveBeenCalledTimes(1);

      expect(memoized(3, 2)).toBe(5);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should respect maxSize option', () => {
      const fn = vi.fn((x: number) => x * x);
      const memoized = memoize(fn, { maxSize: 2 });

      memoized(1); // Cache: [1]
      memoized(2); // Cache: [1, 2]

      expect(fn).toHaveBeenCalledTimes(2);

      memoized(1); // Cache: [2, 1] (1 accessed, moved to end)
      expect(fn).toHaveBeenCalledTimes(2); // No new call

      memoized(3); // Cache: [1, 3] (2 evicted as LRU)
      expect(fn).toHaveBeenCalledTimes(3);

      memoized(2); // Cache: [3, 2] (2 recomputed)
      expect(fn).toHaveBeenCalledTimes(4);

      memoized(3); // Cache: [2, 3] (3 accessed, moved to end)
      expect(fn).toHaveBeenCalledTimes(4); // No new call
    });
  });

  describe('memoizeWith', () => {
    it('should use custom key function', () => {
      interface User {
        id: number;
        name: string;
      }

      const getUserData = vi.fn((user: User) => ({
        ...user,
        lastLogin: 'timestamp'
      }));

      const memoizedGetUserData = memoizeWith<typeof getUserData>(
        (user) => String(user.id),
        getUserData
      );

      const user1 = { id: 1, name: 'Alice' };
      const user2 = { id: 1, name: 'Alice (updated)' }; // Same ID but different object

      memoizedGetUserData(user1);
      expect(getUserData).toHaveBeenCalledTimes(1);

      memoizedGetUserData(user2);
      expect(getUserData).toHaveBeenCalledTimes(1); // Should use cached value

      const user3 = { id: 2, name: 'Bob' };
      memoizedGetUserData(user3);
      expect(getUserData).toHaveBeenCalledTimes(2); // New ID, should call again
    });

    it('should respect maxSize option', () => {
      const fn = vi.fn((x: number) => x * x);
      const memoized = memoizeWith(
        (x) => `key-${x}`,
        fn,
        { maxSize: 2 }
      );

      memoized(1); // Cache: ['key-1']
      memoized(2); // Cache: ['key-1', 'key-2']
      expect(fn).toHaveBeenCalledTimes(2);

      memoized(1); // Cache: ['key-2', 'key-1'] (1 accessed, moved to end)
      expect(fn).toHaveBeenCalledTimes(2); // No new call

      memoized(3); // Cache: ['key-1', 'key-3'] ('key-2' evicted as LRU)
      expect(fn).toHaveBeenCalledTimes(3);

      memoized(2); // Cache: ['key-3', 'key-2'] (2 recomputed)
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });
});
