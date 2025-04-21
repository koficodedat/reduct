/**
 * Example demonstrating WebAssembly-accelerated machine learning algorithms
 */
import { MachineLearningAccelerator } from '../src/accelerators/data-structures/machine-learning';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('WebAssembly-Accelerated Machine Learning Example');
console.log('==============================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a machine learning accelerator
const mlAccelerator = new MachineLearningAccelerator();

// Create test data for linear regression
console.log('\nCreating test data for linear regression...');
const size = 1000000;
const generateLinearData = (size: number, slope: number, intercept: number, noise: number): [number[], number[]] => {
  const x = Array.from({ length: size }, () => Math.random() * 100);
  const y = x.map(value => slope * value + intercept + (Math.random() - 0.5) * 2 * noise);
  return [x, y];
};

const [x, y] = generateLinearData(size, 2.5, 10, 5);
console.log(`Generated ${size} data points`);

// Linear Regression
console.log('\nLinear Regression:');
console.log('-----------------');
console.time('Linear Regression (WASM)');
const regression = mlAccelerator.linearRegression(x, y);
console.timeEnd('Linear Regression (WASM)');
console.log(`Slope: ${regression.slope.toFixed(4)}`);
console.log(`Intercept: ${regression.intercept.toFixed(4)}`);
console.log(`R-squared: ${regression.r_squared.toFixed(4)}`);

// Linear Regression Prediction
console.log('\nLinear Regression Prediction:');
console.log('---------------------------');
const testX = [25, 50, 75];
console.time('Linear Regression Prediction (WASM)');
const predictions = mlAccelerator.linearRegressionPredict(testX, regression.slope, regression.intercept);
console.timeEnd('Linear Regression Prediction (WASM)');
console.log(`Test X values: ${testX.join(', ')}`);
console.log(`Predicted Y values: ${predictions.map(v => v.toFixed(4)).join(', ')}`);

// Create test data for clustering
console.log('\nCreating test data for clustering...');
const generateClusterData = (numClusters: number, pointsPerCluster: number, spread: number): number[] => {
  const data: number[] = [];

  for (let i = 0; i < numClusters; i++) {
    const centerX = Math.random() * 100;
    const centerY = Math.random() * 100;

    for (let j = 0; j < pointsPerCluster; j++) {
      const x = centerX + (Math.random() - 0.5) * 2 * spread;
      const y = centerY + (Math.random() - 0.5) * 2 * spread;
      data.push(x, y);
    }
  }

  return data;
};

const clusterSize = 10000;
const clusterData = generateClusterData(5, clusterSize, 5);
console.log(`Generated ${clusterSize * 5} data points in 5 clusters`);

// K-means Clustering
console.log('\nK-means Clustering:');
console.log('-----------------');
console.time('K-means Clustering (WASM)');
const clustering = mlAccelerator.kMeansClustering(clusterData, 5, 100);
console.timeEnd('K-means Clustering (WASM)');
console.log(`Iterations: ${clustering.iterations}`);
console.log(`Converged: ${clustering.converged}`);

// Count points in each cluster
const clusterCounts = Array(5).fill(0);
clustering.assignments.forEach(cluster => {
  clusterCounts[cluster]++;
});
console.log(`Points per cluster: ${clusterCounts.join(', ')}`);
console.log(`Centroids: ${clustering.centroids.map(v => v.toFixed(2)).join(', ')}`);

// Create test data for PCA
console.log('\nCreating test data for PCA...');
const generatePCAData = (size: number, angle: number, scale: [number, number]): number[] => {
  const data: number[] = [];
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  for (let i = 0; i < size; i++) {
    const x = (Math.random() - 0.5) * 2 * scale[0];
    const y = (Math.random() - 0.5) * 2 * scale[1];

    // Rotate the point
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;

    data.push(rotatedX, rotatedY);
  }

  return data;
};

const pcaSize = 10000;
const pcaData = generatePCAData(pcaSize, Math.PI / 4, [10, 2]);
console.log(`Generated ${pcaSize} data points`);

// Principal Component Analysis
console.log('\nPrincipal Component Analysis:');
console.log('--------------------------');
console.time('PCA (WASM)');
const pca = mlAccelerator.pca(pcaData, 2);
console.timeEnd('PCA (WASM)');
console.log(`Components: ${pca.components.map(v => v.toFixed(4)).join(', ')}`);
console.log(`Explained variance: ${pca.explained_variance.map(v => v.toFixed(4)).join(', ')}`);
console.log(`Mean: (${pca.mean_x.toFixed(4)}, ${pca.mean_y.toFixed(4)})`);

// Compare with JavaScript implementations
console.log('\nComparison with JavaScript Implementations:');
console.log('----------------------------------------');

// Linear Regression
console.time('Linear Regression (JS)');
const linearRegressionJs = (x: number[], y: number[]) => {
  const n = x.length;
  const meanX = x.reduce((sum, value) => sum + value, 0) / n;
  const meanY = y.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - meanX;
    const yDiff = y[i] - meanY;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

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

  return { slope, intercept, r_squared: rSquared };
};
const regressionJs = linearRegressionJs(x, y);
console.timeEnd('Linear Regression (JS)');
console.log(`Slope (JS): ${regressionJs.slope.toFixed(4)}`);
console.log(`Intercept (JS): ${regressionJs.intercept.toFixed(4)}`);
console.log(`R-squared (JS): ${regressionJs.r_squared.toFixed(4)}`);

// K-means Clustering (simplified for comparison)
console.time('K-means Clustering (JS simplified)');
const kMeansClusteringJsSimplified = (data: number[], k: number, _maxIterations: number) => {
  const numPoints = data.length / 2;

  // Initialize centroids randomly
  const centroids: number[] = [];
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * numPoints);
    centroids.push(data[randomIndex * 2], data[randomIndex * 2 + 1]);
  }

  // Initialize assignments
  let assignments: number[] = Array(numPoints).fill(0);
  let iteration = 0;

  // Run a few iterations for comparison
  for (let iter = 0; iter < 5; iter++) {
    // Assign points to clusters
    for (let i = 0; i < numPoints; i++) {
      let minDist = Infinity;
      let minCluster = 0;

      for (let j = 0; j < k; j++) {
        const dx = data[i * 2] - centroids[j * 2];
        const dy = data[i * 2 + 1] - centroids[j * 2 + 1];
        const dist = dx * dx + dy * dy;

        if (dist < minDist) {
          minDist = dist;
          minCluster = j;
        }
      }

      assignments[i] = minCluster;
    }

    // Update centroids
    const newCentroids = Array(k * 2).fill(0);
    const counts = Array(k).fill(0);

    for (let i = 0; i < numPoints; i++) {
      const cluster = assignments[i];
      newCentroids[cluster * 2] += data[i * 2];
      newCentroids[cluster * 2 + 1] += data[i * 2 + 1];
      counts[cluster]++;
    }

    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        newCentroids[j * 2] /= counts[j];
        newCentroids[j * 2 + 1] /= counts[j];
      }
    }

    // Update centroids
    for (let j = 0; j < k * 2; j++) {
      centroids[j] = newCentroids[j];
    }

    iteration++;
  }

  return { iterations: iteration };
};
const clusteringJs = kMeansClusteringJsSimplified(clusterData, 5, 5);
console.timeEnd('K-means Clustering (JS simplified)');
console.log(`Iterations (JS): ${clusteringJs.iterations}`);

console.log('\nWebAssembly-accelerated machine learning example completed.');
