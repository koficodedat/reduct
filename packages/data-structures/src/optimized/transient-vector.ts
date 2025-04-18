/**
 * TransientVector - A mutable version of PersistentVector for efficient batch operations.
 *
 * This implementation provides a mutable interface to the trie data structure
 * used by PersistentVector, allowing for efficient batch operations like map,
 * filter, and reduce. After the batch operations are complete, the TransientVector
 * can be converted back to a PersistentVector.
 *
 * @packageDocumentation
 */

import { Option, some, none } from '@reduct/core';
import { PersistentVector } from './persistent-vector';

// Constants for the trie implementation (must match PersistentVector)
const BITS = 5;
const BRANCH_SIZE = 1 << BITS; // 32
const MASK = BRANCH_SIZE - 1;  // 31

/**
 * Node types for the trie structure
 */
type Node<T> = T[] | Array<Node<T>>;

/**
 * TransientVector class - a mutable version of PersistentVector for efficient batch operations
 */
export class TransientVector<T> {
  // The root node of the trie
  private root: Node<T>;

  // The tail array for fast appends
  private tail: T[];

  // The total number of elements in the vector
  private size: number;

  // The height of the trie
  private shift: number;

  // Flag to track if this transient vector has been used in a persistent operation
  private isValid: boolean;

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
    this.isValid = true;
  }

  /**
   * Creates a TransientVector from a PersistentVector
   */
  static from<T>(vector: PersistentVector<T>): TransientVector<T> {
    // Access the private fields of the PersistentVector
    // This is a bit of a hack, but it's the most efficient way to convert
    const size = (vector as any).size;
    const shift = (vector as any).shift;
    const root = [...(vector as any).root];
    const tail = [...(vector as any).tail];

    return new TransientVector<T>(size, shift, root, tail);
  }

  /**
   * Creates an empty TransientVector
   */
  static empty<T>(): TransientVector<T> {
    return new TransientVector<T>(0, 0, [], []);
  }

  /**
   * Converts this TransientVector back to a PersistentVector
   * After this operation, the TransientVector is no longer valid for use
   */
  persistent(): PersistentVector<T> {
    this.ensureValid();
    
    // Create a new PersistentVector with our current state
    const result = new (PersistentVector as any)<T>(
      this.size,
      this.shift,
      this.root,
      this.tail
    );
    
    // Mark this transient as no longer valid
    this.isValid = false;
    
    return result;
  }

  /**
   * Ensures that this TransientVector is still valid for use
   * @throws Error if the vector has already been used in a persistent operation
   */
  private ensureValid(): void {
    if (!this.isValid) {
      throw new Error('TransientVector has already been used in a persistent operation');
    }
  }

  /**
   * Returns the number of elements in the vector
   */
  getSize(): number {
    this.ensureValid();
    return this.size;
  }

  /**
   * Checks if the vector is empty
   */
  isEmpty(): boolean {
    this.ensureValid();
    return this.size === 0;
  }

  /**
   * Gets the element at the specified index
   * Returns Some(element) if the index is valid, None otherwise
   */
  get(index: number): Option<T> {
    this.ensureValid();
    
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
   * Modifies this TransientVector in place and returns it
   */
  set(index: number, value: T): TransientVector<T> {
    this.ensureValid();
    
    // Check if the index is valid
    if (index < 0 || index >= this.size) {
      throw new Error(`Index out of bounds: ${index}`);
    }

    // Check if the element is in the tail
    const tailOffset = this.size - this.tail.length;
    if (index >= tailOffset) {
      // Modify the tail in place
      this.tail[index - tailOffset] = value;
      return this;
    }

    // Modify the trie in place
    this.updateNode(this.root, this.shift, index, value);
    return this;
  }

  /**
   * Helper method to update a node in the trie
   * Modifies the node in place
   */
  private updateNode(node: Node<T>, level: number, index: number, value: T): void {
    if (level === 0) {
      // Leaf level, update the element directly
      (node as T[])[index & MASK] = value;
    } else {
      // Internal level, recursively update the child node
      const subIndex = (index >>> level) & MASK;
      this.updateNode(
        node[subIndex] as Node<T>,
        level - BITS,
        index,
        value
      );
    }
  }

  /**
   * Appends an element to the end of the vector
   * Modifies this TransientVector in place and returns it
   */
  append(value: T): TransientVector<T> {
    this.ensureValid();
    
    // If the tail is not full, just append to the tail
    if (this.tail.length < BRANCH_SIZE) {
      this.tail.push(value);
      this.size++;
      return this;
    }

    // The tail is full, we need to incorporate it into the trie
    // and start a new tail

    // Special case: the trie is empty (only had elements in the tail)
    if (this.root.length === 0) {
      this.root = [this.tail] as Node<T>;
      this.tail = [value];
      this.size++;
      this.shift = BITS;
      return this;
    }

    // Check if we need to increase the height of the trie
    if ((this.size >>> BITS) > (1 << this.shift)) {
      // Create a new root node with the current root as its first child
      const newRoot = [this.root, this.newPath(this.shift, this.tail)] as Array<Node<T>>;
      this.root = newRoot;
      this.shift += BITS;
      this.tail = [value];
      this.size++;
      return this;
    }

    // Regular case: add the tail to the trie
    this.pushTail(this.root, this.shift, this.tail);
    this.tail = [value];
    this.size++;
    return this;
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
   * Modifies the node in place
   */
  private pushTail(node: Node<T>, level: number, tail: T[]): void {
    // Calculate the subindex for the current level
    const subIndex = ((this.size - 1) >>> level) & MASK;

    if (level === BITS) {
      // We're at the leaf level, add the tail
      node[subIndex] = tail;
    } else if (subIndex < node.length) {
      // Recursively push the tail down the trie
      if (!node[subIndex]) {
        node[subIndex] = this.newPath(level - BITS, tail);
      } else {
        this.pushTail(
          node[subIndex] as Node<T>,
          level - BITS,
          tail
        );
      }
    } else {
      // Create a new path for the tail
      node[subIndex] = this.newPath(level - BITS, tail);
    }
  }

  /**
   * Converts the vector to an array
   */
  toArray(): T[] {
    this.ensureValid();
    
    const result: T[] = new Array(this.size);

    // Copy elements from the trie and tail to the array
    for (let i = 0; i < this.size; i++) {
      result[i] = this.get(i).get();
    }

    return result;
  }
}
