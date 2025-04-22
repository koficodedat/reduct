/**
 * Input Characteristics Analyzer
 *
 * This utility analyzes input characteristics to help determine when to use WebAssembly.
 * It examines properties of the input data to make more informed decisions about
 * which implementation (WebAssembly or JavaScript) would be more efficient.
 */

import {
  InputDataType,
  InputSizeCategory,
  InputDensityCategory,
  InputValueRangeCategory,
  InputCharacteristics
} from '@reduct/shared-types/utils';

/**
 * Input characteristics analyzer
 */
export class InputCharacteristicsAnalyzer {
  /**
   * Maximum number of elements to sample for analysis
   */
  private static readonly MAX_SAMPLE_SIZE = 1000;

  /**
   * Analyze the characteristics of an array
   * @param array The array to analyze
   * @returns The characteristics of the array
   */
  public static analyzeArray<T>(array: T[]): InputCharacteristics {
    const size = array.length;

    // Determine size category
    const sizeCategory = this._getSizeCategory(size);

    // For empty arrays, return basic characteristics
    if (size === 0) {
      return {
        size,
        sizeCategory,
        dataType: InputDataType.UNKNOWN,
        isHomogeneous: true,
        densityCategory: InputDensityCategory.DENSE,
        valueRangeCategory: InputValueRangeCategory.NARROW,
        isIntegerOnly: false,
        isSmallIntegerOnly: false,
        isSorted: true,
        isReverseSorted: true,
        hasSpecialValues: false,
      };
    }

    // Sample the array for analysis
    const sampleSize = Math.min(size, this.MAX_SAMPLE_SIZE);
    const sampleStep = Math.max(1, Math.floor(size / sampleSize));
    const sample: T[] = [];

    for (let i = 0; i < size; i += sampleStep) {
      sample.push(array[i]);
    }

    // Analyze data type
    const dataType = this._getDataType(sample);
    const isHomogeneous = this._isHomogeneous(sample);

    // Analyze density
    const densityCategory = this._getDensityCategory(sample);

    // Initialize numeric-specific characteristics
    let valueRangeCategory = InputValueRangeCategory.NARROW;
    let isIntegerOnly = false;
    let isSmallIntegerOnly = false;
    let isSorted = true;
    let isReverseSorted = true;
    let hasSpecialValues = false;

    // Analyze numeric arrays
    if (dataType === InputDataType.NUMBER || dataType === InputDataType.INTEGER || dataType === InputDataType.FLOAT) {
      const numericSample = sample as unknown as number[];

      // Check for special values
      hasSpecialValues = numericSample.some(n => isNaN(n) || !isFinite(n));

      // Analyze value range
      valueRangeCategory = this._getValueRangeCategory(numericSample);

      // Check if all values are integers
      isIntegerOnly = numericSample.every(n => Number.isInteger(n));

      // Check if all values are small integers
      isSmallIntegerOnly = numericSample.every(n => Number.isInteger(n) && n >= -2147483648 && n <= 2147483647);

      // Check if the array is sorted
      isSorted = this._isSorted(numericSample);

      // Check if the array is reverse sorted
      isReverseSorted = this._isReverseSorted(numericSample);
    }

    return {
      size,
      sizeCategory,
      dataType,
      isHomogeneous,
      densityCategory,
      valueRangeCategory,
      isIntegerOnly,
      isSmallIntegerOnly,
      isSorted,
      isReverseSorted,
      hasSpecialValues,
    };
  }

  /**
   * Get the size category of an input
   * @param size Size of the input
   * @returns Size category
   */
  private static _getSizeCategory(size: number): InputSizeCategory {
    if (size < 10) {
      return InputSizeCategory.TINY;
    } else if (size < 100) {
      return InputSizeCategory.SMALL;
    } else if (size < 1000) {
      return InputSizeCategory.MEDIUM;
    } else if (size < 10000) {
      return InputSizeCategory.LARGE;
    } else if (size < 100000) {
      return InputSizeCategory.VERY_LARGE;
    } else {
      return InputSizeCategory.HUGE;
    }
  }

  /**
   * Get the data type of an array
   * @param array The array to analyze
   * @returns Data type
   */
  private static _getDataType<T>(array: T[]): InputDataType {
    if (array.length === 0) {
      return InputDataType.UNKNOWN;
    }

    // Check the type of the first element
    const firstType = typeof array[0];

    // Check if all elements have the same type
    const allSameType = array.every(item => typeof item === firstType);

    if (!allSameType) {
      return InputDataType.MIXED;
    }

    // Determine the specific type
    switch (firstType) {
      case 'number':
        // Check if all numbers are integers
        if (array.every(item => Number.isInteger(item as unknown as number))) {
          return InputDataType.INTEGER;
        }
        // Check if all numbers are floats
        if (array.every(item => typeof item === 'number' && !Number.isInteger(item as unknown as number))) {
          return InputDataType.FLOAT;
        }
        return InputDataType.NUMBER;
      case 'string':
        return InputDataType.STRING;
      case 'boolean':
        return InputDataType.BOOLEAN;
      case 'object':
        // Check if the object is an array
        if (array.every(item => Array.isArray(item))) {
          return InputDataType.ARRAY;
        }
        return InputDataType.OBJECT;
      default:
        return InputDataType.UNKNOWN;
    }
  }

  /**
   * Check if an array is homogeneous (all elements have the same type)
   * @param array The array to analyze
   * @returns Whether the array is homogeneous
   */
  private static _isHomogeneous<T>(array: T[]): boolean {
    if (array.length <= 1) {
      return true;
    }

    const firstType = typeof array[0];
    return array.every(item => typeof item === firstType);
  }

  /**
   * Get the density category of an array
   * @param array The array to analyze
   * @returns Density category
   */
  private static _getDensityCategory<T>(array: T[]): InputDensityCategory {
    if (array.length === 0) {
      return InputDensityCategory.DENSE;
    }

    // Count empty slots
    let emptyCount = 0;
    for (let i = 0; i < array.length; i++) {
      if (array[i] === undefined) {
        emptyCount++;
      }
    }

    const density = 1 - (emptyCount / array.length);

    if (density < 0.5) {
      return InputDensityCategory.SPARSE;
    } else if (density < 0.9) {
      return InputDensityCategory.MEDIUM;
    } else {
      return InputDensityCategory.DENSE;
    }
  }

  /**
   * Get the value range category of a numeric array
   * @param array The array to analyze
   * @returns Value range category
   */
  private static _getValueRangeCategory(array: number[]): InputValueRangeCategory {
    if (array.length <= 1) {
      return InputValueRangeCategory.NARROW;
    }

    // Find min and max values
    let min = array[0];
    let max = array[0];

    for (let i = 1; i < array.length; i++) {
      if (array[i] < min) {
        min = array[i];
      }
      if (array[i] > max) {
        max = array[i];
      }
    }

    const range = max - min;
    const avgValue = (max + min) / 2;

    // Calculate relative range
    const relativeRange = Math.abs(avgValue) < 1e-10 ? range : range / Math.abs(avgValue);

    if (relativeRange < 0.1) {
      return InputValueRangeCategory.NARROW;
    } else if (relativeRange < 1) {
      return InputValueRangeCategory.MEDIUM;
    } else {
      return InputValueRangeCategory.WIDE;
    }
  }

  /**
   * Check if a numeric array is sorted
   * @param array The array to analyze
   * @returns Whether the array is sorted
   */
  private static _isSorted(array: number[]): boolean {
    if (array.length <= 1) {
      return true;
    }

    for (let i = 1; i < array.length; i++) {
      if (array[i] < array[i - 1]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a numeric array is reverse sorted
   * @param array The array to analyze
   * @returns Whether the array is reverse sorted
   */
  private static _isReverseSorted(array: number[]): boolean {
    if (array.length <= 1) {
      return true;
    }

    for (let i = 1; i < array.length; i++) {
      if (array[i] > array[i - 1]) {
        return false;
      }
    }

    return true;
  }
}
