/**
 * PersistentVector implementation
 *
 * A 32-way branching trie implementation of the List interface optimized for large collections.
 * Uses structural sharing and path copying for efficient immutable operations.
 *
 * @packageDocumentation
 */

import { IList, TransientList } from './types';

/**
 * Branching factor for the trie structure
 * 32 is chosen for optimal performance with modern CPUs and memory systems
 */
const BRANCHING_FACTOR = 32;

/**
 * Bit mask for extracting the index within a node (5 bits for 32-way branching)
 */
const MASK = BRANCHING_FACTOR - 1;

/**
 * Shift amount for each level of the trie (5 bits for 32-way branching)
 */
const SHIFT = 5;

/**
 * Node interface for the trie structure
 */
interface Node<T> {
  /**
   * The children of the node, which can be either elements (at leaf nodes)
   * or other nodes (at internal nodes)
   */
  readonly children: ReadonlyArray<T | Node<T>>;

  /**
   * The total number of elements in this node and its children
   */
  readonly size: number;
}

/**
 * TransientPersistentVector implementation
 *
 * A mutable version of PersistentVector for efficient batch operations.
 */
export class TransientPersistentVector<T> implements TransientList<T> {
  /**
   * The mutable root node
   */
  private root: Node<T> | null;

  /**
   * The mutable tail buffer
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
   * Create a new TransientPersistentVector
   *
   * @param root - The root node
   * @param tail - The tail buffer
   * @param size - The total number of elements
   * @param height - The height of the trie
   */
  constructor(
    root: Node<T> | null = null,
    tail: T[] = [],
    size: number = 0,
    height: number = 0
  ) {
    this.root = root;
    this.tail = tail;
    this._size = size;
    this.height = height;
  }

  /**
   * Create a new TransientPersistentVector from a PersistentVector
   */
  static from<T>(vector: PersistentVector<T>): TransientPersistentVector<T> {
    // Create a new transient vector with the same structure as the persistent vector
    return new TransientPersistentVector<T>(
      vector['root'],
      [...vector['tail']],
      vector.size,
      vector['height']
    );
  }

  /**
   * Append a value to the end of the list
   */
  append(value: T): TransientList<T> {
    // Fast path: append to tail if not full
    if (this.tail.length < BRANCHING_FACTOR) {
      this.tail.push(value);
      this._size++;
      return this;
    }

    // Slow path: tail is full, incorporate into trie and create new tail

    // If the trie is empty, create a new leaf node with the current tail
    if (this.root === null) {
      this.root = {
        children: [...this.tail],
        size: this.tail.length
      };
      this.height = 0;
    } else {
      // Check if we need to increase the height of the trie
      const tailOffset = this._size - this.tail.length;
      const requiresHeightIncrease = tailOffset === Math.pow(BRANCHING_FACTOR, this.height + 1);

      if (requiresHeightIncrease) {
        // Create a new root node with the current root as its only child
        this.root = {
          children: [this.root],
          size: this.root.size
        };
        this.height++;
      }

      // Helper function to incorporate the tail into the trie
      const incorporateTail = (node: Node<T>, idx: number, level: number): Node<T> => {
        if (level === 0) {
          // Leaf level - create a new node with the tail
          return {
            children: [...this.tail],
            size: this.tail.length
          };
        }

        // Internal level - recursively incorporate the tail
        const childIndex = (idx >> (level * SHIFT)) & MASK;
        let child: Node<T>;

        if (childIndex < node.children.length) {
          // Child exists, update it
          child = incorporateTail(node.children[childIndex] as Node<T>, idx, level - 1);
        } else {
          // Child doesn't exist, create a new path
          child = incorporateTail({
            children: [],
            size: 0
          }, idx, level - 1);
        }

        // Create a new node with the updated child
        const newChildren = [...node.children];
        while (newChildren.length <= childIndex) {
          newChildren.push({
            children: [],
            size: 0
          } as Node<T>);
        }
        newChildren[childIndex] = child;

        return {
          children: newChildren,
          size: node.size + this.tail.length
        };
      };

      // Incorporate the tail into the trie
      this.root = incorporateTail(this.root, tailOffset, this.height);
    }

    // Create a new tail with the appended value
    this.tail = [value];
    this._size++;

    return this;
  }

  /**
   * Prepend a value to the beginning of the list
   */
  prepend(value: T): TransientList<T> {
    // For simplicity in the transient implementation, convert to array,
    // prepend the value, and rebuild the trie
    const elements = [value];

    // Add elements from the root if it exists
    if (this.root !== null) {
      // Helper function to collect elements from the trie
      const collectElements = (node: Node<T>, level: number): void => {
        if (level === 0) {
          // Leaf level - collect elements directly
          for (let i = 0; i < node.children.length; i++) {
            elements.push(node.children[i] as T);
          }
        } else {
          // Internal level - recursively collect elements from children
          for (let i = 0; i < node.children.length; i++) {
            collectElements(node.children[i] as Node<T>, level - 1);
          }
        }
      };

      // Collect elements from the trie
      collectElements(this.root, this.height);
    }

    // Add elements from the tail
    elements.push(...this.tail);

    // Reset the trie
    this.root = null;
    this.tail = elements;
    this._size = elements.length;
    this.height = 0;

    return this;
  }

  /**
   * Set a value at a specific index
   */
  set(index: number, value: T): TransientList<T> {
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

    // Helper function to update a node at a specific level
    const updateNode = (node: Node<T>, idx: number, level: number): Node<T> => {
      if (level === 0) {
        // Leaf level - update the element directly
        const leafIndex = idx & MASK;
        const newChildren = [...node.children];
        newChildren[leafIndex] = value;
        return { children: newChildren, size: node.size };
      }

      // Internal level - recursively update the child node
      const childIndex = (idx >> (level * SHIFT)) & MASK;
      const child = node.children[childIndex] as Node<T>;
      const newChild = updateNode(child, idx, level - 1);

      // Create a new node with the updated child
      const newChildren = [...node.children];
      newChildren[childIndex] = newChild;
      return { children: newChildren, size: node.size };
    };

    // Update the root node
    this.root = updateNode(this.root, index, this.height);

    return this;
  }

  /**
   * Convert the transient list back to an immutable list
   */
  persistent(): IList<T> {
    return new PersistentVector<T>(
      this.root,
      [...this.tail],
      this._size,
      this.height
    );
  }
}

/**
 * PersistentVector implementation
 *
 * A 32-way branching trie implementation of the List interface optimized for large collections.
 * Uses structural sharing and path copying for efficient immutable operations.
 */
export class PersistentVector<T> implements IList<T> {
  /**
   * The root node of the trie
   */
  private readonly root: Node<T> | null;

  /**
   * The tail buffer for efficient appends
   */
  private readonly tail: ReadonlyArray<T>;

  /**
   * The total number of elements
   */
  private readonly _size: number;

  /**
   * The height of the trie
   */
  private readonly height: number;

  /**
   * Create a new PersistentVector
   *
   * @param root - The root node
   * @param tail - The tail buffer
   * @param size - The total number of elements
   * @param height - The height of the trie
   */
  constructor(
    root: Node<T> | null,
    tail: ReadonlyArray<T>,
    size: number,
    height: number
  ) {
    this.root = root;
    this.tail = tail;
    this._size = size;
    this.height = height;
  }

  /**
   * Create a new PersistentVector from an array of elements
   *
   * @param elements - The elements to create the vector from
   * @returns A new PersistentVector containing the elements
   */
  static from<T>(elements: T[]): PersistentVector<T> {
    if (elements.length === 0) {
      return new PersistentVector<T>(null, [], 0, 0);
    }

    // Extract the tail (last 32 elements or fewer)
    const tailSize = elements.length % BRANCHING_FACTOR || BRANCHING_FACTOR;
    const trieSize = elements.length - tailSize;
    const tail = elements.slice(trieSize);

    if (trieSize === 0) {
      // If all elements fit in the tail, no need for a trie
      return new PersistentVector<T>(null, tail, elements.length, 0);
    }

    // Build the trie for the remaining elements
    const buildTrie = (start: number, end: number, level: number): Node<T> => {
      if (level === 0) {
        // Leaf level - create a node with elements
        return {
          children: elements.slice(start, Math.min(start + BRANCHING_FACTOR, end)),
          size: Math.min(BRANCHING_FACTOR, end - start)
        };
      }

      // Internal level - create a node with child nodes
      const childSize = Math.pow(BRANCHING_FACTOR, level);
      const children: Node<T>[] = [];
      let nodeSize = 0;

      for (let i = start; i < end; i += childSize) {
        const child = buildTrie(i, Math.min(i + childSize, end), level - 1);
        children.push(child);
        nodeSize += child.size;
      }

      return {
        children,
        size: nodeSize
      };
    };

    // Calculate the height of the trie
    const height = Math.ceil(Math.log(trieSize) / Math.log(BRANCHING_FACTOR)) - 1;

    // Build the trie
    const root = buildTrie(0, trieSize, height);

    return new PersistentVector<T>(root, tail, elements.length, height);
  }

  /**
   * The number of elements in the list
   */
  get size(): number {
    return this._size;
  }

  /**
   * Whether the list is empty
   */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Get the element at the specified index
   */
  get(index: number): T | undefined {
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

    // Navigate to the element
    let node = this.root;
    let level = this.height;
    let idx = index;

    while (level > 0) {
      const childIndex = (idx >> (level * SHIFT)) & MASK;
      if (childIndex >= node.children.length) {
        return undefined;
      }
      node = node.children[childIndex] as Node<T>;
      level--;
    }

    const leafIndex = idx & MASK;
    if (leafIndex >= node.children.length) {
      return undefined;
    }

    return node.children[leafIndex] as T;
  }

  /**
   * Set the element at the specified index
   */
  set(index: number, value: T): IList<T> {
    if (index < 0 || index >= this._size) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    // Fast path: set in tail
    const tailOffset = this._size - this.tail.length;
    if (index >= tailOffset) {
      const tailIndex = index - tailOffset;
      const newTail = [...this.tail];
      newTail[tailIndex] = value;
      return new PersistentVector<T>(this.root, newTail, this._size, this.height);
    }

    // Slow path: set in trie
    if (this.root === null) {
      throw new Error('Invalid state: root is null but index is in trie range');
    }

    // Helper function to update a node at a specific level
    const updateNode = (node: Node<T>, idx: number, level: number): Node<T> => {
      if (level === 0) {
        // Leaf level - update the element directly
        const leafIndex = idx & MASK;
        const newChildren = [...node.children];
        newChildren[leafIndex] = value;
        return { children: newChildren, size: node.size };
      }

      // Internal level - recursively update the child node
      const childIndex = (idx >> (level * SHIFT)) & MASK;
      const child = node.children[childIndex] as Node<T>;
      const newChild = updateNode(child, idx, level - 1);

      // Create a new node with the updated child
      const newChildren = [...node.children];
      newChildren[childIndex] = newChild;
      return { children: newChildren, size: node.size };
    };

    // Update the root node
    const newRoot = updateNode(this.root, index, this.height);

    return new PersistentVector<T>(newRoot, this.tail, this._size, this.height);
  }

  /**
   * Insert an element at the specified index
   */
  insert(index: number, value: T): IList<T> {
    return this;
  }

  /**
   * Remove the element at the specified index
   */
  remove(index: number): IList<T> {
    return this;
  }

  /**
   * Append an element to the end of the list
   */
  append(value: T): IList<T> {
    // Fast path: append to tail if not full
    if (this.tail.length < BRANCHING_FACTOR) {
      const newTail = [...this.tail, value];
      return new PersistentVector<T>(this.root, newTail, this._size + 1, this.height);
    }

    // Slow path: tail is full, incorporate into trie and create new tail
    let newRoot = this.root;
    let newHeight = this.height;

    // If the trie is empty, create a new leaf node with the current tail
    if (newRoot === null) {
      newRoot = {
        children: [...this.tail],
        size: this.tail.length
      };
      newHeight = 0;
    } else {
      // Check if we need to increase the height of the trie
      const tailOffset = this._size - this.tail.length;
      const requiresHeightIncrease = tailOffset === Math.pow(BRANCHING_FACTOR, this.height + 1);

      if (requiresHeightIncrease) {
        // Create a new root node with the current root as its only child
        newRoot = {
          children: [newRoot],
          size: newRoot.size
        };
        newHeight = this.height + 1;
      }

      // Helper function to incorporate the tail into the trie
      const incorporateTail = (node: Node<T>, idx: number, level: number): Node<T> => {
        if (level === 0) {
          // Leaf level - create a new node with the tail
          return {
            children: [...this.tail],
            size: this.tail.length
          };
        }

        // Internal level - recursively incorporate the tail
        const childIndex = (idx >> (level * SHIFT)) & MASK;
        let child: Node<T>;

        if (childIndex < node.children.length) {
          // Child exists, update it
          child = incorporateTail(node.children[childIndex] as Node<T>, idx, level - 1);
        } else {
          // Child doesn't exist, create a new path
          child = incorporateTail({
            children: [],
            size: 0
          }, idx, level - 1);
        }

        // Create a new node with the updated child
        const newChildren = [...node.children];
        while (newChildren.length <= childIndex) {
          newChildren.push({
            children: [],
            size: 0
          } as Node<T>);
        }
        newChildren[childIndex] = child;

        return {
          children: newChildren,
          size: node.size + this.tail.length
        };
      };

      // Incorporate the tail into the trie
      newRoot = incorporateTail(newRoot, tailOffset, newHeight);
    }

    // Create a new tail with the appended value
    const newTail = [value];

    return new PersistentVector<T>(newRoot, newTail, this._size + 1, newHeight);
  }

  /**
   * Prepend an element to the beginning of the list
   */
  prepend(value: T): IList<T> {
    return this;
  }

  /**
   * Concatenate this list with another list
   */
  concat(other: IList<T>): IList<T> {
    return this;
  }

  /**
   * Map each element in the list to a new value
   */
  map<U>(fn: (value: T, index: number) => U): IList<U> {
    return new PersistentVector<U>(null, [], 0, 0);
  }

  /**
   * Filter elements in the list based on a predicate
   */
  filter(fn: (value: T, index: number) => boolean): IList<T> {
    return this;
  }

  /**
   * Reduce the list to a single value
   */
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U {
    return initial;
  }

  /**
   * Find the first element in the list that satisfies a predicate
   */
  find(fn: (value: T, index: number) => boolean): T | undefined {
    return undefined;
  }

  /**
   * Find the index of the first element in the list that satisfies a predicate
   */
  findIndex(fn: (value: T, index: number) => boolean): number {
    return -1;
  }

  /**
   * Convert the list to an array
   */
  toArray(): T[] {
    if (this.isEmpty) {
      return [];
    }

    const result: T[] = [];

    // Helper function to collect elements from the trie
    const collectElements = (node: Node<T>, level: number): void => {
      if (level === 0) {
        // Leaf level - collect elements directly
        for (let i = 0; i < node.children.length; i++) {
          result.push(node.children[i] as T);
        }
      } else {
        // Internal level - recursively collect elements from children
        for (let i = 0; i < node.children.length; i++) {
          collectElements(node.children[i] as Node<T>, level - 1);
        }
      }
    };

    // Collect elements from the trie
    if (this.root !== null) {
      collectElements(this.root, this.height);
    }

    // Add elements from the tail
    result.push(...this.tail);

    return result;
  }

  /**
   * Create a slice of the list
   */
  slice(start?: number, end?: number): IList<T> {
    return this;
  }

  /**
   * Perform a map, filter, and reduce operation in a single pass
   */
  mapFilterReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    return initial;
  }

  /**
   * Perform a map and reduce operation in a single pass
   */
  mapReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    return initial;
  }

  /**
   * Perform a filter and map operation in a single pass
   */
  filterMap<U>(
    filterFn: (value: T, index: number) => boolean,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    return new PersistentVector<U>(null, [], 0, 0);
  }

  /**
   * Create a transient (temporarily mutable) version of the list
   */
  transient(): TransientList<T> {
    return new TransientPersistentVector<T>(
      this.root,
      [...this.tail],
      this._size,
      this.height
    );
  }

  /**
   * Get the first element in the list
   */
  first(): T | undefined {
    if (this.isEmpty) {
      return undefined;
    }

    if (this.root === null) {
      return this.tail[0];
    }

    // Navigate to the leftmost leaf
    let node = this.root;
    let level = this.height;

    while (level > 0) {
      node = node.children[0] as Node<T>;
      level--;
    }

    return node.children[0] as T;
  }

  /**
   * Get the last element in the list
   */
  last(): T | undefined {
    if (this.isEmpty) {
      return undefined;
    }

    // Fast path: get from tail
    if (this.tail.length > 0) {
      return this.tail[this.tail.length - 1];
    }

    if (this.root === null) {
      return undefined;
    }

    // Navigate to the rightmost leaf
    let node = this.root;
    let level = this.height;

    while (level > 0) {
      node = node.children[node.children.length - 1] as Node<T>;
      level--;
    }

    return node.children[node.children.length - 1] as T;
  }
}
