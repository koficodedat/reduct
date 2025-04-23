/**
 * Specialized List implementations for different data types
 * 
 * This module provides specialized List implementations optimized for
 * specific data types like numbers, strings, and object references.
 */

import * as numericOps from './numeric-operations';
import * as objectOps from './object-operations';
import * as stringOps from './string-operations';
import { DataType, detectDataType } from './type-detection';
import { IList } from './types';

import List from './index';

/**
 * Create a specialized list for numeric data
 * 
 * @param data - The numeric data
 * @returns A list with specialized numeric operations
 */
export function createNumericList(data: number[]): IList<number> & {
  sum: () => number;
  average: () => number;
  min: () => number;
  max: () => number;
} {
  const list = List.from(data);
  
  // Add specialized numeric operations
  return Object.assign(list, {
    map: <R>(fn: (value: number, index: number) => R): IList<R> => {
      return numericOps.numericMap(list, fn);
    },
    filter: (fn: (value: number, index: number) => boolean): IList<number> => {
      return numericOps.numericFilter(list, fn);
    },
    reduce: <U>(fn: (acc: U, value: number, index: number) => U, initial: U): U => {
      return numericOps.numericReduce(list, fn, initial);
    },
    sum: (): number => {
      return numericOps.sum(list);
    },
    average: (): number => {
      return numericOps.average(list);
    },
    min: (): number => {
      return numericOps.min(list);
    },
    max: (): number => {
      return numericOps.max(list);
    }
  });
}

/**
 * Create a specialized list for string data
 * 
 * @param data - The string data
 * @returns A list with specialized string operations
 */
export function createStringList(data: string[]): IList<string> & {
  join: (separator?: string) => string;
  findContaining: (substring: string) => IList<string>;
  findStartingWith: (prefix: string) => IList<string>;
  findEndingWith: (suffix: string) => IList<string>;
} {
  const list = List.from(data);
  
  // Add specialized string operations
  return Object.assign(list, {
    map: <R>(fn: (value: string, index: number) => R): IList<R> => {
      return stringOps.stringMap(list, fn);
    },
    filter: (fn: (value: string, index: number) => boolean): IList<string> => {
      return stringOps.stringFilter(list, fn);
    },
    concat: (other: IList<string>): IList<string> => {
      return stringOps.stringConcat(list, other);
    },
    join: (separator: string = ','): string => {
      return stringOps.join(list, separator);
    },
    findContaining: (substring: string): IList<string> => {
      return stringOps.findContaining(list, substring);
    },
    findStartingWith: (prefix: string): IList<string> => {
      return stringOps.findStartingWith(list, prefix);
    },
    findEndingWith: (suffix: string): IList<string> => {
      return stringOps.findEndingWith(list, suffix);
    }
  });
}

/**
 * Create a specialized list for object reference data
 * 
 * @param data - The object reference data
 * @returns A list with specialized object operations
 */
export function createObjectList<T extends object>(data: T[]): IList<T> & {
  findByProperty: <K extends keyof T>(property: K, value: any) => IList<T>;
  groupByProperty: <K extends keyof T>(property: K) => Map<T[K], IList<T>>;
  pluck: <K extends keyof T>(property: K) => IList<T[K]>;
  unique: (property?: keyof T) => IList<T>;
} {
  const list = List.from(data);
  
  // Add specialized object operations
  return Object.assign(list, {
    map: <R>(fn: (value: T, index: number) => R): IList<R> => {
      return objectOps.objectMap(list, fn);
    },
    filter: (fn: (value: T, index: number) => boolean): IList<T> => {
      return objectOps.objectFilter(list, fn);
    },
    findByProperty: <K extends keyof T>(property: K, value: any): IList<T> => {
      return objectOps.findByProperty(list, property, value);
    },
    groupByProperty: <K extends keyof T>(property: K): Map<T[K], IList<T>> => {
      return objectOps.groupByProperty(list, property);
    },
    pluck: <K extends keyof T>(property: K): IList<T[K]> => {
      return objectOps.pluck(list, property);
    },
    unique: (property?: keyof T): IList<T> => {
      return objectOps.unique(list, property);
    }
  });
}

/**
 * Create a specialized list based on the data type
 * 
 * @param data - The data array
 * @returns A specialized list for the detected data type
 */
export function createSpecializedList<T>(data: T[]): IList<T> {
  const dataType = detectDataType(data);
  
  switch (dataType) {
    case DataType.NUMERIC:
      return createNumericList(data as unknown as number[]) as unknown as IList<T>;
    case DataType.STRING:
      return createStringList(data as unknown as string[]) as unknown as IList<T>;
    case DataType.OBJECT_REFERENCE:
      return createObjectList(data as unknown as object[]) as unknown as IList<T>;
    default:
      return List.from(data);
  }
}
