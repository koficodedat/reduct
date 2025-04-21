/**
 * Tests for WasmEnhancedHAMTPersistentVector
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WasmEnhancedHAMTPersistentVector } from '../../../src/list/wasm-enhanced-hamt-persistent-vector';
import { EnhancedHAMTPersistentVector } from '../../../src/list/enhanced-hamt-persistent-vector';
import { isWebAssemblySupported } from '../../../src/utils/mock-wasm';

describe('WasmEnhancedHAMTPersistentVector', () => {
  describe('creation', () => {
    it('should create an empty vector', () => {
      const vector = WasmEnhancedHAMTPersistentVector.empty();
      expect(vector.size).toBe(0);
      expect(vector.isEmpty).toBe(true);
    });

    it('should create a vector from an array', () => {
      const array = [1, 2, 3, 4, 5];
      const vector = WasmEnhancedHAMTPersistentVector.from(array);
      expect(vector.size).toBe(5);
      expect(vector.isEmpty).toBe(false);
      expect(vector.get(0)).toBe(1);
      expect(vector.get(4)).toBe(5);
    });

    it('should create a vector with a single element', () => {
      const vector = WasmEnhancedHAMTPersistentVector.of(42);
      expect(vector.size).toBe(1);
      expect(vector.isEmpty).toBe(false);
      expect(vector.get(0)).toBe(42);
    });
  });

  describe('basic operations', () => {
    it('should get elements at specific indices', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      expect(vector.get(0)).toBe(1);
      expect(vector.get(2)).toBe(3);
      expect(vector.get(4)).toBe(5);
      expect(vector.get(-1)).toBeUndefined();
      expect(vector.get(5)).toBeUndefined();
    });

    it('should set elements at specific indices', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const newVector = vector.set(2, 42);
      
      // Original vector should be unchanged
      expect(vector.get(2)).toBe(3);
      
      // New vector should have the updated value
      expect(newVector.get(2)).toBe(42);
      expect(newVector.size).toBe(5);
    });

    it('should append elements', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3]);
      const newVector = vector.append(4);
      
      // Original vector should be unchanged
      expect(vector.size).toBe(3);
      expect(vector.get(3)).toBeUndefined();
      
      // New vector should have the appended value
      expect(newVector.size).toBe(4);
      expect(newVector.get(3)).toBe(4);
    });

    it('should prepend elements', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([2, 3, 4]);
      const newVector = vector.prepend(1);
      
      // Original vector should be unchanged
      expect(vector.size).toBe(3);
      expect(vector.get(0)).toBe(2);
      
      // New vector should have the prepended value
      expect(newVector.size).toBe(4);
      expect(newVector.get(0)).toBe(1);
      expect(newVector.get(1)).toBe(2);
    });

    it('should insert elements at specific indices', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 3, 4]);
      const newVector = vector.insert(1, 2);
      
      // Original vector should be unchanged
      expect(vector.size).toBe(3);
      expect(vector.get(1)).toBe(3);
      
      // New vector should have the inserted value
      expect(newVector.size).toBe(4);
      expect(newVector.get(0)).toBe(1);
      expect(newVector.get(1)).toBe(2);
      expect(newVector.get(2)).toBe(3);
      expect(newVector.get(3)).toBe(4);
    });

    it('should remove elements at specific indices', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const newVector = vector.remove(2);
      
      // Original vector should be unchanged
      expect(vector.size).toBe(5);
      expect(vector.get(2)).toBe(3);
      
      // New vector should have the removed value
      expect(newVector.size).toBe(4);
      expect(newVector.get(0)).toBe(1);
      expect(newVector.get(1)).toBe(2);
      expect(newVector.get(2)).toBe(4);
      expect(newVector.get(3)).toBe(5);
    });
  });

  describe('WebAssembly acceleration', () => {
    let originalIsWebAssemblySupported: typeof isWebAssemblySupported;
    
    beforeEach(() => {
      originalIsWebAssemblySupported = isWebAssemblySupported;
    });
    
    afterEach(() => {
      (global as any).isWebAssemblySupported = originalIsWebAssemblySupported;
    });
    
    it('should check if WebAssembly is supported', () => {
      expect(typeof isWebAssemblySupported).toBe('function');
    });
    
    it('should fall back to JavaScript implementation when WebAssembly is not supported', () => {
      // Mock isWebAssemblySupported to return false
      (global as any).isWebAssemblySupported = vi.fn().mockReturnValue(false);
      
      // Create a vector with WebAssembly disabled
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      
      // Perform operations
      const mapped = vector.map(value => value * 2);
      const filtered = vector.filter(value => value % 2 === 0);
      const sum = vector.reduce((acc, value) => acc + value, 0);
      
      // Verify the results
      expect(mapped.size).toBe(5);
      expect(mapped.get(0)).toBe(2);
      expect(filtered.size).toBe(2);
      expect(filtered.get(0)).toBe(2);
      expect(sum).toBe(15);
    });
    
    it('should produce the same result as JavaScript implementation', () => {
      // Create vectors with both implementations
      const wasmVector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const jsVector = EnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      
      // Perform operations with both implementations
      const wasmMapped = wasmVector.map(value => value * 2);
      const jsMapped = jsVector.map(value => value * 2);
      
      const wasmFiltered = wasmVector.filter(value => value % 2 === 0);
      const jsFiltered = jsVector.filter(value => value % 2 === 0);
      
      const wasmSum = wasmVector.reduce((acc, value) => acc + value, 0);
      const jsSum = jsVector.reduce((acc, value) => acc + value, 0);
      
      // Verify that the results are the same
      expect(wasmMapped.toArray()).toEqual(jsMapped.toArray());
      expect(wasmFiltered.toArray()).toEqual(jsFiltered.toArray());
      expect(wasmSum).toBe(jsSum);
    });
  });

  describe('specialized numeric operations', () => {
    it('should calculate the sum of elements', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const sum = vector.sum();
      
      expect(sum).toBe(15);
    });
    
    it('should calculate the average of elements', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const average = vector.average();
      
      expect(average).toBe(3);
    });
  });

  describe('combined operations', () => {
    it('should perform mapFilterReduce', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const result = vector.mapFilterReduce(
        value => value * 2,
        value => value > 5,
        (acc, value) => acc + value,
        0
      );
      
      expect(result).toBe(24); // (2*3) + (2*4) + (2*5) = 6 + 8 + 10 = 24
    });

    it('should perform mapReduce', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const result = vector.mapReduce(
        value => value * 2,
        (acc, value) => acc + value,
        0
      );
      
      expect(result).toBe(30); // 2 + 4 + 6 + 8 + 10 = 30
    });

    it('should perform filterReduce', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const result = vector.filterReduce(
        value => value % 2 === 0,
        (acc, value) => acc + value,
        0
      );
      
      expect(result).toBe(6); // 2 + 4 = 6
    });

    it('should perform filterMap', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const result = vector.filterMap(
        value => value % 2 === 0,
        value => value * 2
      );
      
      expect(result.toArray()).toEqual([4, 8]);
    });

    it('should perform mapFilter', () => {
      const vector = WasmEnhancedHAMTPersistentVector.from([1, 2, 3, 4, 5]);
      const result = vector.mapFilter(
        value => value * 2,
        value => value > 5
      );
      
      expect(result.toArray()).toEqual([6, 8, 10]);
    });
  });
});
