import { describe, it, expect } from 'vitest';
import { List } from '../../../src/list';
import * as fusedOps from '../../../src/list/operation-fusion';

describe('Operation Fusion', () => {
  describe('mapFilter', () => {
    it('should map and filter in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Map and filter in a single pass
      const result = fusedOps.mapFilter(
        list,
        x => x * 2,
        x => x > 5
      );

      // Result should contain mapped and filtered values
      expect(result.toArray()).toEqual([6, 8, 10]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Map and filter in a single pass
      const result = fusedOps.mapFilter(
        list,
        x => x * 2,
        x => x > 5
      );

      // Result should be empty
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('filterMap', () => {
    it('should filter and map in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Filter and map in a single pass
      const result = fusedOps.filterMap(
        list,
        x => x % 2 === 1,
        x => x * 2
      );

      // Result should contain filtered and mapped values
      expect(result.toArray()).toEqual([2, 6, 10]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Filter and map in a single pass
      const result = fusedOps.filterMap(
        list,
        x => x % 2 === 1,
        x => x * 2
      );

      // Result should be empty
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('mapFilterReduce', () => {
    it('should map, filter, and reduce in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Map, filter, and reduce in a single pass
      const result = fusedOps.mapFilterReduce(
        list,
        x => x * 2,
        x => x > 5,
        (acc, x) => acc + x,
        0
      );

      // Result should be the sum of mapped and filtered values
      expect(result).toBe(24); // 6 + 8 + 10
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Map, filter, and reduce in a single pass
      const result = fusedOps.mapFilterReduce(
        list,
        x => x * 2,
        x => x > 5,
        (acc, x) => acc + x,
        0
      );

      // Result should be the initial value
      expect(result).toBe(0);
    });
  });

  describe('filterReduce', () => {
    it('should filter and reduce in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Filter and reduce in a single pass
      const result = fusedOps.filterReduce(
        list,
        x => x % 2 === 1,
        (acc, x) => acc + x,
        0
      );

      // Result should be the sum of filtered values
      expect(result).toBe(9); // 1 + 3 + 5
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Filter and reduce in a single pass
      const result = fusedOps.filterReduce(
        list,
        x => x % 2 === 1,
        (acc, x) => acc + x,
        0
      );

      // Result should be the initial value
      expect(result).toBe(0);
    });
  });

  describe('mapReduce', () => {
    it('should map and reduce in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Map and reduce in a single pass
      const result = fusedOps.mapReduce(
        list,
        x => x * 2,
        (acc, x) => acc + x,
        0
      );

      // Result should be the sum of mapped values
      expect(result).toBe(30); // 2 + 4 + 6 + 8 + 10
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Map and reduce in a single pass
      const result = fusedOps.mapReduce(
        list,
        x => x * 2,
        (acc, x) => acc + x,
        0
      );

      // Result should be the initial value
      expect(result).toBe(0);
    });
  });

  describe('mapSlice', () => {
    it('should map and slice in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Map and slice in a single pass
      const result = fusedOps.mapSlice(
        list,
        x => x * 2,
        1,
        4
      );

      // Result should contain mapped and sliced values
      expect(result.toArray()).toEqual([4, 6, 8]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Map and slice in a single pass
      const result = fusedOps.mapSlice(
        list,
        x => x * 2,
        1,
        4
      );

      // Result should be empty
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('sliceMap', () => {
    it('should slice and map in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Slice and map in a single pass
      const result = fusedOps.sliceMap(
        list,
        1,
        4,
        x => x * 2
      );

      // Result should contain sliced and mapped values
      expect(result.toArray()).toEqual([4, 6, 8]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Slice and map in a single pass
      const result = fusedOps.sliceMap(
        list,
        1,
        4,
        x => x * 2
      );

      // Result should be empty
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('filterSlice', () => {
    it('should filter and slice in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Filter and slice in a single pass
      const result = fusedOps.filterSlice(
        list,
        x => x % 2 === 1,
        1,
        4
      );

      // Result should contain filtered and sliced values
      expect(result.toArray()).toEqual([3]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Filter and slice in a single pass
      const result = fusedOps.filterSlice(
        list,
        x => x % 2 === 1,
        1,
        4
      );

      // Result should be empty
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('sliceFilter', () => {
    it('should slice and filter in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Slice and filter in a single pass
      const result = fusedOps.sliceFilter(
        list,
        1,
        4,
        x => x % 2 === 1
      );

      // Result should contain sliced and filtered values
      expect(result.toArray()).toEqual([3]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Slice and filter in a single pass
      const result = fusedOps.sliceFilter(
        list,
        1,
        4,
        x => x % 2 === 1
      );

      // Result should be empty
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('concatMap', () => {
    it('should concatenate and map in a single pass', () => {
      const list1 = List.from([1, 2, 3]);
      const list2 = List.from([4, 5]);

      // Concatenate and map in a single pass
      const result = fusedOps.concatMap(
        list1,
        list2,
        x => x * 2
      );

      // Result should contain concatenated and mapped values
      expect(result.toArray()).toEqual([2, 4, 6, 8, 10]);
    });

    it('should handle empty lists', () => {
      const list1 = List.empty<number>();
      const list2 = List.empty<number>();

      // Concatenate and map in a single pass
      const result = fusedOps.concatMap(
        list1,
        list2,
        x => x * 2
      );

      // Result should be empty
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('batchUpdate', () => {
    it('should update multiple elements in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Update multiple elements in a single pass
      const result = fusedOps.batchUpdate(
        list,
        [
          [1, 20],
          [3, 40]
        ]
      );

      // Result should contain updated values
      expect(result.toArray()).toEqual([1, 20, 3, 40, 5]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Update multiple elements in a single pass
      const result = fusedOps.batchUpdate(
        list,
        [
          [1, 20],
          [3, 40]
        ]
      );

      // Result should be empty
      expect(result.isEmpty).toBe(true);
    });

    it('should handle empty updates', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Update with empty updates
      const result = fusedOps.batchUpdate(
        list,
        []
      );

      // Result should be the same as the original list
      expect(result).toBe(list);
    });
  });

  describe('batchInsert', () => {
    it('should insert multiple elements in a single pass', () => {
      const list = List.from([1, 2, 3]);

      // Insert multiple elements in a single pass
      const result = fusedOps.batchInsert(
        list,
        [
          [1, 20],
          [3, 40]
        ]
      );

      // Result should contain inserted values
      expect(result.toArray()).toEqual([1, 20, 2, 3, 40]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Insert multiple elements in a single pass
      const result = fusedOps.batchInsert(
        list,
        [
          [0, 20],
          [0, 40]
        ]
      );

      // Result should contain inserted values
      expect(result.toArray()).toEqual([20, 40]);
    });

    it('should handle empty inserts', () => {
      const list = List.from([1, 2, 3]);

      // Insert with empty inserts
      const result = fusedOps.batchInsert(
        list,
        []
      );

      // Result should be the same as the original list
      expect(result).toBe(list);
    });
  });

  describe('batchRemove', () => {
    it('should remove multiple elements in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Remove multiple elements in a single pass
      const result = fusedOps.batchRemove(
        list,
        [1, 3]
      );

      // Result should not contain removed values
      expect(result.toArray()).toEqual([1, 3, 5]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      // Remove multiple elements in a single pass
      const result = fusedOps.batchRemove(
        list,
        [1, 3]
      );

      // Result should be empty
      expect(result.isEmpty).toBe(true);
    });

    it('should handle empty removes', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Remove with empty removes
      const result = fusedOps.batchRemove(
        list,
        []
      );

      // Result should be the same as the original list
      expect(result).toBe(list);
    });
  });
});
