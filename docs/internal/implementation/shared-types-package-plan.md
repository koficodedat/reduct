# Shared Types Package Implementation Plan

## Overview

This document outlines the plan for creating a new `@reduct/shared-types` package to centralize type definitions that are used across multiple packages in the Reduct library. This will eliminate duplication, ensure consistency, and prevent circular dependencies between packages.

## 1. Identified Shared Types

Based on analysis of the codebase, the following types are used across multiple packages and should be moved to the shared types package:

### 1.1 WebAssembly-Related Types

| Type | Current Locations | Description |
|------|------------------|-------------|
| `AcceleratorTier` | `packages/wasm/src/accelerators/accelerator.ts`, `packages/benchmark/src/browser/browser-benchmark-ui.ts`, `packages/benchmark/src/browser/browser-benchmark-runner.ts`, `packages/data-structures/tests/mocks/accelerator.ts`, `packages/benchmark/src/suites/tiered-optimization/base-benchmark.ts` | Enum for WebAssembly acceleration tiers |
| `WebAssemblyFeature` | `packages/wasm/src/core/feature-detection.ts`, `packages/data-structures/src/types/wasm.d.ts` | Enum for WebAssembly features |
| `PerformanceProfile` | `packages/wasm/src/accelerators/accelerator.ts`, `packages/data-structures/src/types/wasm.d.ts` | Interface for accelerator performance metrics |
| `AcceleratorOptions` | `packages/wasm/src/accelerators/accelerator.ts`, `packages/data-structures/src/types/wasm.d.ts` | Interface for accelerator configuration |
| `Accelerator` | `packages/wasm/src/accelerators/accelerator.ts`, `packages/data-structures/src/types/wasm.d.ts` | Interface for WebAssembly accelerators |

### 1.2 Registry-Related Types

| Type | Current Locations | Description |
|------|------------------|-------------|
| `Implementation` | `packages/benchmark/src/registry/types.ts` | Interface for data structure/algorithm implementations |
| `Registry` | `packages/benchmark/src/registry/types.ts` | Type for registry of implementations |
| `OperationFunction` | `packages/benchmark/src/registry/types.ts` | Type for operation functions |
| `OperationsMap` | `packages/benchmark/src/registry/types.ts` | Type for map of operations |
| `OperationMetadata` | `packages/benchmark/src/registry/types.ts` | Interface for operation metadata |
| `OperationsRegistry` | `packages/benchmark/src/registry/types.ts` | Type for registry of operations |

### 1.3 Core Utility Types

| Type | Current Locations | Description |
|------|------------------|-------------|
| `Partial`, `Required`, `Readonly`, etc. | `packages/core/src/types.ts` | Utility types for type transformations |
| `DeepReadonly`, `DeepPartial` | `packages/core/src/types.ts` | Recursive utility types |
| `ElementOf`, `ValueOf` | `packages/core/src/types.ts` | Array element type utilities |
| `Tagged`, `RequireKeys` | `packages/core/src/types.ts` | Type utilities for object manipulation |
| `TypeMapper`, `MapObjectProps` | `packages/core/src/types.ts` | Type-level programming utilities |

### 1.4 Data Structure Types

| Type | Current Locations | Description |
|------|------------------|-------------|
| `DataStructureType` | `packages/data-structures/src/profiling/memory-monitor.ts` | Enum for data structure types |
| `MemoryStats` | `packages/data-structures/src/profiling/memory-monitor.ts` | Interface for memory usage statistics |

## 2. Package Structure

The new package will have the following structure:

```
packages/shared-types/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # Main entry point
│   ├── wasm/                    # WebAssembly-related types
│   │   ├── index.ts
│   │   ├── accelerator.ts
│   │   └── features.ts
│   ├── registry/                # Registry-related types
│   │   ├── index.ts
│   │   ├── implementation.ts
│   │   └── operations.ts
│   ├── core/                    # Core utility types
│   │   ├── index.ts
│   │   ├── utility-types.ts
│   │   └── type-guards.ts
│   └── data-structures/         # Data structure types
│       ├── index.ts
│       └── profiling.ts
└── tests/
    └── unit/
        ├── wasm.test.ts
        ├── registry.test.ts
        ├── core.test.ts
        └── data-structures.test.ts
```

## 3. Migration Strategy

The migration will be performed in the following phases:

### Phase 1: Create the Shared Types Package

1. Create the package structure
2. Set up package.json with appropriate dependencies
3. Configure TypeScript for the package
4. Create empty files for all modules

### Phase 2: Migrate Types

For each group of shared types:

1. Copy the type definitions to the appropriate file in the shared types package
2. Add appropriate JSDoc comments
3. Create index.ts files to re-export types
4. Write basic tests to ensure types are correctly defined

### Phase 3: Update Dependent Packages

For each package that uses the shared types:

1. Add a dependency on `@reduct/shared-types`
2. Replace local type definitions with imports from shared types
3. Update any code that uses the types
4. Fix any type errors that arise from the migration

### Phase 4: Testing and Validation

1. Run tests for all packages to ensure everything still works
2. Fix any issues that arise
3. Verify that circular dependencies have been eliminated

## 4. Detailed Type Migration Plan

### 4.1 WebAssembly Types

```typescript
// packages/shared-types/src/wasm/accelerator.ts

/**
 * Accelerator tiers for optimization strategy
 */
export enum AcceleratorTier {
  /**
   * Always use WebAssembly (significant performance benefit)
   */
  HIGH_VALUE = 'high-value',

  /**
   * Use WebAssembly conditionally (based on input characteristics)
   */
  CONDITIONAL = 'conditional',

  /**
   * Prefer JavaScript (WebAssembly overhead outweighs benefits)
   */
  JS_PREFERRED = 'js-preferred'
}

/**
 * Performance profile for an accelerator
 */
export interface PerformanceProfile {
  /**
   * Estimated speedup factor compared to JavaScript
   */
  estimatedSpeedup: number;

  /**
   * Effective input size where WebAssembly becomes faster than JavaScript
   */
  effectiveInputSize?: number;
}

/**
 * Options for an accelerator
 */
export interface AcceleratorOptions {
  /**
   * Required WebAssembly features
   */
  requiredFeatures?: WebAssemblyFeature[];

  /**
   * Element type for specialized accelerators
   */
  elementType?: string;

  /**
   * Whether to use SIMD when available
   */
  useSIMD?: boolean;

  /**
   * Custom options for the accelerator
   */
  [key: string]: any;
}

/**
 * Base accelerator interface
 */
export interface Accelerator<T, R> {
  /**
   * Execute the accelerated operation
   */
  execute(input: T): R;

  /**
   * Get the performance profile of the accelerator
   */
  getPerformanceProfile(): PerformanceProfile;
}
```

```typescript
// packages/shared-types/src/wasm/features.ts

/**
 * WebAssembly features
 */
export enum WebAssemblyFeature {
  /**
   * Basic WebAssembly support
   */
  BASIC = 'basic',

  /**
   * SIMD (Single Instruction, Multiple Data) support
   */
  SIMD = 'simd',

  /**
   * Threading support
   */
  THREADS = 'threads',

  /**
   * Reference types support
   */
  REFERENCE_TYPES = 'reference-types',

  /**
   * Bulk memory operations support
   */
  BULK_MEMORY = 'bulk-memory',

  /**
   * Exception handling support
   */
  EXCEPTION_HANDLING = 'exception-handling'
}
```

### 4.2 Registry Types

```typescript
// packages/shared-types/src/registry/implementation.ts

/**
 * Function that creates an instance of a data structure or algorithm
 *
 * @param size - Size of the data structure or input size for algorithm
 * @returns Instance of the data structure or algorithm
 */
export type InstanceCreator<T> = (size: number) => T;

/**
 * Function that performs an operation on a data structure or algorithm
 *
 * @param instance - Instance of the data structure or algorithm
 * @param args - Arguments for the operation
 * @returns Result of the operation
 */
export type OperationFunction<T, R = any> = (instance: T, ...args: any[]) => R;

/**
 * Map of operations for a data structure or algorithm
 */
export type OperationsMap<T> = Record<string, OperationFunction<T>>;

/**
 * Implementation of a data structure or algorithm
 */
export interface Implementation<T> {
  /** Name of the implementation */
  name: string;
  /** Description of the implementation */
  description?: string;
  /** Category of the implementation (data-structure or algorithm) */
  category: 'data-structure' | 'algorithm';
  /** Type of the implementation (list, map, stack, sorting, searching, etc.) */
  type: string;
  /** Function to create an instance */
  create: InstanceCreator<T>;
  /** Map of operations */
  operations: OperationsMap<T>;
  /** Capabilities of the implementation */
  capabilities?: string[];
}

/**
 * Registry of implementations
 */
export type Registry = Record<string, Implementation<any>>;
```

```typescript
// packages/shared-types/src/registry/operations.ts

/**
 * Operation metadata
 */
export interface OperationMetadata {
  /** Name of the operation */
  name: string;
  /** Description of the operation */
  description?: string;
  /** Category of the operation */
  category: string;
  /** Whether the operation is read-only */
  readOnly?: boolean;
  /** Default arguments for the operation */
  defaultArgs?: any[];
  /** Required capabilities for this operation */
  requiredCapabilities?: string[];
}

/**
 * Registry of operations
 */
export type OperationsRegistry = Record<string, OperationMetadata>;
```

### 4.3 Core Utility Types

```typescript
// packages/shared-types/src/core/utility-types.ts

/**
 * Makes all properties in an object optional and nullable
 */
export type Partial<T> = {
  [P in keyof T]?: T[P] | null;
};

/**
 * Makes all properties in an object required and non-nullable
 */
export type Required<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Makes all properties in an object readonly
 */
export type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

/**
 * Picks a subset of properties from an object type
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Omits a subset of properties from an object type
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Extracts the type of an array element
 */
export type ElementOf<T extends readonly unknown[]> = T extends readonly (infer E)[] ? E : never;

/**
 * Extracts the type of a promise resolution
 */
export type Awaited<T> = T extends Promise<infer R> ? R : T;

/**
 * Makes all nested properties in an object readonly
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

/**
 * Creates a record type with specified keys and value type
 */
export type Record<K extends keyof any, T> = {
  [P in K]: T;
};

/**
 * Extracts keys from an object type that have values assignable to a specific type
 */
export type KeysOfType<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

/**
 * Represents a function that maps one type to another
 */
export interface TypeMapper<From, To> {
  type: To;
  from: From;
}

/**
 * Represents a mapping from one type to another for objects
 */
export type MapObjectProps<T, M extends { [K in keyof T]?: TypeMapper<any, any> }> = {
  [K in keyof T]: K extends keyof M ? (M[K] extends TypeMapper<T[K], infer R> ? R : T[K]) : T[K];
};

/**
 * Adds a 'tag' property to a type for discriminated unions
 */
export type Tagged<T, Tag extends string, TagValue extends string> = T & {
  [K in Tag]: TagValue;
};

/**
 * Ensures an object type has all keys from another type
 */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Creates a union type from array values
 */
export type ValueOf<T extends readonly unknown[]> = T[number];

/**
 * Type that recursively makes all properties partial
 */
export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

/**
 * Represents a stringified version of a type
 */
export type Stringified<T> = {
  [K in keyof T]: T[K] extends string | number | boolean | null
    ? string
    : T[K] extends Array<infer U>
    ? Array<Stringified<U>>
    : T[K] extends object
    ? Stringified<T[K]>
    : string;
};
```

```typescript
// packages/shared-types/src/core/type-guards.ts

/**
 * Type predicate for string values
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type predicate for number values
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type predicate for boolean values
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type predicate for null values
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Type predicate for undefined values
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Type predicate for array values
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type predicate for object values (excluding null and arrays)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for values within a specific enum
 *
 * @param enumObj - The enum object
 * @returns A type guard for values contained in the enum
 */
export function isEnum<T extends Record<string, string | number>>(
  enumObj: T,
): (value: unknown) => value is T[keyof T] {
  const enumValues = new Set();
  
  // Get all values that are either strings or numbers
  const allValues = Object.values(enumObj).filter(
    value => typeof value === 'string' || typeof value === 'number'
  );
  
  // Add all values to the set
  for (const value of allValues) {
    enumValues.add(value);
  }
  
  // Return the type guard function
  return (value: unknown): value is T[keyof T] => {
    return enumValues.has(value);
  };
}
```

### 4.4 Data Structure Types

```typescript
// packages/shared-types/src/data-structures/profiling.ts

/**
 * Types of data structures for profiling
 */
export enum DataStructureType {
  LIST = 'list',
  MAP = 'map',
  SET = 'set',
  STACK = 'stack',
  QUEUE = 'queue',
  TREE = 'tree',
  GRAPH = 'graph',
  MATRIX = 'matrix',
  VECTOR = 'vector'
}

/**
 * Memory usage statistics for a data structure
 */
export interface MemoryStats {
  /**
   * Number of instances of the data structure
   */
  instanceCount: number;
  
  /**
   * Total number of elements across all instances
   */
  elementCount: number;
  
  /**
   * Estimated memory usage in bytes
   */
  memoryUsage: number;
  
  /**
   * Average memory usage per element in bytes
   */
  memoryPerElement: number;
}
```

## 5. Package Dependencies

The shared types package will have minimal dependencies:

```json
{
  "name": "@reduct/shared-types",
  "version": "0.1.0",
  "description": "Shared type definitions for Reduct packages",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsup": "^7.0.0",
    "vitest": "^0.34.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  },
  "peerDependencies": {},
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./wasm": {
      "types": "./dist/wasm/index.d.ts",
      "import": "./dist/wasm/index.mjs",
      "require": "./dist/wasm/index.js"
    },
    "./registry": {
      "types": "./dist/registry/index.d.ts",
      "import": "./dist/registry/index.mjs",
      "require": "./dist/registry/index.js"
    },
    "./core": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core/index.mjs",
      "require": "./dist/core/index.js"
    },
    "./data-structures": {
      "types": "./dist/data-structures/index.d.ts",
      "import": "./dist/data-structures/index.mjs",
      "require": "./dist/data-structures/index.js"
    }
  },
  "typesVersions": {
    "*": {
      "wasm": [
        "./dist/wasm/index.d.ts"
      ],
      "registry": [
        "./dist/registry/index.d.ts"
      ],
      "core": [
        "./dist/core/index.d.ts"
      ],
      "data-structures": [
        "./dist/data-structures/index.d.ts"
      ]
    }
  }
}
```

## 6. Package Updates

Each package that uses shared types will need to be updated:

### 6.1 @reduct/wasm

```json
{
  "dependencies": {
    "@reduct/shared-types": "^0.1.0",
    // other dependencies...
  }
}
```

```typescript
// Before
export enum AcceleratorTier {
  HIGH_VALUE = 'high-value',
  CONDITIONAL = 'conditional',
  JS_PREFERRED = 'js-preferred'
}

// After
import { AcceleratorTier } from '@reduct/shared-types/wasm';
```

### 6.2 @reduct/benchmark

```json
{
  "dependencies": {
    "@reduct/shared-types": "^0.1.0",
    // other dependencies...
  }
}
```

```typescript
// Before
export type Registry = Record<string, Implementation<any>>;

// After
import { Registry } from '@reduct/shared-types/registry';
```

### 6.3 @reduct/data-structures

```json
{
  "dependencies": {
    "@reduct/shared-types": "^0.1.0",
    // other dependencies...
  }
}
```

```typescript
// Before
enum DataStructureType {
  LIST = 'list',
  // ...
}

// After
import { DataStructureType } from '@reduct/shared-types/data-structures';
```

### 6.4 @reduct/core

```json
{
  "dependencies": {
    "@reduct/shared-types": "^0.1.0",
    // other dependencies...
  }
}
```

```typescript
// Before
export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

// After
import { DeepPartial } from '@reduct/shared-types/core';
```

## 7. Testing Strategy

1. **Unit Tests**: Write basic tests for each type to ensure they are correctly defined
2. **Integration Tests**: Test the shared types in the context of each package
3. **Type Tests**: Use TypeScript's type system to test type compatibility

Example test:

```typescript
// packages/shared-types/tests/unit/wasm.test.ts
import { describe, it, expect } from 'vitest';
import { AcceleratorTier, WebAssemblyFeature } from '../../src/wasm';

describe('WebAssembly Types', () => {
  it('should define AcceleratorTier enum', () => {
    expect(AcceleratorTier.HIGH_VALUE).toBe('high-value');
    expect(AcceleratorTier.CONDITIONAL).toBe('conditional');
    expect(AcceleratorTier.JS_PREFERRED).toBe('js-preferred');
  });

  it('should define WebAssemblyFeature enum', () => {
    expect(WebAssemblyFeature.BASIC).toBe('basic');
    expect(WebAssemblyFeature.SIMD).toBe('simd');
    // Test other values...
  });
});
```

## 8. Implementation Steps

1. Create the shared types package with the structure outlined above
2. Implement the shared types in the new package
3. Update each dependent package to use the shared types
4. Run tests to ensure everything works correctly
5. Update documentation to reflect the new package structure

## 9. Conclusion

Creating a shared types package will improve the Reduct library by:

1. Eliminating duplication of type definitions
2. Ensuring consistency across packages
3. Preventing circular dependencies
4. Making it easier to maintain and update types
5. Providing a single source of truth for shared types

This plan provides a comprehensive approach to extracting shared types into a dedicated package, with a clear migration strategy and testing approach.
