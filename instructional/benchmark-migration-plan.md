# Benchmark Migration Plan

## Overview

This document outlines the plan for migrating existing benchmark implementations from the `@reduct/algorithms` and `@reduct/data-structures` packages to the new dedicated `@reduct/benchmark` package. This migration will consolidate all benchmarking functionality into a single, comprehensive package to support the Phase 2 performance optimization work.

## Migration Timeline

1. **Phase 1: Initial Setup** ✅
   - Create the `@reduct/benchmark` package structure
   - Implement core benchmarking utilities
   - Set up visualization and reporting tools

2. **Phase 2: Migrate Existing Benchmarks** (Current)
   - Move algorithm benchmarks from `@reduct/algorithms`
   - Move data structure benchmarks from `@reduct/data-structures`
   - Enhance benchmarks with new capabilities

3. **Phase 3: Implement New Benchmarks**
   - Add specialized benchmarks for Phase 2 optimizations
   - Create comparison benchmarks against popular libraries
   - Implement scalability testing for different input sizes

4. **Phase 4: Remove Deprecated Benchmarks**
   - Mark old benchmarks as deprecated
   - Remove old benchmark implementations
   - Update documentation and examples

## Detailed Migration Steps

### 1. Algorithm Benchmarks Migration

| Source | Destination | Status |
|--------|-------------|--------|
| `@reduct/algorithms/benchmark/index.ts` | `@reduct/benchmark/src/utils.ts` | ✅ |
| `@reduct/algorithms/benchmark/sorting-benchmark.ts` | `@reduct/benchmark/src/runners/sorting-benchmarks.ts` | ✅ |
| `@reduct/algorithms/complexity/index.ts` | `@reduct/benchmark/src/complexity/index.ts` | ✅ |
| `@reduct/algorithms/complexity/instrumented-sort.ts` | `@reduct/benchmark/src/complexity/instrumented-sort.ts` | ✅ |
| `@reduct/algorithms/complexity/operation-analysis.ts` | `@reduct/benchmark/src/complexity/operation-analysis.ts` | ✅ |

**Tasks:**
- [x] Create `complexity` directory in `@reduct/benchmark/src`
- [x] Migrate complexity analysis tools
- [x] Update imports in migrated files
- [ ] Add tests for migrated functionality

### 2. Data Structure Benchmarks Migration

| Source | Destination | Status |
|--------|-------------|--------|
| `@reduct/data-structures/benchmark/index.ts` | `@reduct/benchmark/src/runners/data-structure-benchmarks.ts` | ✅ |
| `@reduct/data-structures/benchmark/list-benchmarks.ts` | `@reduct/benchmark/src/runners/list-benchmarks.ts` | ✅ |
| `@reduct/data-structures/benchmark/map-benchmarks.ts` | `@reduct/benchmark/src/runners/map-benchmarks.ts` | ✅ |
| `@reduct/data-structures/benchmark/stack-benchmarks.ts` | `@reduct/benchmark/src/runners/stack-benchmarks.ts` | ✅ |

**Tasks:**
- [x] Migrate remaining data structure benchmarks
- [x] Consolidate common functionality
- [x] Update imports in migrated files
- [ ] Add tests for migrated functionality

### 3. New Benchmark Implementation

| Benchmark Type | Description | Status |
|----------------|-------------|--------|
| Structural Sharing | Measure performance of structural sharing implementations | ⏳ |
| Chunked Sequences | Benchmark chunked sequence model for List | ⏳ |
| HAMT | Benchmark Hash Array Mapped Trie implementation for Map | ⏳ |
| Collision Resolution | Test collision handling performance | ⏳ |
| Library Comparison | Compare with Immutable.js, Ramda, etc. | ⏳ |

**Tasks:**
- [ ] Implement benchmarks for new data structure optimizations
- [ ] Create comparison benchmarks against popular libraries
- [ ] Add memory usage measurements
- [ ] Implement visualization for benchmark results

### 4. Cleanup and Documentation

**Tasks:**
- [x] Remove old benchmark implementations
- [x] Update imports in example files
- [x] Create comprehensive documentation
- [x] Add usage examples for the new benchmark package

## Implementation Notes

### Benchmark Package Structure

```
@reduct/benchmark/
├── src/
│   ├── index.ts                  # Main entry point
│   ├── types.ts                  # Common benchmark types
│   ├── utils.ts                  # Core benchmark utilities
│   ├── complexity/               # Complexity analysis tools
│   │   ├── index.ts
│   │   ├── instrumented-sort.ts
│   │   └── operation-analysis.ts
│   ├── runners/                  # Benchmark runners
│   │   ├── index.ts
│   │   ├── list-benchmarks.ts
│   │   ├── map-benchmarks.ts
│   │   ├── sorting-benchmarks.ts
│   │   ├── searching-benchmarks.ts
│   │   └── stack-benchmarks.ts
│   └── visualization/            # Visualization tools
│       ├── index.ts
│       ├── formatters.ts
│       └── exporters.ts
├── examples/                     # Usage examples
│   ├── basic-benchmark.ts
│   └── run-benchmarks.ts
└── tests/                        # Tests for benchmark functionality
```

### Migration Strategy

1. **Copy and Enhance**: Copy existing benchmarks to the new package, enhancing them with new capabilities.
2. **Update Imports**: Update imports in the new files to use the new package structure.
3. **Test Thoroughly**: Ensure migrated benchmarks produce consistent results.
4. **Deprecate Old Implementations**: Mark old implementations as deprecated.
5. **Document Changes**: Update documentation to reflect the new benchmark package.

## Relation to Phase 2 Optimization Work

The benchmark migration should be completed before starting the Phase 2 optimization work to establish baseline performance metrics. This will allow us to:

1. Measure the current performance of List and Map implementations
2. Compare different optimization strategies
3. Track performance improvements over time
4. Document performance characteristics for users

Once the benchmark migration is complete, we can proceed with the Phase 2 optimization work:

- Week 3-4: Immutable List Implementation
- Week 5-6: Functional Map Implementation
- Week 7-8: Testing and Documentation

## Progress Tracking

- ✅ = Completed
- ⏳ = In Progress
- ❌ = Not Started

## Next Steps

1. Complete the migration of complexity analysis tools
2. Migrate remaining data structure benchmarks
3. Implement benchmarks for new optimizations
4. Update documentation and examples
