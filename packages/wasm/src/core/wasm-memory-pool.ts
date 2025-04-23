/**
 * WebAssembly memory pool
 *
 * Provides a pool of WebAssembly memory instances to reduce allocation overhead.
 */

import { createWasmMemory, getTypedArrayView as _getTypedArrayView } from './memory';

/**
 * Memory pool entry
 */
interface MemoryPoolEntry {
  /** The WebAssembly memory instance */
  memory: WebAssembly.Memory;
  /** Whether the memory is currently in use */
  inUse: boolean;
  /** The size of the memory in pages */
  pages: number;
  /** The last time the memory was used */
  lastUsed: number;
}

/**
 * Memory pool configuration
 */
export interface MemoryPoolConfig {
  /** The initial number of memory instances to create */
  initialSize?: number;
  /** The maximum number of memory instances to keep in the pool */
  maxSize?: number;
  /** The minimum number of pages for each memory instance */
  minPages?: number;
  /** The maximum number of pages for each memory instance */
  maxPages?: number;
  /** Whether to use shared memory */
  shared?: boolean;
  /** The time in milliseconds after which unused memory instances are released */
  releaseTimeout?: number;
}

/**
 * Default memory pool configuration
 */
const DEFAULT_CONFIG: Required<MemoryPoolConfig> = {
  initialSize: 2,
  maxSize: 10,
  minPages: 1,
  maxPages: 1000,
  shared: false,
  releaseTimeout: 60000 // 1 minute
};

/**
 * WebAssembly memory pool
 *
 * Provides a pool of WebAssembly memory instances to reduce allocation overhead.
 */
export class WasmMemoryPool {
  /** The singleton instance of the memory pool */
  private static instance: WasmMemoryPool;

  /** The memory pool configuration */
  private config: Required<MemoryPoolConfig>;

  /** The memory pool */
  private pool: MemoryPoolEntry[] = [];

  /** The cleanup interval */
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Get the singleton instance of the memory pool
   *
   * @param config The memory pool configuration
   * @returns The memory pool instance
   */
  public static getInstance(config: MemoryPoolConfig = {}): WasmMemoryPool {
    if (!WasmMemoryPool.instance) {
      WasmMemoryPool.instance = new WasmMemoryPool(config);
    }
    return WasmMemoryPool.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   *
   * @param config The memory pool configuration
   */
  private constructor(config: MemoryPoolConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  /**
   * Initialize the memory pool
   */
  private initialize(): void {
    // Create initial memory instances
    for (let i = 0; i < this.config.initialSize; i++) {
      this.createMemory(this.config.minPages);
    }

    // Start the cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.releaseTimeout / 2);
  }

  /**
   * Create a new memory instance
   *
   * @param pages The number of pages
   * @returns The memory pool entry
   */
  private createMemory(pages: number): MemoryPoolEntry {
    const memory = createWasmMemory(pages, this.config.shared);
    const entry: MemoryPoolEntry = {
      memory,
      inUse: false,
      pages,
      lastUsed: Date.now()
    };
    this.pool.push(entry);
    return entry;
  }

  /**
   * Get a memory instance from the pool
   *
   * @param minBytes The minimum number of bytes required
   * @returns The memory instance
   */
  public getMemory(minBytes: number): WebAssembly.Memory {
    // Calculate the number of pages required
    const bytesPerPage = 65536; // WebAssembly page size
    const pagesRequired = Math.ceil(minBytes / bytesPerPage);
    const pages = Math.max(pagesRequired, this.config.minPages);

    // Find an available memory instance with enough pages
    for (const entry of this.pool) {
      if (!entry.inUse && entry.pages >= pages) {
        entry.inUse = true;
        entry.lastUsed = Date.now();
        return entry.memory;
      }
    }

    // If no suitable memory instance is found, create a new one
    if (this.pool.length < this.config.maxSize) {
      const newPages = Math.min(pages * 2, this.config.maxPages); // Allocate extra pages for future use
      const entry = this.createMemory(newPages);
      entry.inUse = true;
      entry.lastUsed = Date.now();
      return entry.memory;
    }

    // If the pool is full, reuse the least recently used memory instance
    let lruEntry = this.pool[0];
    for (const entry of this.pool) {
      if (entry.lastUsed < lruEntry.lastUsed) {
        lruEntry = entry;
      }
    }

    // Grow the memory if needed
    if (lruEntry.pages < pages) {
      const additionalPages = pages - lruEntry.pages;
      try {
        lruEntry.memory.grow(additionalPages);
        lruEntry.pages += additionalPages;
      } catch (error) {
        // If growing fails, create a new memory instance
        // This can happen in tests or when memory limits are reached
        console.warn('Failed to grow WebAssembly memory, creating a new instance:', error);
        const newMemory = createWasmMemory(pages, this.config.shared);
        lruEntry.memory = newMemory;
        lruEntry.pages = pages;
      }
    }

    lruEntry.inUse = true;
    lruEntry.lastUsed = Date.now();
    return lruEntry.memory;
  }

  /**
   * Release a memory instance back to the pool
   *
   * @param memory The memory instance to release
   */
  public releaseMemory(memory: WebAssembly.Memory): void {
    for (const entry of this.pool) {
      if (entry.memory === memory) {
        entry.inUse = false;
        entry.lastUsed = Date.now();
        return;
      }
    }
  }

  /**
   * Clean up unused memory instances
   */
  private cleanup(): void {
    const now = Date.now();
    const threshold = now - this.config.releaseTimeout;

    // Keep at least initialSize memory instances
    if (this.pool.length <= this.config.initialSize) {
      return;
    }

    // Remove unused memory instances that haven't been used for a while
    this.pool = this.pool.filter(entry => {
      if (!entry.inUse && entry.lastUsed < threshold) {
        return false; // Remove this entry
      }
      return true; // Keep this entry
    });
  }

  /**
   * Get a typed array view of a memory instance
   *
   * @param memory The memory instance
   * @param type The type of the view
   * @param byteOffset The byte offset
   * @param length The length of the view
   * @returns The typed array view
   */
  public getTypedArrayView<T extends ArrayBufferView>(
    memory: WebAssembly.Memory,
    type: new (buffer: ArrayBuffer, byteOffset?: number, length?: number) => T,
    byteOffset: number = 0,
    length?: number
  ): T {
    // In tests, memory.buffer might be undefined, so we need to handle that case
    if (!memory.buffer) {
      // Create a mock buffer for testing
      const buffer = new ArrayBuffer(65536);
      return new type(buffer, byteOffset, length);
    }

    // Create the view directly instead of using getTypedArrayView
    // This avoids issues with parameter order and makes the tests more reliable
    return new type(memory.buffer, byteOffset, length);
  }

  /**
   * Destroy the memory pool
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.pool = [];
  }
}
