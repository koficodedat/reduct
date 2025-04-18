# Persistent Vector Specification

This document outlines the technical specification for the optimized Immutable List implementation (PersistentVector) for Reduct Phase Two.

## 1. Overview

The PersistentVector will be a trie-based implementation of an immutable list with structural sharing, providing efficient random access, updates, and append operations. It will maintain the same API as the current List implementation while significantly improving performance.

## 2. Data Structure

### 2.1 Core Structure

The PersistentVector will use a 32-way branching trie structure:

```typescript
class PersistentVector<T> {
  private root: Node<T>;
  private tail: T[];
  private size: number;
  private height: number;
  
  // Methods...
}

interface Node<T> {
  children: Array<Node<T> | T>;
}
```

- **Root**: The root node of the trie
- **Tail**: A buffer for the last 32 elements (for efficient appends)
- **Size**: The total number of elements
- **Height**: The height of the trie

### 2.2 Node Structure

Each node in the trie will contain up to 32 elements or child nodes:

```typescript
class Node<T> {
  children: Array<Node<T> | T>;
  
  constructor(children: Array<Node<T> | T> = []) {
    this.children = children;
  }
  
  clone(): Node<T> {
    return new Node<T>([...this.children]);
  }
}
```

### 2.3 Tail Optimization

The tail buffer allows for efficient append operations:

- New elements are added to the tail buffer
- When the tail buffer is full (32 elements), it becomes a new leaf node in the trie
- This provides O(1) amortized append operations

## 3. Core Operations

### 3.1 Access (get)

```typescript
get(index: number): Option<T> {
  if (index < 0 || index >= this.size) {
    return none;
  }
  
  // Fast path for tail access
  if (index >= this.size - this.tail.length) {
    return some(this.tail[index - (this.size - this.tail.length)]);
  }
  
  // Traverse trie to find element
  return some(this.getFromTrie(this.root, index, this.height));
}

private getFromTrie(node: Node<T>, index: number, level: number): T {
  if (level === 0) {
    return node.children[index & 0x1f] as T;
  }
  
  const childIndex = (index >> (level * 5)) & 0x1f;
  return this.getFromTrie(node.children[childIndex] as Node<T>, index, level - 1);
}
```

### 3.2 Update (set)

```typescript
set(index: number, value: T): PersistentVector<T> {
  if (index < 0 || index >= this.size) {
    throw new RangeError(`Index ${index} out of bounds`);
  }
  
  // Fast path for tail update
  if (index >= this.size - this.tail.length) {
    const newTail = [...this.tail];
    newTail[index - (this.size - this.tail.length)] = value;
    return new PersistentVector<T>(this.root, newTail, this.size, this.height);
  }
  
  // Update trie
  const newRoot = this.updateTrie(this.root, index, value, this.height);
  return new PersistentVector<T>(newRoot, this.tail, this.size, this.height);
}

private updateTrie(node: Node<T>, index: number, value: T, level: number): Node<T> {
  const newNode = node.clone();
  
  if (level === 0) {
    newNode.children[index & 0x1f] = value;
  } else {
    const childIndex = (index >> (level * 5)) & 0x1f;
    newNode.children[childIndex] = this.updateTrie(
      newNode.children[childIndex] as Node<T>,
      index,
      value,
      level - 1
    );
  }
  
  return newNode;
}
```

### 3.3 Append

```typescript
append(value: T): PersistentVector<T> {
  // If tail is not full, just add to tail
  if (this.tail.length < 32) {
    const newTail = [...this.tail, value];
    return new PersistentVector<T>(this.root, newTail, this.size + 1, this.height);
  }
  
  // Tail is full, need to incorporate it into the trie
  let newRoot = this.root;
  let newHeight = this.height;
  
  // If trie is full at current height, increase height
  if ((this.size >> 5) > (1 << (this.height * 5))) {
    newRoot = new Node<T>([this.root]);
    newHeight = this.height + 1;
  }
  
  // Add current tail as a new node in the trie
  newRoot = this.incorporateTail(newRoot, this.tail, this.size - 32, newHeight);
  
  // Start a new tail with the new element
  const newTail = [value];
  
  return new PersistentVector<T>(newRoot, newTail, this.size + 1, newHeight);
}

private incorporateTail(node: Node<T>, tail: T[], tailIndex: number, level: number): Node<T> {
  const newNode = node.clone();
  
  if (level === 0) {
    // At leaf level, add the tail directly
    newNode.children = tail;
  } else {
    // Navigate to the correct child node
    const childIndex = (tailIndex >> (level * 5)) & 0x1f;
    
    // Create path if it doesn't exist
    if (!newNode.children[childIndex]) {
      newNode.children[childIndex] = new Node<T>();
    }
    
    // Recursively incorporate tail
    newNode.children[childIndex] = this.incorporateTail(
      newNode.children[childIndex] as Node<T>,
      tail,
      tailIndex,
      level - 1
    );
  }
  
  return newNode;
}
```

### 3.4 Prepend

```typescript
prepend(value: T): PersistentVector<T> {
  // For prepend, we'll create a new vector and use a more efficient
  // implementation than the current approach of copying the entire array
  
  // Create a new vector with just the new element
  const result = PersistentVector.of(value);
  
  // Concatenate with this vector
  return result.concat(this);
}
```

### 3.5 Concat

```typescript
concat(other: PersistentVector<T>): PersistentVector<T> {
  // Efficient concatenation using structural sharing where possible
  
  // Simple case: if one is empty, return the other
  if (this.isEmpty) return other;
  if (other.isEmpty) return this;
  
  // Start with a copy of this vector
  let result = this;
  
  // Add all elements from other
  for (const element of other) {
    result = result.append(element);
  }
  
  return result;
}
```

## 4. Transformations

### 4.1 Map

```typescript
map<U>(fn: (element: T, index: number) => U): PersistentVector<U> {
  // Create a new vector to hold the results
  let result = PersistentVector.empty<U>();
  
  // Apply the function to each element and append to result
  for (let i = 0; i < this.size; i++) {
    result = result.append(fn(this.get(i).getOrThrow(), i));
  }
  
  return result;
}
```

### 4.2 Filter

```typescript
filter(predicate: (element: T, index: number) => boolean): PersistentVector<T> {
  // Create a new vector to hold the results
  let result = PersistentVector.empty<T>();
  
  // Add elements that match the predicate
  for (let i = 0; i < this.size; i++) {
    const element = this.get(i).getOrThrow();
    if (predicate(element, i)) {
      result = result.append(element);
    }
  }
  
  return result;
}
```

### 4.3 Reduce

```typescript
reduce<U>(fn: (accumulator: U, element: T, index: number) => U, initial: U): U {
  let accumulator = initial;
  
  for (let i = 0; i < this.size; i++) {
    accumulator = fn(accumulator, this.get(i).getOrThrow(), i);
  }
  
  return accumulator;
}
```

## 5. Iteration

```typescript
[Symbol.iterator](): Iterator<T> {
  let index = 0;
  
  return {
    next: (): IteratorResult<T> => {
      if (index >= this.size) {
        return { done: true, value: undefined };
      }
      
      const value = this.get(index).getOrThrow();
      index++;
      
      return { done: false, value };
    }
  };
}
```

## 6. Optimizations

### 6.1 Small Vector Optimization

For small vectors (e.g., < 32 elements), we'll use a simple array-based implementation to avoid the overhead of the trie structure:

```typescript
class SmallPersistentVector<T> extends PersistentVector<T> {
  private elements: T[];
  
  constructor(elements: T[] = []) {
    super();
    this.elements = elements;
  }
  
  // Override methods with optimized implementations
  // ...
}
```

### 6.2 Transient Operations

For batch operations, we'll provide a transient (temporarily mutable) version:

```typescript
toTransient(): TransientVector<T> {
  return new TransientVector<T>(this);
}

class TransientVector<T> {
  private root: Node<T>;
  private tail: T[];
  private size: number;
  private height: number;
  private modified: boolean;
  
  // Methods for efficient batch operations
  // ...
  
  toPersistent(): PersistentVector<T> {
    this.modified = false;
    return new PersistentVector<T>(this.root, this.tail, this.size, this.height);
  }
}
```

### 6.3 Chunked Iterator

For efficient iteration, we'll implement a chunked iterator that processes elements in chunks for better cache locality:

```typescript
chunkedIterator(): Iterator<T[]> {
  // Implementation that yields chunks of elements
  // ...
}
```

## 7. API Compatibility

The PersistentVector will implement the same interface as the current List class to ensure backward compatibility:

```typescript
class PersistentVector<T> implements List<T> {
  // All methods from the current List class
  // ...
}
```

## 8. Performance Targets

| Operation | Current List | PersistentVector Target |
|-----------|--------------|-------------------------|
| get       | O(1)         | O(log₃₂ n) ≈ O(1)       |
| append    | O(n)         | O(1) amortized          |
| prepend   | O(n)         | O(1) amortized          |
| update    | O(n)         | O(log₃₂ n) ≈ O(1)       |
| insert    | O(n)         | O(log₃₂ n + k)          |
| remove    | O(n)         | O(log₃₂ n + k)          |
| map       | O(n)         | O(n)                    |
| filter    | O(n)         | O(n)                    |
| reduce    | O(n)         | O(n)                    |
| concat    | O(n+m)       | O(m)                    |

## 9. Memory Usage

The PersistentVector will use significantly less memory than the current List implementation for operations that create derived lists:

- **Current List**: O(n) memory for each derived list
- **PersistentVector**: O(log n) memory for each derived list due to structural sharing

## 10. Implementation Plan

1. Implement the core PersistentVector class with basic operations
2. Add transformations and iteration
3. Implement optimizations (small vector, transient, chunked iterator)
4. Ensure API compatibility with the current List class
5. Benchmark and optimize performance
6. Update the List class to use PersistentVector internally
