/**
 * Advanced type system utilities
 *
 * This module provides type guards, type-level programming helpers,
 * and utility types for safer and more expressive TypeScript.
 *
 * @packageDocumentation
 */

// ============================================================================
// Type Predicates
// ============================================================================

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
 * Type predicate for array values
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type predicate for objects (excluding null)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
 * Type predicate for function values
 */
export function isFunction(value: unknown): value is Function {
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

/**
 * Type guard for values within a specific enum
 *
 * @param enumObj - The enum object
 * @returns A type guard for values contained in the enum
 *
 * @example
 * ```typescript
 * enum Color { Red, Green, Blue }
 * const isColor = isEnum(Color);
 * ```
 */
export function isEnum<T extends Record<string, string | number>>(
  enumObj: T,
): (value: unknown) => value is T[keyof T] {
  const enumValues = new Set(
    Object.values(enumObj).filter(value => typeof value === 'string' || typeof value === 'number'),
  );

  return (value: unknown): value is T[keyof T] => {
    return enumValues.has(value as string | number);
  };
}

// ============================================================================
// Type Utilities
// ============================================================================

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

// ============================================================================
// Type-Level Programming
// ============================================================================

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
