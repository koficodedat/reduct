import { WasmAccelerator } from '../wasm-accelerator';
import { PerformanceProfile, AcceleratorOptions } from '../accelerator';
import { WebAssemblyFeature } from '../../core/feature-detection';

/**
 * Time series accelerator
 * 
 * Provides optimized implementations of time series operations for numeric arrays
 * using WebAssembly.
 */
export class TimeSeriesAccelerator extends WasmAccelerator {
  /**
   * Create a new time series accelerator
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    super('data-structures', 'time-series', 'operations', {
      ...options,
      requiredFeatures: [WebAssemblyFeature.BASIC],
    });
  }

  /**
   * Calculate the simple moving average (SMA) of a numeric array
   * 
   * @param array The input array
   * @param windowSize The window size
   * @returns An array of moving averages
   */
  public movingAverage(array: number[], windowSize: number): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculateMovingAverageJs(array, windowSize);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.calculateMovingAverageJs(array, windowSize);
      }

      // Validate window size
      if (windowSize <= 0 || windowSize > array.length) {
        throw new Error('Window size must be greater than 0 and less than or equal to the array length');
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);
      
      // Call the WebAssembly implementation
      const result = module.numeric_moving_average_f64(typedArray, windowSize);
      
      // Convert the result back to a regular array
      return Array.from(new Float64Array(result));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculateMovingAverageJs(array, windowSize);
    }
  }

  /**
   * Calculate the exponential moving average (EMA) of a numeric array
   * 
   * @param array The input array
   * @param alpha The smoothing factor (0 < alpha <= 1)
   * @returns An array of exponential moving averages
   */
  public exponentialMovingAverage(array: number[], alpha: number): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculateExponentialMovingAverageJs(array, alpha);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.calculateExponentialMovingAverageJs(array, alpha);
      }

      // Validate alpha
      if (alpha <= 0 || alpha > 1) {
        throw new Error('Alpha must be between 0 and 1 (exclusive of 0)');
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);
      
      // Call the WebAssembly implementation
      const result = module.numeric_exponential_moving_average_f64(typedArray, alpha);
      
      // Convert the result back to a regular array
      return Array.from(new Float64Array(result));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculateExponentialMovingAverageJs(array, alpha);
    }
  }

  /**
   * Calculate the weighted moving average (WMA) of a numeric array
   * 
   * @param array The input array
   * @param windowSize The window size
   * @returns An array of weighted moving averages
   */
  public weightedMovingAverage(array: number[], windowSize: number): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculateWeightedMovingAverageJs(array, windowSize);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.calculateWeightedMovingAverageJs(array, windowSize);
      }

      // Validate window size
      if (windowSize <= 0 || windowSize > array.length) {
        throw new Error('Window size must be greater than 0 and less than or equal to the array length');
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);
      
      // Call the WebAssembly implementation
      const result = module.numeric_weighted_moving_average_f64(typedArray, windowSize);
      
      // Convert the result back to a regular array
      return Array.from(new Float64Array(result));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculateWeightedMovingAverageJs(array, windowSize);
    }
  }

  /**
   * Detect outliers in a numeric array using the Z-score method
   * 
   * @param array The input array
   * @param threshold The Z-score threshold (default: 3.0)
   * @returns An array of booleans indicating outliers
   */
  public detectOutliers(array: number[], threshold: number = 3.0): boolean[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.detectOutliersJs(array, threshold);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.detectOutliersJs(array, threshold);
      }

      // Validate threshold
      if (threshold <= 0) {
        throw new Error('Threshold must be greater than 0');
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);
      
      // Call the WebAssembly implementation
      const result = module.numeric_detect_outliers_f64(typedArray, threshold);
      
      // Convert the result back to a regular array
      return Array.from(result).map(value => Boolean(value));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.detectOutliersJs(array, threshold);
    }
  }

  /**
   * Interpolate missing values in a numeric array
   * 
   * @param array The input array with NaN values
   * @returns An array with interpolated values
   */
  public interpolateMissing(array: number[]): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.interpolateMissingJs(array);
    }

    try {
      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);
      
      // Call the WebAssembly implementation
      const result = module.numeric_interpolate_missing_f64(typedArray);
      
      // Convert the result back to a regular array
      return Array.from(new Float64Array(result));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.interpolateMissingJs(array);
    }
  }

  /**
   * Calculate the autocorrelation of a numeric array
   * 
   * @param array The input array
   * @param lag The lag (default: 1)
   * @returns The autocorrelation
   */
  public autocorrelation(array: number[], lag: number = 1): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculateAutocorrelationJs(array, lag);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.calculateAutocorrelationJs(array, lag);
      }

      // Validate lag
      if (lag <= 0 || lag >= array.length) {
        throw new Error('Lag must be greater than 0 and less than the array length');
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);
      
      // Call the WebAssembly implementation
      return module.numeric_autocorrelation_f64(typedArray, lag);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculateAutocorrelationJs(array, lag);
    }
  }

  /**
   * Execute the accelerated operation
   * @param _input The input for the operation
   * @returns The result of the operation
   */
  public execute(_input: any): any {
    throw new Error('Method not implemented. Use specific operation methods instead.');
  }

  /**
   * Get the performance profile of the time series accelerator
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 8.0,
      effectiveInputSize: 1000,
    };
  }

  /**
   * Check if an array contains only numbers
   * 
   * @param array The array to check
   * @returns True if the array contains only numbers
   */
  private isNumericArray(array: any[]): boolean {
    return array.every(value => typeof value === 'number');
  }

  /**
   * Calculate the simple moving average (SMA) of a numeric array using JavaScript
   * 
   * @param array The input array
   * @param windowSize The window size
   * @returns An array of moving averages
   */
  private calculateMovingAverageJs(array: number[], windowSize: number): number[] {
    if (windowSize <= 0 || windowSize > array.length) {
      throw new Error('Window size must be greater than 0 and less than or equal to the array length');
    }

    const result: number[] = [];
    let windowSum = 0;

    // Calculate the first window sum
    for (let i = 0; i < windowSize; i++) {
      windowSum += array[i];
    }

    // Add the first result
    result.push(windowSum / windowSize);

    // Calculate the rest of the moving averages using a sliding window
    for (let i = 1; i <= array.length - windowSize; i++) {
      windowSum = windowSum - array[i - 1] + array[i + windowSize - 1];
      result.push(windowSum / windowSize);
    }

    return result;
  }

  /**
   * Calculate the exponential moving average (EMA) of a numeric array using JavaScript
   * 
   * @param array The input array
   * @param alpha The smoothing factor (0 < alpha <= 1)
   * @returns An array of exponential moving averages
   */
  private calculateExponentialMovingAverageJs(array: number[], alpha: number): number[] {
    if (alpha <= 0 || alpha > 1) {
      throw new Error('Alpha must be between 0 and 1 (exclusive of 0)');
    }

    if (array.length === 0) {
      return [];
    }

    const result: number[] = [array[0]];

    for (let i = 1; i < array.length; i++) {
      const ema = alpha * array[i] + (1 - alpha) * result[i - 1];
      result.push(ema);
    }

    return result;
  }

  /**
   * Calculate the weighted moving average (WMA) of a numeric array using JavaScript
   * 
   * @param array The input array
   * @param windowSize The window size
   * @returns An array of weighted moving averages
   */
  private calculateWeightedMovingAverageJs(array: number[], windowSize: number): number[] {
    if (windowSize <= 0 || windowSize > array.length) {
      throw new Error('Window size must be greater than 0 and less than or equal to the array length');
    }

    const result: number[] = [];
    const denominator = (windowSize * (windowSize + 1)) / 2;

    for (let i = 0; i <= array.length - windowSize; i++) {
      let weightedSum = 0;
      for (let j = 0; j < windowSize; j++) {
        weightedSum += array[i + j] * (j + 1);
      }
      result.push(weightedSum / denominator);
    }

    return result;
  }

  /**
   * Detect outliers in a numeric array using the Z-score method using JavaScript
   * 
   * @param array The input array
   * @param threshold The Z-score threshold
   * @returns An array of booleans indicating outliers
   */
  private detectOutliersJs(array: number[], threshold: number): boolean[] {
    if (threshold <= 0) {
      throw new Error('Threshold must be greater than 0');
    }

    if (array.length === 0) {
      return [];
    }

    // Calculate mean
    const mean = array.reduce((sum, value) => sum + value, 0) / array.length;

    // Calculate standard deviation
    const squaredDiffs = array.map(value => {
      const diff = value - mean;
      return diff * diff;
    });
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / array.length;
    const stdDev = Math.sqrt(variance);

    // Detect outliers
    if (stdDev === 0) {
      // If standard deviation is 0, no outliers
      return array.map(() => false);
    } else {
      // Calculate Z-scores and detect outliers
      return array.map(value => {
        const zScore = Math.abs(value - mean) / stdDev;
        return zScore > threshold;
      });
    }
  }

  /**
   * Interpolate missing values in a numeric array using JavaScript
   * 
   * @param array The input array with NaN values
   * @returns An array with interpolated values
   */
  private interpolateMissingJs(array: number[]): number[] {
    if (array.length === 0) {
      return [];
    }

    const result = [...array];

    // Find first non-NaN value
    let firstValidIndex = -1;
    for (let i = 0; i < result.length; i++) {
      if (!isNaN(result[i])) {
        firstValidIndex = i;
        break;
      }
    }

    // If all values are NaN, return the original array
    if (firstValidIndex === -1) {
      return result;
    }

    // Fill in leading NaN values with the first valid value
    for (let i = 0; i < firstValidIndex; i++) {
      result[i] = result[firstValidIndex];
    }

    // Interpolate middle values
    let lastValidIndex = firstValidIndex;
    let lastValidValue = result[firstValidIndex];

    for (let i = firstValidIndex + 1; i < result.length; i++) {
      if (!isNaN(result[i])) {
        // If we have a gap, interpolate
        if (i > lastValidIndex + 1) {
          const gap = i - lastValidIndex;
          const step = (result[i] - lastValidValue) / gap;

          for (let j = 1; j < gap; j++) {
            result[lastValidIndex + j] = lastValidValue + step * j;
          }
        }

        lastValidIndex = i;
        lastValidValue = result[i];
      } else if (i === result.length - 1) {
        // Fill in trailing NaN values with the last valid value
        result[i] = lastValidValue;
      }
    }

    return result;
  }

  /**
   * Calculate the autocorrelation of a numeric array using JavaScript
   * 
   * @param array The input array
   * @param lag The lag
   * @returns The autocorrelation
   */
  private calculateAutocorrelationJs(array: number[], lag: number): number {
    if (lag <= 0 || lag >= array.length) {
      throw new Error('Lag must be greater than 0 and less than the array length');
    }

    // Calculate mean
    const mean = array.reduce((sum, value) => sum + value, 0) / array.length;

    // Calculate autocorrelation
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < array.length - lag; i++) {
      const x_t = array[i] - mean;
      const x_t_plus_lag = array[i + lag] - mean;
      numerator += x_t * x_t_plus_lag;
    }

    for (let i = 0; i < array.length; i++) {
      const x_t = array[i] - mean;
      denominator += x_t * x_t;
    }

    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }
}
