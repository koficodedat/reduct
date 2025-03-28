# Immutable List Optimization Specification

## Overview
This document outlines the technical approach for creating a performance-optimized variant of the Immutable List data structure for Reduct.

## Current Implementation Limitations
The existing Immutable List implementation has the following performance characteristics:

- O(n) append operations requiring full list copying
- O(n) access time for random indexing
- Inefficient memory usage during transformations
- Limited structural sharing between derived lists

## Optimization Goals
- O(1) prepend operations
- O(log32 n) access time for random indexing
- O(log32 n) update time for element replacement
- O(1) access for first/last elements
- Minimal memory overhead for transformations through structural sharing
- Efficient iteration with good cache locality

## Technical Approach: Persistent Vector Trie

We will implement a 32-way branching trie structure similar to Clojure's PersistentVector and Scala's Vector:

### Core Data Structure

```typescript
// Simplified structure - actual implementation will be more nuanced
interface Node<T> {
  // Store elements or child nodes
  children: Array<T | Node<T>>;
  // Additional metadata for optimizations
  size: number;
}

class PersistentVector<T> {
  private root: Node<T>;
  private tail: Array<T>; // Small buffer for efficient appends
  private size: number;
  
  // Core operations...
}
```

### Internal Architecture

1. **Trie Structure**:
   - Uses a 32-way branching factor (tunable based on performance testing)
   - Stores elements in leaf nodes
   - Maintains a balanced tree structure
   - Uses path copying for modifications

2. **Tail Optimization**:
   - Maintains a small buffer (typically 32 elements) for the tail of the vector
   - Allows O(1) append operations until the buffer fills
   - Amortizes the cost of restructuring when tail is full

3. **Structural Sharing**:
   - Shares unchanged branches between vectors
   - Only copies the path from root to modified node
   - Ensures O(log n) memory usage for modifications

### Key Operations

#### 1. Access (nth)
```typescript
function nth<T>(index: number): T {
  if (index < 0 || index >= this.size) throw new RangeError();
  
  // Fast path for tail access
  if (index >= this.size - this.tail.length) {
    return this.tail[index - (this.size - this.tail.length)];
  }
  
  // Traverse trie to find element
  let node = this.root;
  let level = this.height;
  while (level > 0) {
    const childIndex = (index >> (level * 5)) & 0x1f;
    node = node.children[childIndex] as Node<T>;
    level--;
  }
  
  return node.children[index & 0x1f] as T;
}
```

#### 2. Update (with)
```typescript
function with<T>(index: number, value: T): PersistentVector<T> {
  if (index < 0 || index >= this.size) throw new RangeError();
  
  // Fast path for tail updates
  if (index >= this.size - this.tail.length) {
    const newTail = [...this.tail];
    newTail[index - (this.size - this.tail.length)] = value;
    return new PersistentVector(this.root, newTail, this.size, this.height);
  }
  
  // Path copying for main trie updates
  const newRoot = this.updatePath(this.root, index, value, this.height);
  return new PersistentVector(newRoot, this.tail, this.size, this.height);
}

private updatePath(node: Node<T>, index: number, value: T, level: number): Node<T> {
  const newNode = { children: [...node.children], size: node.size };
  
  if (level === 0) {
    newNode.children[index & 0x1f] = value;
  } else {
    const childIndex = (index >> (level * 5)) & 0x1f;
    newNode.children[childIndex] = this.updatePath(
      node.children[childIndex] as Node<T>,
      index, value, level - 1
    );
  }
  
  return newNode;
}
```

#### 3. Append (append)
```typescript
function append<T>(value: T): PersistentVector<T> {
  // Fast path: append to tail if not full
  if (this.tail.length < 32) {
    const newTail = [...this.tail, value];
    return new PersistentVector(this.root, newTail, this.size + 1, this.height);
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
  
  return new PersistentVector(newRoot, newTail, this.size + 1, newHeight);
}
```

#### 4. Iteration
We'll implement efficient iteration using:
- Direct access to the tail for the last chunk
- Level-by-level traversal for the main trie
- Chunk-based iteration for better cache locality

#### 5. Transformations (map, filter, etc.)
These will be implemented as lazy operations that only materialize when needed:

```typescript
function map<T, U>(f: (value: T) => U): LazyVector<U> {
  return new LazyVector<U>(() => {
    const result = new PersistentVector<U>();
    for (const item of this) {
      result = result.append(f(item));
    }
    return result;
  });
}
```

### Optimizations

1. **Transient Mutations**:
   - For batch operations, provide a transient (temporarily mutable) version
   - Allows efficient sequences of operations
   - Converts back to immutable when operations complete

2. **Small Vector Optimization**:
   - For very small vectors (e.g., < 8 elements), use a simple array
   - Avoids trie overhead for common small-list use cases

3. **Specialized Operations**:
   - Implement efficient slicing without full copying
   - Provide bulk operations (insertAll, removeRange)
   - Optimize concatenation of vectors

### Performance Benchmarking

We'll compare against:
- Current Reduct implementation
- Native JavaScript arrays
- Immutable.js Vector
- immer library

Metrics to measure:
- Random access time
- Update performance
- Append/prepend operations
- Memory usage
- Iteration speed
- Cache behavior

## Implementation Plan

1. Create base PersistentVector implementation with core operations
2. Add specialized optimizations
3. Implement transformation operations
4. Create comprehensive benchmark suite
5. Optimize based on benchmark results
6. Document performance characteristics and use cases

## API Surface

The optimized list will maintain the same public API as the current implementation:

```typescript
interface List<T> {
  // Creation
  empty(): List<T>;
  of<T>(...items: T[]): List<T>;
  from<T>(iterable: Iterable<T>): List<T>;
  
  // Basic operations
  get(index: number): T | undefined;
  set(index: number, value: T): List<T>;
  append(value: T): List<T>;
  prepend(value: T): List<T>;
  concat(other: List<T>): List<T>;
  
  // Transformations
  map<U>(fn: (value: T, index: number) => U): List<U>;
  filter(predicate: (value: T, index: number) => boolean): List<T>;
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U;
  
  // Additional operations
  slice(start?: number, end?: number): List<T>;
  // ...other operations
}
```

## Next Steps

1. Implement core PersistentVector class
2. Create basic operations (get, set, append, prepend)
3. Implement structural sharing
4. Add transformation operations
5. Create benchmarking infrastructure
6. Optimize based on performance testing