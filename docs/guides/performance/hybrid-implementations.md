# Hybrid Implementation Strategy Guide

## Introduction

Reduct uses a hybrid implementation strategy that combines the best aspects of native JavaScript data structures and custom immutable implementations. This guide explains how Reduct's hybrid approach works and how it benefits your applications.

## What Are Hybrid Implementations?

Hybrid implementations use different underlying data structures based on collection size, operation type, and runtime environment. This approach allows Reduct to:

1. Leverage native JavaScript performance for small collections
2. Use specialized immutable implementations for larger collections
3. Adapt to different usage patterns and environments
4. Maintain consistent APIs regardless of the underlying implementation

## Size-Based Adaptation

### How It Works

Reduct automatically selects the most appropriate implementation based on collection size:

```javascript
// Small collection: Uses native array with immutable wrapper
const smallList = List.of(1, 2, 3, 4, 5);

// Medium collection: Uses chunked array implementation
const mediumList = List.from(Array.from({ length: 100 }, (_, i) => i));

// Large collection: Uses persistent vector trie
const largeList = List.from(Array.from({ length: 10000 }, (_, i) => i));
```

The transition between implementations is transparent to users but provides optimal performance across different scenarios.

### Size Thresholds

Reduct uses carefully tuned size thresholds based on extensive benchmarking:

| Collection Type | Small | Medium | Large |
|-----------------|-------|--------|-------|
| List/Vector     | < 32  | 32-1000 | > 1000 |
| Map/Dictionary  | < 32  | 32-1000 | > 1000 |
| Set             | < 32  | 32-1000 | > 1000 |

These thresholds may be adjusted based on runtime performance monitoring.

## Implementation Types

### Lists/Vectors

Reduct uses three main implementations for lists:

1. **SmallList**: Native array with immutable wrapper
   ```javascript
   // Internal implementation (simplified)
   class SmallList {
     constructor(items) {
       this._items = Object.freeze([...items]);
     }

     get(index) {
       return this._items[index];
     }

     set(index, value) {
       const newItems = [...this._items];
       newItems[index] = value;
       return new SmallList(newItems);
     }
   }
   ```

2. **ChunkedList**: Array of chunks for medium-sized collections
   ```javascript
   // Internal implementation (simplified)
   class ChunkedList {
     constructor(chunks, size) {
       this._chunks = chunks;
       this._size = size;
     }

     get(index) {
       const chunkIndex = Math.floor(index / CHUNK_SIZE);
       const innerIndex = index % CHUNK_SIZE;
       return this._chunks[chunkIndex][innerIndex];
     }

     // Other operations...
   }
   ```

3. **PersistentVector**: 32-way branching trie for large collections
   ```javascript
   // Internal implementation (simplified)
   class PersistentVector {
     constructor(root, tail, size) {
       this._root = root;
       this._tail = tail;
       this._size = size;
     }

     // Trie-based implementation...
   }
   ```

### Maps/Dictionaries

Reduct uses three main implementations for maps:

1. **SmallMap**: Object or Map with immutable wrapper
   ```javascript
   // For string keys
   const map = { key1: 'value1', key2: 'value2' };
   Object.freeze(map);

   // For mixed keys
   const map = new Map([['key1', 'value1'], [obj, 'value2']]);
   // With immutable operations
   ```

2. **HashArrayMappedTrie**: HAMT for larger collections
   ```javascript
   // Simplified HAMT implementation
   class HAMT {
     constructor(root, size) {
       this._root = root;
       this._size = size;
     }

     // HAMT operations...
   }
   ```

## Operation-Specific Optimization

Different operations use different strategies:

### Read Operations

```javascript
// Small list: Direct array access
const value = smallList.get(5);

// Large list: Trie traversal
const value = largeList.get(5000);
```

### Write Operations

```javascript
// Small list: Create new array
const newSmallList = smallList.set(2, 'new value');

// Large list: Path copying in trie
const newLargeList = largeList.set(5000, 'new value');
```

### Bulk Operations

```javascript
// Small list: Native array methods with immutable wrapper
const mapped = smallList.map(x => x * 2);

// Large list: Specialized implementation with structural sharing
const mapped = largeList.map(x => x * 2);
```

## Specialized Operation Chains

Reduct detects and optimizes common operation chains:

```javascript
// This chain is detected and optimized
const result = list
  .map(x => x * 2)
  .filter(x => x > 10)
  .reduce((sum, x) => sum + x, 0);

// Internally uses a specialized implementation:
function mapFilterReduce(list, mapFn, filterFn, reduceFn, initial) {
  let result = initial;
  for (let i = 0; i < list.size; i++) {
    const value = list.get(i);
    const mapped = mapFn(value);
    if (filterFn(mapped)) {
      result = reduceFn(result, mapped);
    }
  }
  return result;
}
```

## Transparent Implementation Switching

Reduct handles implementation switching transparently:

```javascript
// Start with small list
let list = List.of(1, 2, 3);

// Grows to medium size - implementation switches automatically
for (let i = 0; i < 100; i++) {
  list = list.append(i);
}

// Grows to large size - implementation switches again
for (let i = 0; i < 1000; i++) {
  list = list.append(i);
}

// API remains consistent throughout
console.log(list.get(500));
```

## Performance Characteristics

### Lists/Vectors

| Operation | Small List | Medium List | Large List |
|-----------|------------|-------------|------------|
| get       | O(1), native | O(1), chunked | O(log₃₂ n) |
| set       | O(n), copy   | O(√n), partial copy | O(log₃₂ n) |
| append    | O(n), copy   | O(1) amortized | O(1) amortized |
| prepend   | O(n), copy   | O(1) | O(1) |
| iteration | Native speed | Chunked | Chunked |

### Maps/Dictionaries

| Operation | Small Map | Large Map |
|-----------|-----------|-----------|
| get       | O(1), native | O(log₃₂ n) |
| set       | O(n), copy   | O(log₃₂ n) |
| delete    | O(n), copy   | O(log₃₂ n) |
| iteration | Native speed | Trie traversal |

## Best Practices

### 1. Don't Worry About Implementation Details

Let Reduct handle the implementation details:

```javascript
// Just use the collection - Reduct will choose the best implementation
const list = List.from(myData);
```

### 2. Use Bulk Operations

Prefer bulk operations over sequences of individual operations:

```javascript
// Good: Single bulk operation
const newList = list.withMutations(mutable => {
  for (let i = 0; i < 1000; i++) {
    mutable.set(i, i * 2);
  }
});

// Less efficient: Many individual operations
let newList = list;
for (let i = 0; i < 1000; i++) {
  newList = newList.set(i, i * 2);
}
```

### 3. Chain Operations

Chain operations to enable specialized optimizations:

```javascript
// Good: Allows operation fusion
const result = list
  .map(x => x * 2)
  .filter(x => x > 10)
  .reduce((sum, x) => sum + x, 0);
```

### 4. Use Specialized Methods

Use specialized methods for common operations:

```javascript
// Good: Uses specialized implementation
const sum = numbers.sum();
const average = numbers.average();
const max = numbers.max();
```

## Conclusion

Reduct's hybrid implementation strategy provides the best of both worlds: the performance of native JavaScript data structures for small collections and the benefits of immutable, persistent data structures for larger collections. This approach allows Reduct to deliver high-performance immutable collections that work well across a wide range of use cases.

For more detailed information on Reduct's implementation strategies, see the [Hybrid Implementation Strategy](../../internal/technical/hybrid-implementation-strategy.md) document.
