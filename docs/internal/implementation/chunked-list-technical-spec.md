# ChunkedList Technical Specification

## Overview

This document provides a detailed technical specification for the ChunkedList implementation, which is designed for medium-sized collections (32-1000 elements) in the Reduct library. The ChunkedList uses a 32-way branching trie structure with path copying and structural sharing to provide efficient immutable operations.

## Related Documentation

- [Enhanced List Implementation Plan](./enhanced-list-implementation-plan.md)
- [Immutable List Optimization](../technical/immutable-list-optimization-spec.md)
- [Hybrid Implementation Strategy](../technical/hybrid-implementation-strategy.md)

## Data Structure

The ChunkedList is based on a 32-way branching trie structure, similar to Clojure's PersistentVector and Scala's Vector. This structure provides:

- O(log₃₂ n) access time for random indexing
- O(log₃₂ n) update time for element replacement
- O(1) append operations (amortized) with tail optimization
- O(1) prepend operations with structural sharing
- Efficient memory usage through structural sharing

### Core Components

1. **Trie Structure**:
   - A tree with a branching factor of 32
   - Each node contains up to 32 elements or child nodes
   - Leaf nodes contain actual elements
   - Internal nodes contain references to child nodes
   - The height of the tree is log₃₂ n (rounded up)

2. **Tail Optimization**:
   - A small buffer (up to 32 elements) for the tail of the vector
   - Allows O(1) append operations until the buffer fills
   - When the buffer fills, it becomes a new leaf node in the trie

3. **Structural Sharing**:
   - Unchanged branches are shared between vectors
   - Only the path from root to modified node is copied
   - Ensures O(log₃₂ n) memory usage for modifications

### Key Interfaces

```typescript
interface Node<T> {
  readonly children: ReadonlyArray<T | Node<T>>;
  readonly size: number;
}

class ChunkedList<T> implements IList<T> {
  private readonly root: Node<T>;
  private readonly tail: ReadonlyArray<T>;
  private readonly size: number;
  private readonly height: number;
  
  // Constructor and methods
}
```

## Core Operations

### 1. Access (get)

```typescript
get(index: number): T | undefined {
  if (index < 0 || index >= this.size) {
    return undefined;
  }

  // Fast path for tail access
  if (index >= this.size - this.tail.length) {
    return this.tail[index - (this.size - this.tail.length)];
  }

  // Traverse trie to find element
  let node = this.root;
  let level = this.height;
  let idx = index;
  
  while (level > 0) {
    const childIndex = (idx >> (level * 5)) & 0x1f;
    node = node.children[childIndex] as Node<T>;
    level--;
  }

  return node.children[idx & 0x1f] as T;
}
```

### 2. Update (set)

```typescript
set(index: number, value: T): ChunkedList<T> {
  if (index < 0 || index >= this.size) {
    throw new RangeError(`Index ${index} out of bounds`);
  }

  // Fast path for tail updates
  if (index >= this.size - this.tail.length) {
    const tailIndex = index - (this.size - this.tail.length);
    const newTail = [...this.tail];
    newTail[tailIndex] = value;
    return new ChunkedList(this.root, newTail, this.size, this.height);
  }

  // Path copying for main trie updates
  const newRoot = this.updatePath(this.root, index, value, this.height);
  return new ChunkedList(newRoot, this.tail, this.size, this.height);
}

private updatePath(node: Node<T>, index: number, value: T, level: number): Node<T> {
  const newChildren = [...node.children];
  
  if (level === 0) {
    // Leaf node, update element directly
    newChildren[index & 0x1f] = value;
  } else {
    // Internal node, recursively update child
    const childIndex = (index >> (level * 5)) & 0x1f;
    newChildren[childIndex] = this.updatePath(
      node.children[childIndex] as Node<T>,
      index, value, level - 1
    );
  }
  
  return { children: newChildren, size: node.size };
}
```

### 3. Append (append)

```typescript
append(value: T): ChunkedList<T> {
  // Fast path: append to tail if not full
  if (this.tail.length < 32) {
    const newTail = [...this.tail, value];
    return new ChunkedList(this.root, newTail, this.size + 1, this.height);
  }

  // Slow path: tail is full, incorporate into trie and create new tail
  let newRoot = this.root;
  let newHeight = this.height;

  // If trie is full at current height, increase height
  if (this.requiresHeightIncrease()) {
    newRoot = { children: [this.root], size: this.root.size };
    newHeight = this.height + 1;
  }

  // Push tail into trie
  newRoot = this.incorporateTail(newRoot, this.tail, newHeight);

  // Create new tail with single element
  const newTail = [value];

  return new ChunkedList(newRoot, newTail, this.size + 1, newHeight);
}

private requiresHeightIncrease(): boolean {
  // Check if adding a new node at the current height would exceed capacity
  const nodeCount = Math.ceil(this.size / 32);
  const capacityAtCurrentHeight = Math.pow(32, this.height);
  return nodeCount >= capacityAtCurrentHeight;
}

private incorporateTail(root: Node<T>, tail: ReadonlyArray<T>, height: number): Node<T> {
  // Calculate the path to where the tail should be incorporated
  const tailIndex = this.size - tail.length;
  const newRoot = { ...root, children: [...root.children] };
  
  let node = newRoot;
  let level = height;
  
  // Navigate to the correct position
  while (level > 0) {
    const childIndex = (tailIndex >> (level * 5)) & 0x1f;
    const child = node.children[childIndex] as Node<T> || { children: [], size: 0 };
    const newChild = { ...child, children: [...child.children] };
    node.children[childIndex] = newChild;
    node = newChild;
    level--;
  }
  
  // Add tail as a leaf node
  const leafIndex = tailIndex & 0x1f;
  node.children[leafIndex] = { children: tail, size: tail.length };
  
  return newRoot;
}
```

### 4. Prepend (prepend)

```typescript
prepend(value: T): ChunkedList<T> {
  // Special case for empty list
  if (this.isEmpty) {
    return new ChunkedList(null, [value], 1, 0);
  }
  
  // If tail has space and root is empty, prepend to tail
  if (this.root === null && this.tail.length < 32) {
    const newTail = [value, ...this.tail];
    return new ChunkedList(null, newTail, this.size + 1, 0);
  }
  
  // Create a new list with the value as the first element
  const newList = new ChunkedList(null, [value], 1, 0);
  
  // Concatenate the current list to the new list
  return newList.concat(this);
}
```

### 5. Iteration

```typescript
*[Symbol.iterator](): Iterator<T> {
  // Yield elements from the main trie
  const tailOffset = this.size - this.tail.length;
  
  // Iterate through the main trie
  if (this.root !== null) {
    yield* this.iterateNode(this.root, this.height, 0, tailOffset);
  }
  
  // Iterate through the tail
  for (const item of this.tail) {
    yield item;
  }
}

private *iterateNode(node: Node<T>, level: number, offset: number, limit: number): Generator<T> {
  if (level === 0) {
    // Leaf node, yield elements directly
    for (let i = 0; i < Math.min(node.children.length, limit - offset); i++) {
      yield node.children[i] as T;
    }
  } else {
    // Internal node, recursively iterate through children
    for (let i = 0; i < node.children.length && offset < limit; i++) {
      const child = node.children[i] as Node<T>;
      const childSize = Math.pow(32, level);
      
      if (offset + childSize <= limit) {
        yield* this.iterateNode(child, level - 1, offset, limit);
        offset += childSize;
      } else {
        yield* this.iterateNode(child, level - 1, offset, limit);
        break;
      }
    }
  }
}
```

## Optimizations

### 1. Tail Optimization

The tail optimization is crucial for efficient append operations:

- Maintain a small buffer (up to 32 elements) for the tail
- Append directly to the tail for O(1) operations
- Only restructure the trie when the tail fills up
- Amortize the cost of restructuring over multiple operations

### 2. Path Copying

Path copying ensures efficient immutable updates:

- Only copy the nodes on the path from root to the modified node
- Share all unchanged branches between vectors
- Ensure O(log₃₂ n) memory usage for modifications

### 3. Structural Sharing

Structural sharing is key to memory efficiency:

- Reuse unchanged parts of the trie across different instances
- Only create new nodes for the modified path
- Ensure that operations like `append`, `prepend`, and `set` are memory-efficient

### 4. Chunked Iteration

Chunked iteration improves cache locality:

- Process elements in chunks of 32
- Leverage CPU cache for better performance
- Reduce the number of node traversals

## Performance Characteristics

| Operation | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| get       | O(log₃₂ n)      | O(1)             |
| set       | O(log₃₂ n)      | O(log₃₂ n)       |
| append    | O(1)*           | O(1)*            |
| prepend   | O(1)*           | O(1)*            |
| insert    | O(log₃₂ n)      | O(log₃₂ n)       |
| remove    | O(log₃₂ n)      | O(log₃₂ n)       |
| iterate   | O(n)            | O(1)             |

*Amortized complexity

## Implementation Considerations

1. **Branching Factor**:
   - The branching factor of 32 is chosen for optimal performance
   - It balances between tree height and node size
   - It aligns well with CPU cache line sizes
   - It allows for efficient bit manipulation (5 bits per level)

2. **Memory Layout**:
   - Use flat arrays for nodes to improve cache locality
   - Ensure nodes are properly sized for CPU cache lines
   - Minimize pointer chasing for better performance

3. **Bit Manipulation**:
   - Use bit operations for fast index calculations
   - Leverage the power-of-two branching factor for efficient bit shifting
   - Optimize path calculations with bitwise operations

4. **JavaScript Engine Optimization**:
   - Ensure consistent object shapes for better JIT compilation
   - Use monomorphic code patterns
   - Maintain type stability
   - Optimize for function inlining

## Next Steps

1. Implement the core ChunkedList structure
2. Add basic operations (get, set, append, prepend)
3. Implement structural sharing and path copying
4. Add tail optimization
5. Implement efficient iteration
6. Add transformation operations (map, filter, reduce)
7. Optimize for JavaScript engines
8. Comprehensive testing and benchmarking
