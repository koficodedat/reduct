/**
 * Utility types for type transformations
 *
 * This module provides utility types for type transformations and type-level programming.
 *
 * @packageDocumentation
 */

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
