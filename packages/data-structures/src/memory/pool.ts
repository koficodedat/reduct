/**
 * Memory pooling for frequently allocated structures
 *
 * This module provides memory pooling to reduce garbage collection pressure
 * by reusing objects instead of creating new ones.
 */

/**
 * A generic object pool
 *
 * @template T The type of objects in the pool
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  /**
   * Create a new object pool
   *
   * @param factory - A function that creates new objects
   * @param reset - A function that resets objects to their initial state
   * @param initialSize - The initial size of the pool
   * @param maxSize - The maximum size of the pool
   */
  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize = 0,
    maxSize = 1000
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  /**
   * Get an object from the pool
   *
   * @returns An object from the pool
   */
  get(): T {
    if (this.pool.length > 0) {
      this.hits++;
      return this.pool.pop()!;
    }

    this.misses++;
    return this.factory();
  }

  /**
   * Return an object to the pool
   *
   * @param obj - The object to return to the pool
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  /**
   * Get the hit rate of the pool
   *
   * @returns The hit rate as a number between 0 and 1
   */
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  /**
   * Get the current size of the pool
   *
   * @returns The current size of the pool
   */
  getSize(): number {
    return this.pool.length;
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool = [];
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Resize the pool
   *
   * @param newMaxSize - The new maximum size of the pool
   */
  resize(newMaxSize: number): void {
    this.maxSize = newMaxSize;
    if (this.pool.length > newMaxSize) {
      this.pool = this.pool.slice(0, newMaxSize);
    }
  }
}

/**
 * A pool of arrays
 *
 * @template T The type of elements in the arrays
 */
export class ArrayPool<T> {
  private pools: Map<number, ObjectPool<T[]>> = new Map();
  private maxPoolSize: number;
  private maxArraySize: number;

  /**
   * Create a new array pool
   *
   * @param maxPoolSize - The maximum size of each pool
   * @param maxArraySize - The maximum size of arrays to pool
   */
  constructor(maxPoolSize = 100, maxArraySize = 1024) {
    this.maxPoolSize = maxPoolSize;
    this.maxArraySize = maxArraySize;
  }

  /**
   * Get an array from the pool
   *
   * @param size - The size of the array
   * @returns An array from the pool
   */
  get(size: number): T[] {
    if (size > this.maxArraySize) {
      return new Array(size);
    }

    let pool = this.pools.get(size);
    if (!pool) {
      pool = new ObjectPool<T[]>(
        () => new Array(size),
        (arr) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = undefined as unknown as T;
          }
        },
        0,
        this.maxPoolSize
      );
      this.pools.set(size, pool);
    }

    return pool.get();
  }

  /**
   * Return an array to the pool
   *
   * @param arr - The array to return to the pool
   */
  release(arr: T[]): void {
    const size = arr.length;
    if (size <= this.maxArraySize) {
      let pool = this.pools.get(size);
      if (!pool) {
        pool = new ObjectPool<T[]>(
          () => new Array(size),
          (arr) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = undefined as unknown as T;
            }
          },
          0,
          this.maxPoolSize
        );
        this.pools.set(size, pool);
      }
      pool.release(arr);
    }
  }

  /**
   * Clear all pools
   */
  clear(): void {
    this.pools.clear();
  }

  /**
   * Get statistics about the pool
   *
   * @returns Statistics about the pool
   */
  getStats(): { size: number; hitRate: number; poolCount: number } {
    let totalSize = 0;
    let totalHits = 0;

    for (const pool of this.pools.values()) {
      totalSize += pool.getSize();
      totalHits += pool.getHitRate() * (pool.getHitRate() > 0 ? 1 : 0);
    }

    const poolCount = this.pools.size;
    const hitRate = poolCount > 0 ? totalHits / poolCount : 0;

    return {
      size: totalSize,
      hitRate,
      poolCount
    };
  }
}

/**
 * A singleton array pool for reusing arrays
 */
export const arrayPool = new ArrayPool();

/**
 * Get an array from the pool
 *
 * @param size - The size of the array
 * @returns An array from the pool
 */
export function getPooledArray<T>(size: number): T[] {
  return arrayPool.get(size) as unknown as T[];
}

/**
 * Return an array to the pool
 *
 * @param arr - The array to return to the pool
 */
export function releasePooledArray<T>(arr: T[]): void {
  arrayPool.release(arr);
}

/**
 * A pool of objects
 *
 * @template T The type of objects in the pool
 */
export class TypedObjectPool<T> {
  private pool: ObjectPool<T>;

  /**
   * Create a new typed object pool
   *
   * @param factory - A function that creates new objects
   * @param reset - A function that resets objects to their initial state
   * @param initialSize - The initial size of the pool
   * @param maxSize - The maximum size of the pool
   */
  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize = 0,
    maxSize = 1000
  ) {
    this.pool = new ObjectPool<T>(factory, reset, initialSize, maxSize);
  }

  /**
   * Get an object from the pool
   *
   * @returns An object from the pool
   */
  get(): T {
    return this.pool.get();
  }

  /**
   * Return an object to the pool
   *
   * @param obj - The object to return to the pool
   */
  release(obj: T): void {
    this.pool.release(obj);
  }

  /**
   * Get the hit rate of the pool
   *
   * @returns The hit rate as a number between 0 and 1
   */
  getHitRate(): number {
    return this.pool.getHitRate();
  }

  /**
   * Get the current size of the pool
   *
   * @returns The current size of the pool
   */
  getSize(): number {
    return this.pool.getSize();
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool.clear();
  }
}

/**
 * A pool of typed arrays
 */
export class TypedArrayPool {
  private int8Pool = new ArrayPool<number>();
  private int16Pool = new ArrayPool<number>();
  private int32Pool = new ArrayPool<number>();
  private uint8Pool = new ArrayPool<number>();
  private uint16Pool = new ArrayPool<number>();
  private uint32Pool = new ArrayPool<number>();
  private float32Pool = new ArrayPool<number>();
  private float64Pool = new ArrayPool<number>();

  /**
   * Get an Int8Array from the pool
   *
   * @param size - The size of the array
   * @returns An Int8Array from the pool
   */
  getInt8Array(size: number): Int8Array {
    const buffer = this.int8Pool.get(size);
    return new Int8Array(buffer);
  }

  /**
   * Return an Int8Array to the pool
   *
   * @param arr - The array to return to the pool
   */
  releaseInt8Array(arr: Int8Array): void {
    this.int8Pool.release(Array.from(arr));
  }

  /**
   * Get an Int16Array from the pool
   *
   * @param size - The size of the array
   * @returns An Int16Array from the pool
   */
  getInt16Array(size: number): Int16Array {
    const buffer = this.int16Pool.get(size);
    return new Int16Array(buffer);
  }

  /**
   * Return an Int16Array to the pool
   *
   * @param arr - The array to return to the pool
   */
  releaseInt16Array(arr: Int16Array): void {
    this.int16Pool.release(Array.from(arr));
  }

  /**
   * Get an Int32Array from the pool
   *
   * @param size - The size of the array
   * @returns An Int32Array from the pool
   */
  getInt32Array(size: number): Int32Array {
    const buffer = this.int32Pool.get(size);
    return new Int32Array(buffer);
  }

  /**
   * Return an Int32Array to the pool
   *
   * @param arr - The array to return to the pool
   */
  releaseInt32Array(arr: Int32Array): void {
    this.int32Pool.release(Array.from(arr));
  }

  /**
   * Get a Uint8Array from the pool
   *
   * @param size - The size of the array
   * @returns A Uint8Array from the pool
   */
  getUint8Array(size: number): Uint8Array {
    const buffer = this.uint8Pool.get(size);
    return new Uint8Array(buffer);
  }

  /**
   * Return a Uint8Array to the pool
   *
   * @param arr - The array to return to the pool
   */
  releaseUint8Array(arr: Uint8Array): void {
    this.uint8Pool.release(Array.from(arr));
  }

  /**
   * Get a Uint16Array from the pool
   *
   * @param size - The size of the array
   * @returns A Uint16Array from the pool
   */
  getUint16Array(size: number): Uint16Array {
    const buffer = this.uint16Pool.get(size);
    return new Uint16Array(buffer);
  }

  /**
   * Return a Uint16Array to the pool
   *
   * @param arr - The array to return to the pool
   */
  releaseUint16Array(arr: Uint16Array): void {
    this.uint16Pool.release(Array.from(arr));
  }

  /**
   * Get a Uint32Array from the pool
   *
   * @param size - The size of the array
   * @returns A Uint32Array from the pool
   */
  getUint32Array(size: number): Uint32Array {
    const buffer = this.uint32Pool.get(size);
    return new Uint32Array(buffer);
  }

  /**
   * Return a Uint32Array to the pool
   *
   * @param arr - The array to return to the pool
   */
  releaseUint32Array(arr: Uint32Array): void {
    this.uint32Pool.release(Array.from(arr));
  }

  /**
   * Get a Float32Array from the pool
   *
   * @param size - The size of the array
   * @returns A Float32Array from the pool
   */
  getFloat32Array(size: number): Float32Array {
    const buffer = this.float32Pool.get(size);
    return new Float32Array(buffer);
  }

  /**
   * Return a Float32Array to the pool
   *
   * @param arr - The array to return to the pool
   */
  releaseFloat32Array(arr: Float32Array): void {
    this.float32Pool.release(Array.from(arr));
  }

  /**
   * Get a Float64Array from the pool
   *
   * @param size - The size of the array
   * @returns A Float64Array from the pool
   */
  getFloat64Array(size: number): Float64Array {
    const buffer = this.float64Pool.get(size);
    return new Float64Array(buffer);
  }

  /**
   * Return a Float64Array to the pool
   *
   * @param arr - The array to return to the pool
   */
  releaseFloat64Array(arr: Float64Array): void {
    this.float64Pool.release(Array.from(arr));
  }

  /**
   * Clear all pools
   */
  clear(): void {
    this.int8Pool.clear();
    this.int16Pool.clear();
    this.int32Pool.clear();
    this.uint8Pool.clear();
    this.uint16Pool.clear();
    this.uint32Pool.clear();
    this.float32Pool.clear();
    this.float64Pool.clear();
  }
}

/**
 * A singleton typed array pool for reusing typed arrays
 */
export const typedArrayPool = new TypedArrayPool();

/**
 * Get a typed array from the pool
 *
 * @param type - The type of typed array
 * @param size - The size of the array
 * @returns A typed array from the pool
 */
export function getPooledTypedArray(
  type: 'int8' | 'int16' | 'int32' | 'uint8' | 'uint16' | 'uint32' | 'float32' | 'float64',
  size: number
): Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Float32Array | Float64Array {
  switch (type) {
    case 'int8':
      return typedArrayPool.getInt8Array(size);
    case 'int16':
      return typedArrayPool.getInt16Array(size);
    case 'int32':
      return typedArrayPool.getInt32Array(size);
    case 'uint8':
      return typedArrayPool.getUint8Array(size);
    case 'uint16':
      return typedArrayPool.getUint16Array(size);
    case 'uint32':
      return typedArrayPool.getUint32Array(size);
    case 'float32':
      return typedArrayPool.getFloat32Array(size);
    case 'float64':
      return typedArrayPool.getFloat64Array(size);
    default:
      throw new Error(`Unknown typed array type: ${type}`);
  }
}

/**
 * Return a typed array to the pool
 *
 * @param arr - The array to return to the pool
 */
export function releasePooledTypedArray(
  arr: Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Float32Array | Float64Array
): void {
  if (arr instanceof Int8Array) {
    typedArrayPool.releaseInt8Array(arr);
  } else if (arr instanceof Int16Array) {
    typedArrayPool.releaseInt16Array(arr);
  } else if (arr instanceof Int32Array) {
    typedArrayPool.releaseInt32Array(arr);
  } else if (arr instanceof Uint8Array) {
    typedArrayPool.releaseUint8Array(arr);
  } else if (arr instanceof Uint16Array) {
    typedArrayPool.releaseUint16Array(arr);
  } else if (arr instanceof Uint32Array) {
    typedArrayPool.releaseUint32Array(arr);
  } else if (arr instanceof Float32Array) {
    typedArrayPool.releaseFloat32Array(arr);
  } else if (arr instanceof Float64Array) {
    typedArrayPool.releaseFloat64Array(arr);
  }
}
