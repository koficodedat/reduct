# Hash Array Mapped Trie (HAMT) Map Specification

This document outlines the technical specification for the optimized Immutable Map implementation (HAMTMap) for Reduct Phase Two.

## 1. Overview

The HAMTMap will be a Hash Array Mapped Trie (HAMT) implementation of an immutable map with structural sharing, providing efficient lookup, insertion, and deletion operations. It will maintain the same API as the current ImmutableMap implementation while significantly improving performance.

## 2. Data Structure

### 2.1 Core Structure

The HAMTMap will use a 32-way branching trie structure with bitmap indexing:

```typescript
class HAMTMap<K, V> {
  private root: Node<K, V>;
  private size: number;
  private hashFn: (key: K) => number;
  private equalsFn: (a: K, b: K) => boolean;
  
  // Methods...
}

interface Node<K, V> {
  type: 'leaf' | 'collision' | 'branch';
}
```

- **Root**: The root node of the trie
- **Size**: The total number of key-value pairs
- **HashFn**: Function to compute hash codes for keys
- **EqualsFn**: Function to compare keys for equality

### 2.2 Node Types

The HAMT will use three types of nodes:

#### Branch Node

```typescript
interface BranchNode<K, V> extends Node<K, V> {
  type: 'branch';
  bitmap: number;
  children: Array<Node<K, V>>;
}
```

- **Bitmap**: A 32-bit integer where each bit indicates the presence of a child
- **Children**: An array of child nodes (size equal to the number of 1 bits in the bitmap)

#### Leaf Node

```typescript
interface LeafNode<K, V> extends Node<K, V> {
  type: 'leaf';
  hash: number;
  key: K;
  value: V;
}
```

- **Hash**: The hash code of the key
- **Key**: The key
- **Value**: The associated value

#### Collision Node

```typescript
interface CollisionNode<K, V> extends Node<K, V> {
  type: 'collision';
  hash: number;
  entries: Array<[K, V]>;
}
```

- **Hash**: The hash code shared by all entries
- **Entries**: An array of key-value pairs with the same hash code

### 2.3 Bitmap Indexing

The HAMT uses bitmap indexing to efficiently represent sparse nodes:

- Each level of the trie uses 5 bits of the hash code (32 possible branches)
- A bitmap is used to indicate which of the 32 possible children are present
- The position of a child in the children array is determined by counting the number of 1 bits in the bitmap before the relevant bit

```typescript
function index(bitmap: number, bit: number): number {
  return popCount(bitmap & (bit - 1));
}

function popCount(x: number): number {
  // Count the number of 1 bits in x
  // Implementation using bit manipulation or lookup table
}
```

## 3. Core Operations

### 3.1 Lookup (get)

```typescript
get(key: K): Option<V> {
  const hash = this.hashFn(key);
  return this.getFromNode(this.root, hash, key, 0);
}

private getFromNode(node: Node<K, V>, hash: number, key: K, shift: number): Option<V> {
  if (node.type === 'leaf') {
    return this.equalsFn(node.key, key) ? some(node.value) : none;
  }
  
  if (node.type === 'collision') {
    if (node.hash !== hash) return none;
    
    const entry = node.entries.find(([k]) => this.equalsFn(k, key));
    return entry ? some(entry[1]) : none;
  }
  
  // Branch node
  const bit = mask(hash, shift);
  if ((node.bitmap & bit) === 0) return none;
  
  const index = popCount(node.bitmap & (bit - 1));
  return this.getFromNode(node.children[index], hash, key, shift + 5);
}

private mask(hash: number, shift: number): number {
  return 1 << ((hash >>> shift) & 0x1f);
}
```

### 3.2 Insertion (set)

```typescript
set(key: K, value: V): HAMTMap<K, V> {
  const hash = this.hashFn(key);
  const [newRoot, added] = this.setInNode(this.root, hash, key, value, 0);
  
  return new HAMTMap<K, V>(
    newRoot,
    this.size + (added ? 1 : 0),
    this.hashFn,
    this.equalsFn
  );
}

private setInNode(
  node: Node<K, V>,
  hash: number,
  key: K,
  value: V,
  shift: number
): [Node<K, V>, boolean] {
  // Leaf node
  if (node.type === 'leaf') {
    // Replace value if keys match
    if (this.equalsFn(node.key, key)) {
      return [{ ...node, value }, false];
    }
    
    // Hash collision - create collision node
    if (node.hash === hash) {
      return [
        {
          type: 'collision',
          hash,
          entries: [[node.key, node.value], [key, value]]
        },
        true
      ];
    }
    
    // Different keys with different hashes - create branch node
    return [this.mergeTwoLeaves(node, hash, key, value, shift), true];
  }
  
  // Collision node
  if (node.type === 'collision') {
    // If hash matches, update or add entry
    if (node.hash === hash) {
      const index = node.entries.findIndex(([k]) => this.equalsFn(k, key));
      
      if (index >= 0) {
        // Update existing entry
        const newEntries = [...node.entries];
        newEntries[index] = [key, value];
        return [{ ...node, entries: newEntries }, false];
      } else {
        // Add new entry
        return [
          { ...node, entries: [...node.entries, [key, value]] },
          true
        ];
      }
    }
    
    // Different hash - create branch node
    return [this.createBranchWithCollision(node, hash, key, value, shift), true];
  }
  
  // Branch node
  const bit = this.mask(hash, shift);
  
  if ((node.bitmap & bit) === 0) {
    // Bit not set - add new leaf
    const index = this.index(node.bitmap, bit);
    const newLeaf = { type: 'leaf', hash, key, value };
    
    const newChildren = [...node.children];
    newChildren.splice(index, 0, newLeaf);
    
    return [
      { ...node, bitmap: node.bitmap | bit, children: newChildren },
      true
    ];
  } else {
    // Bit already set - update child
    const index = this.index(node.bitmap, bit);
    const [newChild, added] = this.setInNode(
      node.children[index],
      hash,
      key,
      value,
      shift + 5
    );
    
    const newChildren = [...node.children];
    newChildren[index] = newChild;
    
    return [{ ...node, children: newChildren }, added];
  }
}
```

### 3.3 Deletion (delete)

```typescript
delete(key: K): HAMTMap<K, V> {
  const hash = this.hashFn(key);
  const [newRoot, removed] = this.deleteFromNode(this.root, hash, key, 0);
  
  if (!removed) return this;
  
  return new HAMTMap<K, V>(
    newRoot,
    this.size - 1,
    this.hashFn,
    this.equalsFn
  );
}

private deleteFromNode(
  node: Node<K, V>,
  hash: number,
  key: K,
  shift: number
): [Node<K, V> | null, boolean] {
  // Leaf node
  if (node.type === 'leaf') {
    return this.equalsFn(node.key, key) ? [null, true] : [node, false];
  }
  
  // Collision node
  if (node.type === 'collision') {
    if (node.hash !== hash) return [node, false];
    
    const index = node.entries.findIndex(([k]) => this.equalsFn(k, key));
    if (index === -1) return [node, false];
    
    if (node.entries.length === 2) {
      // Convert back to leaf node
      const [k, v] = node.entries[1 - index];
      return [{ type: 'leaf', hash, key: k, value: v }, true];
    }
    
    // Remove entry from collision node
    const newEntries = [...node.entries];
    newEntries.splice(index, 1);
    return [{ ...node, entries: newEntries }, true];
  }
  
  // Branch node
  const bit = this.mask(hash, shift);
  
  if ((node.bitmap & bit) === 0) return [node, false];
  
  const index = this.index(node.bitmap, bit);
  const [newChild, removed] = this.deleteFromNode(
    node.children[index],
    hash,
    key,
    shift + 5
  );
  
  if (!removed) return [node, false];
  
  if (newChild === null) {
    // Remove child
    if (node.children.length === 1) return [null, true];
    
    const newBitmap = node.bitmap & ~bit;
    const newChildren = [...node.children];
    newChildren.splice(index, 1);
    
    return [{ ...node, bitmap: newBitmap, children: newChildren }, true];
  }
  
  // Update child
  const newChildren = [...node.children];
  newChildren[index] = newChild;
  
  return [{ ...node, children: newChildren }, true];
}
```

## 4. Additional Operations

### 4.1 Iteration

```typescript
entries(): IterableIterator<[K, V]> {
  return this.entriesFromNode(this.root);
}

private *entriesFromNode(node: Node<K, V>): IterableIterator<[K, V]> {
  if (node.type === 'leaf') {
    yield [node.key, node.value];
  } else if (node.type === 'collision') {
    for (const [key, value] of node.entries) {
      yield [key, value];
    }
  } else {
    for (const child of node.children) {
      yield* this.entriesFromNode(child);
    }
  }
}

keys(): IterableIterator<K> {
  return this.keysFromNode(this.root);
}

private *keysFromNode(node: Node<K, V>): IterableIterator<K> {
  if (node.type === 'leaf') {
    yield node.key;
  } else if (node.type === 'collision') {
    for (const [key] of node.entries) {
      yield key;
    }
  } else {
    for (const child of node.children) {
      yield* this.keysFromNode(child);
    }
  }
}

values(): IterableIterator<V> {
  return this.valuesFromNode(this.root);
}

private *valuesFromNode(node: Node<K, V>): IterableIterator<V> {
  if (node.type === 'leaf') {
    yield node.value;
  } else if (node.type === 'collision') {
    for (const [, value] of node.entries) {
      yield value;
    }
  } else {
    for (const child of node.children) {
      yield* this.valuesFromNode(child);
    }
  }
}
```

### 4.2 Transformations

```typescript
map<U>(fn: (value: V, key: K) => U): HAMTMap<K, U> {
  let result = HAMTMap.empty<K, U>(this.hashFn, this.equalsFn);
  
  for (const [key, value] of this.entries()) {
    result = result.set(key, fn(value, key));
  }
  
  return result;
}

filter(predicate: (value: V, key: K) => boolean): HAMTMap<K, V> {
  let result = HAMTMap.empty<K, V>(this.hashFn, this.equalsFn);
  
  for (const [key, value] of this.entries()) {
    if (predicate(value, key)) {
      result = result.set(key, value);
    }
  }
  
  return result;
}

merge(other: HAMTMap<K, V>): HAMTMap<K, V> {
  let result = this;
  
  for (const [key, value] of other.entries()) {
    result = result.set(key, value);
  }
  
  return result;
}
```

## 5. Optimizations

### 5.1 Specialized Key Types

For common key types, we'll provide specialized implementations:

#### String Keys

```typescript
class StringKeyHAMTMap<V> extends HAMTMap<string, V> {
  constructor(root: Node<string, V>, size: number) {
    super(root, size, stringHash, stringEquals);
  }
  
  static empty<V>(): StringKeyHAMTMap<V> {
    return new StringKeyHAMTMap<V>(emptyNode, 0);
  }
  
  // Specialized methods for string keys
}

function stringHash(str: string): number {
  // Efficient string hash function
}

function stringEquals(a: string, b: string): boolean {
  return a === b;
}
```

#### Number Keys

```typescript
class NumberKeyHAMTMap<V> extends HAMTMap<number, V> {
  constructor(root: Node<number, V>, size: number) {
    super(root, size, numberHash, numberEquals);
  }
  
  static empty<V>(): NumberKeyHAMTMap<V> {
    return new NumberKeyHAMTMap<V>(emptyNode, 0);
  }
  
  // Specialized methods for number keys
}

function numberHash(num: number): number {
  // Efficient number hash function
}

function numberEquals(a: number, b: number): boolean {
  return a === b;
}
```

### 5.2 Small Map Optimization

For small maps (e.g., < 8 entries), we'll use a simple array-based implementation to avoid the overhead of the trie structure:

```typescript
class SmallHAMTMap<K, V> extends HAMTMap<K, V> {
  private entries: Array<[K, V]>;
  
  constructor(entries: Array<[K, V]> = [], hashFn: (key: K) => number, equalsFn: (a: K, b: K) => boolean) {
    super(null, entries.length, hashFn, equalsFn);
    this.entries = entries;
  }
  
  // Override methods with optimized implementations
  // ...
}
```

### 5.3 Transient Operations

For batch operations, we'll provide a transient (temporarily mutable) version:

```typescript
toTransient(): TransientHAMTMap<K, V> {
  return new TransientHAMTMap<K, V>(this);
}

class TransientHAMTMap<K, V> {
  private root: Node<K, V>;
  private size: number;
  private hashFn: (key: K) => number;
  private equalsFn: (a: K, b: K) => boolean;
  private modified: boolean;
  
  // Methods for efficient batch operations
  // ...
  
  toPersistent(): HAMTMap<K, V> {
    this.modified = false;
    return new HAMTMap<K, V>(this.root, this.size, this.hashFn, this.equalsFn);
  }
}
```

## 6. API Compatibility

The HAMTMap will implement the same interface as the current ImmutableMap class to ensure backward compatibility:

```typescript
class HAMTMap<K, V> implements ImmutableMap<K, V> {
  // All methods from the current ImmutableMap class
  // ...
}
```

## 7. Performance Targets

| Operation | Current Map | HAMTMap Target |
|-----------|-------------|----------------|
| get       | O(1) avg    | O(log₃₂ n) ≈ O(1) |
| set       | O(n)        | O(log₃₂ n) ≈ O(1) |
| delete    | O(n)        | O(log₃₂ n) ≈ O(1) |
| has       | O(1) avg    | O(log₃₂ n) ≈ O(1) |
| entries   | O(n)        | O(n)           |
| keys      | O(n)        | O(n)           |
| values    | O(n)        | O(n)           |
| map       | O(n)        | O(n)           |
| filter    | O(n)        | O(n)           |
| merge     | O(n+m)      | O(m log₃₂ n)   |

## 8. Memory Usage

The HAMTMap will use significantly less memory than the current ImmutableMap implementation for operations that create derived maps:

- **Current Map**: O(n) memory for each derived map
- **HAMTMap**: O(log n) memory for each derived map due to structural sharing

## 9. Implementation Plan

1. Implement the core HAMTMap class with basic operations
2. Add transformations and iteration
3. Implement optimizations (specialized key types, small map, transient)
4. Ensure API compatibility with the current ImmutableMap class
5. Benchmark and optimize performance
6. Update the ImmutableMap class to use HAMTMap internally
