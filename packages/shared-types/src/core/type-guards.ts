/**
 * Type guards for runtime type checking
 *
 * This module provides type predicates for runtime type checking.
 *
 * @packageDocumentation
 */

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
  const enumValues = new Set<string | number>();
  const enumKeys = new Set<string>();

  // For numeric enums, TypeScript creates a bidirectional mapping
  // We need to filter out the string keys that are also values
  const keys = Object.keys(enumObj);
  const values = Object.values(enumObj);

  // Add all keys to the set
  for (const key of keys) {
    enumKeys.add(key);
  }

  // Add all values to the set, but only if they're not also keys
  for (const value of values) {
    if (typeof value === 'string' || typeof value === 'number') {
      // For numeric enums, don't add string keys as values
      if (typeof value === 'string' && enumKeys.has(value)) {
        continue;
      }
      enumValues.add(value);
    }
  }

  // Return the type guard function
  return (value: unknown): value is T[keyof T] => {
    // Only accept string or number values
    if (typeof value !== 'string' && typeof value !== 'number') {
      return false;
    }

    // For string values, make sure they're not enum keys
    if (typeof value === 'string' && enumKeys.has(value)) {
      return false;
    }

    // Check if the value is in the set of enum values
    return enumValues.has(value);
  };
}
