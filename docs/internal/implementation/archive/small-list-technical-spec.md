# SmallList Technical Specification

## Overview

This document provides a detailed technical specification for the SmallList implementation, which is designed for small collections (fewer than 32 elements) in the Reduct library. The SmallList uses a simple array-backed implementation with optimizations for JavaScript engines to provide performance as close as possible to native arrays while maintaining immutability.

## Related Documentation

- [Enhanced List Implementation Plan](./enhanced-list-implementation-plan.md)
- [Immutable List Optimization](../technical/immutable-list-optimization-spec.md)
- [JavaScript Engine Optimization](../technical/javascript-engine-optimization.md)

## Data Structure

The SmallList is a simple wrapper around a native JavaScript array that provides immutability guarantees while minimizing overhead:

```typescript
class SmallList<T> implements IList<T> {
  private readonly items: ReadonlyArray<T>;
  
  constructor(items: ReadonlyArray<T>) {
    this.items = items;
  }
  
  // Methods implementing the IList interface
}
```

## Core Operations

### 1. Access (get)

```typescript
get(index: number): T | undefined {
  if (index < 0 || index >= this.items.length) {
    return undefined;
  }
  return this.items[index];
}

first(): T | undefined {
  return this.items.length > 0 ? this.items[0] : undefined;
}

last(): T | undefined {
  return this.items.length > 0 ? this.items[this.items.length - 1] : undefined;
}
```

### 2. Update (set)

```typescript
set(index: number, value: T): SmallList<T> {
  if (index < 0 || index >= this.items.length) {
    throw new RangeError(`Index ${index} out of bounds`);
  }
  
  // Create a new array with the updated value
  const newItems = [...this.items];
  newItems[index] = value;
  
  return new SmallList(newItems);
}
```

### 3. Append (append)

```typescript
append(value: T): SmallList<T> {
  // Create a new array with the appended value
  return new SmallList([...this.items, value]);
}
```

### 4. Prepend (prepend)

```typescript
prepend(value: T): SmallList<T> {
  // Create a new array with the prepended value
  return new SmallList([value, ...this.items]);
}
```

### 5. Transformation (map, filter, reduce)

```typescript
map<U>(fn: (value: T, index: number) => U): SmallList<U> {
  // Directly use native array map
  return new SmallList(this.items.map(fn));
}

filter(predicate: (value: T, index: number) => boolean): SmallList<T> {
  // Directly use native array filter
  return new SmallList(this.items.filter(predicate));
}

reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U {
  // Directly use native array reduce
  return this.items.reduce(fn, initial);
}
```

## JavaScript Engine Optimizations

### 1. Hidden Class Stability

Ensure stable hidden classes for better JIT compilation:

```typescript
class SmallList<T> {
  // Declare all properties upfront
  private readonly items: ReadonlyArray<T>;
  private readonly _size: number;
  
  constructor(items: ReadonlyArray<T>) {
    this.items = items;
    this._size = items.length;
  }
  
  get size(): number {
    return this._size;
  }
  
  get isEmpty(): boolean {
    return this._size === 0;
  }
}
```

### 2. Monomorphic Code Patterns

Use monomorphic code patterns for better optimization:

```typescript
// Specialized methods for common types
private mapNumbers(fn: (value: number, index: number) => number): SmallList<number> {
  // Type-specialized implementation for numbers
  return new SmallList(Array.prototype.map.call(this.items, fn));
}

map<U>(fn: (value: T, index: number) => U): SmallList<U> {
  // Type specialization for common cases
  if (this.isEmpty) {
    return new SmallList([]);
  }
  
  // Check if we're dealing with numbers and use specialized implementation
  if (typeof this.items[0] === 'number' && 
      typeof fn(this.items[0] as any, 0) === 'number') {
    return this.mapNumbers(fn as any) as any;
  }
  
  // General case
  return new SmallList(this.items.map(fn));
}
```

### 3. Function Inlining

Keep functions small and simple for better inlining:

```typescript
// Small, simple functions that are likely to be inlined
private createNewArrayWith(index: number, value: T): T[] {
  const newItems = [...this.items];
  newItems[index] = value;
  return newItems;
}

set(index: number, value: T): SmallList<T> {
  if (index < 0 || index >= this.items.length) {
    throw new RangeError(`Index ${index} out of bounds`);
  }
  
  return new SmallList(this.createNewArrayWith(index, value));
}
```

### 4. Array Literal Optimization

Leverage array literal optimizations for small collections:

```typescript
static empty<T>(): SmallList<T> {
  return new SmallList([]);
}

static of<T>(...items: T[]): SmallList<T> {
  return new SmallList(items);
}

static from<T>(iterable: Iterable<T>): SmallList<T> {
  if (Array.isArray(iterable)) {
    // Fast path for arrays
    return new SmallList([...iterable]);
  }
  
  // General case for other iterables
  return new SmallList(Array.from(iterable));
}
```

### 5. Iteration Pattern Optimization

Use optimized iteration patterns:

```typescript
forEach(fn: (value: T, index: number) => void): void {
  // Use native forEach for best performance
  this.items.forEach(fn);
}

*[Symbol.iterator](): Iterator<T> {
  // Use native iteration
  yield* this.items;
}

// Optimized implementation for finding elements
find(predicate: (value: T, index: number) => boolean): T | undefined {
  // Use native find for best performance
  return this.items.find(predicate);
}
```

### 6. Type Stability

Maintain type stability for better JIT optimization:

```typescript
// Ensure type stability in all operations
map<U>(fn: (value: T, index: number) => U): SmallList<U> {
  const results: U[] = new Array(this.items.length);
  for (let i = 0; i < this.items.length; i++) {
    results[i] = fn(this.items[i], i);
  }
  return new SmallList(results);
}
```

## Specialized Operations

Implement efficient operation chains that avoid intermediate collection creation:

```typescript
mapFilterReduce<U, V>(
  mapFn: (value: T, index: number) => U,
  filterFn: (value: U, index: number) => boolean,
  reduceFn: (acc: V, value: U, index: number) => V,
  initial: V
): V {
  // For very small collections, use separate native operations
  // JavaScript engines might optimize this better in some cases
  if (this.items.length < 16) {
    return this.items
      .map(mapFn)
      .filter(filterFn)
      .reduce((acc: V, val: U, idx: number) => reduceFn(acc, val, idx), initial);
  }
  
  // For larger collections, use a single-pass implementation
  let result = initial;
  let filteredIndex = 0;
  
  for (let i = 0; i < this.items.length; i++) {
    const mappedValue = mapFn(this.items[i], i);
    if (filterFn(mappedValue, i)) {
      result = reduceFn(result, mappedValue, filteredIndex++);
    }
  }
  
  return result;
}

mapReduce<U, V>(
  mapFn: (value: T, index: number) => U,
  reduceFn: (acc: V, value: U, index: number) => V,
  initial: V
): V {
  // For very small collections, use separate native operations
  if (this.items.length < 16) {
    return this.items
      .map(mapFn)
      .reduce((acc: V, val: U, idx: number) => reduceFn(acc, val, idx), initial);
  }
  
  // For larger collections, use a single-pass implementation
  let result = initial;
  
  for (let i = 0; i < this.items.length; i++) {
    const mappedValue = mapFn(this.items[i], i);
    result = reduceFn(result, mappedValue, i);
  }
  
  return result;
}

filterMap<U>(
  filterFn: (value: T, index: number) => boolean,
  mapFn: (value: T, index: number) => U
): SmallList<U> {
  // For very small collections, use separate native operations
  if (this.items.length < 16) {
    return new SmallList(
      this.items
        .filter(filterFn)
        .map(mapFn)
    );
  }
  
  // For larger collections, use a single-pass implementation
  const result: U[] = [];
  
  for (let i = 0; i < this.items.length; i++) {
    if (filterFn(this.items[i], i)) {
      result.push(mapFn(this.items[i], i));
    }
  }
  
  return new SmallList(result);
}
```

## Transient Mutations

Implement a transient (temporarily mutable) version for batch operations:

```typescript
class TransientSmallList<T> implements TransientList<T> {
  private items: T[];
  private readonly _original: SmallList<T>;
  
  constructor(original: SmallList<T>, items: T[]) {
    this._original = original;
    this.items = items;
  }
  
  append(value: T): TransientSmallList<T> {
    this.items.push(value);
    return this;
  }
  
  prepend(value: T): TransientSmallList<T> {
    this.items.unshift(value);
    return this;
  }
  
  set(index: number, value: T): TransientSmallList<T> {
    if (index < 0 || index >= this.items.length) {
      throw new RangeError(`Index ${index} out of bounds`);
    }
    
    this.items[index] = value;
    return this;
  }
  
  persistent(): SmallList<T> {
    // Create a new immutable list with the current items
    return new SmallList([...this.items]);
  }
}

// Add to SmallList class
transient(): TransientSmallList<T> {
  return new TransientSmallList(this, [...this.items]);
}
```

## Performance Characteristics

| Operation | Time Complexity | Space Complexity | Performance vs. Native Arrays |
|-----------|-----------------|------------------|-------------------------------|
| get       | O(1)            | O(1)             | ~1.0x (equivalent)           |
| set       | O(n)            | O(n)             | ~1.1-1.2x slower             |
| append    | O(n)            | O(n)             | ~1.1-1.2x slower             |
| prepend   | O(n)            | O(n)             | ~1.1-1.2x slower             |
| map       | O(n)            | O(n)             | ~1.0-1.1x slower             |
| filter    | O(n)            | O(n)             | ~1.0-1.1x slower             |
| reduce    | O(n)            | O(1)             | ~1.0x (equivalent)           |

## Implementation Considerations

1. **Size Limit**:
   - The SmallList is optimized for collections with fewer than 32 elements
   - For larger collections, the SmartList wrapper should transition to ChunkedList

2. **Memory Efficiency**:
   - The SmallList uses a simple array copy for immutability
   - This is memory-inefficient for large collections but acceptable for small ones
   - The simplicity provides better performance for small collections

3. **JavaScript Engine Optimization**:
   - The implementation is heavily optimized for modern JavaScript engines
   - It leverages engine-specific optimizations for arrays and objects
   - It maintains type stability and hidden class stability

4. **API Consistency**:
   - The SmallList implements the same interface as other List implementations
   - This ensures consistent behavior across all collection sizes
   - The implementation details are hidden from users

## Next Steps

1. Implement the core SmallList structure
2. Add basic operations (get, set, append, prepend)
3. Implement transformation operations (map, filter, reduce)
4. Add specialized operation chains
5. Implement transient mutations
6. Apply JavaScript engine optimizations
7. Comprehensive testing and benchmarking
