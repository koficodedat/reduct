/**
 * List-related types
 *
 * This module provides types for list data structures.
 *
 * @packageDocumentation
 */

/**
 * Data type categories for specialized optimizations
 */
export enum DataType {
  /**
   * Unknown data type
   */
  UNKNOWN = 'unknown',
  
  /**
   * Numeric data type
   */
  NUMERIC = 'numeric',
  
  /**
   * String data type
   */
  STRING = 'string',
  
  /**
   * Object reference data type
   */
  OBJECT_REFERENCE = 'object_reference',
  
  /**
   * Mixed data types
   */
  MIXED = 'mixed'
}

/**
 * Representation types for the List implementation
 */
export enum RepresentationType {
  /**
   * Simple array representation for very small collections
   */
  ARRAY = 'array',

  /**
   * SmallList representation for small collections
   */
  SMALL = 'small',

  /**
   * Chunked array representation for medium collections
   */
  CHUNKED = 'chunked',

  /**
   * Vector representation for large collections
   */
  VECTOR = 'vector',

  /**
   * HAMT Vector representation for very large collections
   * Uses Hash Array Mapped Trie for efficient structural sharing
   */
  HAMT_VECTOR = 'hamt_vector'
}
