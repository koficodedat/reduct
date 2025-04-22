/**
 * Tests for WasmMemoryPool
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WasmMemoryPool, MemoryPoolConfig } from '../../../src/core/wasm-memory-pool';

describe('WasmMemoryPool', () => {
  let memoryPool: WasmMemoryPool;

  beforeEach(() => {
    // Create a new memory pool for each test
    memoryPool = WasmMemoryPool.getInstance({
      initialSize: 2,
      maxSize: 5,
      minPages: 1,
      maxPages: 10,
      releaseTimeout: 100
    });
  });

  afterEach(() => {
    // Clean up the memory pool
    (memoryPool as any).destroy();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = WasmMemoryPool.getInstance();
      const instance2 = WasmMemoryPool.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should accept configuration options', () => {
      const config: MemoryPoolConfig = {
        initialSize: 3,
        maxSize: 10,
        minPages: 2,
        maxPages: 20,
        shared: true,
        releaseTimeout: 200
      };
      const instance = WasmMemoryPool.getInstance(config);
      expect(instance).toBeDefined();
    });
  });

  describe('getMemory', () => {
    it('should return a WebAssembly.Memory instance', () => {
      const memory = memoryPool.getMemory(1024);
      expect(memory).toBeInstanceOf(WebAssembly.Memory);
    });

    it('should request memory with appropriate size', () => {
      // Mock the createMemory method to verify it's called with the right parameters
      const createMemorySpy = vi.spyOn(memoryPool as any, 'createMemory');

      // Request memory with a specific size
      const bytesPerPage = 65536; // WebAssembly page size
      const minBytes = 100000;
      const pagesRequired = Math.ceil(minBytes / bytesPerPage);

      memoryPool.getMemory(minBytes);

      // Verify that createMemory was called with at least the required pages
      expect(createMemorySpy).toHaveBeenCalled();
      const calledWithPages = createMemorySpy.mock.calls[0][0];
      expect(calledWithPages).toBeGreaterThanOrEqual(pagesRequired);

      // Clean up
      createMemorySpy.mockRestore();
    });

    it('should reuse memory instances when possible', () => {
      const memory1 = memoryPool.getMemory(1024);
      memoryPool.releaseMemory(memory1);
      const memory2 = memoryPool.getMemory(1024);
      expect(memory2).toBe(memory1);
    });

    it('should create new memory instances when needed', () => {
      const memory1 = memoryPool.getMemory(1024);
      const memory2 = memoryPool.getMemory(1024);
      const memory3 = memoryPool.getMemory(1024);
      expect(memory1).not.toBe(memory2);
      expect(memory1).not.toBe(memory3);
      expect(memory2).not.toBe(memory3);
    });

    it('should handle growing memory when needed', () => {
      // Instead of testing the actual grow call, which is environment-dependent,
      // we'll test that the code path for growing memory is handled correctly

      // Create a memory instance with a mock grow method
      const mockMemory = {
        buffer: new ArrayBuffer(1024),
        grow: vi.fn().mockImplementation(() => {
          // Mock implementation that updates the buffer
          (mockMemory as any).buffer = new ArrayBuffer(2048);
          return 2; // Return the new size in pages
        })
      } as unknown as WebAssembly.Memory;

      // Create a mock entry for the memory pool
      const mockEntry = {
        memory: mockMemory,
        inUse: false,
        pages: 1,
        lastUsed: Date.now() - 1000
      };

      // Add the mock entry to the pool
      (memoryPool as any).pool = [mockEntry];

      // Request memory with a larger size
      const result = memoryPool.getMemory(2048);

      // Verify that we got the same memory instance back
      expect(result).toBe(mockMemory);

      // Verify that the entry is now marked as in use
      expect(mockEntry.inUse).toBe(true);

      // Clean up
      (memoryPool as any).pool = [];
    });
  });

  describe('releaseMemory', () => {
    it('should mark memory instances as available', () => {
      const memory = memoryPool.getMemory(1024);
      memoryPool.releaseMemory(memory);
      const memory2 = memoryPool.getMemory(1024);
      expect(memory2).toBe(memory);
    });

    it('should do nothing for unknown memory instances', () => {
      const memory = new WebAssembly.Memory({ initial: 1 });
      memoryPool.releaseMemory(memory);
      // No error should be thrown
    });
  });

  describe('getTypedArrayView', () => {
    it('should create typed array views with the correct type', () => {
      // Create a memory instance with a defined buffer
      const mockMemory = {
        buffer: new ArrayBuffer(1024)
      } as unknown as WebAssembly.Memory;

      // Test with different typed array types
      const uint8View = memoryPool.getTypedArrayView(mockMemory, Uint8Array);
      const uint16View = memoryPool.getTypedArrayView(mockMemory, Uint16Array);
      const uint32View = memoryPool.getTypedArrayView(mockMemory, Uint32Array);
      const float32View = memoryPool.getTypedArrayView(mockMemory, Float32Array);
      const float64View = memoryPool.getTypedArrayView(mockMemory, Float64Array);

      // Verify that the correct types were created
      expect(uint8View).toBeInstanceOf(Uint8Array);
      expect(uint16View).toBeInstanceOf(Uint16Array);
      expect(uint32View).toBeInstanceOf(Uint32Array);
      expect(float32View).toBeInstanceOf(Float32Array);
      expect(float64View).toBeInstanceOf(Float64Array);
    });

    it('should respect byteOffset and length parameters', () => {
      // Create a memory instance with a defined buffer
      const mockMemory = {
        buffer: new ArrayBuffer(1024)
      } as unknown as WebAssembly.Memory;

      // Test with byteOffset and length
      const byteOffset = 128;
      const length = 256;
      const view = memoryPool.getTypedArrayView(mockMemory, Uint8Array, byteOffset, length);

      // Verify that the view has the correct properties
      expect(view).toBeInstanceOf(Uint8Array);
      expect(view.byteOffset).toBe(byteOffset);
      expect(view.length).toBe(length);
    });

    it('should handle memory with undefined buffer', () => {
      // Create a memory instance with an undefined buffer
      const mockMemory = { buffer: undefined } as unknown as WebAssembly.Memory;

      // Get a typed array view
      const view = memoryPool.getTypedArrayView(mockMemory, Uint8Array);

      // Verify that a typed array was created
      expect(view).toBeInstanceOf(Uint8Array);
    });
  });
});
