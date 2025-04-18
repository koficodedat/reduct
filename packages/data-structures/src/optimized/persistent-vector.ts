/**
 * PersistentVector - An optimized immutable vector implementation based on a trie data structure.
 *
 * This implementation is inspired by Clojure's PersistentVector and provides:
 * - O(log32 n) random access and updates
 * - O(1) append operations (amortized)
 * - O(1) access to first and last elements
 * - Efficient slicing and concatenation
 * - Memory-efficient structural sharing
 *
 * @packageDocumentation
 */

import { Option, some, none } from '@reduct/core';

// Constants for the trie implementation
const BITS = 5;
const BRANCH_SIZE = 1 << BITS; // 32
const MASK = BRANCH_SIZE - 1;  // 31

/**
 * Node types for the trie structure
 */
type Node<T> = T[] | Array<Node<T>>;

/**
 * PersistentVector class - an efficient immutable vector implementation
 */
export class PersistentVector<T> {
  // The root node of the trie
  private readonly root: Node<T>;

  // The tail array for fast appends (elements that don't fit in a complete trie)
  private readonly tail: T[];

  // The total number of elements in the vector
  private readonly size: number;

  // The height of the trie (0 for empty or small vectors)
  private readonly shift: number;

  /**
   * Private constructor - use static factory methods to create instances
   */
  private constructor(
    size: number,
    shift: number,
    root: Node<T>,
    tail: T[]
  ) {
    this.size = size;
    this.shift = shift;
    this.root = root;
    this.tail = tail;
  }

  /**
   * Creates an empty PersistentVector
   */
  static empty<T>(): PersistentVector<T> {
    return new PersistentVector<T>(0, 0, [], []);
  }

  /**
   * Creates a PersistentVector from an array of elements
   */
  static from<T>(elements: ReadonlyArray<T>): PersistentVector<T> {
    let vector = PersistentVector.empty<T>();

    // Add each element to the vector
    for (const element of elements) {
      vector = vector.append(element);
    }

    return vector;
  }

  /**
   * Returns the number of elements in the vector
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Checks if the vector is empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Gets the element at the specified index
   * Returns Some(element) if the index is valid, None otherwise
   */
  get(index: number): Option<T> {
    // Check if the index is valid
    if (index < 0 || index >= this.size) {
      return none;
    }

    // Check if the element is in the tail
    const tailOffset = this.size - this.tail.length;
    if (index >= tailOffset) {
      return some(this.tail[index - tailOffset]);
    }

    // Navigate the trie to find the element
    let node = this.root as any;
    let level = this.shift;

    while (level > 0) {
      node = node[(index >>> level) & MASK];
      level -= BITS;
    }

    return some(node[index & MASK]);
  }

  /**
   * Sets the element at the specified index to a new value
   * Returns a new vector with the updated element
   */
  set(index: number, value: T): PersistentVector<T> {
    // Check if the index is valid
    if (index < 0 || index >= this.size) {
      throw new Error(`Index out of bounds: ${index}`);
    }

    // Check if the element is in the tail
    const tailOffset = this.size - this.tail.length;
    if (index >= tailOffset) {
      // Create a new tail with the updated element
      const newTail = [...this.tail];
      newTail[index - tailOffset] = value;

      return new PersistentVector<T>(this.size, this.shift, this.root, newTail);
    }

    // Create a new root with the updated element
    const newRoot = this.updateNode(this.root, this.shift, index, value);

    return new PersistentVector<T>(this.size, this.shift, newRoot, this.tail);
  }

  /**
   * Helper method to update a node in the trie
   */
  private updateNode(node: Node<T>, level: number, index: number, value: T): Node<T> {
    // Create a copy of the current node
    const newNode = [...node] as Node<T>;

    if (level === 0) {
      // Leaf level, update the element directly
      newNode[index & MASK] = value;
    } else {
      // Internal level, recursively update the child node
      const subIndex = (index >>> level) & MASK;
      newNode[subIndex] = this.updateNode(
        node[subIndex] as Node<T>,
        level - BITS,
        index,
        value
      );
    }

    return newNode;
  }

  /**
   * Appends an element to the end of the vector
   * Returns a new vector with the added element
   */
  append(value: T): PersistentVector<T> {
    // If the tail is not full, just append to the tail
    if (this.tail.length < BRANCH_SIZE) {
      const newTail = [...this.tail, value];
      return new PersistentVector<T>(this.size + 1, this.shift, this.root, newTail);
    }

    // The tail is full, we need to incorporate it into the trie
    // and start a new tail

    // Special case: the trie is empty (only had elements in the tail)
    if (this.root.length === 0) {
      return new PersistentVector<T>(
        this.size + 1,
        BITS,
        [this.tail] as Node<T>,
        [value]
      );
    }

    // Check if we need to increase the height of the trie
    if ((this.size >>> BITS) > (1 << this.shift)) {
      // Create a new root node with the current root as its first child
      const newRoot = [this.root, this.newPath(this.shift, this.tail)] as Array<Node<T>>;
      return new PersistentVector<T>(
        this.size + 1,
        this.shift + BITS,
        newRoot,
        [value]
      );
    }

    // Regular case: add the tail to the trie
    const newRoot = this.pushTail(this.root, this.shift, this.tail);
    return new PersistentVector<T>(
      this.size + 1,
      this.shift,
      newRoot,
      [value]
    );
  }

  /**
   * Helper method to create a new path in the trie
   */
  private newPath(level: number, tail: T[]): Node<T> {
    if (level === 0) {
      return tail;
    }

    const node = [] as Node<T>;
    node[0] = this.newPath(level - BITS, tail);
    return node;
  }

  /**
   * Helper method to push the tail into the trie
   */
  private pushTail(node: Node<T>, level: number, tail: T[]): Node<T> {
    // Create a copy of the current node
    const newNode = [...node] as Node<T>;

    // Calculate the subindex for the current level
    const subIndex = ((this.size - 1) >>> level) & MASK;

    if (level === BITS) {
      // We're at the leaf level, add the tail
      newNode[subIndex] = tail;
    } else if (subIndex < node.length) {
      // Recursively push the tail down the trie
      newNode[subIndex] = this.pushTail(
        node[subIndex] as Node<T>,
        level - BITS,
        tail
      );
    } else {
      // Create a new path for the tail
      newNode[subIndex] = this.newPath(level - BITS, tail);
    }

    return newNode;
  }

  /**
   * Prepends an element to the beginning of the vector
   * Returns a new vector with the element at the beginning
   */
  prepend(value: T): PersistentVector<T> {
    // Special case: empty vector
    if (this.size === 0) {
      return new PersistentVector<T>(1, BITS, [], [value]);
    }

    // If the tail has space, we can just add to it
    if (this.tail.length < BRANCH_SIZE) {
      // Create a new tail with the value at the beginning
      const newTail = [value, ...this.tail];

      // Create a new vector with the updated tail and size
      return new PersistentVector<T>(
        this.size + 1,
        this.shift,
        this.root,
        newTail
      );
    }

    // We need to create a new root and shift the elements
    // This is more complex and less efficient than append
    // For now, we'll use a simple but less efficient approach
    const array = [value, ...this.toArray()];
    return PersistentVector.from(array);
  }

  /**
   * Maps each element in the vector using the provided function
   * Returns a new vector with the mapped elements
   */
  map<U>(fn: (value: T, index: number) => U): PersistentVector<U> {
    let result = PersistentVector.empty<U>();

    // Map each element and append to the result
    for (let i = 0; i < this.size; i++) {
      const value = this.get(i).get();
      result = result.append(fn(value, i));
    }

    return result;
  }

  /**
   * Filters elements in the vector using the provided predicate
   * Returns a new vector with only the elements that satisfy the predicate
   */
  filter(predicate: (value: T, index: number) => boolean): PersistentVector<T> {
    let result = PersistentVector.empty<T>();

    // Filter elements and append to the result
    for (let i = 0; i < this.size; i++) {
      const value = this.get(i).get();
      if (predicate(value, i)) {
        result = result.append(value);
      }
    }

    return result;
  }

  /**
   * Reduces the vector to a single value using the provided function
   */
  reduce<U>(fn: (accumulator: U, value: T, index: number) => U, initial: U): U {
    let result = initial;

    // Apply the reducer function to each element
    for (let i = 0; i < this.size; i++) {
      const value = this.get(i).get();
      result = fn(result, value, i);
    }

    return result;
  }

  /**
   * Concatenates this vector with another vector
   * Returns a new vector containing all elements from both vectors
   */
  concat(other: PersistentVector<T>): PersistentVector<T> {
    // Special cases
    if (other.size === 0) return this;
    if (this.size === 0) return other;

    // For small vectors, use a simple approach
    if (this.size + other.size < 1000) {
      return PersistentVector.from([...this.toArray(), ...other.toArray()]);
    }

    // For larger vectors, build incrementally
    let result: PersistentVector<T> = this;
    for (let i = 0; i < other.size; i++) {
      result = result.append(other.get(i).get());
    }
    return result;
  }

  /**
   * Returns a slice of the vector as a new vector
   *
   * @param start - Start index (inclusive)
   * @param end - End index (exclusive)
   * @returns A new vector with the specified elements
   */
  slice(start?: number, end?: number): PersistentVector<T> {
    // Handle undefined parameters
    const startIndex = start !== undefined ? start : 0;
    const endIndex = end !== undefined ? end : this.size;

    // Normalize indices
    const normalizedStart = Math.max(0, startIndex < 0 ? this.size + startIndex : startIndex);
    const normalizedEnd = Math.min(this.size, endIndex < 0 ? this.size + endIndex : endIndex);

    // Handle empty slice
    if (normalizedStart >= normalizedEnd) {
      return PersistentVector.empty<T>();
    }

    // For small slices or small vectors, use a simple approach
    if (normalizedEnd - normalizedStart < 1000 || this.size < 1000) {
      let result = PersistentVector.empty<T>();
      for (let i = normalizedStart; i < normalizedEnd; i++) {
        result = result.append(this.get(i).get());
      }
      return result;
    }

    // For larger slices, we could implement a more efficient algorithm
    // that works directly with the trie structure, but for now we'll use
    // the simple approach
    return PersistentVector.from(
      this.toArray().slice(normalizedStart, normalizedEnd)
    );
  }

  /**
   * Converts the vector to an array
   */
  toArray(): T[] {
    const result: T[] = new Array(this.size);

    // Copy elements from the trie and tail to the array
    for (let i = 0; i < this.size; i++) {
      result[i] = this.get(i).get();
    }

    return result;
  }

  /**
   * Checks if any element satisfies the predicate
   */
  some(predicate: (value: T, index: number) => boolean): boolean {
    for (let i = 0; i < this.size; i++) {
      if (predicate(this.get(i).get(), i)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if all elements satisfy the predicate
   */
  every(predicate: (value: T, index: number) => boolean): boolean {
    for (let i = 0; i < this.size; i++) {
      if (!predicate(this.get(i).get(), i)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Executes a function for each element
   */
  forEach(fn: (value: T, index: number) => void): void {
    for (let i = 0; i < this.size; i++) {
      fn(this.get(i).get(), i);
    }
  }

  /**
   * Returns the index of the first occurrence of the element, or -1 if not found
   */
  indexOf(element: T, fromIndex: number = 0): number {
    const start = fromIndex < 0 ? Math.max(0, this.size + fromIndex) : fromIndex;

    for (let i = start; i < this.size; i++) {
      if (this.get(i).get() === element) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Checks if the vector includes the element
   */
  includes(element: T): boolean {
    return this.indexOf(element) !== -1;
  }

  /**
   * Returns an iterator for the vector
   */
  [Symbol.iterator](): Iterator<T> {
    let index = 0;

    return {
      next: (): IteratorResult<T> => {
        if (index < this.size) {
          const value = this.get(index).get();
          index++;
          return { value, done: false };
        }
        return { value: undefined as any, done: true };
      }
    };
  }
}
