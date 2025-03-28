# Functional Map Optimization Specification

## Overview
This document outlines the technical approach for creating a performance-optimized variant of the Functional Map data structure for Reduct, based on Hash Array Mapped Trie (HAMT) architecture.

## Current Implementation Limitations
The existing Functional Map implementation has the following performance characteristics:

- O(n) lookup, insertion, and deletion operations in worst case
- Complete map copying during updates, leading to inefficient memory usage
- Limited structural sharing between derived maps
- Inefficient handling of hash collisions
- Performance degradation with large maps

## Optimization Goals
- O(log₃₂ n) lookup, insertion, and deletion operations
- Minimal memory overhead for transformations through structural sharing
- Efficient handling of hash collisions
- Specialized optimizations for common key types
- Competitive performance with mutable alternatives while maintaining immutability

## Technical Approach: Hash Array Mapped Trie (HAMT)

We will implement a HAMT structure similar to Clojure's PersistentHashMap and Scala's HashMap:

### Core Data Structure

```typescript
// Type definitions for nodes in the HAMT
type BitmapIndexedNode<K, V> = {
  type: 'bitmap';
  bitmap: number;
  children: Array<Node<K, V> | Entry<K, V>>;
};

type CollisionNode<K, V> = {
  type: 'collision';
  hash: number;
  entries: Array<Entry<K, V>>;
};

type Entry<K, V> = {
  type: 'entry';
  key: K;
  value: V;
  hash: number;
};

type Node<K, V> = BitmapIndexedNode<K, V> | CollisionNode<K, V> | Entry<K, V>;

class PersistentHashMap<K, V> {
  private root: Node<K, V> | null;
  private size: number;
  private readonly hashFn: (key: K) => number;
  
  // Core operations...
}
```

### Internal Architecture

1. **HAMT Structure**:
   - Uses a 32-way branching factor (5-bit chunks of hash code)
   - Uses bitmap indexing for sparse node representation
   - Stores entries in leaf nodes or collision nodes
   - Balances tree structure based on hash distribution

2. **Bitmap Indexing**:
   - Each internal node uses a 32-bit bitmap to indicate which branches exist
   - Provides memory efficiency by only allocating slots for populated branches
   - Enables O(1) branch existence check through bit operations

3. **Structural Sharing**:
   - Shares unchanged branches between maps
   - Only copies the path from root to modified node
   - Ensures O(log n) memory usage for modifications

4. **Collision Handling**:
   - Uses dedicated collision nodes for keys with identical hash codes
   - Stores colliding entries in a small array
   - Performs linear search within collision nodes

### Key Operations

#### 1. Lookup (get)
```typescript
function get<K, V>(key: K): V | undefined {
  if (this.root === null) return undefined;
  
  const hash = this.hashFn(key);
  return this.getFromNode(this.root, key, hash, 0);
}

private getFromNode<K, V>(
  node: Node<K, V>, 
  key: K, 
  hash: number, 
  level: number
): V | undefined {
  if (node.type === 'entry') {
    return equalKeys(node.key, key) ? node.value : undefined;
  }
  
  if (node.type === 'collision') {
    if (hash !== node.hash) return undefined;
    
    const entry = node.entries.find(e => equalKeys(e.key, key));
    return entry ? entry.value : undefined;
  }
  
  // BitmapIndexedNode
  const fragment = hashFragment(hash, level);
  const bit = 1 << fragment;
  
  if ((node.bitmap & bit) === 0) {
    return undefined; // No entry exists
  }
  
  const index = popCount(node.bitmap & (bit - 1));
  const nextNode = node.children[index];
  
  return this.getFromNode(nextNode, key, hash, level + 1);
}
```

#### 2. Insertion (set)
```typescript
function set<K, V>(key: K, value: V): PersistentHashMap<K, V> {
  const hash = this.hashFn(key);
  const [newRoot, replaced] = this.root === null
    ? [{ type: 'entry', key, value, hash }, false]
    : this.setInNode(this.root, key, value, hash, 0);
  
  const newSize = replaced ? this.size : this.size + 1;
  return new PersistentHashMap(newRoot, newSize, this.hashFn);
}

private setInNode<K, V>(
  node: Node<K, V>,
  key: K,
  value: V,
  hash: number,
  level: number
): [Node<K, V>, boolean] {
  // Entry node case
  if (node.type === 'entry') {
    if (node.hash === hash && equalKeys(node.key, key)) {
      // Replace existing entry
      return [{ ...node, value }, true];
    }
    
    if (node.hash === hash) {
      // Hash collision - create collision node
      return [{
        type: 'collision',
        hash,
        entries: [node, { type: 'entry', key, value, hash }]
      }, false];
    }
    
    // Different hashes - create branch node with both entries
    return [this.createBranchWithTwoEntries(
      node, hash, key, value, level
    ), false];
  }
  
  // Collision node case
  if (node.type === 'collision') {
    if (hash !== node.hash) {
      // Different hashes - create branch node
      return [this.createBranchWithEntryAndCollision(
        node, hash, key, value, level
      ), false];
    }
    
    // Same hash - update or add to collision node
    const entries = [...node.entries];
    const idx = entries.findIndex(e => equalKeys(e.key, key));
    
    if (idx >= 0) {
      // Replace existing entry in collision
      entries[idx] = { type: 'entry', key, value, hash };
      return [{ ...node, entries }, true];
    } else {
      // Add new entry to collision
      entries.push({ type: 'entry', key, value, hash });
      return [{ ...node, entries }, false];
    }
  }
  
  // BitmapIndexedNode case
  const fragment = hashFragment(hash, level);
  const bit = 1 << fragment;
  const index = popCount(node.bitmap & (bit - 1));
  
  if ((node.bitmap & bit) === 0) {
    // Bit not set - insert new entry
    const newChildren = [...node.children];
    newChildren.splice(index, 0, { type: 'entry', key, value, hash });
    
    return [{
      type: 'bitmap',
      bitmap: node.bitmap | bit,
      children: newChildren
    }, false];
  }
  
  // Bit already set - update existing branch
  const [newChild, replaced] = this.setInNode(
    node.children[index], key, value, hash, level + 1
  );
  
  const newChildren = [...node.children];
  newChildren[index] = newChild;
  
  return [{
    type: 'bitmap',
    bitmap: node.bitmap,
    children: newChildren
  }, replaced];
}
```

#### 3. Deletion (delete)
```typescript
function delete<K, V>(key: K): PersistentHashMap<K, V> {
  if (this.root === null) return this;
  
  const hash = this.hashFn(key);
  const [newRoot, removed] = this.deleteFromNode(this.root, key, hash, 0);
  
  if (!removed) return this;
  
  const newSize = this.size - 1;
  if (newSize === 0) return PersistentHashMap.empty();
  
  return new PersistentHashMap(newRoot, newSize, this.hashFn);
}

private deleteFromNode<K, V>(
  node: Node<K, V>,
  key: K,
  hash: number,
  level: number
): [Node<K, V> | null, boolean] {
  // Implementation details similar to insertion, but removing entries
  // and consolidating nodes when necessary
}
```

#### 4. Iteration
We'll implement efficient iteration using:
- Depth-first traversal of the trie
- Streaming access to entries, keys, and values
- Special handling for collision nodes

#### 5. Transformations (map, filter, etc.)
These will be implemented efficiently, leveraging structural sharing:

```typescript
function map<K, V, U>(f: (value: V, key: K) => U): PersistentHashMap<K, U> {
  if (this.isEmpty()) return PersistentHashMap.empty();
  
  const result = PersistentHashMap.empty<K, U>();
  for (const [key, value] of this.entries()) {
    result = result.set(key, f(value, key));
  }
  return result;
}
```

### Optimizations

1. **Hash Function Specialization**:
   - Optimize hash functions for common key types (strings, numbers)
   - String hashing will use a high-quality algorithm (MurmurHash3 or similar)
   - Number keys get direct hash representation with special handling
   - Custom hash function support for user-defined types

2. **Advanced Collision Handling**:
   - Optimized data structures for collision nodes based on size
   - Transition to sorted arrays for larger collision sets
   - Path compression for common hash prefixes

3. **Transient Mutations**:
   - Provide a transient (temporarily mutable) version for batch operations
   - Allow efficient sequences of operations with single copy at the end
   - Implement thread-safe transition back to immutable form

4. **Key Equality Optimization**:
   - Specialized equality checking for common key types
   - Identity comparison optimization when possible
   - Customizable equality function support

5. **Small Map Optimization**:
   - For very small maps (e.g., < 8 entries), use a simple array-based implementation
   - Avoid trie overhead for common small-map use cases

### Performance Benchmarking

We'll compare against:
- Current Reduct implementation
- Native JavaScript Map
- Immutable.js Map
- immer library

Metrics to measure:
- Lookup performance
- Insertion/deletion speed
- Iteration performance
- Memory usage
- Structural sharing efficiency
- Collision handling effectiveness

## Advanced Features

1. **Custom Hash & Equality Functions**:
   ```typescript
   interface HashEqualityConfig<K> {
     hash: (key: K) => number;
     equals: (a: K, b: K) => boolean;
   }
   
   // Usage
   const customMap = PersistentHashMap.withConfig({
     hash: (obj) => obj.id, 
     equals: (a, b) => a.id === b.id
   });
   ```

2. **Entry Set Operations**:
   ```typescript
   // Union of two maps
   function union<K, V>(other: PersistentHashMap<K, V>): PersistentHashMap<K, V>;
   
   // Intersection of two maps
   function intersect<K, V>(other: PersistentHashMap<K, V>): PersistentHashMap<K, V>;
   
   // Difference of two maps
   function difference<K, V>(other: PersistentHashMap<K, V>): PersistentHashMap<K, V>;
   ```

3. **Batch Operations**:
   ```typescript
   // Batch set operation
   function setAll<K, V>(entries: Iterable<[K, V]>): PersistentHashMap<K, V>;
   
   // Batch update operation
   function updateAll<K, V>(keys: Iterable<K>, updateFn: (value: V, key: K) => V): PersistentHashMap<K, V>;
   ```

## Implementation Plan

1. Create base hash functions and bitmap manipulation utilities
2. Implement core HAMT node types and operations
3. Build the PersistentHashMap class with basic operations
4. Add specialized optimizations for common key types
5. Implement transformation operations
6. Create comprehensive benchmark suite
7. Optimize based on benchmark results
8. Document performance characteristics and use cases

## API Surface

The optimized map will maintain the same public API as the current implementation:

```typescript
interface ImmutableMap<K, V> {
  // Creation
  empty<K, V>(): ImmutableMap<K, V>;
  from<K, V>(entries: Iterable<[K, V]>): ImmutableMap<K, V>;
  fromObject<V>(obj: Record<string, V>): ImmutableMap<string, V>;
  
  // Basic operations
  get(key: K): Option<V>;
  has(key: K): boolean;
  set(key: K, value: V): ImmutableMap<K, V>;
  delete(key: K): ImmutableMap<K, V>;
  
  // Collection operations
  keys(): List<K>;
  values(): List<V>;
  entries(): List<[K, V]>;
  
  // Size information
  get size(): number;
  get isEmpty(): boolean;
  
  // Transformations
  map<U>(fn: (value: V, key: K) => U): ImmutableMap<K, U>;
  filter(predicate: (value: V, key: K) => boolean): ImmutableMap<K, V>;
  
  // Collection operations
  merge(other: ImmutableMap<K, V>): ImmutableMap<K, V>;
  
  // Iteration
  forEach(fn: (value: V, key: K) => void): void;
  
  // Conversion
  toObject(this: ImmutableMap<string, V>): Record<string, V>;
  toString(): string;
}
```

## Next Steps

1. Implement core bitmap manipulation utilities
2. Create hash functions for common key types
3. Build the node structure and basic operations
4. Implement core map operations (get, set, delete)
5. Add structural sharing optimizations
6. Create benchmarking infrastructure
7. Optimize based on performance testing