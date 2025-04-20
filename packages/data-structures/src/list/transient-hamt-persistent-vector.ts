/**
 * TransientHAMTPersistentVector implementation
 *
 * A mutable version of HAMTPersistentVector for efficient batch operations.
 */

import { TransientList } from './types';
import { HAMTNode } from './hamt-node';
import { HAMTPersistentVector } from './hamt-persistent-vector';

// Constants
const BITS_PER_LEVEL = 5;
const BRANCH_SIZE = 1 << BITS_PER_LEVEL; // 32
// const MASK = BRANCH_SIZE - 1; // 0x1F

export class TransientHAMTPersistentVector<T> implements TransientList<T> {
  /**
   * The root node of the trie
   */
  private root: HAMTNode<T> | null;

  /**
   * The tail buffer for efficient appends
   */
  private tail: T[];

  /**
   * The total number of elements
   */
  private _size: number;

  /**
   * The height of the trie
   */
  private height: number;

  /**
   * Whether the vector has been used after being made persistent
   */
  private _used: boolean;

  /**
   * Create a new TransientHAMTPersistentVector
   */
  constructor(
    root: HAMTNode<T> | null,
    tail: T[],
    size: number,
    height: number
  ) {
    this.root = root;
    this.tail = tail;
    this._size = size;
    this.height = height;
    this._used = false;
  }

  /**
   * Get the size of the vector
   */
  get size(): number {
    this.ensureUnused();
    return this._size;
  }

  /**
   * Check if the vector is empty
   */
  get isEmpty(): boolean {
    this.ensureUnused();
    return this._size === 0;
  }

  /**
   * Ensure the vector hasn't been used after being made persistent
   */
  private ensureUnused(): void {
    if (this._used) {
      throw new Error('Cannot use a transient vector after it has been made persistent');
    }
  }

  /**
   * Get an element at the specified index
   */
  get(index: number): T | undefined {
    this.ensureUnused();

    if (index < 0 || index >= this._size) {
      return undefined;
    }

    // Fast path: get from tail
    const tailOffset = this._size - this.tail.length;
    if (index >= tailOffset) {
      return this.tail[index - tailOffset];
    }

    // Slow path: get from trie
    if (this.root === null) {
      return undefined;
    }

    // Implementation would traverse the trie to find the element
    // This is a simplified placeholder
    const array = this.toArray();
    return array[index];
  }

  /**
   * Set an element at the specified index
   */
  set(index: number, value: T): TransientList<T> {
    this.ensureUnused();

    if (index < 0 || index >= this._size) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    // Fast path: set in tail
    const tailOffset = this._size - this.tail.length;
    if (index >= tailOffset) {
      this.tail[index - tailOffset] = value;
      return this;
    }

    // Slow path: set in trie
    if (this.root === null) {
      throw new Error('Invalid state: root is null but index is in trie range');
    }

    // Implementation would modify the trie in-place
    // This is a simplified placeholder
    const array = this.toArray();
    array[index] = value;

    // Rebuild the vector from the array
    const vector = HAMTPersistentVector.from(array);
    this.root = (vector as any).root;
    this.tail = [...(vector as any).tail];
    this._size = vector.size;
    this.height = (vector as any).height;

    return this;
  }

  /**
   * Insert an element at the specified index
   */
  insert(index: number, value: T): TransientList<T> {
    this.ensureUnused();

    if (index < 0 || index > this._size) {
      throw new RangeError(`Index ${index} out of bounds for insertion`);
    }

    // Fast path: append
    if (index === this._size) {
      return this.append(value);
    }

    // Implementation would modify the trie in-place
    // This is a simplified placeholder
    const array = this.toArray();
    array.splice(index, 0, value);

    // Rebuild the vector from the array
    const vector = HAMTPersistentVector.from(array);
    this.root = (vector as any).root;
    this.tail = [...(vector as any).tail];
    this._size = vector.size;
    this.height = (vector as any).height;

    return this;
  }

  /**
   * Remove an element at the specified index
   */
  remove(index: number): TransientList<T> {
    this.ensureUnused();

    if (index < 0 || index >= this._size) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    // Implementation would modify the trie in-place
    // This is a simplified placeholder
    const array = this.toArray();
    array.splice(index, 1);

    // Rebuild the vector from the array
    const vector = HAMTPersistentVector.from(array);
    this.root = (vector as any).root;
    this.tail = [...(vector as any).tail];
    this._size = vector.size;
    this.height = (vector as any).height;

    return this;
  }

  /**
   * Append an element to the end of the list
   */
  append(value: T): TransientList<T> {
    this.ensureUnused();

    // Fast path: append to tail if not full
    if (this.tail.length < BRANCH_SIZE) {
      this.tail.push(value);
      this._size++;
      return this;
    }

    // Slow path: tail is full, incorporate into trie and create new tail
    // Implementation would modify the trie in-place
    // This is a simplified placeholder
    const array = this.toArray();
    array.push(value);

    // Rebuild the vector from the array
    const vector = HAMTPersistentVector.from(array);
    this.root = (vector as any).root;
    this.tail = [...(vector as any).tail];
    this._size = vector.size;
    this.height = (vector as any).height;

    return this;
  }

  /**
   * Prepend an element to the beginning of the list
   */
  prepend(value: T): TransientList<T> {
    this.ensureUnused();

    // Implementation would modify the trie in-place
    // This is a simplified placeholder
    const array = this.toArray();
    array.unshift(value);

    // Rebuild the vector from the array
    const vector = HAMTPersistentVector.from(array);
    this.root = (vector as any).root;
    this.tail = [...(vector as any).tail];
    this._size = vector.size;
    this.height = (vector as any).height;

    return this;
  }

  /**
   * Convert the list to an array
   */
  toArray(): T[] {
    this.ensureUnused();

    const result: T[] = new Array(this._size);

    // Copy elements from the trie
    if (this.root !== null) {
      // Implementation would traverse the trie to collect all elements
      // This is a simplified placeholder that assumes we have a method to get elements
      for (let i = 0; i < this._size - this.tail.length; i++) {
        result[i] = this.get(i) as T;
      }
    }

    // Copy elements from the tail
    const tailOffset = this._size - this.tail.length;
    for (let i = 0; i < this.tail.length; i++) {
      result[tailOffset + i] = this.tail[i];
    }

    return result;
  }

  /**
   * Convert the transient vector back to an immutable vector
   */
  persistent(): HAMTPersistentVector<T> {
    this.ensureUnused();
    this._used = true;
    return new HAMTPersistentVector<T>(
      this.root,
      [...this.tail],
      this._size,
      this.height
    );
  }
}
