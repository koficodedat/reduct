/**
 * Enhanced Input Characteristics Analyzer
 *
 * This utility provides advanced analysis of input characteristics to help determine
 * when to use WebAssembly and which implementation strategy to use.
 */

import {
  InputCharacteristics,
  InputSizeCategory,
  InputDataType,
  InputDensityCategory as _InputDensityCategory,
  InputValueRangeCategory,
  EnhancedInputCharacteristics,
  ProcessingStrategy
} from '@reduct/shared-types/utils';

import { InputCharacteristicsAnalyzer } from './input-characteristics';

/**
 * Enhanced input characteristics analyzer
 */
export class EnhancedInputCharacteristicsAnalyzer {
  /**
   * Analyze the characteristics of an array with enhanced information
   * @param array The array to analyze
   * @returns The enhanced characteristics of the array
   */
  public static analyzeArray<T>(array: T[]): EnhancedInputCharacteristics {
    // Get basic characteristics
    const basicCharacteristics = InputCharacteristicsAnalyzer.analyzeArray(array);

    // Calculate complexity score
    const complexityScore = this._calculateComplexityScore(basicCharacteristics);

    // Determine if the input is suitable for WebAssembly
    const isWasmSuitable = this._isWasmSuitable(basicCharacteristics);

    // Determine if the input is suitable for SIMD
    const isSIMDSuitable = this._isSIMDSuitable(basicCharacteristics);

    // Determine if the input is suitable for parallel processing
    const isParallelSuitable = this._isParallelSuitable(basicCharacteristics);

    // Determine if the input is suitable for hybrid processing
    const isHybridSuitable = this._isHybridSuitable(basicCharacteristics);

    // Determine the recommended strategy
    const recommendedStrategy = this._determineStrategy(
      basicCharacteristics,
      isWasmSuitable,
      isSIMDSuitable,
      isParallelSuitable,
      isHybridSuitable
    );

    // Estimate WebAssembly speedup
    const estimatedWasmSpeedup = this._estimateWasmSpeedup(basicCharacteristics);

    // Estimate memory overhead
    const estimatedMemoryOverhead = this._estimateMemoryOverhead(basicCharacteristics);

    return {
      ...basicCharacteristics,
      isWasmSuitable,
      isSIMDSuitable,
      isParallelSuitable,
      isHybridSuitable,
      recommendedStrategy,
      estimatedWasmSpeedup,
      estimatedMemoryOverhead,
      complexityScore
    };
  }

  /**
   * Calculate the complexity score of the input
   * @param characteristics The basic characteristics of the input
   * @returns The complexity score
   */
  private static _calculateComplexityScore(characteristics: InputCharacteristics): number {
    let score = 0;

    // Size contributes to complexity
    switch (characteristics.sizeCategory) {
      case InputSizeCategory.TINY:
        score += 0;
        break;
      case InputSizeCategory.SMALL:
        score += 1;
        break;
      case InputSizeCategory.MEDIUM:
        score += 2;
        break;
      case InputSizeCategory.LARGE:
        score += 3;
        break;
      case InputSizeCategory.VERY_LARGE:
        score += 4;
        break;
      case InputSizeCategory.HUGE:
        score += 5;
        break;
    }

    // Data type contributes to complexity
    switch (characteristics.dataType) {
      case InputDataType.NUMBER:
      case InputDataType.INTEGER:
      case InputDataType.FLOAT:
        score += 0; // Numeric types are simpler
        break;
      case InputDataType.BOOLEAN:
        score += 1;
        break;
      case InputDataType.STRING:
        score += 2;
        break;
      case InputDataType.OBJECT:
        score += 3;
        break;
      case InputDataType.ARRAY:
        score += 4; // Nested arrays are complex
        break;
      case InputDataType.MIXED:
        score += 5; // Mixed types are most complex
        break;
      default:
        score += 2;
    }

    // Homogeneity reduces complexity
    if (characteristics.isHomogeneous) {
      score -= 1;
    } else {
      score += 1;
    }

    // Special values increase complexity
    if (characteristics.hasSpecialValues) {
      score += 2;
    }

    // Sorting status affects complexity
    if (characteristics.isSorted || characteristics.isReverseSorted) {
      score -= 1; // Sorted arrays are simpler for some operations
    }

    // Value range affects complexity
    switch (characteristics.valueRangeCategory) {
      case InputValueRangeCategory.NARROW:
        score += 0;
        break;
      case InputValueRangeCategory.MEDIUM:
        score += 1;
        break;
      case InputValueRangeCategory.WIDE:
        score += 2;
        break;
    }

    return Math.max(0, score); // Ensure score is non-negative
  }

  /**
   * Determine if the input is suitable for WebAssembly
   * @param characteristics The basic characteristics of the input
   * @returns Whether the input is suitable for WebAssembly
   */
  private static _isWasmSuitable(characteristics: InputCharacteristics): boolean {
    // WebAssembly is suitable for:
    // 1. Medium to huge arrays
    // 2. Homogeneous numeric arrays
    // 3. Arrays without special values

    const sizeIsSuitable = [
      InputSizeCategory.MEDIUM,
      InputSizeCategory.LARGE,
      InputSizeCategory.VERY_LARGE,
      InputSizeCategory.HUGE
    ].includes(characteristics.sizeCategory);

    const typeIsSuitable = [
      InputDataType.NUMBER,
      InputDataType.INTEGER,
      InputDataType.FLOAT
    ].includes(characteristics.dataType);

    return sizeIsSuitable &&
           typeIsSuitable &&
           characteristics.isHomogeneous &&
           !characteristics.hasSpecialValues;
  }

  /**
   * Determine if the input is suitable for SIMD
   * @param characteristics The basic characteristics of the input
   * @returns Whether the input is suitable for SIMD
   */
  private static _isSIMDSuitable(characteristics: InputCharacteristics): boolean {
    // SIMD is suitable for:
    // 1. Large to huge arrays
    // 2. Homogeneous numeric arrays
    // 3. Arrays without special values

    const sizeIsSuitable = [
      InputSizeCategory.LARGE,
      InputSizeCategory.VERY_LARGE,
      InputSizeCategory.HUGE
    ].includes(characteristics.sizeCategory);

    const typeIsSuitable = [
      InputDataType.NUMBER,
      InputDataType.INTEGER,
      InputDataType.FLOAT
    ].includes(characteristics.dataType);

    return sizeIsSuitable &&
           typeIsSuitable &&
           characteristics.isHomogeneous &&
           !characteristics.hasSpecialValues;
  }

  /**
   * Determine if the input is suitable for parallel processing
   * @param characteristics The basic characteristics of the input
   * @returns Whether the input is suitable for parallel processing
   */
  private static _isParallelSuitable(characteristics: InputCharacteristics): boolean {
    // Parallel processing is suitable for:
    // 1. Very large to huge arrays
    // 2. Homogeneous arrays

    const sizeIsSuitable = [
      InputSizeCategory.VERY_LARGE,
      InputSizeCategory.HUGE
    ].includes(characteristics.sizeCategory);

    return sizeIsSuitable && characteristics.isHomogeneous;
  }

  /**
   * Determine if the input is suitable for hybrid processing
   * @param characteristics The basic characteristics of the input
   * @returns Whether the input is suitable for hybrid processing
   */
  private static _isHybridSuitable(characteristics: InputCharacteristics): boolean {
    // Hybrid processing is suitable for:
    // 1. Medium to large arrays
    // 2. Mixed data types or non-homogeneous arrays
    // 3. Complex operations that benefit from specialized handling

    const sizeIsSuitable = [
      InputSizeCategory.MEDIUM,
      InputSizeCategory.LARGE
    ].includes(characteristics.sizeCategory);

    const typeIsSuitable = characteristics.dataType === InputDataType.MIXED ||
                          !characteristics.isHomogeneous;

    return sizeIsSuitable || typeIsSuitable;
  }

  /**
   * Determine the recommended processing strategy
   * @param characteristics The basic characteristics of the input
   * @param isWasmSuitable Whether the input is suitable for WebAssembly
   * @param isSIMDSuitable Whether the input is suitable for SIMD
   * @param isParallelSuitable Whether the input is suitable for parallel processing
   * @param isHybridSuitable Whether the input is suitable for hybrid processing
   * @returns The recommended processing strategy
   */
  private static _determineStrategy(
    characteristics: InputCharacteristics,
    isWasmSuitable: boolean,
    isSIMDSuitable: boolean,
    isParallelSuitable: boolean,
    isHybridSuitable: boolean
  ): ProcessingStrategy {
    // For tiny and small arrays, always use JavaScript
    if ([InputSizeCategory.TINY, InputSizeCategory.SMALL].includes(characteristics.sizeCategory)) {
      return ProcessingStrategy.JAVASCRIPT;
    }

    // For huge arrays with numeric data, use parallel processing if suitable
    if (isParallelSuitable &&
        characteristics.sizeCategory === InputSizeCategory.HUGE &&
        [InputDataType.NUMBER, InputDataType.INTEGER, InputDataType.FLOAT].includes(characteristics.dataType)) {
      return ProcessingStrategy.PARALLEL;
    }

    // For large arrays with numeric data, use SIMD if suitable
    if (isSIMDSuitable &&
        [InputSizeCategory.LARGE, InputSizeCategory.VERY_LARGE].includes(characteristics.sizeCategory) &&
        [InputDataType.NUMBER, InputDataType.INTEGER, InputDataType.FLOAT].includes(characteristics.dataType)) {
      return ProcessingStrategy.SIMD;
    }

    // For medium to large arrays with mixed data types, use hybrid approach
    if (isHybridSuitable &&
        [InputSizeCategory.MEDIUM, InputSizeCategory.LARGE].includes(characteristics.sizeCategory) &&
        (characteristics.dataType === InputDataType.MIXED || !characteristics.isHomogeneous)) {
      return ProcessingStrategy.HYBRID;
    }

    // For medium to huge arrays with numeric data, use WebAssembly if suitable
    if (isWasmSuitable &&
        [InputSizeCategory.MEDIUM, InputSizeCategory.LARGE, InputSizeCategory.VERY_LARGE, InputSizeCategory.HUGE].includes(characteristics.sizeCategory) &&
        [InputDataType.NUMBER, InputDataType.INTEGER, InputDataType.FLOAT].includes(characteristics.dataType)) {
      return ProcessingStrategy.WEBASSEMBLY;
    }

    // Default to JavaScript
    return ProcessingStrategy.JAVASCRIPT;
  }

  /**
   * Estimate the WebAssembly speedup factor
   * @param characteristics The basic characteristics of the input
   * @returns The estimated speedup factor
   */
  private static _estimateWasmSpeedup(characteristics: InputCharacteristics): number {
    // Base speedup factor
    let speedup = 1.0;

    // Size affects speedup
    switch (characteristics.sizeCategory) {
      case InputSizeCategory.TINY:
        speedup *= 0.5; // WebAssembly might be slower for tiny arrays
        break;
      case InputSizeCategory.SMALL:
        speedup *= 0.8; // WebAssembly might be slightly slower for small arrays
        break;
      case InputSizeCategory.MEDIUM:
        speedup *= 1.2; // WebAssembly might be slightly faster for medium arrays
        break;
      case InputSizeCategory.LARGE:
        speedup *= 1.5; // WebAssembly is faster for large arrays
        break;
      case InputSizeCategory.VERY_LARGE:
        speedup *= 2.0; // WebAssembly is much faster for very large arrays
        break;
      case InputSizeCategory.HUGE:
        speedup *= 3.0; // WebAssembly is significantly faster for huge arrays
        break;
    }

    // Data type affects speedup
    switch (characteristics.dataType) {
      case InputDataType.INTEGER:
        speedup *= 1.5; // WebAssembly is very efficient for integers
        break;
      case InputDataType.FLOAT:
        speedup *= 1.3; // WebAssembly is efficient for floats
        break;
      case InputDataType.NUMBER:
        speedup *= 1.2; // WebAssembly is efficient for numbers
        break;
      case InputDataType.BOOLEAN:
        speedup *= 1.1; // WebAssembly is somewhat efficient for booleans
        break;
      case InputDataType.STRING:
        speedup *= 0.9; // WebAssembly might be slower for strings
        break;
      case InputDataType.OBJECT:
        speedup *= 0.7; // WebAssembly is less efficient for objects
        break;
      case InputDataType.ARRAY:
        speedup *= 0.8; // WebAssembly is less efficient for nested arrays
        break;
      case InputDataType.MIXED:
        speedup *= 0.6; // WebAssembly is least efficient for mixed types
        break;
      default:
        speedup *= 1.0;
    }

    // Homogeneity affects speedup
    if (characteristics.isHomogeneous) {
      speedup *= 1.2; // WebAssembly is more efficient for homogeneous arrays
    } else {
      speedup *= 0.8; // WebAssembly is less efficient for non-homogeneous arrays
    }

    // Special values affect speedup
    if (characteristics.hasSpecialValues) {
      speedup *= 0.7; // WebAssembly is less efficient for arrays with special values
    }

    // Sorting status affects speedup
    if (characteristics.isSorted) {
      speedup *= 1.1; // WebAssembly can take advantage of sorted arrays
    }

    // Value range affects speedup
    switch (characteristics.valueRangeCategory) {
      case InputValueRangeCategory.NARROW:
        speedup *= 1.2; // WebAssembly is more efficient for narrow value ranges
        break;
      case InputValueRangeCategory.MEDIUM:
        speedup *= 1.0; // Neutral effect
        break;
      case InputValueRangeCategory.WIDE:
        speedup *= 0.9; // WebAssembly is less efficient for wide value ranges
        break;
    }

    return Math.max(0.5, speedup); // Ensure speedup is at least 0.5
  }

  /**
   * Estimate the memory overhead of WebAssembly
   * @param characteristics The basic characteristics of the input
   * @returns The estimated memory overhead in bytes
   */
  private static _estimateMemoryOverhead(characteristics: InputCharacteristics): number {
    // Base memory overhead
    let overhead = 1024; // 1KB base overhead

    // Size affects overhead
    overhead += characteristics.size * 4; // 4 bytes per element for copying

    // Data type affects overhead
    switch (characteristics.dataType) {
      case InputDataType.INTEGER:
      case InputDataType.FLOAT:
      case InputDataType.NUMBER:
        overhead += characteristics.size * 8; // 8 bytes per number
        break;
      case InputDataType.BOOLEAN:
        overhead += characteristics.size * 1; // 1 byte per boolean
        break;
      case InputDataType.STRING:
        // Estimate 16 bytes per character on average
        overhead += characteristics.size * 16 * 10; // Assuming 10 chars per string
        break;
      case InputDataType.OBJECT:
      case InputDataType.ARRAY:
      case InputDataType.MIXED:
        overhead += characteristics.size * 32; // 32 bytes per complex element
        break;
      default:
        overhead += characteristics.size * 8;
    }

    return overhead;
  }
}
