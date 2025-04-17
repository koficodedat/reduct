/**
 * Map registry
 *
 * Registers Map implementations for benchmarking.
 *
 * @packageDocumentation
 */

import { ImmutableMap } from '@reduct/data-structures';
import { Registry, Implementation } from '../types';
import { generateRandomEntries } from '../../utils';

/**
 * Reduct Map implementation
 */
const reductMap: Implementation<ImmutableMap<string, number>> = {
  name: 'Reduct Map',
  description: 'Immutable Map implementation from @reduct/data-structures',
  category: 'data-structure',
  type: 'map',
  create: (size) => ImmutableMap.from(generateRandomEntries(size)),
  operations: {
    get: (map, key) => map.get(key),
    has: (map, key) => map.has(key),
    set: (map, key, value) => map.set(key, value),
    delete: (map, key) => map.delete(key),
    entries: (map) => map.entries(),
    keys: (map) => map.keys(),
    values: (map) => map.values(),
    size: (map) => map.size,
    isEmpty: (map) => map.isEmpty,
  },
};

/**
 * Native Map implementation
 */
const nativeMap: Implementation<Map<string, number>> = {
  name: 'Native Map',
  description: 'JavaScript native Map',
  category: 'data-structure',
  type: 'map',
  create: (size) => new Map(generateRandomEntries(size)),
  operations: {
    get: (map, key) => map.get(key),
    has: (map, key) => map.has(key),
    set: (map, key, value) => {
      const newMap = new Map(map);
      newMap.set(key, value);
      return newMap;
    },
    delete: (map, key) => {
      const newMap = new Map(map);
      newMap.delete(key);
      return newMap;
    },
    entries: (map) => Array.from(map.entries()),
    keys: (map) => Array.from(map.keys()),
    values: (map) => Array.from(map.values()),
    size: (map) => map.size,
    isEmpty: (map) => map.size === 0,
  },
};

/**
 * Plain Object implementation
 */
const plainObject: Implementation<Record<string, number>> = {
  name: 'Plain Object',
  description: 'JavaScript plain object used as a map',
  category: 'data-structure',
  type: 'map',
  create: (size) => {
    const entries = generateRandomEntries(size);
    const obj: Record<string, number> = {};
    for (const [key, value] of entries) {
      obj[key] = value;
    }
    return obj;
  },
  operations: {
    get: (obj, key) => obj[key],
    has: (obj, key) => key in obj,
    set: (obj, key, value) => ({ ...obj, [key]: value }),
    delete: (obj, key) => {
      const newObj = { ...obj };
      delete newObj[key];
      return newObj;
    },
    entries: (obj) => Object.entries(obj),
    keys: (obj) => Object.keys(obj),
    values: (obj) => Object.values(obj),
    size: (obj) => Object.keys(obj).length,
    isEmpty: (obj) => Object.keys(obj).length === 0,
  },
};

/**
 * Map registry
 */
export const mapRegistry: Registry = {
  'reduct-map': reductMap,
  'native-map': nativeMap,
  'plain-object': plainObject,
};
