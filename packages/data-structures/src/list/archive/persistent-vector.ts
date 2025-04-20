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

  /**
   * Compression type for the node
   * - 'none': No compression (default)
   * - 'sparse': Sparse array compression for nodes with many empty slots
   * - 'run': Run-length encoding for nodes with repeated values
   */
  readonly compressionType?: 'none' | 'sparse' | 'run';

  /**
   * Compression data, used when compressionType is not 'none'
   * For 'sparse': Map of index -> value
   * For 'run': Array of [value, count] pairs
   */
  readonly compressionData?: any;
}

/**
 * Threshold for sparse node compression
 * If a node has fewer than this percentage of slots filled, it will be compressed
 */
const SPARSE_COMPRESSION_THRESHOLD = 0.3; // 30%

/**
 * Threshold for run-length encoding compression
 * If a node has runs of the same value longer than this, it will be compressed
 */
const RUN_COMPRESSION_THRESHOLD = 8; // 8 consecutive identical values

/**
 * Maximum size of the node cache
 * This limits how many nodes we keep in memory for reuse
 */
const MAX_NODE_CACHE_SIZE = 100;

/**
 * A cache of node references to reuse identical subtrees
 */
class NodeCache<T> {
  private static instances: Map<string, NodeCache<any>> = new Map();
  private cache: Map<string, Node<T>> = new Map();

  /**
   * Get a singleton instance of the node cache for a specific type
   *
   * @param id - A unique identifier for the type
   * @returns A node cache instance
   */
  static getInstance<T>(id: string = 'default'): NodeCache<T> {
    if (!NodeCache.instances.has(id)) {
      NodeCache.instances.set(id, new NodeCache<T>());
    }
    return NodeCache.instances.get(id) as NodeCache<T>;
  }

  /**
   * Get a node from the cache or create a new one
   *
   * @param node - The node to get or create
   * @returns A cached node or the original node
   */
  getOrCreate(node: Node<T>): Node<T> {
    // Create a key for the node
    const key = this.createNodeKey(node);

    // Check if the node is in the cache
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // If the cache is full, clear it
    if (this.cache.size >= MAX_NODE_CACHE_SIZE) {
      this.cache.clear();
    }

    // Add the node to the cache
    this.cache.set(key, node);

    return node;
  }

  /**
   * Create a key for a node
   *
   * @param node - The node to create a key for
   * @returns A string key
   */
  private createNodeKey(node: Node<T>): string {
    // For compressed nodes, use the compression type and data
    if (node.compressionType === 'sparse') {
      const data = node.compressionData as Map<number, T | Node<T>>;
      const entries = Array.from(data.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([k, v]) => `${k}:${this.valueToString(v)}`);
      return `sparse:${node.size}:${entries.join(',')}`;
    }

    if (node.compressionType === 'run') {
      const data = node.compressionData as Array<[T | Node<T>, number]>;
      const runs = data.map(([v, c]) => `${this.valueToString(v)}:${c}`);
      return `run:${node.size}:${runs.join(',')}`;
    }

    // For regular nodes, use the children
    const children = node.children.map(child => this.valueToString(child));
    return `none:${node.size}:${children.join(',')}`;
  }

  /**
   * Convert a value to a string
   *
   * @param value - The value to convert
   * @returns A string representation of the value
   */
  private valueToString(value: T | Node<T> | undefined): string {
    if (value === undefined) {
      return 'undefined';
    }

    if (typeof value === 'object' && value !== null && 'children' in value) {
      // It's a node, create a key for it
      return this.createNodeKey(value as Node<T>);
    }

    // It's a value, convert to string
    return String(value);
  }
}

/**
 * Create a compressed node from a sparse array
 *
 * @param children - The sparse array of children
 * @param size - The total number of elements in the node
 * @returns A compressed node
 */
function createSparseNode<T>(children: ReadonlyArray<T | Node<T>>, size: number): Node<T> {
  // Check if compression is beneficial
  const filledSlots = children.filter(child => child !== undefined).length;
  const fillRatio = filledSlots / children.length;

  if (fillRatio >= SPARSE_COMPRESSION_THRESHOLD) {
    // Not sparse enough to benefit from compression
    return { children, size, compressionType: 'none' };
  }

  // Create a map of index -> value for non-empty slots
  const compressionData = new Map<number, T | Node<T>>();
  for (let i = 0; i < children.length; i++) {
    if (children[i] !== undefined) {
      compressionData.set(i, children[i]);
    }
  }

  return {
    children: [], // Empty array as we're using the map instead
    size,
    compressionType: 'sparse',
    compressionData
  };
}

/**
 * Create a compressed node using run-length encoding
 *
 * @param children - The array of children
 * @param size - The total number of elements in the node
 * @returns A compressed node
 */
function createRunNode<T>(children: ReadonlyArray<T | Node<T>>, size: number): Node<T> {
  // Check if there are runs that can be compressed
  const runs: Array<[T | Node<T>, number]> = [];
  let currentValue: T | Node<T> | undefined = undefined;
  let currentCount = 0;

  for (let i = 0; i < children.length; i++) {
    if (children[i] === currentValue) {
      currentCount++;
    } else {
      if (currentCount > 0) {
        runs.push([currentValue as T | Node<T>, currentCount]);
      }
      currentValue = children[i];
      currentCount = 1;
    }
  }

  if (currentCount > 0) {
    runs.push([currentValue as T | Node<T>, currentCount]);
  }

  // Check if compression is beneficial
  if (runs.length > children.length / RUN_COMPRESSION_THRESHOLD) {
    // Not enough runs to benefit from compression
    return { children, size, compressionType: 'none' };
  }

  return {
    children: [], // Empty array as we're using the runs instead
    size,
    compressionType: 'run',
    compressionData: runs
  };
}

/**
 * Get a child from a potentially compressed node
 *
 * @param node - The node to get the child from
 * @param index - The index of the child
 * @returns The child at the specified index
 */
function getNodeChild<T>(node: Node<T>, index: number): T | Node<T> | undefined {
  if (!node.compressionType || node.compressionType === 'none') {
    return node.children[index];
  }

  if (node.compressionType === 'sparse') {
    return (node.compressionData as Map<number, T | Node<T>>).get(index);
  }

  if (node.compressionType === 'run') {
    const runs = node.compressionData as Array<[T | Node<T>, number]>;
    let position = 0;

    for (const [value, count] of runs) {
      if (index < position + count) {
        return value;
      }
      position += count;
    }
  }

  return undefined;
}

/**
 * Set a child in a potentially compressed node
 *
 * @param node - The node to set the child in
 * @param index - The index of the child
 * @param value - The value to set
 * @returns A new node with the updated child
 */
function setNodeChild<T>(node: Node<T>, index: number, value: T | Node<T>): Node<T> {
  if (!node.compressionType || node.compressionType === 'none') {
    const newChildren = [...node.children];
    newChildren[index] = value;

    // Check if the new node should be compressed
    if (value === undefined) {
      return createSparseNode(newChildren, node.size);
    }

    return { children: newChildren, size: node.size, compressionType: 'none' };
  }

  if (node.compressionType === 'sparse') {
    const newCompressionData = new Map(node.compressionData as Map<number, T | Node<T>>);

    if (value === undefined) {
      newCompressionData.delete(index);
    } else {
      newCompressionData.set(index, value);
    }

    // Check if we should decompress
    if (newCompressionData.size > node.children.length * SPARSE_COMPRESSION_THRESHOLD) {
      // Convert back to a regular node
      const newChildren = new Array(node.children.length);
      for (const [idx, val] of newCompressionData.entries()) {
        newChildren[idx] = val;
      }
      return { children: newChildren, size: node.size, compressionType: 'none' };
    }

    return {
      children: [],
      size: node.size,
      compressionType: 'sparse',
      compressionData: newCompressionData
    };
  }

  if (node.compressionType === 'run') {
    // For run-length encoding, it's usually easier to decompress, update, and then recompress
    const runs = node.compressionData as Array<[T | Node<T>, number]>;
    const newChildren = new Array(node.children.length);
    let position = 0;

    for (const [val, count] of runs) {
      for (let i = 0; i < count; i++) {
        newChildren[position + i] = val;
      }
      position += count;
    }

    newChildren[index] = value;

    // Try to compress again
    return createRunNode(newChildren, node.size);
  }

  return node;
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

    // Create a node cache for this operation
    const nodeCache = NodeCache.getInstance<T>();

    // Build the trie for the remaining elements
    const buildTrie = (start: number, end: number, level: number): Node<T> => {
      if (level === 0) {
        // Leaf level - create a node with elements
        const children = elements.slice(start, Math.min(start + BRANCHING_FACTOR, end));
        const size = Math.min(BRANCHING_FACTOR, end - start);

        // Check if the node can be compressed
        // First, check for runs of identical values
        const runNode = createRunNode(children, size);
        if (runNode.compressionType === 'run') {
          return nodeCache.getOrCreate(runNode);
        }

        // Then, check for sparse arrays
        const sparseNode = createSparseNode(children, size);
        if (sparseNode.compressionType === 'sparse') {
          return nodeCache.getOrCreate(sparseNode);
        }

        // If no compression is beneficial, return a regular node
        const node: Node<T> = {
          children,
          size,
          compressionType: 'none'
        };

        return nodeCache.getOrCreate(node);
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

      // Check if the internal node can be compressed
      // For internal nodes, we only check for sparse compression
      const sparseNode = createSparseNode(children, nodeSize);
      if (sparseNode.compressionType === 'sparse') {
        return nodeCache.getOrCreate(sparseNode);
      }

      const node: Node<T> = {
        children,
        size: nodeSize,
        compressionType: 'none'
      };

      return nodeCache.getOrCreate(node);
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

      // Get the child using the appropriate method based on compression
      const child = getNodeChild(node, childIndex);
      if (!child) {
        return undefined;
      }

      node = child as Node<T>;
      level--;
    }

    const leafIndex = idx & MASK;

    // Get the value using the appropriate method based on compression
    return getNodeChild(node, leafIndex) as T;
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

    // Create a node cache for this operation
    const nodeCache = NodeCache.getInstance<T>();

    // Helper function to update a node at a specific level
    const updateNode = (node: Node<T>, idx: number, level: number): Node<T> => {
      if (level === 0) {
        // Leaf level - update the element directly
        const leafIndex = idx & MASK;
        const newNode = setNodeChild(node, leafIndex, value);
        return nodeCache.getOrCreate(newNode);
      }

      // Internal level - recursively update the child node
      const childIndex = (idx >> (level * SHIFT)) & MASK;
      const child = getNodeChild(node, childIndex) as Node<T>;
      if (!child) {
        throw new Error(`Child at index ${childIndex} is undefined at level ${level}`);
      }

      const newChild = updateNode(child, idx, level - 1);

      // Create a new node with the updated child
      const newNode = setNodeChild(node, childIndex, newChild);
      return nodeCache.getOrCreate(newNode);
    };

    // Update the root node
    const newRoot = updateNode(this.root, index, this.height);

    return new PersistentVector<T>(newRoot, this.tail, this._size, this.height);
  }

  /**
   * Insert an element at the specified index
   *
   * @param index - The index to insert at
   * @param value - The value to insert
   * @returns A new list with the inserted value
   * @throws {RangeError} If the index is out of bounds
   */
  insert(index: number, value: T): IList<T> {
    if (index < 0 || index > this._size) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    // Fast path: insert at the beginning
    if (index === 0) {
      return this.prepend(value);
    }

    // Fast path: insert at the end
    if (index === this._size) {
      return this.append(value);
    }

    // Fast path: if the list is empty, create a new list with just the value
    if (this.isEmpty) {
      return new PersistentVector<T>(null, [value], 1, 0);
    }

    // Fast path: if the insertion point is in the tail
    const tailOffset = this._size - this.tail.length;
    if (index >= tailOffset) {
      // Insert into the tail
      const tailIndex = index - tailOffset;
      const newTail = [...this.tail.slice(0, tailIndex), value, ...this.tail.slice(tailIndex)];
      return new PersistentVector<T>(this.root, newTail, this._size + 1, this.height);
    }

    // For small to medium lists, the simple approach is still efficient
    if (this._size < 1000) {
      const elements = this.toArray();
      elements.splice(index, 0, value);
      return PersistentVector.from(elements);
    }

    // For larger lists, use path copying for structural sharing
    try {
      // Find the path to the insertion point
      const path = this.findPathToIndex(index);

      // Insert the value at the appropriate position
      const newRoot = this.insertIntoPath(path, index, value);

      return new PersistentVector<T>(newRoot, this.tail, this._size + 1, this.height);
    } catch (error) {
      // Fallback to the simple approach if path copying fails
      console.error(`Error in insert: ${error}`);
      const elements = this.toArray();
      elements.splice(index, 0, value);
      return PersistentVector.from(elements);
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
    const newLeafChildren = [...leafNode.children.slice(0, leafIndex), value, ...leafNode.children.slice(leafIndex)] as T[];

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
   * Remove the element at the specified index
   *
   * @param index - The index to remove
   * @returns A new list with the value removed
   * @throws {RangeError} If the index is out of bounds
   */
  remove(index: number): IList<T> {
    if (index < 0 || index >= this._size) {
      throw new RangeError(`Index ${index} out of bounds`);
    }

    // Fast path: if the list has only one element, return an empty list
    if (this._size === 1) {
      return new PersistentVector<T>(null, [], 0, 0);
    }

    // Fast path: if the removal point is in the tail
    const tailOffset = this._size - this.tail.length;
    if (index >= tailOffset) {
      // Remove from the tail
      const tailIndex = index - tailOffset;
      const newTail = [...this.tail.slice(0, tailIndex), ...this.tail.slice(tailIndex + 1)];
      return new PersistentVector<T>(this.root, newTail, this._size - 1, this.height);
    }

    // For small to medium lists, the simple approach is still efficient
    if (this._size < 1000) {
      const elements = this.toArray();
      elements.splice(index, 1);
      return PersistentVector.from(elements);
    }

    // For larger lists, use path copying for structural sharing
    try {
      // Find the path to the removal point
      const path = this.findPathToIndex(index);

      // Remove the value at the appropriate position
      const newRoot = this.removeFromPath(path, index);

      // Check if we need to decrease the height of the trie
      if (this.height > 0 && newRoot.children.length === 1) {
        // If the root has only one child, we can decrease the height
        return new PersistentVector<T>(
          newRoot.children[0] as Node<T>,
          this.tail,
          this._size - 1,
          this.height - 1
        );
      }

      return new PersistentVector<T>(newRoot, this.tail, this._size - 1, this.height);
    } catch (error) {
      // Fallback to the simple approach if path copying fails
      console.error(`Error in remove: ${error}`);
      const elements = this.toArray();
      elements.splice(index, 1);
      return PersistentVector.from(elements);
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
    const newLeafChildren = [...leafNode.children.slice(0, leafIndex), ...leafNode.children.slice(leafIndex + 1)] as T[];

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

      // If the child is empty and not the only child, remove it
      if (newPath[i + 1].children.length === 0 && newChildren.length > 1) {
        newChildren.splice(childIndex, 1);
      }

      newPath[i] = {
        children: newChildren,
        size: currentNode.size - 1
      };
    }

    // Return the new root
    return newPath[0];
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
   *
   * @param value - The value to prepend
   * @returns A new list with the value prepended
   */
  prepend(value: T): IList<T> {
    // Fast path: if the list is empty, create a new list with just the value
    if (this.isEmpty) {
      return new PersistentVector<T>(null, [value], 1, 0);
    }

    // Fast path: if the list is small, use a simple approach
    if (this._size < 1000) {
      const elements = [value, ...this.toArray()];
      return PersistentVector.from(elements);
    }

    // For larger lists, we need a more efficient approach
    // Create a new root with the value prepended

    // If the root is null, create a new root with the value
    if (this.root === null) {
      return new PersistentVector<T>(null, [value, ...this.tail], this._size + 1, 0);
    }

    // If the first leaf node is not full, we can just prepend to it
    let node = this.root;
    let level = this.height;

    // Navigate to the leftmost leaf
    while (level > 0) {
      node = node.children[0] as Node<T>;
      level--;
    }

    // If the leftmost leaf is not full, we can just prepend to it
    if (node.children.length < BRANCHING_FACTOR) {
      // Create a new path to the leftmost leaf
      const newRoot = this.prependToLeftmostLeaf(value);
      return new PersistentVector<T>(newRoot, this.tail, this._size + 1, this.height);
    }

    // If the leftmost leaf is full, we need to create a new leaf
    // This is more complex and requires shifting all indices
    // For simplicity, we'll use the array-based approach for now
    const elements = [value, ...this.toArray()];
    return PersistentVector.from(elements);
  }

  /**
   * Prepend a value to the leftmost leaf of the trie
   *
   * @param value - The value to prepend
   * @returns A new root node with the value prepended
   */
  private prependToLeftmostLeaf(value: T): Node<T> {
    // Create a new path to the leftmost leaf
    let newNode = this.root;
    let level = this.height;

    // Navigate to the leftmost leaf while creating a new path
    const path: Node<T>[] = [newNode!];
    while (level > 0) {
      newNode = newNode!.children[0] as Node<T>;
      path.push(newNode);
      level--;
    }

    // Create a new leaf node with the value prepended
    const leafNode = path[path.length - 1];
    const newLeafChildren = [value, ...leafNode.children] as T[];

    // Update the leaf node
    const newLeafNode: Node<T> = {
      children: newLeafChildren,
      size: leafNode.size + 1
    };

    // Update the path from bottom to top
    const newPath = [...path];
    newPath[newPath.length - 1] = newLeafNode;

    // Rebuild the path with updated sizes
    for (let i = newPath.length - 2; i >= 0; i--) {
      const currentNode = newPath[i];

      const newChildren = [...currentNode.children];
      newChildren[0] = newPath[i + 1];

      newPath[i] = {
        children: newChildren,
        size: currentNode.size + 1
      };
    }

    // Return the new root
    return newPath[0];
  }

  /**
   * Concatenate this list with another list
   *
   * @param other - The list to concatenate with this list
   * @returns A new list containing all elements from this list followed by all elements from the other list
   */
  concat(other: IList<T>): IList<T> {
    // Fast path: if the other list is empty, return this list
    if (other.isEmpty) {
      return this;
    }

    // Fast path: if this list is empty, return the other list
    if (this.isEmpty) {
      return other;
    }

    // Fast path: if both lists are small, use a simple approach
    if (this._size + other.size < 1000) {
      const elements = [...this.toArray(), ...other.toArray()];
      return PersistentVector.from(elements);
    }

    // For larger lists, we need a more efficient approach
    // We'll use a transient vector for efficient batch operations
    const transient = this.transient() as TransientPersistentVector<T>;

    // Add all elements from the other list
    for (let i = 0; i < other.size; i++) {
      transient.append(other.get(i)!);
    }

    // Convert back to a persistent vector
    return transient.persistent();
  }

  /**
   * Map each element in the list to a new value
   *
   * @param fn - The mapping function
   * @returns A new list with each element mapped to a new value
   */
  map<U>(fn: (value: T, index: number) => U): IList<U> {
    if (this.isEmpty) {
      return new PersistentVector<U>(null, [], 0, 0);
    }

    // Fast path: if the list is small, use a simple approach
    if (this._size < 1000) {
      const elements = this.toArray().map(fn);
      return PersistentVector.from(elements);
    }

    // For larger lists, we need a more efficient approach that avoids full array conversion
    // We'll map the trie and tail separately

    // Map the tail
    const mappedTail = this.tail.map((value, i) => fn(value, this._size - this.tail.length + i));

    // If there's no root, we're done
    if (this.root === null) {
      return new PersistentVector<U>(null, mappedTail, this._size, 0);
    }

    // Map the trie
    const mapNode = (node: Node<T>, level: number, indexOffset: number): Node<U> => {
      if (level === 0) {
        // Leaf level - map elements directly
        const mappedChildren = node.children.map((value, i) =>
          fn(value as T, indexOffset + i)
        );
        return {
          children: mappedChildren,
          size: node.size
        };
      }

      // Internal level - recursively map children
      const mappedChildren: Node<U>[] = [];
      let nodeSize = 0;

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i] as Node<T>;
        const childOffset = indexOffset + (i * Math.pow(BRANCHING_FACTOR, level));
        const mappedChild = mapNode(child, level - 1, childOffset);
        mappedChildren.push(mappedChild);
        nodeSize += mappedChild.size;
      }

      return {
        children: mappedChildren,
        size: nodeSize
      };
    };

    // Map the root node
    const mappedRoot = mapNode(this.root, this.height, 0);

    return new PersistentVector<U>(mappedRoot, mappedTail, this._size, this.height);
  }

  /**
   * Filter elements in the list based on a predicate
   *
   * @param fn - The predicate function
   * @returns A new list containing only elements that satisfy the predicate
   */
  filter(fn: (value: T, index: number) => boolean): IList<T> {
    if (this.isEmpty) {
      return new PersistentVector<T>(null, [], 0, 0);
    }

    // Fast path: if the list is small, use a simple approach
    if (this._size < 1000) {
      const elements = this.toArray();
      const filtered = elements.filter((value, index) => fn(value, index));
      return PersistentVector.from(filtered);
    }

    // For larger lists, we need a more efficient approach that avoids full array conversion
    // We'll collect filtered elements and then build a new vector
    const filteredElements: T[] = [];

    // Helper function to filter elements from the trie
    const filterNode = (node: Node<T>, level: number, indexOffset: number): void => {
      if (level === 0) {
        // Leaf level - filter elements directly
        for (let i = 0; i < node.children.length; i++) {
          const value = node.children[i];
          const globalIndex = indexOffset + i;

          if (value !== undefined && fn(value as T, globalIndex)) {
            filteredElements.push(value as T);
          }
        }
      } else {
        // Internal level - recursively filter elements from children
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child !== undefined) {
            const childOffset = indexOffset + (i * Math.pow(BRANCHING_FACTOR, level));
            filterNode(child as Node<T>, level - 1, childOffset);
          }
        }
      }
    };

    // Filter elements from the trie
    if (this.root !== null) {
      filterNode(this.root, this.height, 0);
    }

    // Filter elements from the tail
    const tailOffset = this._size - this.tail.length;
    for (let i = 0; i < this.tail.length; i++) {
      const globalIndex = tailOffset + i;
      if (fn(this.tail[i], globalIndex)) {
        filteredElements.push(this.tail[i]);
      }
    }

    // Create a new vector from the filtered elements
    return PersistentVector.from(filteredElements);
  }

  /**
   * Reduce the list to a single value
   */
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U {
    if (this.isEmpty) {
      return initial;
    }

    // Convert to array and use native reduce for simplicity
    const elements = this.toArray();
    return elements.reduce((acc, value, index) => fn(acc, value, index), initial);
  }

  /**
   * Find the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The first element that satisfies the predicate, or undefined if no element satisfies the predicate
   */
  find(fn: (value: T, index: number) => boolean): T | undefined {
    if (this.isEmpty) {
      return undefined;
    }

    // Helper function to find an element in the trie
    const findInNode = (node: Node<T>, level: number, indexOffset: number): T | undefined => {
      if (level === 0) {
        // Leaf level - search elements directly
        for (let i = 0; i < node.children.length; i++) {
          const value = node.children[i] as T;
          const globalIndex = indexOffset + i;

          if (value !== undefined && fn(value, globalIndex)) {
            return value;
          }
        }
      } else {
        // Internal level - recursively search children
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i] as Node<T>;
          if (child !== undefined) {
            const childOffset = indexOffset + (i * Math.pow(BRANCHING_FACTOR, level));
            const result = findInNode(child, level - 1, childOffset);
            if (result !== undefined) {
              return result;
            }
          }
        }
      }

      return undefined;
    };

    // Search in the trie
    if (this.root !== null) {
      const result = findInNode(this.root, this.height, 0);
      if (result !== undefined) {
        return result;
      }
    }

    // Search in the tail
    const tailOffset = this._size - this.tail.length;
    for (let i = 0; i < this.tail.length; i++) {
      const globalIndex = tailOffset + i;
      if (fn(this.tail[i], globalIndex)) {
        return this.tail[i];
      }
    }

    return undefined;
  }

  /**
   * Find the index of the first element in the list that satisfies a predicate
   *
   * @param fn - The predicate function
   * @returns The index of the first element that satisfies the predicate, or -1 if no element satisfies the predicate
   */
  findIndex(fn: (value: T, index: number) => boolean): number {
    if (this.isEmpty) {
      return -1;
    }

    // Helper function to find an index in the trie
    const findIndexInNode = (node: Node<T>, level: number, indexOffset: number): number => {
      if (level === 0) {
        // Leaf level - search elements directly
        for (let i = 0; i < node.children.length; i++) {
          const value = node.children[i] as T;
          const globalIndex = indexOffset + i;

          if (value !== undefined && fn(value, globalIndex)) {
            return globalIndex;
          }
        }
      } else {
        // Internal level - recursively search children
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i] as Node<T>;
          if (child !== undefined) {
            const childOffset = indexOffset + (i * Math.pow(BRANCHING_FACTOR, level));
            const result = findIndexInNode(child, level - 1, childOffset);
            if (result !== -1) {
              return result;
            }
          }
        }
      }

      return -1;
    };

    // Search in the trie
    if (this.root !== null) {
      const result = findIndexInNode(this.root, this.height, 0);
      if (result !== -1) {
        return result;
      }
    }

    // Search in the tail
    const tailOffset = this._size - this.tail.length;
    for (let i = 0; i < this.tail.length; i++) {
      const globalIndex = tailOffset + i;
      if (fn(this.tail[i], globalIndex)) {
        return globalIndex;
      }
    }

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
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new list containing elements from start to end
   */
  slice(start?: number, end?: number): IList<T> {
    // Normalize start and end indices
    const startIndex = start !== undefined ? Math.max(0, start < 0 ? this._size + start : start) : 0;
    const endIndex = end !== undefined ? Math.min(this._size, end < 0 ? this._size + end : end) : this._size;

    // If the slice is empty, return an empty vector
    if (startIndex >= endIndex || startIndex >= this._size) {
      return new PersistentVector<T>(null, [], 0, 0);
    }

    // If the slice is the entire vector, return this vector
    if (startIndex === 0 && endIndex === this._size) {
      return this;
    }

    // Fast path: if the list is small, use a simple approach
    if (this._size < 1000) {
      const elements = this.toArray().slice(startIndex, endIndex);
      return PersistentVector.from(elements);
    }

    // For larger lists, we need a more efficient approach
    // We'll collect elements in the slice range and then build a new vector
    const slicedElements: T[] = [];

    // Helper function to collect elements from the trie
    const collectElements = (node: Node<T>, level: number, indexOffset: number): void => {
      // Skip this node if it's entirely outside the slice range
      const nodeEnd = indexOffset + Math.pow(BRANCHING_FACTOR, level);
      if (indexOffset >= endIndex || nodeEnd <= startIndex) {
        return;
      }

      if (level === 0) {
        // Leaf level - collect elements directly
        for (let i = 0; i < node.children.length; i++) {
          const globalIndex = indexOffset + i;

          if (globalIndex >= startIndex && globalIndex < endIndex) {
            slicedElements.push(node.children[i] as T);
          }
        }
      } else {
        // Internal level - recursively collect elements from children
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i] as Node<T>;
          if (child !== undefined) {
            const childOffset = indexOffset + (i * Math.pow(BRANCHING_FACTOR, level));
            collectElements(child, level - 1, childOffset);
          }
        }
      }
    };

    // Collect elements from the trie
    if (this.root !== null) {
      collectElements(this.root, this.height, 0);
    }

    // Collect elements from the tail
    const tailOffset = this._size - this.tail.length;
    for (let i = 0; i < this.tail.length; i++) {
      const globalIndex = tailOffset + i;

      if (globalIndex >= startIndex && globalIndex < endIndex) {
        slicedElements.push(this.tail[i]);
      }
    }

    // Create a new vector from the sliced elements
    return PersistentVector.from(slicedElements);
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
    if (this.isEmpty) {
      return initial;
    }

    // Convert to array and perform operations in a single pass
    const elements = this.toArray();
    let result = initial;

    for (let i = 0; i < elements.length; i++) {
      const mappedValue = mapFn(elements[i], i);
      if (filterFn(mappedValue, i)) {
        result = reduceFn(result, mappedValue, i);
      }
    }

    return result;
  }

  /**
   * Perform a map and reduce operation in a single pass
   */
  mapReduce<U, V>(
    mapFn: (value: T, index: number) => U,
    reduceFn: (acc: V, value: U, index: number) => V,
    initial: V
  ): V {
    if (this.isEmpty) {
      return initial;
    }

    // Convert to array and perform operations in a single pass
    const elements = this.toArray();
    let result = initial;

    for (let i = 0; i < elements.length; i++) {
      const mappedValue = mapFn(elements[i], i);
      result = reduceFn(result, mappedValue, i);
    }

    return result;
  }

  /**
   * Perform a filter and map operation in a single pass
   */
  filterMap<U>(
    filterFn: (value: T, index: number) => boolean,
    mapFn: (value: T, index: number) => U
  ): IList<U> {
    if (this.isEmpty) {
      return new PersistentVector<U>(null, [], 0, 0);
    }

    // Convert to array and perform operations in a single pass
    const elements = this.toArray();
    const result: U[] = [];

    for (let i = 0; i < elements.length; i++) {
      if (filterFn(elements[i], i)) {
        result.push(mapFn(elements[i], i));
      }
    }

    // Create a new vector with the result
    return PersistentVector.from(result);
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

  /**
   * Update multiple elements at once
   *
   * @param updates - An array of [index, value] pairs
   * @returns A new list with the updated values
   * @throws {RangeError} If any index is out of bounds
   */
  updateMany(updates: Array<[number, T]>): IList<T> {
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

    // Fast path: if the list is small, use a simple approach
    if (this._size < 1000) {
      const elements = this.toArray();
      for (const [index, value] of sortedUpdates) {
        elements[index] = value;
      }
      return PersistentVector.from(elements);
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
    if (trieUpdates.length === 0 || this.root === null) {
      return new PersistentVector<T>(this.root, newTail, this._size, this.height);
    }

    // For trie updates, we need to use path copying for structural sharing
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

      return new PersistentVector<T>(newRoot, newTail, this._size, this.height);
    } catch (error) {
      // Fallback to the simple approach if path copying fails
      console.error(`Error in updateMany: ${error}`);
      const elements = this.toArray();
      for (const [index, value] of sortedUpdates) {
        elements[index] = value;
      }
      return PersistentVector.from(elements);
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
  removeMany(indices: number[]): IList<T> {
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
      return new PersistentVector<T>(null, [], 0, 0);
    }

    // Fast path: if the list is small, use a simple approach
    if (this._size < 1000) {
      const elements = this.toArray();

      // Remove elements in descending order to avoid index shifting
      for (const index of sortedIndices) {
        elements.splice(index, 1);
      }

      return PersistentVector.from(elements);
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
    if (this.root !== null) {
      collectKeptElements(this.root, this.height, 0);
    }

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
      return new PersistentVector<T>(null, [], 0, 0);
    }

    // Create a new list from the kept elements
    return PersistentVector.from(keptElements);
  }

  /**
   * Insert multiple elements at once
   *
   * @param insertions - An array of [index, value] pairs
   * @returns A new list with the elements inserted
   * @throws {RangeError} If any index is out of bounds
   */
  insertMany(insertions: Array<[number, T]>): IList<T> {
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
      return PersistentVector.from(values);
    }

    // Fast path: if all insertions are at the end
    if (sortedInsertions.every(([index]) => index === this._size)) {
      // Use the transient vector for efficient batch operations
      const transient = this.transient() as TransientPersistentVector<T>;

      // Add all values at the end
      for (const [_, value] of sortedInsertions) {
        transient.append(value);
      }

      // Convert back to a persistent vector
      return transient.persistent();
    }

    // Fast path: if the list is small, use a simple approach
    if (this._size < 1000) {
      const elements = this.toArray();

      // Apply insertions in reverse order to avoid index shifting
      for (let i = sortedInsertions.length - 1; i >= 0; i--) {
        const [index, value] = sortedInsertions[i];
        elements.splice(index, 0, value);
      }

      return PersistentVector.from(elements);
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

    // Create a new vector from the result array
    return PersistentVector.from(result);
  }
}
