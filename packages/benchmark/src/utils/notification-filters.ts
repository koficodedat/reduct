/**
 * Notification filters to reduce noise
 */
import { RegressionDetectionResult } from './regression-detection';

/**
 * Filter function for notifications
 */
export type NotificationFilter = (result: RegressionDetectionResult, options?: any) => RegressionDetectionResult;

/**
 * Filter by threshold
 * @param result Regression detection result
 * @param options Filter options
 * @returns Filtered regression detection result
 */
export const thresholdFilter: NotificationFilter = (result, options = {}) => {
  const { regressionThreshold = 10, improvementThreshold = 10 } = options;
  
  return {
    ...result,
    regressions: result.regressions.filter(
      (regression) => Math.abs(regression.percentageChange) >= regressionThreshold
    ),
    improvements: result.improvements.filter(
      (improvement) => Math.abs(improvement.percentageChange) >= improvementThreshold
    ),
  };
};

/**
 * Filter by operation
 * @param result Regression detection result
 * @param options Filter options
 * @returns Filtered regression detection result
 */
export const operationFilter: NotificationFilter = (result, options = {}) => {
  const { operations = [] } = options;
  
  if (!operations.length) {
    return result;
  }
  
  const filterByOperation = (item: any) => {
    const operation = item.name.split('-')[0];
    return operations.includes(operation);
  };
  
  return {
    ...result,
    regressions: result.regressions.filter(filterByOperation),
    improvements: result.improvements.filter(filterByOperation),
    noChanges: result.noChanges.filter(filterByOperation),
    newBenchmarks: result.newBenchmarks.filter((benchmark) => {
      const operation = benchmark.operation;
      return operations.includes(operation);
    }),
    missingBenchmarks: result.missingBenchmarks.filter((benchmark) => {
      const operation = benchmark.operation;
      return operations.includes(operation);
    }),
  };
};

/**
 * Filter by tier
 * @param result Regression detection result
 * @param options Filter options
 * @returns Filtered regression detection result
 */
export const tierFilter: NotificationFilter = (result, options = {}) => {
  const { tiers = [] } = options;
  
  if (!tiers.length) {
    return result;
  }
  
  const filterByTier = (item: any) => {
    const tier = item.name.split('-')[1];
    return tiers.includes(tier);
  };
  
  return {
    ...result,
    regressions: result.regressions.filter(filterByTier),
    improvements: result.improvements.filter(filterByTier),
    noChanges: result.noChanges.filter(filterByTier),
    newBenchmarks: result.newBenchmarks.filter((benchmark) => {
      const tier = benchmark.tier;
      return tiers.includes(tier);
    }),
    missingBenchmarks: result.missingBenchmarks.filter((benchmark) => {
      const tier = benchmark.tier;
      return tiers.includes(tier);
    }),
  };
};

/**
 * Filter by input size
 * @param result Regression detection result
 * @param options Filter options
 * @returns Filtered regression detection result
 */
export const inputSizeFilter: NotificationFilter = (result, options = {}) => {
  const { minSize = 0, maxSize = Infinity } = options;
  
  const filterBySize = (item: any) => {
    const size = parseInt(item.name.split('-')[2], 10);
    return size >= minSize && size <= maxSize;
  };
  
  return {
    ...result,
    regressions: result.regressions.filter(filterBySize),
    improvements: result.improvements.filter(filterBySize),
    noChanges: result.noChanges.filter(filterBySize),
    newBenchmarks: result.newBenchmarks.filter((benchmark) => {
      const size = benchmark.inputSize;
      return size >= minSize && size <= maxSize;
    }),
    missingBenchmarks: result.missingBenchmarks.filter((benchmark) => {
      const size = benchmark.inputSize;
      return size >= minSize && size <= maxSize;
    }),
  };
};

/**
 * Apply multiple filters
 * @param result Regression detection result
 * @param filters Filters to apply
 * @returns Filtered regression detection result
 */
export const applyFilters = (
  result: RegressionDetectionResult,
  filters: Array<{ filter: NotificationFilter; options?: any }>
): RegressionDetectionResult => {
  return filters.reduce(
    (filteredResult, { filter, options }) => filter(filteredResult, options),
    result
  );
};
