import { WebAssemblyFeature } from '../../core/feature-detection';
import { PerformanceProfile, AcceleratorOptions } from '../accelerator';
import { WasmAccelerator } from '../wasm-accelerator';

/**
 * Linear regression result interface
 */
export interface LinearRegressionResult {
  /** The slope of the regression line */
  slope: number;
  /** The y-intercept of the regression line */
  intercept: number;
  /** The coefficient of determination (R-squared) */
  r_squared: number;
}

/**
 * K-means clustering result interface
 */
export interface KMeansClusteringResult {
  /** The cluster assignments for each data point */
  assignments: number[];
  /** The centroids of the clusters */
  centroids: number[];
  /** The number of iterations performed */
  iterations: number;
  /** Whether the algorithm converged */
  converged: boolean;
}

/**
 * PCA result interface
 */
export interface PCAResult {
  /** The principal components */
  components: number[];
  /** The projected data */
  projected: number[];
  /** The explained variance ratio for each component */
  explained_variance: number[];
  /** The mean of the x values */
  mean_x: number;
  /** The mean of the y values */
  mean_y: number;
}

/**
 * Machine learning accelerator
 * 
 * Provides optimized implementations of machine learning algorithms
 * using WebAssembly.
 */
export class MachineLearningAccelerator extends WasmAccelerator {
  /**
   * Create a new machine learning accelerator
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    super('data-structures', 'machine-learning', 'operations', {
      ...options,
      requiredFeatures: [WebAssemblyFeature.BASIC],
    });
  }

  /**
   * Perform linear regression on x and y data
   * 
   * @param x The independent variable values
   * @param y The dependent variable values
   * @returns The linear regression result
   */
  public linearRegression(x: number[], y: number[]): LinearRegressionResult {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.linearRegressionJs(x, y);
    }

    try {
      // Check if the arrays contain only numbers
      if (!this.isNumericArray(x) || !this.isNumericArray(y)) {
        return this.linearRegressionJs(x, y);
      }

      // Check if the arrays have the same length
      if (x.length !== y.length) {
        throw new Error('x and y arrays must have the same length');
      }

      // Check if there are enough data points
      if (x.length < 2) {
        throw new Error('At least 2 data points are required for linear regression');
      }

      // Convert to Float64Array for better performance
      const xTypedArray = new Float64Array(x);
      const yTypedArray = new Float64Array(y);
      
      // Call the WebAssembly implementation
      const result = module.linear_regression_f64(xTypedArray, yTypedArray);
      
      // Convert the result to a LinearRegressionResult
      return {
        slope: result.slope as number,
        intercept: result.intercept as number,
        r_squared: result.r_squared as number,
      };
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.linearRegressionJs(x, y);
    }
  }

  /**
   * Predict y values using linear regression
   * 
   * @param x The independent variable values
   * @param slope The slope of the regression line
   * @param intercept The y-intercept of the regression line
   * @returns The predicted y values
   */
  public linearRegressionPredict(x: number[], slope: number, intercept: number): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.linearRegressionPredictJs(x, slope, intercept);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(x)) {
        return this.linearRegressionPredictJs(x, slope, intercept);
      }

      // Convert to Float64Array for better performance
      const xTypedArray = new Float64Array(x);
      
      // Call the WebAssembly implementation
      const result = module.linear_regression_predict_f64(xTypedArray, slope, intercept);
      
      // Convert the result back to a regular array
      return Array.from(new Float64Array(result));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.linearRegressionPredictJs(x, slope, intercept);
    }
  }

  /**
   * Perform k-means clustering on 2D data
   * 
   * @param data The data points as a flat array [x1, y1, x2, y2, ...]
   * @param k The number of clusters
   * @param maxIterations The maximum number of iterations (default: 100)
   * @returns The k-means clustering result
   */
  public kMeansClustering(data: number[], k: number, maxIterations: number = 100): KMeansClusteringResult {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.kMeansClusteringJs(data, k, maxIterations);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(data)) {
        return this.kMeansClusteringJs(data, k, maxIterations);
      }

      // Check if the data is valid
      if (data.length % 2 !== 0) {
        throw new Error('Data must be a flat array of 2D points [x1, y1, x2, y2, ...]');
      }

      // Check if there are enough data points
      if (data.length / 2 < k) {
        throw new Error('Number of points must be greater than or equal to k');
      }

      // Convert to Float64Array for better performance
      const dataTypedArray = new Float64Array(data);
      
      // Call the WebAssembly implementation
      const result = module.kmeans_clustering_f64(dataTypedArray, k, maxIterations);
      
      // Convert the result to a KMeansClusteringResult
      return {
        assignments: Array.from(result.assignments as any[]).map(Number),
        centroids: Array.from(new Float64Array(result.centroids as any)),
        iterations: Number(result.iterations),
        converged: Boolean(result.converged),
      };
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.kMeansClusteringJs(data, k, maxIterations);
    }
  }

  /**
   * Perform Principal Component Analysis (PCA) on 2D data
   * 
   * @param data The data points as a flat array [x1, y1, x2, y2, ...]
   * @param numComponents The number of components to keep (1 or 2)
   * @returns The PCA result
   */
  public pca(data: number[], numComponents: number = 2): PCAResult {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.pcaJs(data, numComponents);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(data)) {
        return this.pcaJs(data, numComponents);
      }

      // Check if the data is valid
      if (data.length % 2 !== 0) {
        throw new Error('Data must be a flat array of 2D points [x1, y1, x2, y2, ...]');
      }

      // Check if the number of components is valid
      if (numComponents < 1 || numComponents > 2) {
        throw new Error('Number of components must be 1 or 2 for 2D data');
      }

      // Convert to Float64Array for better performance
      const dataTypedArray = new Float64Array(data);
      
      // Call the WebAssembly implementation
      const result = module.pca_f64(dataTypedArray, numComponents);
      
      // Convert the result to a PCAResult
      return {
        components: Array.from(new Float64Array(result.components as any)),
        projected: Array.from(new Float64Array(result.projected as any)),
        explained_variance: Array.from(new Float64Array(result.explained_variance as any)),
        mean_x: Number(result.mean_x),
        mean_y: Number(result.mean_y),
      };
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.pcaJs(data, numComponents);
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
   * Get the performance profile of the machine learning accelerator
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 10.0,
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
   * Perform linear regression on x and y data using JavaScript
   * 
   * @param x The independent variable values
   * @param y The dependent variable values
   * @returns The linear regression result
   */
  private linearRegressionJs(x: number[], y: number[]): LinearRegressionResult {
    if (x.length !== y.length) {
      throw new Error('x and y arrays must have the same length');
    }

    if (x.length < 2) {
      throw new Error('At least 2 data points are required for linear regression');
    }

    // Calculate means
    const n = x.length;
    const meanX = x.reduce((sum, value) => sum + value, 0) / n;
    const meanY = y.reduce((sum, value) => sum + value, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - meanX;
      const yDiff = y[i] - meanY;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    if (denominator === 0) {
      throw new Error('Division by zero in linear regression');
    }

    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;

    // Calculate R-squared
    let ssTotal = 0;
    let ssResidual = 0;

    for (let i = 0; i < n; i++) {
      const yPred = slope * x[i] + intercept;
      const yDiff = y[i] - meanY;
      const residual = y[i] - yPred;

      ssTotal += yDiff * yDiff;
      ssResidual += residual * residual;
    }

    const rSquared = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);

    return {
      slope,
      intercept,
      r_squared: rSquared,
    };
  }

  /**
   * Predict y values using linear regression using JavaScript
   * 
   * @param x The independent variable values
   * @param slope The slope of the regression line
   * @param intercept The y-intercept of the regression line
   * @returns The predicted y values
   */
  private linearRegressionPredictJs(x: number[], slope: number, intercept: number): number[] {
    return x.map(value => slope * value + intercept);
  }

  /**
   * Perform k-means clustering on 2D data using JavaScript
   * 
   * @param data The data points as a flat array [x1, y1, x2, y2, ...]
   * @param k The number of clusters
   * @param maxIterations The maximum number of iterations
   * @returns The k-means clustering result
   */
  private kMeansClusteringJs(data: number[], k: number, maxIterations: number): KMeansClusteringResult {
    if (data.length % 2 !== 0) {
      throw new Error('Data must be a flat array of 2D points [x1, y1, x2, y2, ...]');
    }

    const numPoints = data.length / 2;

    if (numPoints < k) {
      throw new Error('Number of points must be greater than or equal to k');
    }

    // Convert flat array to points
    const points: [number, number][] = [];
    for (let i = 0; i < data.length; i += 2) {
      points.push([data[i], data[i + 1]]);
    }

    // Initialize centroids using k-means++ initialization
    const centroids: [number, number][] = [];

    // Choose the first centroid randomly
    const firstIndex = Math.floor(Math.random() * numPoints);
    centroids.push([points[firstIndex][0], points[firstIndex][1]]);

    // Choose the remaining centroids
    for (let i = 1; i < k; i++) {
      const distances: number[] = [];

      // Calculate the distance from each point to the nearest centroid
      for (let j = 0; j < numPoints; j++) {
        let minDist = Infinity;

        for (let l = 0; l < centroids.length; l++) {
          const dx = points[j][0] - centroids[l][0];
          const dy = points[j][1] - centroids[l][1];
          const dist = dx * dx + dy * dy;

          if (dist < minDist) {
            minDist = dist;
          }
        }

        distances.push(minDist);
      }

      // Choose the next centroid with probability proportional to distance squared
      let sumDistances = 0;
      for (const dist of distances) {
        sumDistances += dist;
      }

      let target = Math.random() * sumDistances;
      let nextIndex = 0;

      for (let j = 0; j < distances.length; j++) {
        target -= distances[j];
        if (target <= 0) {
          nextIndex = j;
          break;
        }
      }

      centroids.push([points[nextIndex][0], points[nextIndex][1]]);
    }

    // Initialize assignments
    const assignments: number[] = Array(numPoints).fill(0);
    let converged = false;
    let iteration = 0;

    // Run k-means algorithm
    while (!converged && iteration < maxIterations) {
      // Assign points to clusters
      let changed = false;

      for (let i = 0; i < numPoints; i++) {
        let minDist = Infinity;
        let minCluster = 0;

        for (let j = 0; j < k; j++) {
          const dx = points[i][0] - centroids[j][0];
          const dy = points[i][1] - centroids[j][1];
          const dist = dx * dx + dy * dy;

          if (dist < minDist) {
            minDist = dist;
            minCluster = j;
          }
        }

        if (assignments[i] !== minCluster) {
          assignments[i] = minCluster;
          changed = true;
        }
      }

      // Check for convergence
      if (!changed) {
        converged = true;
        break;
      }

      // Update centroids
      const newCentroids: [number, number][] = Array(k).fill([0, 0]);
      const counts: number[] = Array(k).fill(0);

      for (let i = 0; i < numPoints; i++) {
        const cluster = assignments[i];
        newCentroids[cluster][0] += points[i][0];
        newCentroids[cluster][1] += points[i][1];
        counts[cluster]++;
      }

      for (let j = 0; j < k; j++) {
        if (counts[j] > 0) {
          newCentroids[j][0] /= counts[j];
          newCentroids[j][1] /= counts[j];
        } else {
          // If a cluster is empty, reinitialize its centroid
          const randomIndex = Math.floor(Math.random() * numPoints);
          newCentroids[j][0] = points[randomIndex][0];
          newCentroids[j][1] = points[randomIndex][1];
        }
      }

      // Update centroids
      centroids.splice(0, centroids.length, ...newCentroids);

      iteration++;
    }

    // Convert centroids to flat array
    const centroidsFlat: number[] = [];
    for (const centroid of centroids) {
      centroidsFlat.push(centroid[0], centroid[1]);
    }

    return {
      assignments,
      centroids: centroidsFlat,
      iterations: iteration,
      converged,
    };
  }

  /**
   * Perform Principal Component Analysis (PCA) on 2D data using JavaScript
   * 
   * @param data The data points as a flat array [x1, y1, x2, y2, ...]
   * @param numComponents The number of components to keep (1 or 2)
   * @returns The PCA result
   */
  private pcaJs(data: number[], numComponents: number): PCAResult {
    if (data.length % 2 !== 0) {
      throw new Error('Data must be a flat array of 2D points [x1, y1, x2, y2, ...]');
    }

    const numPoints = data.length / 2;

    if (numComponents < 1 || numComponents > 2) {
      throw new Error('Number of components must be 1 or 2 for 2D data');
    }

    // Convert flat array to points
    const points: [number, number][] = [];
    for (let i = 0; i < data.length; i += 2) {
      points.push([data[i], data[i + 1]]);
    }

    // Calculate means
    let meanX = 0;
    let meanY = 0;

    for (const point of points) {
      meanX += point[0];
      meanY += point[1];
    }

    meanX /= numPoints;
    meanY /= numPoints;

    // Center the data
    const centeredPoints: [number, number][] = points.map(point => [
      point[0] - meanX,
      point[1] - meanY,
    ]);

    // Calculate covariance matrix
    let covXX = 0;
    let covXY = 0;
    let covYY = 0;

    for (const point of centeredPoints) {
      covXX += point[0] * point[0];
      covXY += point[0] * point[1];
      covYY += point[1] * point[1];
    }

    covXX /= numPoints;
    covXY /= numPoints;
    covYY /= numPoints;

    // Calculate eigenvalues and eigenvectors
    const trace = covXX + covYY;
    const determinant = covXX * covYY - covXY * covXY;

    const discriminant = trace * trace - 4 * determinant;

    if (discriminant < 0) {
      throw new Error('Negative discriminant in PCA');
    }

    const eigenvalue1 = (trace + Math.sqrt(discriminant)) / 2;
    const eigenvalue2 = (trace - Math.sqrt(discriminant)) / 2;

    // Sort eigenvalues and eigenvectors
    const [lambda1, lambda2] = eigenvalue1 >= eigenvalue2
      ? [eigenvalue1, eigenvalue2]
      : [eigenvalue2, eigenvalue1];

    // Calculate eigenvectors
    let eigenvector1: [number, number] = [0, 0];
    let eigenvector2: [number, number] = [0, 0];

    if (covXY !== 0) {
      eigenvector1 = [lambda1 - covYY, covXY];
      eigenvector2 = [lambda2 - covYY, covXY];
    } else {
      // Special case: covariance matrix is diagonal
      if (covXX >= covYY) {
        eigenvector1 = [1, 0];
        eigenvector2 = [0, 1];
      } else {
        eigenvector1 = [0, 1];
        eigenvector2 = [1, 0];
      }
    }

    // Normalize eigenvectors
    const norm1 = Math.sqrt(eigenvector1[0] * eigenvector1[0] + eigenvector1[1] * eigenvector1[1]);
    eigenvector1[0] /= norm1;
    eigenvector1[1] /= norm1;

    const norm2 = Math.sqrt(eigenvector2[0] * eigenvector2[0] + eigenvector2[1] * eigenvector2[1]);
    eigenvector2[0] /= norm2;
    eigenvector2[1] /= norm2;

    // Calculate explained variance
    const totalVariance = lambda1 + lambda2;
    const explainedVariance1 = lambda1 / totalVariance;
    const explainedVariance2 = lambda2 / totalVariance;

    // Project data onto principal components
    const projected: number[] = [];

    for (const point of centeredPoints) {
      projected.push(point[0] * eigenvector1[0] + point[1] * eigenvector1[1]);

      if (numComponents > 1) {
        projected.push(point[0] * eigenvector2[0] + point[1] * eigenvector2[1]);
      }
    }

    // Create components array
    const components: number[] = [eigenvector1[0], eigenvector1[1]];

    if (numComponents > 1) {
      components.push(eigenvector2[0], eigenvector2[1]);
    }

    // Create explained variance array
    const explainedVariance: number[] = [explainedVariance1];

    if (numComponents > 1) {
      explainedVariance.push(explainedVariance2);
    }

    return {
      components,
      projected,
      explained_variance: explainedVariance,
      mean_x: meanX,
      mean_y: meanY,
    };
  }
}
