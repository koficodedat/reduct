# SmartList Technical Specification

## Overview

This document provides a detailed technical specification for the SmartList implementation, which serves as an adaptive wrapper around different List implementations in the Reduct library. The SmartList transparently selects the most appropriate implementation based on collection size and handles transitions between implementations to provide optimal performance while maintaining a consistent API.

## Related Documentation

- [Enhanced List Implementation Plan](./enhanced-list-implementation-plan.md)
- [Small List Technical Specification](./small-list-technical-spec.md)
- [Chunked List Technical Specification](./chunked-list-technical-spec.md)
- [Hybrid Implementation Strategy](../technical/hybrid-implementation-strategy.md)

## Core Concept

The SmartList is a facade that delegates operations to the most appropriate underlying implementation based on collection size:

- **SmallList**: For collections with fewer than 32 elements
- **ChunkedList**: For collections with 32-1000 elements
- **PersistentVector**: For collections with more than 1000 elements

This adaptive approach allows the List to provide optimal performance across all collection sizes while maintaining immutability and a consistent API.

## Implementation

```typescript
class List<T> implements IList<T> {
  // Size thresholds for different implementations
  private static readonly SMALL_COLLECTION_THRESHOLD = 32;
  private static readonly MEDIUM_COLLECTION_THRESHOLD = 1000;
  
  // The actual implementation
  private readonly implementation: IList<T>;
  
  // Size of the collection
  private readonly _size: number;
  
  constructor(implementation: IList<T>, size: number) {
    this.implementation = implementation;
    this._size = size;
  }
  
  // Factory methods
  static empty<T>(): List<T> {
    return new List<T>(new SmallList<T>([]), 0);
  }
  
  static of<T>(...items: T[]): List<T> {
    return List.from(items);
  }
  
  static from<T>(iterable: Iterable<T>): List<T> {
    // Convert iterable to array
    const items = Array.isArray(iterable) ? iterable : Array.from(iterable);
    const size = items.length;
    
    // Select the appropriate implementation based on size
    let implementation: IList<T>;
    
    if (size < List.SMALL_COLLECTION_THRESHOLD) {
      implementation = new SmallList<T>(items);
    } else if (size < List.MEDIUM_COLLECTION_THRESHOLD) {
      implementation = new ChunkedList<T>(items);
    } else {
      implementation = new PersistentVector<T>(items);
    }
    
    return new List<T>(implementation, size);
  }
  
  // Delegate methods to the underlying implementation
  // with appropriate implementation transitions
}
```

## Size-Based Adaptation

The key feature of the SmartList is its ability to adapt the underlying implementation based on collection size:

```typescript
private ensureOptimalImplementation(newSize: number): IList<T> {
  // Check if we need to transition to a different implementation
  if (newSize < List.SMALL_COLLECTION_THRESHOLD) {
    if (this.implementation instanceof SmallList) {
      return this.implementation;
    }
    return new SmallList<T>(this.implementation.toArray());
  } else if (newSize < List.MEDIUM_COLLECTION_THRESHOLD) {
    if (this.implementation instanceof ChunkedList) {
      return this.implementation;
    }
    return new ChunkedList<T>(this.implementation.toArray());
  } else {
    if (this.implementation instanceof PersistentVector) {
      return this.implementation;
    }
    return new PersistentVector<T>(this.implementation.toArray());
  }
}
```

## Operation Delegation

The SmartList delegates all operations to the underlying implementation, handling transitions when necessary:

```typescript
append(value: T): List<T> {
  const newSize = this._size + 1;
  const newImpl = this.implementation.append(value);
  
  // Check if we need to transition to a different implementation
  const optimalImpl = this.ensureOptimalImplementation(newSize);
  
  if (optimalImpl !== this.implementation) {
    // We need to transition to a different implementation
    return new List<T>(optimalImpl.append(value), newSize);
  }
  
  // No transition needed
  return new List<T>(newImpl, newSize);
}

prepend(value: T): List<T> {
  const newSize = this._size + 1;
  const newImpl = this.implementation.prepend(value);
  
  // Check if we need to transition to a different implementation
  const optimalImpl = this.ensureOptimalImplementation(newSize);
  
  if (optimalImpl !== this.implementation) {
    // We need to transition to a different implementation
    return new List<T>(optimalImpl.prepend(value), newSize);
  }
  
  // No transition needed
  return new List<T>(newImpl, newSize);
}

// Similar pattern for other operations that change the collection size
```

## Specialized Operations

The SmartList also provides specialized operation chains that are optimized for common transformation patterns:

```typescript
mapFilterReduce<U, V>(
  mapFn: (value: T, index: number) => U,
  filterFn: (value: U, index: number) => boolean,
  reduceFn: (acc: V, value: U, index: number) => V,
  initial: V
): V {
  // Delegate to the underlying implementation
  return this.implementation.mapFilterReduce(mapFn, filterFn, reduceFn, initial);
}

mapReduce<U, V>(
  mapFn: (value: T, index: number) => U,
  reduceFn: (acc: V, value: U, index: number) => V,
  initial: V
): V {
  // Delegate to the underlying implementation
  return this.implementation.mapReduce(mapFn, reduceFn, initial);
}

filterMap<U>(
  filterFn: (value: T, index: number) => boolean,
  mapFn: (value: T, index: number) => U
): List<U> {
  const result = this.implementation.filterMap(filterFn, mapFn);
  return new List<U>(result, result.size);
}
```

## Transient Mutations

The SmartList supports transient mutations for efficient batch operations:

```typescript
class TransientList<T> implements TransientList<T> {
  private implementation: TransientList<T>;
  private size: number;
  
  constructor(implementation: TransientList<T>, size: number) {
    this.implementation = implementation;
    this.size = size;
  }
  
  append(value: T): TransientList<T> {
    this.implementation = this.implementation.append(value);
    this.size++;
    return this;
  }
  
  prepend(value: T): TransientList<T> {
    this.implementation = this.implementation.prepend(value);
    this.size++;
    return this;
  }
  
  set(index: number, value: T): TransientList<T> {
    this.implementation = this.implementation.set(index, value);
    return this;
  }
  
  persistent(): List<T> {
    // Convert back to immutable list
    const persistentImpl = this.implementation.persistent();
    
    // Ensure optimal implementation based on final size
    let optimalImpl: IList<T>;
    
    if (this.size < List.SMALL_COLLECTION_THRESHOLD) {
      optimalImpl = new SmallList<T>(persistentImpl.toArray());
    } else if (this.size < List.MEDIUM_COLLECTION_THRESHOLD) {
      optimalImpl = new ChunkedList<T>(persistentImpl.toArray());
    } else {
      optimalImpl = new PersistentVector<T>(persistentImpl.toArray());
    }
    
    return new List<T>(optimalImpl, this.size);
  }
}

// Add to List class
transient(): TransientList<T> {
  return new TransientList<T>(this.implementation.transient(), this._size);
}
```

## Performance Tuning

The SmartList includes mechanisms for tuning performance based on benchmarks:

```typescript
// Adjustable thresholds for different implementations
private static adjustThresholds(smallThreshold: number, mediumThreshold: number): void {
  List.SMALL_COLLECTION_THRESHOLD = smallThreshold;
  List.MEDIUM_COLLECTION_THRESHOLD = mediumThreshold;
}

// Runtime performance monitoring
private static monitorPerformance(): void {
  // Collect performance metrics
  // Adjust thresholds based on metrics
}
```

## Implementation Considerations

1. **Transition Costs**:
   - Transitioning between implementations has a cost
   - The SmartList should minimize unnecessary transitions
   - Transitions should happen at appropriate size thresholds

2. **API Consistency**:
   - The SmartList provides a consistent API regardless of the underlying implementation
   - All operations behave the same way across implementations
   - The implementation details are hidden from users

3. **Performance Optimization**:
   - The SmartList should select the most efficient implementation for each operation
   - It should leverage specialized implementations for common patterns
   - It should adapt to the characteristics of the JavaScript engine

4. **Memory Efficiency**:
   - The SmartList should minimize memory overhead
   - It should leverage structural sharing where possible
   - It should avoid unnecessary copying of data

## Next Steps

1. Implement the core SmartList wrapper
2. Add delegation to underlying implementations
3. Implement size-based adaptation
4. Add specialized operation chains
5. Implement transient mutations
6. Add performance tuning mechanisms
7. Comprehensive testing and benchmarking
