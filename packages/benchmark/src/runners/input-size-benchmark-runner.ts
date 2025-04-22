/**
 * Runner for the input size benchmark suite
 */

import { InputSizeBenchmarkSuite, DataTypeCategory, InputSizeCategory } from '../suites/wasm-optimization/input-size-benchmark';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Options for the input size benchmark runner
 */
export interface InputSizeBenchmarkRunnerOptions {
  /**
   * The operations to benchmark
   */
  operations: string[];

  /**
   * The input size categories to benchmark
   */
  sizeCategories?: InputSizeCategory[];

  /**
   * The data type categories to benchmark
   */
  dataTypeCategories?: DataTypeCategory[];

  /**
   * The number of iterations to run for each benchmark
   */
  iterations?: number;

  /**
   * The number of warmup iterations to run before each benchmark
   */
  warmupIterations?: number;

  /**
   * The output directory for benchmark reports
   */
  outputDir?: string;
}

/**
 * Runner for the input size benchmark suite
 */
export class InputSizeBenchmarkRunner {
  /**
   * The operations to benchmark
   */
  private readonly operations: string[];

  /**
   * The input size categories to benchmark
   */
  private readonly sizeCategories: InputSizeCategory[];

  /**
   * The data type categories to benchmark
   */
  private readonly dataTypeCategories: DataTypeCategory[];

  /**
   * The number of iterations to run for each benchmark
   */
  private readonly iterations: number;

  /**
   * The number of warmup iterations to run before each benchmark
   */
  private readonly warmupIterations: number;

  /**
   * The output directory for benchmark reports
   */
  private readonly outputDir: string;

  /**
   * Create a new input size benchmark runner
   * 
   * @param options The runner options
   */
  constructor(options: InputSizeBenchmarkRunnerOptions) {
    this.operations = options.operations;
    this.sizeCategories = options.sizeCategories || [
      InputSizeCategory.TINY,
      InputSizeCategory.SMALL,
      InputSizeCategory.MEDIUM
    ];
    this.dataTypeCategories = options.dataTypeCategories || [
      DataTypeCategory.NUMBER,
      DataTypeCategory.STRING
    ];
    this.iterations = options.iterations || 50;
    this.warmupIterations = options.warmupIterations || 5;
    this.outputDir = options.outputDir || path.join(process.cwd(), 'packages/benchmark/reports');
  }

  /**
   * Run the benchmarks
   */
  public async run(): Promise<void> {
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Run benchmarks for each operation
    for (const operation of this.operations) {
      console.log(`Running benchmarks for ${operation}...`);

      // Create the benchmark suite
      const suite = new InputSizeBenchmarkSuite({
        name: `${operation}-size-benchmark`,
        operation,
        sizeCategories: this.sizeCategories,
        dataTypeCategories: this.dataTypeCategories,
        iterations: this.iterations,
        warmupIterations: this.warmupIterations
      });

      // Run the benchmark
      await suite.run();

      // Format the results
      const formattedResults = suite.formatResults();

      // Save the results
      const outputPath = path.join(this.outputDir, `${operation}-size-benchmark.md`);
      fs.writeFileSync(outputPath, formattedResults);

      console.log(`Benchmark results saved to ${outputPath}`);
    }
  }
}

/**
 * Run the input size benchmark runner
 */
export async function runInputSizeBenchmarks(options: InputSizeBenchmarkRunnerOptions): Promise<void> {
  const runner = new InputSizeBenchmarkRunner(options);
  await runner.run();
}

/**
 * Run the benchmark from the command line
 */
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const operations = args.length > 0 ? args : ['map', 'filter', 'reduce', 'sort', 'find'];

  // Run the benchmarks
  runInputSizeBenchmarks({ operations })
    .then(() => console.log('Benchmarks completed'))
    .catch(error => console.error('Error running benchmarks:', error));
}
