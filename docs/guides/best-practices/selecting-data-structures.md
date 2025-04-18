# Selecting the Right Data Structure

## Introduction

Choosing the right data structure is crucial for application performance and developer productivity. This guide helps you select the most appropriate Reduct data structure for your specific use case, considering factors like access patterns, collection size, and performance requirements.

## Understanding Reduct's Data Structure Philosophy

Reduct provides immutable data structures with different performance characteristics:

1. **Immutability**: All data structures are immutable, ensuring predictable behavior
2. **Persistent**: Efficient structural sharing between versions
3. **Hybrid Implementation**: Different implementations based on collection size
4. **Optimized Operations**: Specialized implementations for common operations

## Core Data Structures

### List

A sequential collection with efficient random access, append, and prepend operations.

```javascript
import { List } from 'reduct/data-structures';

const list = List.of(1, 2, 3, 4, 5);
const withItem = list.append(6);
const firstItem = list.get(0);
```

**Best for**:
- Sequential data with random access needs
- Frequent append/prepend operations
- Iteration over all elements
- Transformations like map, filter, reduce

**Performance characteristics**:
- Small lists (< 32 elements): Near-native array performance
- Medium lists (32-1000 elements): Efficient chunked implementation
- Large lists (> 1000 elements): O(log₃₂ n) access, efficient structural sharing

### Map

An associative collection that maps keys to values.

```javascript
import { Map } from 'reduct/data-structures';

const map = Map.of(['key1', 'value1'], ['key2', 'value2']);
const withEntry = map.set('key3', 'value3');
const value = map.get('key1');
```

**Best for**:
- Key-value associations
- Frequent lookups by key
- Unique keys with associated values
- Dictionary-like use cases

**Performance characteristics**:
- Small maps (< 32 entries): Near-native object/Map performance
- Large maps (> 32 entries): O(log₃₂ n) operations with structural sharing
- String keys: Optimized implementation for string keys
- Mixed keys: Efficient handling of any key type

### Set

A collection of unique values.

```javascript
import { Set } from 'reduct/data-structures';

const set = Set.of(1, 2, 3, 4, 5);
const withItem = set.add(6);
const hasItem = set.has(3);
```

**Best for**:
- Collections of unique values
- Membership testing
- Set operations (union, intersection, difference)
- Deduplication

**Performance characteristics**:
- Small sets (< 32 elements): Efficient array-based implementation
- Large sets (> 32 elements): O(log₃₂ n) operations with structural sharing
- Primitive values: Optimized implementation
- Object values: Configurable equality semantics

### Stack

A last-in-first-out (LIFO) collection.

```javascript
import { Stack } from 'reduct/data-structures';

const stack = Stack.of(1, 2, 3);
const withItem = stack.push(4);
const topItem = stack.peek();
const poppedStack = stack.pop();
```

**Best for**:
- LIFO access patterns
- Function call tracking
- Undo/redo functionality
- Parsing and evaluation

**Performance characteristics**:
- O(1) push and pop operations
- O(1) peek operation
- Efficient structural sharing

### Queue

A first-in-first-out (FIFO) collection.

```javascript
import { Queue } from 'reduct/data-structures';

const queue = Queue.of(1, 2, 3);
const withItem = queue.enqueue(4);
const firstItem = queue.peek();
const dequeuedQueue = queue.dequeue();
```

**Best for**:
- FIFO access patterns
- Task scheduling
- Breadth-first traversals
- Message processing

**Performance characteristics**:
- O(1) enqueue and dequeue operations
- O(1) peek operation
- Efficient structural sharing

## Specialized Data Structures

### SortedMap

A map with keys maintained in sorted order.

```javascript
import { SortedMap } from 'reduct/data-structures';

const map = SortedMap.of(['c', 3], ['a', 1], ['b', 2]);
// Keys are automatically sorted: 'a', 'b', 'c'
```

**Best for**:
- Ordered key-value associations
- Range queries
- Prefix/suffix operations
- Maintaining sorted order

**Performance characteristics**:
- O(log n) insertion, deletion, and lookup
- Efficient range operations
- Ordered iteration

### Vector

A growable, random-access sequence optimized for large collections.

```javascript
import { Vector } from 'reduct/data-structures';

const vector = Vector.from(Array.from({ length: 10000 }, (_, i) => i));
const value = vector.get(5000);
```

**Best for**:
- Very large sequential collections
- Frequent random access
- Efficient slicing and concatenation
- Performance-critical applications

**Performance characteristics**:
- O(log₃₂ n) access and update
- O(1) append and prepend
- Highly optimized for large collections
- Efficient structural sharing

## Choosing Between Native and Reduct Data Structures

### When to Use Native Arrays/Objects

Native JavaScript arrays and objects might be preferable when:

1. **Collection is small and temporary**: For small, short-lived collections
2. **Maximum performance is critical**: For hot loops with small collections
3. **Interoperability is required**: When working with APIs that expect native types
4. **Mutability is desired**: When in-place mutation is beneficial

```javascript
// Use native array for small, temporary collection
const tempArray = [1, 2, 3, 4, 5];
tempArray.forEach(item => process(item));
```

### When to Use Reduct Data Structures

Reduct data structures are preferable when:

1. **Immutability is important**: For predictable state management
2. **Collection is shared**: When data is passed between components
3. **Collection is large**: For efficient operations on large collections
4. **Persistence is needed**: When previous versions need to be preserved
5. **Rich functional operations**: When using map, filter, reduce, etc.

```javascript
// Use Reduct List for immutable, shared collection
const sharedData = List.from(fetchedData);
const processedData = sharedData.map(process);
```

## Decision Matrix

| Requirement | Recommended Structure |
|-------------|----------------------|
| Sequential data, random access | List or Vector |
| Key-value mapping | Map |
| Unique values | Set |
| LIFO access | Stack |
| FIFO access | Queue |
| Sorted keys | SortedMap |
| Very large collection | Vector |
| Small, temporary collection | Native array/object |
| Frequent updates | Reduct with transient operations |
| Shared, immutable state | Any Reduct structure |

## Performance Considerations

### Collection Size

Collection size significantly impacts performance:

```javascript
// Small collection: Both native and Reduct perform well
const smallList = List.of(1, 2, 3, 4, 5);

// Large collection: Reduct's persistent structures shine
const largeList = List.from(Array.from({ length: 10000 }, (_, i) => i));
```

### Operation Patterns

Different operations have different performance characteristics:

```javascript
// Random access: O(log₃₂ n) for large collections
const value = largeList.get(5000);

// Iteration: Efficient for all sizes
largeList.forEach(value => console.log(value));

// Transformations: Optimized chains
const result = largeList
  .map(x => x * 2)
  .filter(x => x > 1000)
  .reduce((sum, x) => sum + x, 0);
```

### Batch Operations

For multiple updates, use batch operations:

```javascript
// Efficient batch updates
const newList = list.withMutations(mutable => {
  for (let i = 0; i < 1000; i++) {
    mutable.set(i, i * 2);
  }
});
```

## Real-World Examples

### State Management in UI Applications

```javascript
// Application state
const initialState = Map({
  users: List(),
  selectedUser: null,
  isLoading: false
});

// Update state immutably
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_USERS':
      return state
        .set('isLoading', true)
        .set('users', List());
    
    case 'USERS_LOADED':
      return state
        .set('isLoading', false)
        .set('users', List.from(action.users));
    
    case 'SELECT_USER':
      return state.set('selectedUser', action.userId);
    
    default:
      return state;
  }
}
```

### Data Processing Pipeline

```javascript
// Process large dataset
function processData(rawData) {
  return List.from(rawData)
    .map(item => transformItem(item))
    .filter(item => isValid(item))
    .groupBy(item => item.category)
    .map((items, category) => ({
      category,
      count: items.size,
      total: items.reduce((sum, item) => sum + item.value, 0)
    }))
    .toArray();
}
```

### Graph Representation

```javascript
// Represent graph as map of adjacency lists
const graph = Map({
  'A': Set.of('B', 'C'),
  'B': Set.of('A', 'D'),
  'C': Set.of('A', 'D'),
  'D': Set.of('B', 'C')
});

// Add edge
const newGraph = graph.update(
  'A',
  adjacent => adjacent.add('E')
);
```

## Conclusion

Selecting the right data structure is crucial for application performance and developer productivity. Reduct provides a range of immutable data structures with different performance characteristics to suit various use cases.

Consider your access patterns, collection size, and performance requirements when choosing between different data structures. For most cases, Reduct's hybrid implementation strategy provides excellent performance while maintaining the benefits of immutability.

Remember that Reduct's data structures are designed to work well with both small and large collections, adapting their implementation based on collection size to provide optimal performance across a wide range of use cases.
