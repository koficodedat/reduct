/**
 * Advanced type system utilities
 *
 * This module provides type guards, type-level programming helpers,
 * and utility types for safer and more expressive TypeScript.
 *
 * @packageDocumentation
 */

import {
  isString,
  isNumber,
  isBoolean,
  isNull,
  isUndefined,
  isArray,
  isObject,
  isEnum
} from '@reduct/shared-types/core';

// Re-export the shared types
export {
  isString,
  isNumber,
  isBoolean,
  isNull,
  isUndefined,
  isArray,
  isObject,
  isEnum
};

/**
 * Type predicate for function values
 */
export function isFunction(value: unknown): value is (args: any[]) => any {
  return typeof value === 'function';
}

/**
 * Type predicate for Date objects
 */
export function isDate(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === '[object Date]';
}

// ============================================================================
// Advanced Type Guards
// ============================================================================

/**
 * Creates a type guard for arrays where all elements match a predicate
 *
 * @param predicate - Type guard for array elements
 * @returns A type guard for arrays of elements matching the predicate
 *
 * @example
 * ```typescript
 * const isStringArray = isArrayOf(isString);
 * if (isStringArray(value)) {
 *   // value is string[]
 * }
 * ```
 */
export function isArrayOf<T>(
  predicate: (value: unknown) => value is T,
): (value: unknown) => value is T[] {
  return (value: unknown): value is T[] => {
    return isArray(value) && value.every(predicate);
  };
}

/**
 * Creates a type guard for objects with specific properties and types
 *
 * @param schema - Object mapping property names to type guards
 * @returns A type guard for objects matching the schema
 *
 * @example
 * ```typescript
 * const isPerson = isObjectWithProps({
 *   name: isString,
 *   age: isNumber
 * });
 *
 * if (isPerson(value)) {
 *   // value has properties 'name' (string) and 'age' (number)
 * }
 * ```
 */
export function isObjectWithProps<T extends Record<string, unknown>>(schema: {
  [K in keyof T]: (value: unknown) => value is T[K];
}): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    if (!isObject(value)) {
      return false;
    }

    // Check that all required properties exist and have the correct type
    for (const key in schema) {
      if (!(key in value) || !schema[key](value[key])) {
        return false;
      }
    }

    return true;
  };
}

/**
 * Creates a union type guard from multiple type guards
 *
 * @param predicates - Type guards to combine
 * @returns A type guard for values matching any of the predicates
 *
 * @example
 * ```typescript
 * const isStringOrNumber = isOneOf(isString, isNumber);
 * ```
 */
export function isOneOf<T extends unknown[]>(
  ...predicates: { [K in keyof T]: (value: unknown) => value is T[K] }
): (value: unknown) => value is T[number] {
  return (value: unknown): value is T[number] => {
    return predicates.some(predicate => predicate(value));
  };
}

/**
 * Type guard for tuples of specific element types
 *
 * @param predicates - Type guards for each tuple element
 * @returns A type guard for tuples matching the pattern
 *
 * @example
 * ```typescript
 * const isStringNumberPair = isTuple(isString, isNumber);
 * if (isStringNumberPair(value)) {
 *   // value is [string, number]
 * }
 * ```
 */
export function isTuple<T extends unknown[]>(
  ...predicates: { [K in keyof T]: (value: unknown) => value is T[K] }
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    if (!isArray(value) || value.length !== predicates.length) {
      return false;
    }

    return predicates.every((predicate, index) => predicate(value[index]));
  };
}

/**
 * Type guard for literal values
 *
 * @param expectedValue - The exact value to check against
 * @returns A type guard for the literal value
 *
 * @example
 * ```typescript
 * const isStatusOk = isLiteral('OK');
 * ```
 */
export function isLiteral<T extends string | number | boolean | null | undefined>(
  expectedValue: T,
): (value: unknown) => value is T {
  return (value: unknown): value is T => value === expectedValue;
}

// Using isEnum from shared-types

// ============================================================================
// Type Utilities
// ============================================================================

import {
  Partial,
  Required,
  Readonly,
  Pick,
  Omit,
  ElementOf,
  Awaited,
  DeepReadonly,
  Record,
  KeysOfType,
  TypeMapper,
  MapObjectProps,
  Tagged,
  RequireKeys,
  ValueOf,
  DeepPartial,
  Stringified
} from '@reduct/shared-types/core';

// Re-export the shared types
export {
  Partial,
  Required,
  Readonly,
  Pick,
  Omit,
  ElementOf,
  Awaited,
  DeepReadonly,
  Record,
  KeysOfType,
  TypeMapper,
  MapObjectProps,
  Tagged,
  RequireKeys,
  ValueOf,
  DeepPartial,
  Stringified
};
