/**
 * Immutable Map implementation
 *
 * This module provides a persistent, immutable map implementation
 * for key-value storage.
 *
 * @packageDocumentation
 */

import { Option, some, none } from '@reduct/core';
import { List } from './list';

/**
 * Immutable Map class
 *
 * @typeparam K - The type of keys in the map
 * @typeparam V - The type of values in the map
 */
export class ImmutableMap<K, V> {
  /**
   * @internal
   * Internal map for storage
   */
  private readonly data: ReadonlyMap<K, V>;

  /**
   * Creates a new ImmutableMap
   *
   * @param entries - Optional entries to initialize the map with
   */
  private constructor(data: ReadonlyMap<K, V>) {
    this.data = data;
  }

  /**
   * Creates an empty ImmutableMap
   *
   * @returns An empty ImmutableMap
   */
  static empty<K, V>(): ImmutableMap<K, V> {
    return new ImmutableMap<K, V>(new Map<K, V>());
  }

  /**
   * Creates an ImmutableMap from entries
   *
   * @param entries - Array of key-value pairs
   * @returns A new ImmutableMap containing the entries
   */
  static from<K, V>(entries: ReadonlyArray<readonly [K, V]>): ImmutableMap<K, V> {
    return new ImmutableMap<K, V>(new Map<K, V>(entries));
  }

  /**
   * Creates an ImmutableMap from a plain object
   *
   * @param obj - Plain object with string keys
   * @returns A new ImmutableMap containing the object's properties
   */
  static fromObject<V>(obj: Record<string, V>): ImmutableMap<string, V> {
    const entries = Object.entries(obj);
    return ImmutableMap.from(entries);
  }

  /**
   * Returns the number of key-value pairs in the map
   */
  get size(): number {
    return this.data.size;
  }

  /**
   * Returns true if the map has no entries
   */
  get isEmpty(): boolean {
    return this.data.size === 0;
  }

  /**
   * Returns the value associated with the key, or None if the key is not found
   *
   * @param key - The key to look up
   * @returns An Option containing the value, or None if not found
   */
  get(key: K): Option<V> {
    return this.data.has(key) ? some(this.data.get(key)!) : none;
  }

  /**
   * Returns true if the map contains the key
   *
   * @param key - The key to check
   * @returns True if the key exists
   */
  has(key: K): boolean {
    return this.data.has(key);
  }

  /**
   * Creates a new ImmutableMap with the key-value pair added or updated
   *
   * @param key - The key to set
   * @param value - The value to associate with the key
   * @returns A new ImmutableMap with the key-value pair
   */
  set(key: K, value: V): ImmutableMap<K, V> {
    const newMap = new Map(this.data);
    newMap.set(key, value);
    return new ImmutableMap<K, V>(newMap);
  }

  /**
   * Creates a new ImmutableMap with the key removed
   *
   * @param key - The key to remove
   * @returns A new ImmutableMap without the key
   */
  delete(key: K): ImmutableMap<K, V> {
    if (!this.data.has(key)) {
      return this;
    }

    const newMap = new Map(this.data);
    newMap.delete(key);
    return new ImmutableMap<K, V>(newMap);
  }

  /**
   * Returns a List of all keys in the map
   */
  keys(): List<K> {
    return List.from(Array.from(this.data.keys()));
  }

  /**
   * Returns a List of all values in the map
   */
  values(): List<V> {
    return List.from(Array.from(this.data.values()));
  }

  /**
   * Returns a List of all key-value pairs in the map
   */
  entries(): List<[K, V]> {
    return List.from(Array.from(this.data.entries()));
  }

  /**
   * Creates a new ImmutableMap by applying a function to each value
   *
   * @param fn - Function to transform values
   * @returns A new ImmutableMap with transformed values
   */
  map<U>(fn: (value: V, key: K) => U): ImmutableMap<K, U> {
    const entries: Array<[K, U]> = [];

    for (const [key, value] of this.data.entries()) {
      entries.push([key, fn(value, key)]);
    }

    return ImmutableMap.from(entries);
  }

  /**
   * Creates a new ImmutableMap containing only entries that match the predicate
   *
   * @param predicate - Function to test entries
   * @returns A filtered ImmutableMap
   */
  filter(predicate: (value: V, key: K) => boolean): ImmutableMap<K, V> {
    const entries: Array<[K, V]> = [];

    for (const [key, value] of this.data.entries()) {
      if (predicate(value, key)) {
        entries.push([key, value]);
      }
    }

    return ImmutableMap.from(entries);
  }

  /**
   * Creates a new ImmutableMap by merging with another map
   *
   * @param other - Map to merge with (values from other take precedence)
   * @returns A new merged ImmutableMap
   */
  merge(other: ImmutableMap<K, V>): ImmutableMap<K, V> {
    const newMap = new Map(this.data);

    for (const [key, value] of other.data.entries()) {
      newMap.set(key, value);
    }

    return new ImmutableMap<K, V>(newMap);
  }

  /**
   * Executes a function for each entry in the map
   *
   * @param fn - Function to execute
   */
  forEach(fn: (value: V, key: K) => void): void {
    for (const [key, value] of this.data.entries()) {
      fn(value, key);
    }
  }

  /**
   * Converts the map to a plain object (only works for string keys)
   *
   * @returns A plain object representation of the map
   */
  toObject(this: ImmutableMap<string, V>): Record<string, V> {
    const result: Record<string, V> = {} as Record<string, V>;

    for (const [key, value] of this.data.entries()) {
      result[key] = value;
    }

    return result;
  }

  /**
   * Returns a string representation of the map
   */
  toString(): string {
    const entries = Array.from(this.data.entries())
      .map(([key, value]) => `${String(key)}: ${String(value)}`)
      .join(', ');

    return `Map({${entries}})`;
  }
}
