import { describe, it } from 'vitest';
import { List } from './list';
import { testing } from '@reduct/core';
const { verifyProperty, arbitrary } = testing;

describe('List Property Tests', () => {
  // Generate arbitrary lists
  const listArbitrary = arbitrary.array(arbitrary.integer()).map(List.from);
  const integerArbitrary = arbitrary.integer();

  it('should preserve length after map operation', () => {
    verifyProperty('map preserves length', [listArbitrary], (list: List<number>) => {
      const mapped = list.map((x: number) => x * 2);
      return mapped.size === list.size;
    });
  });

  it('should preserve elements after append/get', () => {
    verifyProperty(
      'append adds element correctly',
      [listArbitrary, integerArbitrary],
      (list: List<number>, element: number) => {
        const appended = list.append(element);
        return appended.size === list.size + 1 && appended.get(appended.size - 1).get() === element;
      },
    );
  });

  it('should preserve elements after prepend/get', () => {
    verifyProperty(
      'prepend adds element correctly',
      [listArbitrary, integerArbitrary],
      (list: List<number>, element: number) => {
        const prepended = list.prepend(element);
        return prepended.size === list.size + 1 && prepended.get(0).get() === element;
      },
    );
  });

  it('should keep original list unchanged after operations', () => {
    verifyProperty(
      'immutability is preserved',
      [listArbitrary, integerArbitrary],
      (list: List<number>, element: number) => {
        const originalSize = list.size;
        const originalArray = list.toArray();

        // Perform various operations
        list.append(element);
        list.prepend(element);
        list.map((x: number) => x * 2);
        list.filter((x: number) => x % 2 === 0);

        // Original should be unchanged
        return (
          list.size === originalSize &&
          JSON.stringify(list.toArray()) === JSON.stringify(originalArray)
        );
      },
    );
  });

  it('should filter correctly', () => {
    verifyProperty('filter works correctly', [listArbitrary], (list: List<number>) => {
      const isEven = (x: number) => x % 2 === 0;
      const filtered = list.filter(isEven);

      // Every element in filtered list should satisfy the predicate
      for (const element of filtered.toArray()) {
        if (!isEven(element)) return false;
      }

      // Filtered list should include all elements from original that match predicate
      const originalMatches = list.toArray().filter(isEven);
      return filtered.size === originalMatches.length;
    });
  });

  it('should concatenate correctly', () => {
    verifyProperty('concat works correctly', [listArbitrary, listArbitrary], (listA: List<number>, listB: List<number>) => {
      const concatenated = listA.concat(listB);

      return (
        concatenated.size === listA.size + listB.size &&
        JSON.stringify(concatenated.toArray()) ===
          JSON.stringify([...listA.toArray(), ...listB.toArray()])
      );
    });
  });
});
