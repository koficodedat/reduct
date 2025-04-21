import { WasmAccelerator } from '../wasm-accelerator';
import { PerformanceProfile, AcceleratorOptions } from '../accelerator';
import { WebAssemblyFeature } from '../../core/feature-detection';

/**
 * Numeric statistics accelerator
 *
 * Provides optimized implementations of statistical operations for numeric arrays
 * using WebAssembly.
 */
export class NumericStatsAccelerator extends WasmAccelerator {
  /**
   * Create a new numeric statistics accelerator
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    super('data-structures', 'numeric-stats', 'operations', {
      ...options,
      requiredFeatures: [WebAssemblyFeature.BASIC],
    });
  }

  /**
   * Calculate the median of a numeric array
   *
   * @param array The input array
   * @returns The median value
   */
  public median(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculateMedianJs(array);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.calculateMedianJs(array);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_median_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculateMedianJs(array);
    }
  }

  /**
   * Calculate the standard deviation of a numeric array
   *
   * @param array The input array
   * @returns The standard deviation
   */
  public standardDeviation(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculateStdDevJs(array);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.calculateStdDevJs(array);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_std_dev_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculateStdDevJs(array);
    }
  }

  /**
   * Calculate the correlation coefficient between two numeric arrays
   *
   * @param x The first array
   * @param y The second array
   * @returns The correlation coefficient
   */
  public correlation(x: number[], y: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculateCorrelationJs(x, y);
    }

    try {
      // Check if the arrays contain only numbers
      if (!this.isNumericArray(x) || !this.isNumericArray(y)) {
        return this.calculateCorrelationJs(x, y);
      }

      // Convert to Float64Array for better performance
      const xTypedArray = new Float64Array(x);
      const yTypedArray = new Float64Array(y);

      // Call the WebAssembly implementation
      return module.numeric_correlation_f64(xTypedArray, yTypedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculateCorrelationJs(x, y);
    }
  }

  /**
   * Calculate the percentile of a numeric array
   *
   * @param array The input array
   * @param percentile The percentile (0-100)
   * @returns The value at the specified percentile
   */
  public percentile(array: number[], percentile: number): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculatePercentileJs(array, percentile);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.calculatePercentileJs(array, percentile);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_percentile_f64(typedArray, percentile);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculatePercentileJs(array, percentile);
    }
  }

  /**
   * Calculate the covariance between two numeric arrays
   *
   * @param x The first array
   * @param y The second array
   * @returns The covariance
   */
  public covariance(x: number[], y: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculateCovarianceJs(x, y);
    }

    try {
      // Check if the arrays contain only numbers
      if (!this.isNumericArray(x) || !this.isNumericArray(y)) {
        return this.calculateCovarianceJs(x, y);
      }

      // Convert to Float64Array for better performance
      const xTypedArray = new Float64Array(x);
      const yTypedArray = new Float64Array(y);

      // Call the WebAssembly implementation
      return module.numeric_covariance_f64(xTypedArray, yTypedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculateCovarianceJs(x, y);
    }
  }

  /**
   * Calculate the skewness of a numeric array
   *
   * @param array The input array
   * @returns The skewness
   */
  public skewness(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculateSkewnessJs(array);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.calculateSkewnessJs(array);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_skewness_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculateSkewnessJs(array);
    }
  }

  /**
   * Calculate the kurtosis of a numeric array
   *
   * @param array The input array
   * @returns The kurtosis
   */
  public kurtosis(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculateKurtosisJs(array);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.calculateKurtosisJs(array);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_kurtosis_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculateKurtosisJs(array);
    }
  }

  /**
   * Calculate multiple quantiles of a numeric array
   *
   * @param array The input array
   * @param quantiles Array of quantiles (0-1)
   * @returns Array of values at the specified quantiles
   */
  public quantiles(array: number[], quantiles: number[]): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.calculateQuantilesJs(array, quantiles);
    }

    try {
      // Check if the arrays contain only numbers
      if (!this.isNumericArray(array) || !this.isNumericArray(quantiles)) {
        return this.calculateQuantilesJs(array, quantiles);
      }

      // Convert to Float64Array for better performance
      const arrayTypedArray = new Float64Array(array);
      const quantilesTypedArray = new Float64Array(quantiles);

      // Call the WebAssembly implementation
      const result = module.numeric_quantiles_f64(arrayTypedArray, quantilesTypedArray);

      // Convert the result back to a regular array
      return Array.from(new Float64Array(result));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.calculateQuantilesJs(array, quantiles);
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
   * Get the performance profile of the numeric statistics accelerator
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 5.0,
      effectiveInputSize: 100,
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
   * Calculate the median of a numeric array using JavaScript
   *
   * @param array The input array
   * @returns The median value
   */
  private calculateMedianJs(array: number[]): number {
    if (array.length === 0) {
      return NaN;
    }

    if (array.length === 1) {
      return array[0];
    }

    const sorted = [...array].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  /**
   * Calculate the standard deviation of a numeric array using JavaScript
   *
   * @param array The input array
   * @returns The standard deviation
   */
  private calculateStdDevJs(array: number[]): number {
    if (array.length === 0) {
      return NaN;
    }

    if (array.length === 1) {
      return 0;
    }

    const mean = array.reduce((sum, value) => sum + value, 0) / array.length;
    const squaredDiffs = array.map(value => {
      const diff = value - mean;
      return diff * diff;
    });
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / array.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate the correlation coefficient between two numeric arrays using JavaScript
   *
   * @param x The first array
   * @param y The second array
   * @returns The correlation coefficient
   */
  private calculateCorrelationJs(x: number[], y: number[]): number {
    const length = Math.min(x.length, y.length);

    if (length === 0) {
      return NaN;
    }

    if (length === 1) {
      return 1;
    }

    const meanX = x.reduce((sum, value) => sum + value, 0) / length;
    const meanY = y.reduce((sum, value) => sum + value, 0) / length;

    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (let i = 0; i < length; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      sumXY += diffX * diffY;
      sumX2 += diffX * diffX;
      sumY2 += diffY * diffY;
    }

    if (sumX2 === 0 || sumY2 === 0) {
      return 0;
    }

    return sumXY / (Math.sqrt(sumX2) * Math.sqrt(sumY2));
  }

  /**
   * Calculate the percentile of a numeric array using JavaScript
   *
   * @param array The input array
   * @param percentile The percentile (0-100)
   * @returns The value at the specified percentile
   */
  private calculatePercentileJs(array: number[], percentile: number): number {
    if (array.length === 0) {
      return NaN;
    }

    if (array.length === 1) {
      return array[0];
    }

    const p = Math.max(0, Math.min(100, percentile));
    const sorted = [...array].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Calculate the covariance between two numeric arrays using JavaScript
   *
   * @param x The first array
   * @param y The second array
   * @returns The covariance
   */
  private calculateCovarianceJs(x: number[], y: number[]): number {
    const length = Math.min(x.length, y.length);

    if (length === 0) {
      return NaN;
    }

    if (length === 1) {
      return 0;
    }

    const meanX = x.reduce((sum, value) => sum + value, 0) / length;
    const meanY = y.reduce((sum, value) => sum + value, 0) / length;

    let sumCov = 0;

    for (let i = 0; i < length; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      sumCov += diffX * diffY;
    }

    return sumCov / length;
  }

  /**
   * Calculate the skewness of a numeric array using JavaScript
   *
   * @param array The input array
   * @returns The skewness
   */
  private calculateSkewnessJs(array: number[]): number {
    if (array.length === 0) {
      return NaN;
    }

    if (array.length === 1) {
      return 0;
    }

    const mean = array.reduce((sum, value) => sum + value, 0) / array.length;

    let m2 = 0;
    let m3 = 0;

    for (let i = 0; i < array.length; i++) {
      const diff = array[i] - mean;
      const diff2 = diff * diff;
      m2 += diff2;
      m3 += diff2 * diff;
    }

    const variance = m2 / array.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      return 0;
    }

    // Adjust for sample size (Fisher's moment coefficient of skewness)
    const n = array.length;
    const adjustment = (n * Math.sqrt(n - 1)) / (n - 2);

    return adjustment * (m3 / array.length) / (stdDev * stdDev * stdDev);
  }

  /**
   * Calculate the kurtosis of a numeric array using JavaScript
   *
   * @param array The input array
   * @returns The kurtosis
   */
  private calculateKurtosisJs(array: number[]): number {
    if (array.length === 0) {
      return NaN;
    }

    if (array.length <= 3) {
      return NaN;
    }

    const mean = array.reduce((sum, value) => sum + value, 0) / array.length;

    let m2 = 0;
    let m4 = 0;

    for (let i = 0; i < array.length; i++) {
      const diff = array[i] - mean;
      const diff2 = diff * diff;
      m2 += diff2;
      m4 += diff2 * diff2;
    }

    const variance = m2 / array.length;

    if (variance === 0) {
      return 0;
    }

    // Adjust for sample size
    const n = array.length;
    const adjustment = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
    const term1 = ((n + 1) * (m4 / array.length)) / (variance * variance);
    const term2 = 3 * (n - 1) * (n - 1) / ((n - 2) * (n - 3));

    return adjustment * term1 - term2;
  }

  /**
   * Calculate multiple quantiles of a numeric array using JavaScript
   *
   * @param array The input array
   * @param quantiles Array of quantiles (0-1)
   * @returns Array of values at the specified quantiles
   */
  private calculateQuantilesJs(array: number[], quantiles: number[]): number[] {
    if (array.length === 0 || quantiles.length === 0) {
      return [];
    }

    if (array.length === 1) {
      return quantiles.map(() => array[0]);
    }

    const sorted = [...array].sort((a, b) => a - b);

    return quantiles.map(q => {
      // Validate quantile
      const p = Math.max(0, Math.min(1, q));

      // Calculate the index
      const index = p * (sorted.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;

      if (lower === upper) {
        return sorted[lower];
      }

      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    });
  }
}
