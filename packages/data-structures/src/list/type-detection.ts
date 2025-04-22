/**
 * Type detection utilities for optimized list implementations
 *
 * These utilities help detect the type of data in a list to enable
 * specialized optimizations for different data types.
 */

import { DataType } from '@reduct/shared-types/data-structures';

/**
 * Detect the data type of an array
 *
 * @param data - The array to analyze
 * @param sampleSize - The number of elements to sample (default: 100)
 * @returns The detected data type
 */
export function detectDataType<T>(data: T[], sampleSize: number = 100): DataType {
  if (data.length === 0) {
    return DataType.UNKNOWN;
  }

  // Take a sample of the data to avoid analyzing large arrays
  const sampleCount = Math.min(data.length, sampleSize);
  const step = Math.max(1, Math.floor(data.length / sampleCount));

  let numericCount = 0;
  let stringCount = 0;
  let objectCount = 0;

  for (let i = 0; i < data.length; i += step) {
    const value = data[i];

    if (typeof value === 'number') {
      numericCount++;
    } else if (typeof value === 'string') {
      stringCount++;
    } else if (typeof value === 'object' && value !== null) {
      objectCount++;
    }
  }

  const actualSampleSize = Math.ceil(data.length / step);

  // If all elements are of the same type, return that type
  if (numericCount === actualSampleSize) {
    return DataType.NUMERIC;
  } else if (stringCount === actualSampleSize) {
    return DataType.STRING;
  } else if (objectCount === actualSampleSize) {
    return DataType.OBJECT_REFERENCE;
  }

  // If there's a mix of types, return MIXED
  return DataType.MIXED;
}

/**
 * Check if an array contains only numeric values
 *
 * @param data - The array to check
 * @returns Whether the array contains only numeric values
 */
export function isNumericArray(data: any[]): boolean {
  return detectDataType(data) === DataType.NUMERIC;
}

/**
 * Check if an array contains only string values
 *
 * @param data - The array to check
 * @returns Whether the array contains only string values
 */
export function isStringArray(data: any[]): boolean {
  return detectDataType(data) === DataType.STRING;
}

/**
 * Check if an array contains only object references
 *
 * @param data - The array to check
 * @returns Whether the array contains only object references
 */
export function isObjectReferenceArray(data: any[]): boolean {
  return detectDataType(data) === DataType.OBJECT_REFERENCE;
}

/**
 * Check if an array contains only object values (not null)
 *
 * @param data - The array to check
 * @returns Whether the array contains only object values
 */
export function isObjectArray(data: any[]): boolean {
  if (data.length === 0) return false;

  for (let i = 0; i < Math.min(data.length, 100); i++) {
    if (typeof data[i] !== 'object' || data[i] === null) {
      return false;
    }
  }

  return true;
}
