/**
 * WebAssembly memory management utilities
 */

/**
 * Options for creating a WebAssembly memory
 */
export interface WasmMemoryOptions {
  /**
   * Initial memory size in pages (64KB per page)
   * @default 1
   */
  initial?: number;
  
  /**
   * Maximum memory size in pages (64KB per page)
   */
  maximum?: number;
  
  /**
   * Whether the memory is shared (for threads)
   * @default false
   */
  shared?: boolean;
}

/**
 * Create a WebAssembly memory
 * @param options Options for creating the memory
 * @returns The WebAssembly memory
 */
export function createWasmMemory(options: WasmMemoryOptions = {}): WebAssembly.Memory {
  const { initial = 1, maximum, shared = false } = options;
  
  try {
    return new WebAssembly.Memory({
      initial,
      maximum,
      shared: shared && typeof SharedArrayBuffer === 'function'
    });
  } catch (error) {
    // If shared memory fails, try without shared
    if (shared) {
      try {
        return new WebAssembly.Memory({ initial, maximum });
      } catch (fallbackError) {
        throw new Error(`Failed to create WebAssembly memory: ${fallbackError}`);
      }
    }
    throw new Error(`Failed to create WebAssembly memory: ${error}`);
  }
}

/**
 * Copy data from JavaScript to WebAssembly memory
 * @param memory The WebAssembly memory
 * @param offset The offset in the memory to write to
 * @param data The data to write
 */
export function copyToWasmMemory(
  memory: WebAssembly.Memory,
  offset: number,
  data: ArrayBufferView | ArrayBuffer
): void {
  const view = new Uint8Array(memory.buffer);
  const source = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer);
  
  // Check if the data fits in the memory
  if (offset + source.byteLength > view.byteLength) {
    throw new Error('Data does not fit in WebAssembly memory');
  }
  
  // Copy the data
  view.set(source, offset);
}

/**
 * Copy data from WebAssembly memory to JavaScript
 * @param memory The WebAssembly memory
 * @param offset The offset in the memory to read from
 * @param length The number of bytes to read
 * @returns The copied data as a Uint8Array
 */
export function copyFromWasmMemory(
  memory: WebAssembly.Memory,
  offset: number,
  length: number
): Uint8Array {
  const view = new Uint8Array(memory.buffer);
  
  // Check if the requested data is within the memory bounds
  if (offset + length > view.byteLength) {
    throw new Error('Requested data is outside WebAssembly memory bounds');
  }
  
  // Create a copy of the data
  return new Uint8Array(view.buffer.slice(offset, offset + length));
}

/**
 * Get a typed view of WebAssembly memory
 * @param memory The WebAssembly memory
 * @param offset The offset in the memory
 * @param length The number of elements
 * @returns The typed view
 */
export function getTypedArrayView<T extends ArrayBufferView>(
  constructor: new (buffer: ArrayBuffer, byteOffset?: number, length?: number) => T,
  memory: WebAssembly.Memory,
  offset: number,
  length: number
): T {
  // Calculate the byte length
  const BYTES_PER_ELEMENT = (constructor as any).BYTES_PER_ELEMENT || 1;
  const byteLength = length * BYTES_PER_ELEMENT;
  
  // Check if the requested data is within the memory bounds
  if (offset + byteLength > memory.buffer.byteLength) {
    throw new Error('Requested view is outside WebAssembly memory bounds');
  }
  
  // Create the view
  return new constructor(memory.buffer, offset, length);
}

/**
 * Memory pool for WebAssembly
 */
export class WasmMemoryPool {
  private memories: WebAssembly.Memory[] = [];
  private availableMemories: WebAssembly.Memory[] = [];
  
  /**
   * Create a new memory pool
   * @param initialSize The initial number of memories to create
   * @param memoryOptions Options for creating the memories
   */
  constructor(initialSize = 0, private memoryOptions: WasmMemoryOptions = {}) {
    // Create initial memories
    for (let i = 0; i < initialSize; i++) {
      const memory = createWasmMemory(memoryOptions);
      this.memories.push(memory);
      this.availableMemories.push(memory);
    }
  }
  
  /**
   * Get a memory from the pool
   * @returns A WebAssembly memory
   */
  public getMemory(): WebAssembly.Memory {
    // If there are available memories, return one
    if (this.availableMemories.length > 0) {
      return this.availableMemories.pop()!;
    }
    
    // Otherwise, create a new memory
    const memory = createWasmMemory(this.memoryOptions);
    this.memories.push(memory);
    return memory;
  }
  
  /**
   * Return a memory to the pool
   * @param memory The memory to return
   */
  public releaseMemory(memory: WebAssembly.Memory): void {
    // Check if the memory belongs to this pool
    if (this.memories.includes(memory)) {
      // Add it to the available memories
      this.availableMemories.push(memory);
    }
  }
  
  /**
   * Get the number of memories in the pool
   * @returns The number of memories
   */
  public getSize(): number {
    return this.memories.length;
  }
  
  /**
   * Get the number of available memories in the pool
   * @returns The number of available memories
   */
  public getAvailableSize(): number {
    return this.availableMemories.length;
  }
  
  /**
   * Clear the pool
   */
  public clear(): void {
    this.memories = [];
    this.availableMemories = [];
  }
}
