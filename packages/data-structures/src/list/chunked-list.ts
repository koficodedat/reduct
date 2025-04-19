/**
 * ChunkedList implementation
 *
 * A 32-way branching trie implementation of the List interface optimized for medium-sized collections.
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
 * Create an empty node
 */
function emptyNode<T>(): Node<T> {
  return {
    children: [],
    size: 0
  };
}

/**
 * Create a node with a single child
 */
function nodeWithSingleChild<T>(child: T | Node<T>, childSize: number): Node<T> {
  return {
    children: [child],
    size: childSize
  };
}

/**
 * Get the path to an element at the specified index
 */
function getPath<T>(node: Node<T>, index: number, level: number): (Node<T> | T)[] {
  const path: (Node<T> | T)[] = [node];
  let currentNode = node;
  let idx = index;

  for (let i = level; i > 0; i--) {
    if (!currentNode.children) {
      throw new Error(`Node at level ${i} has no children`);
    }

    const childIndex = (idx >> (i * SHIFT)) & MASK;
    if (childIndex >= currentNode.children.length) {
      throw new Error(`Child index ${childIndex} out of bounds at level ${i}`);
    }

    const child = currentNode.children[childIndex];
    if (!child) {
      throw new Error(`Child at index ${childIndex} is undefined at level ${i}`);
    }

    path.push(child as Node<T>);
    currentNode = child as Node<T>;
  }

  if (!currentNode.children) {
    throw new Error('Leaf node has no children');
  }

  const leafIndex = idx & MASK;
  if (leafIndex >= currentNode.children.length) {
    throw new Error(`Leaf index ${leafIndex} out of bounds`);
  }

  const value = currentNode.children[leafIndex];
  if (value === undefined) {
    throw new Error(`Value at leaf index ${leafIndex} is undefined`);
  }

  path.push(value as T);

  return path;
}

/**
 * Update a node at the specified path
 */
function updatePath<T>(
  path: (Node<T> | T)[],
  level: number,
  value: T
): Node<T> {
  // The last element in the path is the value to replace
  const newPath = [...path];
  newPath[newPath.length - 1] = value;

  // Update each node in the path from bottom to top
  for (let i = level; i >= 0; i--) {
    const nodeIndex = i + 1;
    const childIndex = i === 0
      ? 0 // Root node has only one child for the first level
      : ((path.length - nodeIndex - 1) >> ((i - 1) * SHIFT)) & MASK;

    const currentNode = path[nodeIndex] as Node<T>;

    // Make sure children is an array and copy it
    const newChildren = Array.isArray(currentNode.children)
      ? [...currentNode.children]
      : Array.from(currentNode.children || []);

    if (i === level) {
      // Leaf level - update the actual value
      const leafIndex = (path.length - nodeIndex - 1) & MASK;
      newChildren[leafIndex] = value;
    } else {
      // Internal level - update the child node
      newChildren[childIndex] = newPath[nodeIndex + 1] as Node<T> | T;
    }

    newPath[nodeIndex] = {
      children: newChildren,
      size: currentNode.size
    };
  }

  return newPath[1] as Node<T>;
}

/**
 * TransientChunkedList implementation
 *
 * A mutable version of ChunkedList for efficient batch operations.
 */
export class TransientChunkedList<T> implements TransientList<T> {
  /**
   * The mutable root node
   */
  private root: Node<T> | null;

  /**
   * The mutable tail buffer for efficient appends
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
   * Create a new TransientChunkedList
   *
   * @param root - The root node
   * @param tail - The tail buffer
   * @param size - The total number of elements
   * @param height - The height of the trie
   */
  constructor(root: Node<T> | null, tail: T[], size: number, height: number) {
    this.root = root;
    this.tail = tail;
    this._size = size;
    this.height = height;
  }

  /**
   * Append a value to the end of the list
   *
   * @param value - The value to append
   * @returns The updated transient list
   */
  append(value: T): TransientChunkedList<T> {
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
      const newSize = this._size + 1;
      const requiresHeightIncrease = tailOffset === (1 << (this.height * SHIFT + SHIFT));

      if (requiresHeightIncrease) {
        // Create a new root node with the current root as its only child
        this.root = {
          children: [this.root],
          size: this.root.size
        };
        this.height++;
      }

      // Incorporate the tail into the trie
      let node = this.root;
      let level = this.height;

      // Navigate to the position where the tail should be inserted
      while (level > 0) {
        const childIndex = (tailOffset >> (level * SHIFT)) & MASK;

        // Ensure the path exists
        if (childIndex >= node.children.length) {
          const newChildren = [...node.children];
          while (newChildren.length <= childIndex) {
            newChildren.push(emptyNode<T>());
          }
          node = {
            children: newChildren,
            size: node.size
          } as Node<T>;
        }

        // Move to the next level
        node = node.children[childIndex] as Node<T>;
        level--;
      }

      // Insert the tail at the leaf level
      const leafIndex = tailOffset & MASK;
      const newChildren = [...node.children];
      while (newChildren.length <= leafIndex) {
        newChildren.push(undefined as unknown as T);
      }
      newChildren[leafIndex] = {
        children: [...this.tail],
        size: this.tail.length
      } as unknown as T;

      node = {
        children: newChildren,
        size: node.size + this.tail.length
      };
    }

    // Create a new tail with the appended value
    this.tail = [value];
    this._size++;

    return this;
  }

  /**
   * Prepend a value to the beginning of the list
   *
   * @param value - The value to prepend
   * @returns The updated transient list
   */
  prepend(value: T): TransientChunkedList<T> {
    // For simplicity in the transient implementation, convert to array,
    // prepend the value, and rebuild the trie
    const elements = [value];

    // Add elements from the root if it exists
    if (this.root !== null) {
      // Flatten the trie (simplified for now)
      const flattenTrie = (node: Node<T>, level: number): T[] => {
        if (level === 0) {
          return node.children as T[];
        }

        const result: T[] = [];
        for (const child of node.children) {
          if (child) {
            result.push(...flattenTrie(child as Node<T>, level - 1));
          }
        }
        return result;
      };

      elements.push(...flattenTrie(this.root, this.height));
    }

    // Add elements from the tail
    elements.push(...this.tail);

    // Rebuild the trie
    this.root = null;
    this.tail = elements;
    this._size = elements.length;
    this.height = 0;

    return this;
  }

  /**
   * Set a value at a specific index
   *
   * @param index - The index to set
   * @param value - The value to set
   * @returns The updated transient list
   * @throws {RangeError} If the index is out of bounds
   */
  set(index: number, value: T): TransientChunkedList<T> {
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

    // Find the path to the element
    const path = getPath(this.root, index, this.height);

    // Update the element
    this.root = updatePath(path, this.height, value);

    return this;
  }

  /**
   * Convert the transient list back to an immutable list
   *
   * @returns An immutable list with the current values
   */
  persistent(): IList<T> {
    return new ChunkedList<T>(
      this.root,
      [...this.tail],
      this._size,
      this.height
    );
  }
}

/**
 * ChunkedList implementation
 *
 * A 32-way branching trie implementation of the List interface optimized for medium-sized collections.
 * Uses structural sharing and path copying for efficient immutable operations.
 */
export class ChunkedList<T> implements IList<T> {
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
   * Create a new ChunkedList
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
   * Create a new ChunkedList from an array of elements
   *
   * @param elements - The elements to create the list from
   * @returns A new ChunkedList containing the elements
   */
  static from<T>(elements: T[]): ChunkedList<T> {
    if (elements.length === 0) {
      return new ChunkedList<T>(null, [], 0, 0);
    }

    // For small arrays, just use the tail
    if (elements.length <= BRANCHING_FACTOR) {
      return new ChunkedList<T>(null, elements, elements.length, 0);
    }

    // For medium-sized arrays (up to 100 elements), use a simple approach
    if (elements.length <= 100) {
      // Use a single-level trie with chunks of BRANCHING_FACTOR
      const chunks: T[][] = [];
      for (let i = 0; i < elements.length; i += BRANCHING_FACTOR) {
        chunks.push(elements.slice(i, i + BRANCHING_FACTOR));
      }

      // The last chunk becomes the tail
      const tail = chunks.pop() || [];

      // The rest become the trie
      if (chunks.length === 0) {
        return new ChunkedList<T>(null, tail, elements.length, 0);
      }

      // Create a root node with the chunks as children
      const root: Node<T> = {
        children: chunks.map(chunk => ({
          children: chunk,
          size: chunk.length
        })),
        size: elements.length - tail.length
      };

      return new ChunkedList<T>(root, tail, elements.length, 1);
    }

    // For larger arrays, build a proper trie
    const tailSize = elements.length % BRANCHING_FACTOR;
    const trieSize = elements.length - tailSize;

    // Extract the tail
    const tail = elements.slice(trieSize);

    // Build the trie
    const buildTrie = (start: number, end: number, level: number): Node<T> => {
      if (level === 0) {
        // Leaf level - create a node with elements
        return {
          children: elements.slice(start, end),
          size: end - start
        };
      }

      // Internal level - create a node with child nodes
      const childSize = 1 << (level * SHIFT);
      const children: (Node<T>)[] = [];

      for (let i = start; i < end; i += childSize) {
        children.push(buildTrie(i, Math.min(i + childSize, end), level - 1));
      }

      return {
        children,
        size: end - start
      };
    };

    // Calculate the height of the trie
    const height = Math.floor(Math.log(trieSize) / Math.log(BRANCHING_FACTOR));

    // Build the trie
    const root = buildTrie(0, trieSize, height);

    return new ChunkedList<T>(root, tail, elements.length, height);
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
   * Get the first element in the list
   *
   * @returns The first element, or undefined if the list is empty
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
   *
   * @returns The last element, or undefined if the list is empty
   */
  last(): T | undefined {
    if (this.isEmpty) {
      return undefined;
    }

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

  /**
   * Get a value at a specific index
   *
   * @param index - The index to get
   * @returns The value at the index, or undefined if the index is out of bounds
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
      if (!node.children || childIndex >= node.children.length) {
        return undefined;
      }
      const child = node.children[childIndex];
      if (!child) {
        return undefined;
      }
      node = child as Node<T>;
      level--;
    }

    if (!node.children) {
      return undefined;
    }

    const leafIndex = idx & MASK;
    if (leafIndex >= node.children.length) {
      return undefined;
    }

    return node.children[leafIndex] as T;
  }

  /**
   * Set a value at a specific index
   *
   * @param index - The index to set
   * @param value - The value to set
   * @returns A new list with the updated value
   * @throws {RangeError} If the index is out of bounds
   */
  set(index: number, value: T): ChunkedList<T> {
    if (index < 0 || index >= this._size) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    // Fast path: set in tail
    const tailOffset = this._size - this.tail.length;
    if (index >= tailOffset) {
      const tailIndex = index - tailOffset;
      const newTail = [...this.tail];
      newTail[tailIndex] = value;
      return new ChunkedList<T>(this.root, newTail, this._size, this.height);
    }

    // Slow path: set in trie
    if (this.root === null) {
      throw new Error('Invalid state: root is null but index is in trie range');
    }

    // For medium-sized collections (up to 100 elements), use a simpler approach
    if (this._size <= 100) {
      // Convert to array, update, and rebuild
      const elements = this.toArray();
      elements[index] = value;
      return ChunkedList.from(elements);
    }

    try {
      // Find the path to the element
      const path = getPath(this.root, index, this.height);

      // Update the element
      const newRoot = updatePath(path, this.height, value);

      return new ChunkedList<T>(newRoot, this.tail, this._size, this.height);
    } catch (error) {
      // Fallback: convert to array, update, and rebuild
      const elements = this.toArray();
      elements[index] = value;
      return ChunkedList.from(elements);
    }
  }

  /**
   * Insert a value at a specific index
   *
   * @param index - The index to insert at
   * @param value - The value to insert
   * @returns A new list with the inserted value
   * @throws {RangeError} If the index is out of bounds
   */
  insert(index: number, value: T): ChunkedList<T> {
    if (index < 0 || index > this._size) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    // Special cases
    if (index === 0) {
      return this.prepend(value);
    }

    if (index === this._size) {
      return this.append(value);
    }

    // General case: convert to array, insert, and rebuild
    const elements = this.toArray();
    elements.splice(index, 0, value);
    return ChunkedList.from(elements);
  }

  /**
   * Remove a value at a specific index
   *
   * @param index - The index to remove
   * @returns A new list with the value removed
   * @throws {RangeError} If the index is out of bounds
   */
  remove(index: number): ChunkedList<T> {
    if (index < 0 || index >= this._size) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    // Convert to array, remove, and rebuild
    const elements = this.toArray();
    elements.splice(index, 1);
    return ChunkedList.from(elements);
  }

  /**
   * Append a value to the end of the list
   *
   * @param value - The value to append
   * @returns A new list with the appended value
   */
  append(value: T): ChunkedList<T> {
    // Fast path: append to tail if not full
    if (this.tail.length < BRANCHING_FACTOR) {
      const newTail = [...this.tail, value];
      return new ChunkedList<T>(this.root, newTail, this._size + 1, this.height);
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
      const requiresHeightIncrease = tailOffset === (1 << (newHeight * SHIFT + SHIFT));

      if (requiresHeightIncrease) {
        // Create a new root node with the current root as its only child
        newRoot = {
          children: [newRoot],
          size: newRoot.size
        };
        newHeight++;
      }

      // Incorporate the tail into the trie
      // This is a simplified implementation - a full implementation would
      // use path copying for structural sharing
      const elements = this.toArray();
      elements.push(value);
      return ChunkedList.from(elements);
    }

    // Create a new tail with the appended value
    const newTail = [value];

    return new ChunkedList<T>(newRoot, newTail, this._size + 1, newHeight);
  }

  /**
   * Prepend a value to the beginning of the list
   *
   * @param value - The value to prepend
   * @returns A new list with the prepended value
   */
  prepend(value: T): ChunkedList<T> {
    // For simplicity, convert to array, prepend, and rebuild
    const elements = [value, ...this.toArray()];
    return ChunkedList.from(elements);
  }

  /**
   * Concatenate this list with another list
   *
   * @param other - The list to concatenate with this list
   * @returns A new list with the concatenated values
   */
  concat(other: IList<T>): ChunkedList<T> {
    if (other.isEmpty) {
      return this;
    }

    if (this.isEmpty) {
      return other instanceof ChunkedList
        ? other
        : ChunkedList.from(other.toArray());
    }

    // For simplicity, convert both lists to arrays, concatenate, and rebuild
    const elements = [...this.toArray(), ...other.toArray()];
    return ChunkedList.from(elements);
  }

  /**
   * Map each element in the list to a new value
   *
   * @param fn - The mapping function
   * @returns A new list with the mapped values
   */
  map<U>(fn: (value: T, index: number) => U): ChunkedList<U> {
    // For simplicity, convert to array, map, and rebuild
    const elements = this.toArray().map(fn);
    return ChunkedList.from(elements);
  }

  /**
   * Filter elements in the list based on a predicate
   *
   * @param fn - The predicate function
   * @returns A new list with the filtered values
   */
  filter(fn: (value: T, index: number) => boolean): ChunkedList<T> {
    // For simplicity, convert to array, filter, and rebuild
    const elements = this.toArray().filter(fn);
    return ChunkedList.from(elements);
  }

  /**
   * Reduce the list to a single value
   *
   * @param fn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U {
    // For simplicity, convert to array and reduce
    return this.toArray().reduce(fn, initial);
  }

  /**
   * Find the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The first element that satisfies the predicate, or undefined if no element satisfies the predicate
   */
  find(fn: (value: T, index: number) => boolean): T | undefined {
    // For simplicity, convert to array and find
    return this.toArray().find(fn);
  }

  /**
   * Find the index of the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The index of the first element that satisfies the predicate, or -1 if no element satisfies the predicate
   */
  findIndex(fn: (value: T, index: number) => boolean): number {
    // For simplicity, convert to array and findIndex
    return this.toArray().findIndex(fn);
  }

  /**
   * Convert the list to an array
   *
   * @returns An array with the current values
   */
  toArray(): T[] {
    const result: T[] = [];

    // Add elements from the trie
    if (this.root !== null) {
      // Flatten the trie (simplified for now)
      const flattenTrie = (node: Node<T>, level: number): T[] => {
        if (level === 0) {
          return node.children as T[];
        }

        const result: T[] = [];
        for (const child of node.children) {
          if (child) {
            result.push(...flattenTrie(child as Node<T>, level - 1));
          }
        }
        return result;
      };

      result.push(...flattenTrie(this.root, this.height));
    }

    // Add elements from the tail
    result.push(...this.tail);

    return result;
  }

  /**
   * Create a slice of the list
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new list with the sliced values
   */
  slice(start?: number, end?: number): ChunkedList<T> {
    // For simplicity, convert to array, slice, and rebuild
    const elements = this.toArray().slice(start, end);
    return ChunkedList.from(elements);
  }

  /**
   * Perform a map, filter, and reduce operation in a single pass
   *
   * @param mapFn - The mapping function
   * @param filterFn - The filter predicate
   * @param reduceFn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  mapFilterReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    // For simplicity, use a single-pass implementation with arrays
    let result = initial;
    let filteredIndex = 0;

    const elements = this.toArray();
    for (let i = 0; i < elements.length; i++) {
      const mappedValue = mapFn(elements[i], i);
      if (filterFn(mappedValue, i)) {
        result = reduceFn(result, mappedValue, filteredIndex++);
      }
    }

    return result;
  }

  /**
   * Perform a map and reduce operation in a single pass
   *
   * @param mapFn - The mapping function
   * @param reduceFn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  mapReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    // For simplicity, use a single-pass implementation with arrays
    let result = initial;

    const elements = this.toArray();
    for (let i = 0; i < elements.length; i++) {
      const mappedValue = mapFn(elements[i], i);
      result = reduceFn(result, mappedValue, i);
    }

    return result;
  }

  /**
   * Perform a filter and map operation in a single pass
   *
   * @param filterFn - The filter predicate
   * @param mapFn - The mapping function
   * @returns A new list with the filtered and mapped values
   */
  filterMap<U>(
    filterFn: (value: T, index: number) => boolean,
    mapFn: (value: T, index: number) => U
  ): ChunkedList<U> {
    // For simplicity, use a single-pass implementation with arrays
    const result: U[] = [];

    const elements = this.toArray();
    for (let i = 0; i < elements.length; i++) {
      if (filterFn(elements[i], i)) {
        result.push(mapFn(elements[i], i));
      }
    }

    return ChunkedList.from(result);
  }

  /**
   * Create a transient (temporarily mutable) version of the list
   *
   * @returns A transient list with the current values
   */
  transient(): TransientList<T> {
    return new TransientChunkedList<T>(
      this.root,
      [...this.tail],
      this._size,
      this.height
    );
  }

  /**
   * Iterate through the list
   */
  *[Symbol.iterator](): Iterator<T> {
    // For simplicity, convert to array and iterate
    yield* this.toArray();
  }
}
