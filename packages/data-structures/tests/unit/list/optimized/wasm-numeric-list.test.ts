/**
 * Tests for WebAssembly-Accelerated NumericList
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WasmNumericList } from '../../../../src/list/optimized/wasm-numeric-list';
import * as wasmModule from '@reduct/wasm';

// Mock the WebAssembly module
vi.mock('@reduct/wasm', () => {
  return {
    isWebAssemblySupported: vi.fn().mockReturnValue(true),
    NumericAccelerator: vi.fn().mockImplementation(() => {
      return {
        map: vi.fn().mockImplementation((array, fn) => array.map(fn)),
        filter: vi.fn().mockImplementation((array, fn) => array.filter(fn)),
        reduce: vi.fn().mockImplementation((array, fn, initial) => array.reduce(fn, initial)),
        mapFilter: vi.fn().mockImplementation((array, mapFn, filterFn) => {
          return array.map(mapFn).filter(filterFn);
        }),
        sum: vi.fn().mockImplementation((array) => array.reduce((a, b) => a + b, 0)),
        average: vi.fn().mockImplementation((array) => {
          return array.length === 0 ? 0 : array.reduce((a, b) => a + b, 0) / array.length;
        }),
        min: vi.fn().mockImplementation((array) => {
          return array.length === 0 ? Infinity : Math.min(...array);
        }),
        max: vi.fn().mockImplementation((array) => {
          return array.length === 0 ? -Infinity : Math.max(...array);
        }),
        sort: vi.fn().mockImplementation((array, compareFn) => {
          return [...array].sort(compareFn);
        }),
        median: vi.fn().mockImplementation((array) => {
          if (array.length === 0) return NaN;
          if (array.length === 1) return array[0];
          
          const sorted = [...array].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          
          if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
          } else {
            return sorted[mid];
          }
        }),
        standardDeviation: vi.fn().mockImplementation((array) => {
          if (array.length === 0) return NaN;
          if (array.length === 1) return 0;
          
          const mean = array.reduce((a, b) => a + b, 0) / array.length;
          const variance = array.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / array.length;
          return Math.sqrt(variance);
        }),
        percentile: vi.fn().mockImplementation((array, percentile) => {
          if (array.length === 0) return NaN;
          if (array.length === 1) return array[0];
          
          const p = Math.max(0, Math.min(100, percentile));
          const sorted = [...array].sort((a, b) => a - b);
          const index = (p / 100) * (sorted.length - 1);
          const lower = Math.floor(index);
          const upper = Math.ceil(index);
          const weight = index - lower;
          
          if (lower === upper) {
            return sorted[lower];
          }
          
          return sorted[lower] * (1 - weight) + sorted[upper] * weight;
        })
      };
    })
  };
});

describe('WasmNumericList', () => {
  let list: WasmNumericList;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Basic operations', () => {
    it('should create an empty list', () => {
      list = new WasmNumericList();
      expect(list.size).toBe(0);
      expect(list.isEmpty).toBe(true);
    });
    
    it('should create a list with initial data', () => {
      list = new WasmNumericList([1, 2, 3]);
      expect(list.size).toBe(3);
      expect(list.isEmpty).toBe(false);
      expect(list.get(0)).toBe(1);
      expect(list.get(1)).toBe(2);
      expect(list.get(2)).toBe(3);
    });
    
    it('should return undefined for out-of-bounds indices', () => {
      list = new WasmNumericList([1, 2, 3]);
      expect(list.get(-1)).toBeUndefined();
      expect(list.get(3)).toBeUndefined();
    });
    
    it('should set an element at a specific index', () => {
      list = new WasmNumericList([1, 2, 3]);
      const newList = list.set(1, 5);
      expect(newList.get(1)).toBe(5);
      expect(list.get(1)).toBe(2); // Original list should be unchanged
    });
    
    it('should insert an element at a specific index', () => {
      list = new WasmNumericList([1, 2, 3]);
      const newList = list.insert(1, 5);
      expect(newList.size).toBe(4);
      expect(newList.get(0)).toBe(1);
      expect(newList.get(1)).toBe(5);
      expect(newList.get(2)).toBe(2);
      expect(newList.get(3)).toBe(3);
    });
    
    it('should remove an element at a specific index', () => {
      list = new WasmNumericList([1, 2, 3]);
      const newList = list.remove(1);
      expect(newList.size).toBe(2);
      expect(newList.get(0)).toBe(1);
      expect(newList.get(1)).toBe(3);
    });
    
    it('should append an element to the end of the list', () => {
      list = new WasmNumericList([1, 2, 3]);
      const newList = list.append(4);
      expect(newList.size).toBe(4);
      expect(newList.get(3)).toBe(4);
    });
    
    it('should prepend an element to the beginning of the list', () => {
      list = new WasmNumericList([1, 2, 3]);
      const newList = list.prepend(0);
      expect(newList.size).toBe(4);
      expect(newList.get(0)).toBe(0);
    });
    
    it('should concatenate two lists', () => {
      list = new WasmNumericList([1, 2, 3]);
      const other = new WasmNumericList([4, 5, 6]);
      const newList = list.concat(other);
      expect(newList.size).toBe(6);
      expect(newList.get(0)).toBe(1);
      expect(newList.get(3)).toBe(4);
      expect(newList.get(5)).toBe(6);
    });
    
    it('should convert the list to an array', () => {
      list = new WasmNumericList([1, 2, 3]);
      const array = list.toArray();
      expect(array).toEqual([1, 2, 3]);
    });
    
    it('should get the first element', () => {
      list = new WasmNumericList([1, 2, 3]);
      expect(list.first()).toBe(1);
    });
    
    it('should get the last element', () => {
      list = new WasmNumericList([1, 2, 3]);
      expect(list.last()).toBe(3);
    });
  });
  
  describe('WebAssembly-accelerated operations', () => {
    it('should use WebAssembly for map operation', () => {
      list = new WasmNumericList([1, 2, 3]);
      const mapFn = (x: number) => x * 2;
      const newList = list.map(mapFn);
      
      expect(wasmModule.NumericAccelerator).toHaveBeenCalled();
      expect(wasmModule.isWebAssemblySupported).toHaveBeenCalled();
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.map).toHaveBeenCalledWith([1, 2, 3], mapFn);
      
      expect(newList.toArray()).toEqual([2, 4, 6]);
    });
    
    it('should use WebAssembly for filter operation', () => {
      list = new WasmNumericList([1, 2, 3, 4, 5]);
      const filterFn = (x: number) => x % 2 === 0;
      const newList = list.filter(filterFn);
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.filter).toHaveBeenCalledWith([1, 2, 3, 4, 5], filterFn);
      
      expect(newList.toArray()).toEqual([2, 4]);
    });
    
    it('should use WebAssembly for reduce operation', () => {
      list = new WasmNumericList([1, 2, 3, 4, 5]);
      const reduceFn = (acc: number, x: number) => acc + x;
      const result = list.reduce(reduceFn, 0);
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.reduce).toHaveBeenCalledWith([1, 2, 3, 4, 5], reduceFn, 0);
      
      expect(result).toBe(15);
    });
    
    it('should use WebAssembly for mapFilter operation', () => {
      list = new WasmNumericList([1, 2, 3, 4, 5]);
      const mapFn = (x: number) => x * 2;
      const filterFn = (x: number) => x % 4 === 0;
      const newList = list.mapFilter(mapFn, filterFn);
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.mapFilter).toHaveBeenCalledWith([1, 2, 3, 4, 5], mapFn, filterFn);
      
      expect(newList.toArray()).toEqual([4, 8]);
    });
    
    it('should use WebAssembly for sum operation', () => {
      list = new WasmNumericList([1, 2, 3, 4, 5]);
      const result = list.sum();
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.sum).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
      
      expect(result).toBe(15);
    });
    
    it('should use WebAssembly for average operation', () => {
      list = new WasmNumericList([1, 2, 3, 4, 5]);
      const result = list.average();
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.average).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
      
      expect(result).toBe(3);
    });
    
    it('should use WebAssembly for min operation', () => {
      list = new WasmNumericList([5, 3, 1, 4, 2]);
      const result = list.min();
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.min).toHaveBeenCalledWith([5, 3, 1, 4, 2]);
      
      expect(result).toBe(1);
    });
    
    it('should use WebAssembly for max operation', () => {
      list = new WasmNumericList([5, 3, 1, 4, 2]);
      const result = list.max();
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.max).toHaveBeenCalledWith([5, 3, 1, 4, 2]);
      
      expect(result).toBe(5);
    });
    
    it('should use WebAssembly for sort operation', () => {
      list = new WasmNumericList([5, 3, 1, 4, 2]);
      const newList = list.sort();
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.sort).toHaveBeenCalledWith([5, 3, 1, 4, 2], undefined);
      
      expect(newList.toArray()).toEqual([1, 2, 3, 4, 5]);
    });
    
    it('should use WebAssembly for median operation', () => {
      list = new WasmNumericList([5, 3, 1, 4, 2]);
      const result = list.median();
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.median).toHaveBeenCalledWith([5, 3, 1, 4, 2]);
      
      expect(result).toBe(3);
    });
    
    it('should use WebAssembly for standardDeviation operation', () => {
      list = new WasmNumericList([1, 2, 3, 4, 5]);
      const result = list.standardDeviation();
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.standardDeviation).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
      
      // Standard deviation of [1, 2, 3, 4, 5] is approximately 1.414
      expect(result).toBeCloseTo(1.414, 1);
    });
    
    it('should use WebAssembly for percentile operation', () => {
      list = new WasmNumericList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const result = list.percentile(90);
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.percentile).toHaveBeenCalledWith([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90);
      
      expect(result).toBe(9.1);
    });
  });
  
  describe('Fallback behavior', () => {
    it('should fall back to JavaScript implementation when WebAssembly is not supported', () => {
      (wasmModule.isWebAssemblySupported as any).mockReturnValueOnce(false);
      
      list = new WasmNumericList([1, 2, 3]);
      const mapFn = (x: number) => x * 2;
      const newList = list.map(mapFn);
      
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      expect(accelerator.map).not.toHaveBeenCalled();
      
      expect(newList.toArray()).toEqual([2, 4, 6]);
    });
    
    it('should fall back to JavaScript implementation when WebAssembly operation fails', () => {
      const accelerator = (wasmModule.NumericAccelerator as any).mock.results[0].value;
      accelerator.map.mockImplementationOnce(() => {
        throw new Error('WebAssembly operation failed');
      });
      
      list = new WasmNumericList([1, 2, 3]);
      const mapFn = (x: number) => x * 2;
      const newList = list.map(mapFn);
      
      expect(newList.toArray()).toEqual([2, 4, 6]);
    });
  });
});
