# Functional Map Optimization Specification

## Overview
This document outlines the technical approach for creating a performance-optimized variant of the Functional Map data structure for Reduct, using a hybrid implementation strategy that combines native JavaScript objects/Maps with Hash Array Mapped Trie (HAMT) architecture based on collection size and usage patterns.

## Current Implementation Limitations
The existing Functional Map implementation has the following performance characteristics:

- O(n) lookup, insertion, and deletion operations in worst case
- Complete map copying during updates, leading to inefficient memory usage
- Limited structural sharing between derived maps
- Inefficient handling of hash collisions
- Performance degradation with large maps

## Optimization Goals
- O(1) lookup, insertion, and deletion operations for small maps (leveraging native objects/Maps)
- O(log₃₂ n) operations for larger maps using HAMT
- Minimal memory overhead for transformations through structural sharing
- Efficient handling of hash collisions
- Specialized optimizations for common key types
- Performance competitive with native objects/Maps for small collections
- Adaptive implementation based on collection size and key types
- Optimized operation chains for common transformations
- Seamless integration with JavaScript engine optimizations

## Technical Approach: Hybrid Implementation Strategy

We will implement a hybrid approach that uses different implementations based on collection size and key types:

### Small Collections (< 32 entries)
For small collections, we'll use a simple object or Map-backed implementation that provides immutability guarantees while leveraging native performance:

```typescript
class SmallMap<K, V> {
  // For string keys, use object literal
  private readonly stringEntries: Record<string, V>;
  // For non-string keys, use native Map
  private readonly objectEntries: ReadonlyMap<K, V>;

  // Implementation optimized for small collections
  // Uses native objects/Maps with immutable operations
}
```

### Medium and Large Collections
For larger collections, we will implement a HAMT structure similar to Clojure's PersistentHashMap and Scala's HashMap:

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

1. **Size-Based Implementation Selection**:
   - Automatically select the most efficient implementation based on collection size
   - Use native objects for small maps with string keys
   - Use native Maps for small maps with mixed key types
   - Use HAMT for larger maps
   - Transparently switch implementations when size thresholds are crossed

2. **Hash Function Specialization**:
   - Optimize hash functions for common key types (strings, numbers)
   - String hashing will use a high-quality algorithm (MurmurHash3 or similar)
   - Number keys get direct hash representation with special handling
   - Custom hash function support for user-defined types
   - Leverage native object property access for string keys when possible

3. **Advanced Collision Handling**:
   - Optimized data structures for collision nodes based on size
   - Transition to sorted arrays for larger collision sets
   - Path compression for common hash prefixes
   - Specialized handling for common collision patterns

4. **Transient Mutations**:
   - Provide a transient (temporarily mutable) version for batch operations
   - Allow efficient sequences of operations with single copy at the end
   - Implement thread-safe transition back to immutable form
   - Use native mutation for transient operations on small maps

5. **Key Equality Optimization**:
   - Specialized equality checking for common key types
   - Identity comparison optimization when possible
   - Customizable equality function support
   - Leverage native equality for primitive types

6. **JavaScript Engine Optimization**:
   - Design for JIT compiler optimization
   - Maintain hidden class stability
   - Avoid polymorphic operations
   - Use monomorphic code patterns

7. **Specialized Operation Chains**:
   - Detect and optimize common operation patterns
   - Avoid intermediate collection creation
   - Provide specialized implementations for common transformations

8. **WebAssembly Acceleration**:
   - Implement performance-critical operations in WebAssembly
   - Provide transparent fallback to JavaScript implementation
   - Optimize for large collection operations

### Performance Benchmarking

We'll compare against:
- Current Reduct implementation
- Native JavaScript objects and Maps
- Immutable.js Map
- immer library

Benchmarks will be conducted across multiple collection sizes to validate our size-based optimization strategy:
- Tiny maps (1-8 entries)
- Small maps (9-32 entries)
- Medium maps (33-1000 entries)
- Large maps (1001-10000 entries)
- Very large maps (>10000 entries)

Additional benchmarks will test different key type distributions:
- String-only keys
- Number-only keys
- Mixed key types
- Custom object keys

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

1. Create SmallMap implementation optimized for small collections
   - Object-backed implementation for string keys
   - Map-backed implementation for mixed keys
2. Implement core HAMT node types and operations for larger maps
3. Develop size-based adaptive wrapper (SmartMap)
4. Add specialized optimizations for common key types
5. Implement specialized operation chains
6. Add WebAssembly acceleration for critical operations
7. Create comprehensive benchmark suite across collection sizes and key types
8. Optimize thresholds based on benchmark results
9. Document performance characteristics and use cases

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