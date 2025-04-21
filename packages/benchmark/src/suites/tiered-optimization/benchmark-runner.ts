/**
 * Benchmark runner for tiered optimization
 */
import { NumericArrayBenchmark, NumericArrayOperation } from './numeric-array-benchmark';
import { ListBenchmark, ListOperation } from './list-benchmark';

/**
 * Benchmark runner options
 */
export interface BenchmarkRunnerOptions {
  /**
   * Whether to run numeric array benchmarks
   */
  runNumericArrayBenchmarks?: boolean;

  /**
   * Whether to run list benchmarks
   */
  runListBenchmarks?: boolean;

  /**
   * Numeric array operations to benchmark
   */
  numericArrayOperations?: NumericArrayOperation[];

  /**
   * List operations to benchmark
   */
  listOperations?: ListOperation[];

  /**
   * List element types to benchmark
   */
  listElementTypes?: ('number' | 'string' | 'object')[];

  /**
   * Whether to use adaptive thresholds
   */
  useAdaptiveThresholds?: boolean;

  /**
   * Input size configuration
   */
  inputSizes?: {
    min: number;
    max: number;
    steps: number;
  };

  /**
   * Number of iterations for each benchmark
   */
  iterations?: number;
}

/**
 * Default benchmark runner options
 */
const DEFAULT_OPTIONS: Required<BenchmarkRunnerOptions> = {
  runNumericArrayBenchmarks: true,
  runListBenchmarks: true,
  numericArrayOperations: ['map', 'filter', 'reduce', 'sort', 'mapFilter', 'sum', 'average', 'min', 'max'],
  listOperations: ['map', 'filter', 'reduce', 'sort', 'mapFilter', 'mapReduce', 'filterReduce', 'mapFilterReduce'],
  listElementTypes: ['number', 'string', 'object'],
  useAdaptiveThresholds: true,
  inputSizes: {
    min: 100,
    max: 1000000,
    steps: 10,
  },
  iterations: 5,
};

/**
 * Benchmark runner for tiered optimization
 */
export class BenchmarkRunner {
  /**
   * Options for the benchmark runner
   */
  private readonly options: Required<BenchmarkRunnerOptions>;

  /**
   * Create a new benchmark runner
   * @param options Options for the benchmark runner
   */
  constructor(options: BenchmarkRunnerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Run all benchmarks
   */
  public async run(): Promise<void> {
    console.log('Running tiered optimization benchmarks');
    console.log('=====================================');
    console.log(`Adaptive thresholds: ${this.options.useAdaptiveThresholds ? 'enabled' : 'disabled'}`);
    console.log(`Input sizes: ${this.options.inputSizes.min} to ${this.options.inputSizes.max} (${this.options.inputSizes.steps} steps)`);
    console.log(`Iterations: ${this.options.iterations}`);
    console.log('');

    // Run numeric array benchmarks
    if (this.options.runNumericArrayBenchmarks) {
      await this.runNumericArrayBenchmarks();
    }

    // Run list benchmarks
    if (this.options.runListBenchmarks) {
      await this.runListBenchmarks();
    }

    console.log('\nAll benchmarks completed.');
  }

  /**
   * Run numeric array benchmarks
   */
  private async runNumericArrayBenchmarks(): Promise<void> {
    console.log('Running numeric array benchmarks');
    console.log('===============================');

    for (const operation of this.options.numericArrayOperations) {
      const benchmark = new NumericArrayBenchmark({
        operation,
        useAdaptiveThresholds: this.options.useAdaptiveThresholds,
        inputSizes: this.options.inputSizes,
        iterations: this.options.iterations,
      });

      await benchmark.run();
    }
  }

  /**
   * Run list benchmarks
   */
  private async runListBenchmarks(): Promise<void> {
    console.log('Running list benchmarks');
    console.log('=====================');

    for (const operation of this.options.listOperations) {
      for (const elementType of this.options.listElementTypes) {
        const benchmark = new ListBenchmark({
          operation,
          elementType,
          useAdaptiveThresholds: this.options.useAdaptiveThresholds,
          inputSizes: this.options.inputSizes,
          iterations: this.options.iterations,
        });

        await benchmark.run();
      }
    }
  }
}
