/**
 * Input Characteristics Types
 *
 * This module provides types for analyzing input characteristics to help determine
 * when to use WebAssembly and which implementation strategy to use.
 *
 * @packageDocumentation
 */

/**
 * Input data type
 */
export enum InputDataType {
  /**
   * Unknown data type
   */
  UNKNOWN = 'unknown',
  
  /**
   * Number data type (includes both integers and floats)
   */
  NUMBER = 'number',
  
  /**
   * Integer data type
   */
  INTEGER = 'integer',
  
  /**
   * Float data type
   */
  FLOAT = 'float',
  
  /**
   * String data type
   */
  STRING = 'string',
  
  /**
   * Boolean data type
   */
  BOOLEAN = 'boolean',
  
  /**
   * Object data type
   */
  OBJECT = 'object',
  
  /**
   * Array data type
   */
  ARRAY = 'array',
  
  /**
   * Mixed data types
   */
  MIXED = 'mixed',
}

/**
 * Input size category
 */
export enum InputSizeCategory {
  /**
   * Tiny input (< 10 elements)
   */
  TINY = 'tiny',
  
  /**
   * Small input (10-100 elements)
   */
  SMALL = 'small',
  
  /**
   * Medium input (100-1,000 elements)
   */
  MEDIUM = 'medium',
  
  /**
   * Large input (1,000-10,000 elements)
   */
  LARGE = 'large',
  
  /**
   * Very large input (10,000-100,000 elements)
   */
  VERY_LARGE = 'very_large',
  
  /**
   * Huge input (> 100,000 elements)
   */
  HUGE = 'huge',
}

/**
 * Input density category (for arrays with potential empty slots)
 */
export enum InputDensityCategory {
  /**
   * Sparse input (< 50% filled)
   */
  SPARSE = 'sparse',
  
  /**
   * Medium density input (50-90% filled)
   */
  MEDIUM = 'medium',
  
  /**
   * Dense input (> 90% filled)
   */
  DENSE = 'dense',
}

/**
 * Input value range category
 */
export enum InputValueRangeCategory {
  /**
   * Narrow value range
   */
  NARROW = 'narrow',
  
  /**
   * Medium value range
   */
  MEDIUM = 'medium',
  
  /**
   * Wide value range
   */
  WIDE = 'wide',
}

/**
 * Input characteristics
 */
export interface InputCharacteristics {
  /**
   * Size of the input
   */
  size: number;

  /**
   * Size category of the input
   */
  sizeCategory: InputSizeCategory;

  /**
   * Data type of the input
   */
  dataType: InputDataType;

  /**
   * Whether the input is homogeneous (all elements have the same type)
   */
  isHomogeneous: boolean;

  /**
   * Density of the input (for arrays with potential empty slots)
   */
  densityCategory: InputDensityCategory;

  /**
   * Value range category of the input (for numeric arrays)
   */
  valueRangeCategory: InputValueRangeCategory;

  /**
   * Whether the input contains only integers (for numeric arrays)
   */
  isIntegerOnly: boolean;

  /**
   * Whether the input contains only small integers (for numeric arrays)
   */
  isSmallIntegerOnly: boolean;

  /**
   * Whether the input is sorted
   */
  isSorted: boolean;

  /**
   * Whether the input is reverse sorted
   */
  isReverseSorted: boolean;

  /**
   * Whether the input contains NaN or Infinity values
   */
  hasSpecialValues: boolean;
}
