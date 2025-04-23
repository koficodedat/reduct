/**
 * Configuration-driven approach for benchmark suites
 * 
 * @packageDocumentation
 */

import { BenchmarkConfig } from './types';

import { BenchmarkRegistry } from './index';

/**
 * Validates a benchmark configuration
 * 
 * @param config - Configuration to validate
 * @throws Error if the configuration is invalid
 */
export function validateBenchmarkConfig(config: BenchmarkConfig): void {
  // Check if type exists
  if (!config.type) {
    throw new Error('Benchmark configuration must include a type');
  }

  // Check if benchmark definition exists
  const definition = BenchmarkRegistry.get(config.type);
  if (!definition) {
    throw new Error(`Benchmark definition for type '${config.type}' not found`);
  }

  // Check operations
  if (config.operations && config.operations.length > 0) {
    const availableOperations = definition.operations.map(op => op.name);
    const invalidOperations = config.operations.filter(op => !availableOperations.includes(op));
    
    if (invalidOperations.length > 0) {
      throw new Error(
        `Invalid operations for benchmark type '${config.type}': ${invalidOperations.join(', ')}. ` +
        `Available operations: ${availableOperations.join(', ')}`
      );
    }
  }

  // Check special case
  if (config.specialCase && definition.specialCases) {
    const availableSpecialCases = definition.specialCases.map(sc => sc.name);
    if (!availableSpecialCases.includes(config.specialCase)) {
      throw new Error(
        `Invalid special case for benchmark type '${config.type}': ${config.specialCase}. ` +
        `Available special cases: ${availableSpecialCases.join(', ')}`
      );
    }
  }
}

/**
 * Completes a benchmark configuration with default values
 * 
 * @param config - Partial configuration
 * @returns Complete configuration with defaults filled in
 */
export function completeBenchmarkConfig(config: Partial<BenchmarkConfig>): BenchmarkConfig {
  if (!config.type) {
    throw new Error('Benchmark configuration must include a type');
  }

  const definition = BenchmarkRegistry.get(config.type);
  if (!definition) {
    throw new Error(`Benchmark definition for type '${config.type}' not found`);
  }

  // Fill in defaults
  return {
    type: config.type,
    operations: config.operations || definition.operations.map(op => op.name),
    inputSizes: config.inputSizes || definition.defaultInputSizes || [100, 1000, 10000],
    iterations: config.iterations || definition.defaultIterations || 1000,
    implementations: config.implementations || [],
    specialCase: config.specialCase
  };
}

/**
 * Creates a benchmark configuration
 * 
 * @param type - Type of benchmark
 * @param options - Additional options
 * @returns Benchmark configuration
 */
export function createBenchmarkConfig(
  type: string,
  options?: Partial<Omit<BenchmarkConfig, 'type'>>
): BenchmarkConfig {
  return completeBenchmarkConfig({
    type,
    ...options
  });
}

/**
 * Creates a benchmark configuration for comparing implementations
 * 
 * @param type - Type of benchmark
 * @param implementations - Implementations to compare
 * @param operations - Operations to benchmark
 * @param options - Additional options
 * @returns Benchmark configuration
 */
export function createComparisonConfig(
  type: string,
  implementations: string[],
  operations?: string[],
  options?: Partial<Omit<BenchmarkConfig, 'type' | 'implementations' | 'operations'>>
): BenchmarkConfig {
  return completeBenchmarkConfig({
    type,
    implementations,
    operations,
    ...options
  });
}
