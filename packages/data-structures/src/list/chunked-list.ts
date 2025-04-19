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
 * Maximum size of the chunk pool
 * This limits how many chunks we keep in memory for reuse
 */
const MAX_POOL_SIZE = 100;

/**
 * A pool of reusable chunks to reduce memory allocation
 */
class ChunkPool<T> {
  private static instances: Map<string, ChunkPool<any>> = new Map();
  private chunks: Array<T[]> = [];

  /**
   * Get a singleton instance of the chunk pool for a specific type
   *
   * @param id - A unique identifier for the type
   * @returns A chunk pool instance
   */
  static getInstance<T>(id: string = 'default'): ChunkPool<T> {
    if (!ChunkPool.instances.has(id)) {
      ChunkPool.instances.set(id, new ChunkPool<T>());
    }
    return ChunkPool.instances.get(id) as ChunkPool<T>;
  }

  /**
   * Acquire a chunk from the pool or create a new one
   *
   * @returns A chunk array
   */
  acquire(): T[] {
    if (this.chunks.length > 0) {
      return this.chunks.pop()!;
    }
    return new Array<T>(BRANCHING_FACTOR);
  }

  /**
   * Release a chunk back to the pool
   *
   * @param chunk - The chunk to release
   */
  release(chunk: T[]): void {
    // Only keep chunks up to the maximum pool size
    if (this.chunks.length < MAX_POOL_SIZE) {
      // Clear the chunk to avoid memory leaks
      chunk.length = 0;
      // Ensure the chunk has the correct capacity
      chunk.length = BRANCHING_FACTOR;
      this.chunks.push(chunk);
    }
  }
}

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

// Commented out as it's not used
// /**
//  * Create a node with a single child
//  */
// function nodeWithSingleChild<T>(child: T | Node<T>, childSize: number): Node<T> {
//   return {
//     children: [child],
//     size: childSize
//   };
// }

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
      // const newSize = this._size + 1; // Commented out as it's not used
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
      const chunkPool = ChunkPool.getInstance<T>();

      for (let i = 0; i < elements.length; i += BRANCHING_FACTOR) {
        // Get a chunk from the pool
        const chunk = chunkPool.acquire();

        // Fill the chunk with elements
        const end = Math.min(i + BRANCHING_FACTOR, elements.length);
        for (let j = 0; j < end - i; j++) {
          chunk[j] = elements[i + j];
        }

        // Trim the chunk to the correct size
        chunk.length = end - i;

        chunks.push(chunk);
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
    const chunkPool = ChunkPool.getInstance<T>();

    const buildTrie = (start: number, end: number, level: number): Node<T> => {
      if (level === 0) {
        // Leaf level - create a node with elements
        const chunk = chunkPool.acquire();

        // Fill the chunk with elements
        const chunkSize = end - start;
        for (let i = 0; i < chunkSize; i++) {
          chunk[i] = elements[start + i];
        }

        // Trim the chunk to the correct size
        chunk.length = chunkSize;

        return {
          children: chunk,
          size: chunkSize
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

    // Fast path: if the list is empty, create a new list with just the value
    if (this.isEmpty) {
      return new ChunkedList<T>(null, [value], 1, 0);
    }

    // Fast path: if we only have a tail, insert directly into the tail
    if (this.root === null) {
      // Use the chunk pool to create a new tail
      const chunkPool = ChunkPool.getInstance<T>();
      const newTail = chunkPool.acquire();

      // Copy elements before the insertion point
      for (let i = 0; i < index; i++) {
        newTail[i] = this.tail[i];
      }

      // Insert the new value
      newTail[index] = value;

      // Copy elements after the insertion point
      for (let i = index; i < this.tail.length; i++) {
        newTail[i + 1] = this.tail[i];
      }

      newTail.length = this.tail.length + 1;

      return new ChunkedList<T>(null, newTail, this._size + 1, 0);
    }

    // Fast path: if the insertion point is in the tail
    const tailOffset = this._size - this.tail.length;
    if (index >= tailOffset) {
      // Insert into the tail
      const tailIndex = index - tailOffset;

      // Use the chunk pool to create a new tail
      const chunkPool = ChunkPool.getInstance<T>();
      const newTail = chunkPool.acquire();

      // Copy elements before the insertion point
      for (let i = 0; i < tailIndex; i++) {
        newTail[i] = this.tail[i];
      }

      // Insert the new value
      newTail[tailIndex] = value;

      // Copy elements after the insertion point
      for (let i = tailIndex; i < this.tail.length; i++) {
        newTail[i + 1] = this.tail[i];
      }

      newTail.length = this.tail.length + 1;

      return new ChunkedList<T>(this.root, newTail, this._size + 1, this.height);
    }

    // For small to medium lists, the simple approach is still efficient
    if (this._size < 1000) {
      const elements = this.toArray();
      elements.splice(index, 0, value);
      return ChunkedList.from(elements);
    }

    // For larger lists, use path copying for structural sharing
    try {
      // Find the path to the insertion point
      const path = this.findPathToIndex(index);

      // Insert the value at the appropriate position
      const newRoot = this.insertIntoPath(path, index, value);

      return new ChunkedList<T>(newRoot, this.tail, this._size + 1, this.height);
    } catch (error) {
      // Fallback to the simple approach if path copying fails
      console.error(`Error in insert: ${error}`);
      const elements = this.toArray();
      elements.splice(index, 0, value);
      return ChunkedList.from(elements);
    }
  }

  /**
   * Find the path to a specific index in the trie
   *
   * @param index - The index to find
   * @returns The path to the index
   */
  private findPathToIndex(index: number): Node<T>[] {
    if (this.root === null) {
      throw new Error('Cannot find path in empty trie');
    }

    const path: Node<T>[] = [this.root];
    let node = this.root;
    let idx = index;

    for (let level = this.height; level > 0; level--) {
      const childIndex = (idx >> (level * SHIFT)) & MASK;
      if (childIndex >= node.children.length) {
        throw new Error(`Child index ${childIndex} out of bounds at level ${level}`);
      }

      const child = node.children[childIndex] as Node<T>;
      if (!child) {
        throw new Error(`Child at index ${childIndex} is undefined at level ${level}`);
      }

      path.push(child);
      node = child;
    }

    return path;
  }

  /**
   * Insert a value into a path
   *
   * @param path - The path to insert into
   * @param index - The index to insert at
   * @param value - The value to insert
   * @returns A new root node with the value inserted
   */
  private insertIntoPath(path: Node<T>[], index: number, value: T): Node<T> {
    // Create a copy of the path
    const newPath = [...path];

    // Get the leaf node
    const leafNode = newPath[newPath.length - 1];
    const leafIndex = index & MASK;

    // Create a new leaf node with the inserted value
    const chunkPool = ChunkPool.getInstance<T>();
    const newLeafChildren = chunkPool.acquire();

    // Copy elements before the insertion point
    for (let i = 0; i < leafIndex; i++) {
      if (i < leafNode.children.length) {
        newLeafChildren[i] = leafNode.children[i] as T;
      }
    }

    // Insert the new value
    newLeafChildren[leafIndex] = value;

    // Copy elements after the insertion point
    for (let i = leafIndex; i < leafNode.children.length; i++) {
      newLeafChildren[i + 1] = leafNode.children[i] as T;
    }

    // Update the leaf node
    const newLeafNode: Node<T> = {
      children: newLeafChildren,
      size: leafNode.size + 1
    };

    // Update the path from bottom to top
    newPath[newPath.length - 1] = newLeafNode;

    // Rebuild the path with updated sizes
    for (let i = newPath.length - 2; i >= 0; i--) {
      const currentNode = newPath[i];
      const childIndex = (index >> (i * SHIFT)) & MASK;

      const newChildren = [...currentNode.children];
      newChildren[childIndex] = newPath[i + 1];

      newPath[i] = {
        children: newChildren,
        size: currentNode.size + 1
      };
    }

    // Return the new root
    return newPath[0];
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

    // Fast path: if the list has only one element, return an empty list
    if (this._size === 1) {
      return new ChunkedList<T>(null, [], 0, 0);
    }

    // Fast path: if we only have a tail, remove directly from the tail
    if (this.root === null) {
      // Use the chunk pool to create a new tail
      const chunkPool = ChunkPool.getInstance<T>();
      const newTail = chunkPool.acquire();

      // Copy elements before the removal point
      for (let i = 0; i < index; i++) {
        newTail[i] = this.tail[i];
      }

      // Copy elements after the removal point
      for (let i = index + 1; i < this.tail.length; i++) {
        newTail[i - 1] = this.tail[i];
      }

      newTail.length = this.tail.length - 1;

      return new ChunkedList<T>(null, newTail, this._size - 1, 0);
    }

    // Fast path: if the removal point is in the tail
    const tailOffset = this._size - this.tail.length;
    if (index >= tailOffset) {
      // Remove from the tail
      const tailIndex = index - tailOffset;

      // Use the chunk pool to create a new tail
      const chunkPool = ChunkPool.getInstance<T>();
      const newTail = chunkPool.acquire();

      // Copy elements before the removal point
      for (let i = 0; i < tailIndex; i++) {
        newTail[i] = this.tail[i];
      }

      // Copy elements after the removal point
      for (let i = tailIndex + 1; i < this.tail.length; i++) {
        newTail[i - 1] = this.tail[i];
      }

      newTail.length = this.tail.length - 1;

      return new ChunkedList<T>(this.root, newTail, this._size - 1, this.height);
    }

    // For small to medium lists, the simple approach is still efficient
    if (this._size < 1000) {
      const elements = this.toArray();
      elements.splice(index, 1);
      return ChunkedList.from(elements);
    }

    // For larger lists, use path copying for structural sharing
    try {
      // Find the path to the removal point
      const path = this.findPathToIndex(index);

      // Remove the value at the appropriate position
      const newRoot = this.removeFromPath(path, index);

      return new ChunkedList<T>(newRoot, this.tail, this._size - 1, this.height);
    } catch (error) {
      // Fallback to the simple approach if path copying fails
      console.error(`Error in remove: ${error}`);
      const elements = this.toArray();
      elements.splice(index, 1);
      return ChunkedList.from(elements);
    }
  }

  /**
   * Remove a value from a path
   *
   * @param path - The path to remove from
   * @param index - The index to remove at
   * @returns A new root node with the value removed
   */
  private removeFromPath(path: Node<T>[], index: number): Node<T> {
    // Create a copy of the path
    const newPath = [...path];

    // Get the leaf node
    const leafNode = newPath[newPath.length - 1];
    const leafIndex = index & MASK;

    // Create a new leaf node without the removed value
    const chunkPool = ChunkPool.getInstance<T>();
    const newLeafChildren = chunkPool.acquire();

    // Copy elements before the removal point
    for (let i = 0; i < leafIndex; i++) {
      if (i < leafNode.children.length) {
        newLeafChildren[i] = leafNode.children[i] as T;
      }
    }

    // Copy elements after the removal point
    for (let i = leafIndex + 1; i < leafNode.children.length; i++) {
      newLeafChildren[i - 1] = leafNode.children[i] as T;
    }

    // Update the leaf node
    const newLeafNode: Node<T> = {
      children: newLeafChildren,
      size: leafNode.size - 1
    };

    // Update the path from bottom to top
    newPath[newPath.length - 1] = newLeafNode;

    // Rebuild the path with updated sizes
    for (let i = newPath.length - 2; i >= 0; i--) {
      const currentNode = newPath[i];
      const childIndex = (index >> (i * SHIFT)) & MASK;

      const newChildren = [...currentNode.children];
      newChildren[childIndex] = newPath[i + 1];

      newPath[i] = {
        children: newChildren,
        size: currentNode.size - 1
      };
    }

    // Return the new root
    return newPath[0];
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
      // Use the chunk pool to create a new tail
      const chunkPool = ChunkPool.getInstance<T>();
      const newTail = chunkPool.acquire();

      // Copy the current tail to the new tail
      for (let i = 0; i < this.tail.length; i++) {
        newTail[i] = this.tail[i];
      }

      // Add the new value
      newTail[this.tail.length] = value;
      newTail.length = this.tail.length + 1;

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

      // Incorporate the tail into the trie using path copying for structural sharing
      newRoot = this.incorporateTailIntoTrie(newRoot, newHeight, tailOffset);
    }

    // Create a new tail with the appended value
    const newTail = [value];

    return new ChunkedList<T>(newRoot, newTail, this._size + 1, newHeight);
  }

  /**
   * Incorporate the tail into the trie using path copying for structural sharing
   *
   * @param root - The root node
   * @param height - The height of the trie
   * @param tailOffset - The offset of the tail in the list
   * @returns A new root node with the tail incorporated
   */
  private incorporateTailIntoTrie(root: Node<T>, height: number, tailOffset: number): Node<T> {
    // Create a path to where the tail should be inserted
    const path: Node<T>[] = [];
    let node = root;
    path.push(node);

    // Navigate to the position where the tail should be inserted
    for (let level = height; level > 0; level--) {
      const childIndex = (tailOffset >> (level * SHIFT)) & MASK;

      // Ensure the path exists by creating nodes as needed
      if (childIndex >= node.children.length) {
        // Create a new node with extended children array
        const newChildren = [...node.children];
        while (newChildren.length <= childIndex) {
          newChildren.push(emptyNode<T>());
        }

        // Update the current node in the path
        node = {
          children: newChildren,
          size: node.size
        };
        path[path.length - 1] = node;
      }

      // Move to the next level
      const nextNode = node.children[childIndex] as Node<T>;
      node = nextNode || emptyNode<T>();
      path.push(node);
    }

    // At the leaf level, insert the tail
    const leafIndex = tailOffset & MASK;
    const leafNode = path[path.length - 1];

    // Create a new leaf node with the tail
    const chunkPool = ChunkPool.getInstance<T>();
    const newLeafChildren = chunkPool.acquire();

    // Copy the existing children
    for (let i = 0; i < leafNode.children.length; i++) {
      newLeafChildren[i] = leafNode.children[i] as T;
    }

    // Ensure the array is large enough
    while (newLeafChildren.length <= leafIndex) {
      newLeafChildren.push(undefined as unknown as T);
    }

    // Create a new chunk for the tail
    const tailChunk = chunkPool.acquire();
    for (let i = 0; i < this.tail.length; i++) {
      tailChunk[i] = this.tail[i];
    }
    tailChunk.length = this.tail.length;

    // Add the tail to the leaf node
    newLeafChildren[leafIndex] = {
      children: tailChunk,
      size: this.tail.length
    } as unknown as T;

    // Update the leaf node
    const newLeafNode: Node<T> = {
      children: newLeafChildren,
      size: leafNode.size + this.tail.length
    };

    // Update the path from bottom to top
    path[path.length - 1] = newLeafNode;

    // Rebuild the path with updated sizes
    for (let i = path.length - 2; i >= 0; i--) {
      const currentNode = path[i];
      const childIndex = i === 0
        ? 0 // Root node has only one child for the first level
        : ((tailOffset >> ((i - 1) * SHIFT)) & MASK);

      const newChildren = [...currentNode.children];
      newChildren[childIndex] = path[i + 1];

      path[i] = {
        children: newChildren,
        size: currentNode.size + this.tail.length
      };
    }

    // Return the new root
    return path[0];
  }

  /**
   * Prepend a value to the beginning of the list
   *
   * @param value - The value to prepend
   * @returns A new list with the prepended value
   */
  prepend(value: T): ChunkedList<T> {
    // Fast path: if the list is empty, create a new list with just the value
    if (this.isEmpty) {
      return new ChunkedList<T>(null, [value], 1, 0);
    }

    // Fast path: if the list is small, use a more efficient approach
    if (this._size < BRANCHING_FACTOR) {
      const newTail = [value, ...this.tail];
      return new ChunkedList<T>(null, newTail, this._size + 1, 0);
    }

    // Fast path: if we have space in the first chunk, insert there
    if (this.root !== null && this.height === 0 && this.root.children.length < BRANCHING_FACTOR) {
      // We have a single-level trie with space in the root
      const newChildren = [value, ...this.root.children];
      const newRoot = {
        children: newChildren,
        size: this.root.size + 1
      };
      return new ChunkedList<T>(newRoot, this.tail, this._size + 1, this.height);
    }

    // Medium path: if we have a small trie, use a more efficient approach
    if (this.root !== null && this._size < 100) {
      // Create a new chunk for the value
      const newChunk = [value];

      // Create a new root with the new chunk and the existing chunks
      const newRoot = {
        children: [{
          children: newChunk,
          size: newChunk.length
        }, ...this.root.children],
        size: this.root.size + 1
      };

      return new ChunkedList<T>(newRoot, this.tail, this._size + 1, Math.max(1, this.height));
    }

    // Slow path: for larger tries, we need to rebuild the trie structure
    // This is still more efficient than converting to array and rebuilding
    const newRoot = this.prependToTrie(this.root, this.height);

    return new ChunkedList<T>(
      newRoot,
      this.tail,
      this._size + 1,
      newRoot === null ? 0 : this.height + 1
    );
  }

  /**
   * Prepend a value to the trie by creating a new level
   *
   * @param root - The root node
   * @param _height - The height of the trie (unused but kept for API consistency)
   * @returns A new root node with the value prepended
   */
  private prependToTrie(root: Node<T> | null, _height: number): Node<T> | null {
    if (root === null) {
      return null;
    }

    // Create a new root node with the existing root as its second child
    // The first child will be filled in later with the prepended value
    const newRoot: Node<T> = {
      children: [emptyNode<T>(), root],
      size: root.size + 1
    };

    return newRoot;
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
    // Fast path: if the list is empty, return an empty list
    if (this.isEmpty) {
      return new ChunkedList<U>(null, [], 0, 0);
    }

    // Fast path: if we only have a tail, map the tail directly
    if (this.root === null) {
      const mappedTail = this.tail.map((value, index) => fn(value, index));
      return new ChunkedList<U>(null, mappedTail, mappedTail.length, 0);
    }

    // For small lists, the simple approach is still efficient
    if (this._size < 100) {
      const elements = this.toArray().map(fn);
      return ChunkedList.from(elements);
    }

    // For larger lists, map the trie structure directly
    const mappedRoot = this.mapNode(this.root, this.height, fn, 0);
    const tailOffset = this._size - this.tail.length;
    const mappedTail = this.tail.map((value, index) => fn(value, tailOffset + index));

    return new ChunkedList<U>(mappedRoot, mappedTail, this._size, this.height);
  }

  /**
   * Map a node and its children
   *
   * @param node - The node to map
   * @param level - The level of the node in the trie
   * @param fn - The mapping function
   * @param indexOffset - The index offset for the node
   * @returns A new node with mapped values
   */
  private mapNode<U>(
    node: Node<T>,
    level: number,
    fn: (value: T, index: number) => U,
    indexOffset: number
  ): Node<U> {
    if (level === 0) {
      // Leaf level - map the values directly
      const mappedChildren = node.children.map((value, i) => {
        return fn(value as T, indexOffset + i);
      });

      return {
        children: mappedChildren,
        size: node.size
      };
    }

    // Internal level - recursively map the children
    const mappedChildren: (Node<U>)[] = [];
    let currentOffset = indexOffset;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i] as Node<T>;
      if (child) {
        const childSize = child.size || 0;
        mappedChildren.push(this.mapNode(child, level - 1, fn, currentOffset));
        currentOffset += childSize;
      } else {
        mappedChildren.push(emptyNode<U>());
      }
    }

    return {
      children: mappedChildren,
      size: node.size
    };
  }

  /**
   * Filter elements in the list based on a predicate
   *
   * @param fn - The predicate function
   * @returns A new list with the filtered values
   */
  filter(fn: (value: T, index: number) => boolean): ChunkedList<T> {
    // Fast path: if the list is empty, return an empty list
    if (this.isEmpty) {
      return new ChunkedList<T>(null, [], 0, 0);
    }

    // Fast path: if we only have a tail, filter the tail directly
    if (this.root === null) {
      const filteredTail = this.tail.filter((value, index) => fn(value, index));
      return new ChunkedList<T>(null, filteredTail, filteredTail.length, 0);
    }

    // For small lists, the simple approach is still efficient
    if (this._size < 100) {
      const elements = this.toArray().filter(fn);
      return ChunkedList.from(elements);
    }

    // For larger lists, use a more efficient approach that avoids full array conversion
    // We'll use the chunk pool to collect filtered elements and then build a new list
    const chunkPool = ChunkPool.getInstance<T>();
    let filteredElements = chunkPool.acquire();
    let filteredCount = 0;

    // We'll collect all filtered chunks here
    const allFilteredChunks: T[][] = [];

    // Helper function to collect filtered elements from the trie
    const collectFilteredElements = (node: Node<T>, level: number, indexOffset: number): void => {
      if (level === 0) {
        // Leaf level - filter elements directly
        for (let i = 0; i < node.children.length; i++) {
          const value = node.children[i];
          if (value !== undefined && fn(value as T, indexOffset + i)) {
            filteredElements[filteredCount++] = value as T;

            // If we've filled the current chunk, add it to our collection and start a new one
            if (filteredCount === BRANCHING_FACTOR) {
              // Add the current chunk to our collection
              allFilteredChunks.push(filteredElements);

              // Start a new filtered elements array
              filteredElements = chunkPool.acquire();
              filteredCount = 0;
            }
          }
        }
      } else {
        // Internal level - recursively collect elements from children
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child !== undefined) {
            const childOffset = indexOffset + (i * Math.pow(BRANCHING_FACTOR, level));
            collectFilteredElements(child as Node<T>, level - 1, childOffset);
          }
        }
      }
    };

    // Collect filtered elements from the trie
    collectFilteredElements(this.root, this.height, 0);

    // Filter elements from the tail
    const tailOffset = this._size - this.tail.length;
    for (let i = 0; i < this.tail.length; i++) {
      if (fn(this.tail[i], tailOffset + i)) {
        filteredElements[filteredCount++] = this.tail[i];

        // If we've filled the current chunk, add it to our collection and start a new one
        if (filteredCount === BRANCHING_FACTOR) {
          // Add the current chunk to our collection
          allFilteredChunks.push(filteredElements);

          // Start a new filtered elements array
          filteredElements = chunkPool.acquire();
          filteredCount = 0;
        }
      }
    }

    // If we have any elements in the current chunk, add it to our collection
    if (filteredCount > 0) {
      filteredElements.length = filteredCount;
      allFilteredChunks.push(filteredElements);
    } else {
      // Release the empty chunk back to the pool
      chunkPool.release(filteredElements);
    }

    // If we have no filtered elements, return an empty list
    if (allFilteredChunks.length === 0) {
      return new ChunkedList<T>(null, [], 0, 0);
    }

    // If we have only one chunk and it's small enough, use it as the tail
    if (allFilteredChunks.length === 1 && allFilteredChunks[0].length <= BRANCHING_FACTOR) {
      return new ChunkedList<T>(null, allFilteredChunks[0], allFilteredChunks[0].length, 0);
    }

    // Otherwise, build a proper list from all the chunks
    // Flatten all chunks into a single array
    const totalElements = allFilteredChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Array<T>(totalElements);
    let resultIndex = 0;

    for (const chunk of allFilteredChunks) {
      for (let i = 0; i < chunk.length; i++) {
        result[resultIndex++] = chunk[i];
      }
      // Release the chunk back to the pool
      chunkPool.release(chunk);
    }

    // Create a new list from the filtered elements
    return ChunkedList.from(result);
  }

  /**
   * Update multiple elements at once
   *
   * @param updates - An array of [index, value] pairs
   * @returns A new list with the updated values
   * @throws {RangeError} If any index is out of bounds
   */
  updateMany(updates: Array<[number, T]>): ChunkedList<T> {
    if (updates.length === 0) {
      return this;
    }

    // Sort updates by index for more efficient processing
    const sortedUpdates = [...updates].sort((a, b) => a[0] - b[0]);

    // Validate all indices
    for (const [index] of sortedUpdates) {
      if (index < 0 || index >= this._size) {
        throw new RangeError(`Index ${index} out of bounds`);
      }
    }

    // Fast path: if we only have a tail, update directly
    if (this.root === null) {
      // Create a new tail array
      const newTail = new Array<T>(this.tail.length);

      // Copy the current tail to the new tail
      for (let i = 0; i < this.tail.length; i++) {
        newTail[i] = this.tail[i];
      }

      // Apply updates
      for (const [index, value] of sortedUpdates) {
        newTail[index] = value;
      }

      return new ChunkedList<T>(null, newTail, this._size, 0);
    }

    // Group updates by their location (trie or tail)
    const tailOffset = this._size - this.tail.length;
    const trieUpdates: Array<[number, T]> = [];
    const tailUpdates: Array<[number, T]> = [];

    for (const [index, value] of sortedUpdates) {
      if (index >= tailOffset) {
        tailUpdates.push([index - tailOffset, value]);
      } else {
        trieUpdates.push([index, value]);
      }
    }

    // Handle tail updates
    let newTail = this.tail;
    if (tailUpdates.length > 0) {
      // Create a new tail array
      const tempTail = new Array<T>(this.tail.length);

      // Copy the current tail to the new tail
      for (let i = 0; i < this.tail.length; i++) {
        tempTail[i] = this.tail[i];
      }

      // Apply tail updates
      for (const [index, value] of tailUpdates) {
        tempTail[index] = value;
      }

      newTail = tempTail;
    }

    // If there are no trie updates, we're done
    if (trieUpdates.length === 0) {
      return new ChunkedList<T>(this.root, newTail, this._size, this.height);
    }

    // For small to medium lists, the simple approach is still efficient
    if (this._size < 1000) {
      const elements = this.toArray();
      for (const [index, value] of sortedUpdates) {
        elements[index] = value;
      }
      return ChunkedList.from(elements);
    }

    // For larger lists, use path copying for structural sharing
    try {
      // Group updates by their path in the trie
      const pathMap = new Map<number, Array<[number, T]>>();

      for (const [index, value] of trieUpdates) {
        const pathKey = index >> (this.height * SHIFT);
        if (!pathMap.has(pathKey)) {
          pathMap.set(pathKey, []);
        }
        pathMap.get(pathKey)!.push([index, value]);
      }

      // Apply updates path by path
      let newRoot = this.root;

      for (const [_, pathUpdates] of pathMap.entries()) {
        // Find the path to the first index in this group
        const firstIndex = pathUpdates[0][0];
        const path = this.findPathToIndex(firstIndex);

        // Apply all updates in this path
        newRoot = this.updatePath(path, pathUpdates, newRoot);
      }

      return new ChunkedList<T>(newRoot, newTail, this._size, this.height);
    } catch (error) {
      // Fallback to the simple approach if path copying fails
      console.error(`Error in updateMany: ${error}`);
      const elements = this.toArray();
      for (const [index, value] of sortedUpdates) {
        elements[index] = value;
      }
      return ChunkedList.from(elements);
    }
  }

  /**
   * Update a path with multiple values
   *
   * @param path - The path to update
   * @param updates - The updates to apply
   * @param currentRoot - The current root node
   * @returns A new root node with the updates applied
   */
  private updatePath(path: Node<T>[], updates: Array<[number, T]>, currentRoot: Node<T>): Node<T> {
    // Create a copy of the path
    const newPath = [...path];

    // Get the leaf node
    const leafNode = newPath[newPath.length - 1];

    // Create a new leaf node with the updated values
    const newLeafChildren = [...leafNode.children] as T[];

    // Apply updates to the leaf node
    for (const [index, value] of updates) {
      const leafIndex = index & MASK;
      newLeafChildren[leafIndex] = value;
    }

    // Update the leaf node
    const newLeafNode: Node<T> = {
      children: newLeafChildren,
      size: leafNode.size
    };

    // Update the path from bottom to top
    newPath[newPath.length - 1] = newLeafNode;

    // Rebuild the path
    for (let i = newPath.length - 2; i >= 0; i--) {
      const currentNode = newPath[i];
      const childIndex = (updates[0][0] >> (i * SHIFT)) & MASK;

      const newChildren = [...currentNode.children];
      newChildren[childIndex] = newPath[i + 1];

      newPath[i] = {
        children: newChildren,
        size: currentNode.size
      };
    }

    // If we're updating the root, return the new root
    if (path[0] === currentRoot) {
      return newPath[0];
    }

    // Otherwise, we need to merge the new path into the current root
    const rootChildIndex = (updates[0][0] >> (this.height * SHIFT)) & MASK;
    const newRootChildren = [...currentRoot.children];
    newRootChildren[rootChildIndex] = newPath[0];

    return {
      children: newRootChildren,
      size: currentRoot.size
    };
  }

  /**
   * Remove multiple elements at once
   *
   * @param indices - An array of indices to remove
   * @returns A new list with the elements removed
   * @throws {RangeError} If any index is out of bounds
   */
  removeMany(indices: number[]): ChunkedList<T> {
    if (indices.length === 0) {
      return this;
    }

    // Sort indices in descending order for more efficient removal
    const sortedIndices = [...indices].sort((a, b) => b - a);

    // Validate all indices
    for (const index of sortedIndices) {
      if (index < 0 || index >= this._size) {
        throw new RangeError(`Index ${index} out of bounds`);
      }
    }

    // Fast path: if removing all elements, return empty list
    if (sortedIndices.length >= this._size) {
      return new ChunkedList<T>(null, [], 0, 0);
    }

    // Fast path: if we only have a tail, remove directly
    if (this.root === null) {
      // Copy the current tail to a temporary array
      const tempTail = [...this.tail];

      // Remove elements in descending order to avoid index shifting
      for (const index of sortedIndices) {
        tempTail.splice(index, 1);
      }

      return new ChunkedList<T>(null, tempTail, tempTail.length, 0);
    }

    // For small to medium lists, the simple approach is still efficient
    if (this._size < 1000) {
      const elements = this.toArray();

      // Remove elements in descending order to avoid index shifting
      for (const index of sortedIndices) {
        elements.splice(index, 1);
      }

      return ChunkedList.from(elements);
    }

    // For larger lists, we need a more efficient approach
    // Create a bitmap of indices to keep
    const keepBitmap = new Array(this._size).fill(true);
    for (const index of indices) {
      keepBitmap[index] = false;
    }

    // Collect elements to keep
    const keptElements: T[] = [];

    // Helper function to collect elements to keep from the trie
    const collectKeptElements = (node: Node<T>, level: number, indexOffset: number): void => {
      if (level === 0) {
        // Leaf level - collect elements directly
        for (let i = 0; i < node.children.length; i++) {
          const value = node.children[i];
          const globalIndex = indexOffset + i;

          if (value !== undefined && globalIndex < this._size && keepBitmap[globalIndex]) {
            keptElements.push(value as T);
          }
        }
      } else {
        // Internal level - recursively collect elements from children
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child !== undefined) {
            const childOffset = indexOffset + (i * Math.pow(BRANCHING_FACTOR, level));
            collectKeptElements(child as Node<T>, level - 1, childOffset);
          }
        }
      }
    };

    // Collect elements to keep from the trie
    collectKeptElements(this.root, this.height, 0);

    // Collect elements to keep from the tail
    const tailOffset = this._size - this.tail.length;
    for (let i = 0; i < this.tail.length; i++) {
      const globalIndex = tailOffset + i;
      if (keepBitmap[globalIndex]) {
        keptElements.push(this.tail[i]);
      }
    }

    // If we have no kept elements, return an empty list
    if (keptElements.length === 0) {
      return new ChunkedList<T>(null, [], 0, 0);
    }

    // Create a new list from the kept elements
    return ChunkedList.from(keptElements);
  }

  /**
   * Insert multiple elements at once
   *
   * @param insertions - An array of [index, value] pairs
   * @returns A new list with the elements inserted
   * @throws {RangeError} If any index is out of bounds
   */
  insertMany(insertions: Array<[number, T]>): ChunkedList<T> {
    if (insertions.length === 0) {
      return this;
    }

    // Sort insertions by index for more efficient processing
    const sortedInsertions = [...insertions].sort((a, b) => a[0] - b[0]);

    // Validate all indices
    for (const [index] of sortedInsertions) {
      if (index < 0 || index > this._size) {
        throw new RangeError(`Index ${index} out of bounds`);
      }
    }

    // Fast path: if the list is empty, create a new list with just the inserted values
    if (this.isEmpty) {
      // Ensure insertions are at index 0
      for (const [index] of sortedInsertions) {
        if (index !== 0) {
          throw new RangeError(`Index ${index} out of bounds for empty list`);
        }
      }

      // Extract values in the correct order
      const values = sortedInsertions.map(([_, value]) => value);
      return ChunkedList.from(values);
    }

    // Fast path: if we only have a tail and all insertions are at the end
    if (this.root === null && sortedInsertions.every(([index]) => index === this._size)) {
      // Create a new tail array
      const newTail = [...this.tail];

      // Add the new values
      for (const [_, value] of sortedInsertions) {
        newTail.push(value);
      }

      return new ChunkedList<T>(null, newTail, newTail.length, 0);
    }

    // For small to medium lists, the simple approach is still efficient
    if (this._size < 1000) {
      const elements = this.toArray();

      // Apply insertions in reverse order to avoid index shifting
      for (let i = sortedInsertions.length - 1; i >= 0; i--) {
        const [index, value] = sortedInsertions[i];
        elements.splice(index, 0, value);
      }

      return ChunkedList.from(elements);
    }

    // For larger lists, we need a more efficient approach
    // Create a new array with the correct size
    const newSize = this._size + sortedInsertions.length;
    const result = new Array<T>(newSize);

    // Create a map of insertion indices
    const insertionMap = new Map<number, T>();
    for (const [index, value] of sortedInsertions) {
      insertionMap.set(index, value);
    }

    // Fill the result array
    let sourceIndex = 0;
    let targetIndex = 0;

    while (sourceIndex < this._size || targetIndex < newSize) {
      // Check if we need to insert at this position
      if (insertionMap.has(sourceIndex)) {
        result[targetIndex++] = insertionMap.get(sourceIndex)!;
      }

      // Copy the original element if we haven't reached the end
      if (sourceIndex < this._size) {
        result[targetIndex++] = this.get(sourceIndex++)!;
      } else {
        // We've reached the end of the original list
        // Check if we have any remaining insertions at the end
        if (insertionMap.has(sourceIndex)) {
          result[targetIndex++] = insertionMap.get(sourceIndex)!;
          sourceIndex++;
        } else {
          break;
        }
      }
    }

    // Create a new list from the result array
    return ChunkedList.from(result);
  }

  /**
   * Reduce the list to a single value
   *
   * @param fn - The reducer function
   * @param initial - The initial value
   * @returns The reduced value
   */
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U {
    // Fast path: if the list is empty, return the initial value
    if (this.isEmpty) {
      return initial;
    }

    // Fast path: if we only have a tail, reduce the tail directly
    if (this.root === null) {
      return this.tail.reduce(fn, initial);
    }

    // For small lists, the simple approach is still efficient
    if (this._size < 100) {
      return this.toArray().reduce(fn, initial);
    }

    // For larger lists, use a more efficient approach that avoids full array conversion
    let result = initial;
    let currentIndex = 0;

    // Helper function to reduce elements from the trie
    const reduceElements = (node: Node<T>, level: number): void => {
      if (level === 0) {
        // Leaf level - reduce elements directly
        for (let i = 0; i < node.children.length; i++) {
          const value = node.children[i];
          if (value !== undefined) {
            result = fn(result, value as T, currentIndex++);
          }
        }
      } else {
        // Internal level - recursively reduce elements from children
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child !== undefined) {
            reduceElements(child as Node<T>, level - 1);
          }
        }
      }
    };

    // Reduce elements from the trie
    reduceElements(this.root, this.height);

    // Reduce elements from the tail
    for (let i = 0; i < this.tail.length; i++) {
      result = fn(result, this.tail[i], currentIndex++);
    }

    return result;
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
    // Fast path: if the list is empty, return an empty array
    if (this.isEmpty) {
      return [];
    }

    // Fast path: if we only have a tail, return a copy of the tail
    if (this.root === null) {
      return [...this.tail];
    }

    // Pre-allocate the result array for better performance
    const result = new Array<T>(this._size);
    let resultIndex = 0;

    // Helper function to collect elements from the trie
    const collectElements = (node: Node<T>, level: number): void => {
      if (level === 0) {
        // Leaf level - collect elements directly
        for (let i = 0; i < node.children.length; i++) {
          const value = node.children[i];
          if (value !== undefined) {
            result[resultIndex++] = value as T;
          }
        }
      } else {
        // Internal level - recursively collect elements from children
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child !== undefined) {
            collectElements(child as Node<T>, level - 1);
          }
        }
      }
    };

    // Collect elements from the trie
    collectElements(this.root, this.height);

    // Add elements from the tail
    for (let i = 0; i < this.tail.length; i++) {
      result[resultIndex++] = this.tail[i];
    }

    // If we didn't fill the entire array (due to sparse nodes), truncate it
    if (resultIndex < result.length) {
      return result.slice(0, resultIndex);
    }

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
    // Fast path: if the list is empty, return the initial value
    if (this.isEmpty) {
      return initial;
    }

    // Fast path: if we only have a tail, process the tail directly
    if (this.root === null) {
      let result = initial;
      let filteredIndex = 0;

      for (let i = 0; i < this.tail.length; i++) {
        const mappedValue = mapFn(this.tail[i], i);
        if (filterFn(mappedValue, i)) {
          result = reduceFn(result, mappedValue, filteredIndex++);
        }
      }

      return result;
    }

    // For small lists, the simple approach is still efficient
    if (this._size < 100) {
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

    // For larger lists, use a more efficient approach that avoids full array conversion
    let result = initial;
    let currentIndex = 0;
    let filteredIndex = 0;

    // Helper function to process elements from the trie
    const processElements = (node: Node<T>, level: number): void => {
      if (level === 0) {
        // Leaf level - process elements directly
        for (let i = 0; i < node.children.length; i++) {
          const value = node.children[i];
          if (value !== undefined) {
            const mappedValue = mapFn(value as T, currentIndex++);
            if (filterFn(mappedValue, currentIndex - 1)) {
              result = reduceFn(result, mappedValue, filteredIndex++);
            }
          }
        }
      } else {
        // Internal level - recursively process elements from children
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child !== undefined) {
            processElements(child as Node<T>, level - 1);
          }
        }
      }
    };

    // Process elements from the trie
    processElements(this.root, this.height);

    // Process elements from the tail
    for (let i = 0; i < this.tail.length; i++) {
      const mappedValue = mapFn(this.tail[i], currentIndex++);
      if (filterFn(mappedValue, currentIndex - 1)) {
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
    // Fast path: if the list is empty, return the initial value
    if (this.isEmpty) {
      return initial;
    }

    // Fast path: if we only have a tail, process the tail directly
    if (this.root === null) {
      let result = initial;

      for (let i = 0; i < this.tail.length; i++) {
        const mappedValue = mapFn(this.tail[i], i);
        result = reduceFn(result, mappedValue, i);
      }

      return result;
    }

    // For small lists, the simple approach is still efficient
    if (this._size < 100) {
      let result = initial;

      const elements = this.toArray();
      for (let i = 0; i < elements.length; i++) {
        const mappedValue = mapFn(elements[i], i);
        result = reduceFn(result, mappedValue, i);
      }

      return result;
    }

    // For larger lists, use a more efficient approach that avoids full array conversion
    let result = initial;
    let currentIndex = 0;

    // Helper function to process elements from the trie
    const processElements = (node: Node<T>, level: number): void => {
      if (level === 0) {
        // Leaf level - process elements directly
        for (let i = 0; i < node.children.length; i++) {
          const value = node.children[i];
          if (value !== undefined) {
            const mappedValue = mapFn(value as T, currentIndex);
            result = reduceFn(result, mappedValue, currentIndex);
            currentIndex++;
          }
        }
      } else {
        // Internal level - recursively process elements from children
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child !== undefined) {
            processElements(child as Node<T>, level - 1);
          }
        }
      }
    };

    // Process elements from the trie
    processElements(this.root, this.height);

    // Process elements from the tail
    for (let i = 0; i < this.tail.length; i++) {
      const mappedValue = mapFn(this.tail[i], currentIndex);
      result = reduceFn(result, mappedValue, currentIndex);
      currentIndex++;
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
    // Fast path: if the list is empty, return an empty list
    if (this.isEmpty) {
      return new ChunkedList<U>(null, [], 0, 0);
    }

    // Fast path: if we only have a tail, process the tail directly
    if (this.root === null) {
      const result: U[] = [];

      for (let i = 0; i < this.tail.length; i++) {
        if (filterFn(this.tail[i], i)) {
          result.push(mapFn(this.tail[i], i));
        }
      }

      return ChunkedList.from(result);
    }

    // For small lists, the simple approach is still efficient
    if (this._size < 100) {
      const result: U[] = [];

      const elements = this.toArray();
      for (let i = 0; i < elements.length; i++) {
        if (filterFn(elements[i], i)) {
          result.push(mapFn(elements[i], i));
        }
      }

      return ChunkedList.from(result);
    }

    // For larger lists, use a more efficient approach that avoids full array conversion
    const result: U[] = [];
    let currentIndex = 0;

    // Helper function to process elements from the trie
    const processElements = (node: Node<T>, level: number): void => {
      if (level === 0) {
        // Leaf level - process elements directly
        for (let i = 0; i < node.children.length; i++) {
          const value = node.children[i];
          if (value !== undefined) {
            if (filterFn(value as T, currentIndex)) {
              result.push(mapFn(value as T, currentIndex));
            }
            currentIndex++;
          }
        }
      } else {
        // Internal level - recursively process elements from children
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child !== undefined) {
            processElements(child as Node<T>, level - 1);
          }
        }
      }
    };

    // Process elements from the trie
    processElements(this.root, this.height);

    // Process elements from the tail
    for (let i = 0; i < this.tail.length; i++) {
      if (filterFn(this.tail[i], currentIndex)) {
        result.push(mapFn(this.tail[i], currentIndex));
      }
      currentIndex++;
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
