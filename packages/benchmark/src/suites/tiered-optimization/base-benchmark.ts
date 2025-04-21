/**
 * Base benchmark class for tiered optimization
 */
/**
 * Format benchmark results as markdown
 * @param options Options for formatting
 * @returns Markdown string
 */
function formatBenchmarkResultMarkdown(options: {
  title: string;
  description: string;
  results: Array<{
    name: string;
    mean: number;
    standardDeviation: number;
    min: number;
    max: number;
    iterations: number;
    times: number[];
  }>;
}): string {
  const { title, description, results } = options;

  // Create markdown
  let markdown = `# ${title}\n\n${description}\n\n`;

  // Add timestamp
  markdown += `## Benchmark Results\n\n`;
  markdown += `Timestamp: ${new Date().toISOString()}\n\n`;

  // Add results table
  markdown += `| Name | Mean (ms) | Std Dev (ms) | Min (ms) | Max (ms) | Iterations |\n`;
  markdown += `| ---- | --------- | ------------ | -------- | -------- | ---------- |\n`;

  for (const result of results) {
    markdown += `| ${result.name} | ${result.mean.toFixed(3)} | ${result.standardDeviation.toFixed(3)} | ${result.min.toFixed(3)} | ${result.max.toFixed(3)} | ${result.iterations} |\n`;
  }

  // Add comparison chart
  markdown += `\n## Comparison Chart\n\n`;
  markdown += `\`\`\`\n`;

  // Find the fastest result
  const fastest = results.reduce((fastest, result) => {
    return result.mean < fastest.mean ? result : fastest;
  }, results[0]);

  // Create chart
  const maxBarLength = 50;

  for (const result of results) {
    const ratio = fastest.mean / result.mean;
    const barLength = Math.round(ratio * maxBarLength);
    const bar = '█'.repeat(barLength);

    markdown += `${result.name.padEnd(30)} ${result.mean.toFixed(3).padStart(10)} ms ${bar} ${(ratio * 100).toFixed(1)}%\n`;
  }

  markdown += `\`\`\`\n`;

  return markdown;
}

/**
 * Run a benchmark
 * @param fn Function to benchmark
 * @param options Benchmark options
 * @returns Benchmark result
 */
async function runBenchmark<T>(fn: () => T, options: { iterations: number; name: string; warmupIterations?: number }): Promise<{
  mean: number;
  standardDeviation: number;
  min: number;
  max: number;
  times: number[];
}> {
  const { iterations, warmupIterations = 0 } = options;

  // Run warmup iterations
  for (let i = 0; i < warmupIterations; i++) {
    fn();
  }

  // Run benchmark iterations
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  // Calculate statistics
  const mean = times.reduce((sum, time) => sum + time, 0) / times.length;

  const squaredDiffs = times.map(time => Math.pow(time - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / times.length;
  const standardDeviation = Math.sqrt(variance);

  const min = Math.min(...times);
  const max = Math.max(...times);

  return {
    mean,
    standardDeviation,
    min,
    max,
    times,
  };
}

/**
 * Accelerator tiers for optimization strategy
 */
export enum AcceleratorTier {
  /**
   * Always use WebAssembly (significant performance benefit)
   */
  HIGH_VALUE = 'high-value',

  /**
   * Use WebAssembly conditionally (based on input characteristics)
   */
  CONDITIONAL = 'conditional',

  /**
   * Prefer JavaScript (WebAssembly overhead outweighs benefits)
   */
  JS_PREFERRED = 'js-preferred'
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  /**
   * Name of the benchmark
   */
  name: string;

  /**
   * Mean execution time in milliseconds
   */
  meanTime: number;

  /**
   * Standard deviation of execution time in milliseconds
   */
  stdDev: number;

  /**
   * Minimum execution time in milliseconds
   */
  minTime: number;

  /**
   * Maximum execution time in milliseconds
   */
  maxTime: number;

  /**
   * Number of iterations
   */
  iterations: number;

  /**
   * Raw execution times in milliseconds
   */
  times: number[];
}
import * as fs from 'fs';
import * as path from 'path';

/**
 * Input size configuration for benchmarks
 */
export interface InputSizeConfig {
  /**
   * Minimum input size
   */
  min: number;

  /**
   * Maximum input size
   */
  max: number;

  /**
   * Number of steps between min and max
   */
  steps: number;
}

/**
 * Base benchmark options
 */
export interface BaseBenchmarkOptions {
  /**
   * Input size configuration
   */
  inputSizes?: InputSizeConfig;

  /**
   * Number of iterations for each input size
   */
  iterations?: number;

  /**
   * Whether to save results to a file
   */
  saveResults?: boolean;

  /**
   * Directory to save results to
   */
  resultsDir?: string;

  /**
   * Whether to compare with native implementation
   */
  compareWithNative?: boolean;

  /**
   * Whether to use adaptive thresholds
   */
  useAdaptiveThresholds?: boolean;

  /**
   * Configuration for adaptive thresholds
   */
  adaptiveConfig?: any;
}

/**
 * Default benchmark options
 */
const DEFAULT_OPTIONS: Required<BaseBenchmarkOptions> = {
  inputSizes: {
    min: 100,
    max: 1000000,
    steps: 10,
  },
  iterations: 5,
  saveResults: true,
  resultsDir: path.join(process.cwd(), 'packages/benchmark/reports'),
  compareWithNative: true,
  useAdaptiveThresholds: false,
  adaptiveConfig: {
    maxSamples: 100,
    minSamplesForAdaptation: 10,
    highValueMinSpeedup: 1.5,
    conditionalMinSpeedup: 1.1,
    safetyMargin: 0.1,
    adaptationFrequency: 20,
  },
};

/**
 * Base benchmark class for tiered optimization
 */
export abstract class BaseBenchmark<T, R> {
  /**
   * Options for the benchmark
   */
  protected options: Required<BaseBenchmarkOptions>;

  /**
   * Results of the benchmark
   */
  protected results: BenchmarkResult[] = [];

  /**
   * Create a new benchmark
   * @param name Name of the benchmark
   * @param description Description of the benchmark
   * @param options Options for the benchmark
   */
  constructor(
    protected readonly name: string,
    protected readonly description: string,
    options: BaseBenchmarkOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Create results directory if it doesn't exist
    if (this.options.saveResults && !fs.existsSync(this.options.resultsDir)) {
      fs.mkdirSync(this.options.resultsDir, { recursive: true });
    }
  }

  /**
   * Run the benchmark
   */
  public async run(): Promise<void> {
    console.log(`Running benchmark: ${this.name}`);
    console.log(this.description);
    console.log('='.repeat(80));

    // Generate input sizes
    const inputSizes = this.generateInputSizes();

    // Run benchmark for each input size
    for (const size of inputSizes) {
      await this.runForInputSize(size);
    }

    // Save results
    if (this.options.saveResults) {
      this.saveResults();
    }

    // Print summary
    this.printSummary();
  }

  /**
   * Generate input sizes
   * @returns Array of input sizes
   */
  protected generateInputSizes(): number[] {
    const { min, max, steps } = this.options.inputSizes;
    const inputSizes: number[] = [];

    // Use logarithmic scale for input sizes
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const size = Math.round(min * Math.pow(max / min, t));
      inputSizes.push(size);
    }

    return inputSizes;
  }

  /**
   * Run benchmark for a specific input size
   * @param size Input size
   */
  protected async runForInputSize(size: number): Promise<void> {
    console.log(`\nRunning benchmark for input size: ${size}`);

    // Generate input
    const input = this.generateInput(size);

    // Run benchmark for each tier
    for (const tier of Object.values(AcceleratorTier)) {
      const result = await this.runForTier(input, tier);
      this.results.push(result);

      console.log(`  ${tier}: ${result.meanTime.toFixed(3)} ms`);
    }

    // Run benchmark for native implementation
    if (this.options.compareWithNative) {
      const result = await this.runForNative(input);
      this.results.push(result);

      console.log(`  native: ${result.meanTime.toFixed(3)} ms`);
    }
  }

  /**
   * Run benchmark for a specific tier
   * @param input Input for the benchmark
   * @param tier Tier to use
   * @returns Benchmark result
   */
  protected async runForTier(input: T, tier: AcceleratorTier): Promise<BenchmarkResult> {
    const accelerator = this.createAccelerator(tier);

    // Create benchmark function
    const benchmarkFn = () => {
      return accelerator.execute(input);
    };

    // Run benchmark
    const result = await runBenchmark(benchmarkFn, {
      iterations: this.options.iterations,
      name: `${this.name}-${tier}-${this.getInputSize(input)}`,
      warmupIterations: 2,
    });

    return {
      name: `${this.name}-${tier}-${this.getInputSize(input)}`,
      meanTime: result.mean,
      stdDev: result.standardDeviation,
      minTime: result.min,
      maxTime: result.max,
      iterations: this.options.iterations,
      times: result.times,
    };
  }

  /**
   * Run benchmark for native implementation
   * @param input Input for the benchmark
   * @returns Benchmark result
   */
  protected async runForNative(input: T): Promise<BenchmarkResult> {
    // Create benchmark function
    const benchmarkFn = () => {
      return this.executeNative(input);
    };

    // Run benchmark
    const result = await runBenchmark(benchmarkFn, {
      iterations: this.options.iterations,
      name: `${this.name}-native-${this.getInputSize(input)}`,
      warmupIterations: 2,
    });

    return {
      name: `${this.name}-native-${this.getInputSize(input)}`,
      meanTime: result.mean,
      stdDev: result.standardDeviation,
      minTime: result.min,
      maxTime: result.max,
      iterations: this.options.iterations,
      times: result.times,
    };
  }

  /**
   * Save benchmark results to a file
   */
  protected saveResults(): void {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${this.name}-${timestamp}.md`;
    const filepath = path.join(this.options.resultsDir, filename);

    // Generate markdown report
    const markdown = formatBenchmarkResultMarkdown({
      title: this.name,
      description: this.description,
      results: this.results.map(result => ({
        name: result.name,
        mean: result.meanTime,
        standardDeviation: result.stdDev,
        min: result.minTime,
        max: result.maxTime,
        iterations: result.iterations,
        times: result.times || [],
      })),
    });

    // Save to file
    fs.writeFileSync(filepath, markdown);

    console.log(`\nResults saved to: ${filepath}`);
  }

  /**
   * Print summary of benchmark results
   */
  protected printSummary(): void {
    console.log('\nBenchmark Summary:');
    console.log('-'.repeat(80));

    // Group results by input size
    const resultsBySize = new Map<number, BenchmarkResult[]>();

    for (const result of this.results) {
      const size = this.extractInputSize(result.name);

      if (size) {
        if (!resultsBySize.has(size)) {
          resultsBySize.set(size, []);
        }

        resultsBySize.get(size)!.push(result);
      }
    }

    // Print summary for each input size
    for (const [size, results] of resultsBySize.entries()) {
      console.log(`\nInput size: ${size}`);

      // Find fastest implementation
      let fastest = results[0];

      for (const result of results) {
        if (result.meanTime < fastest.meanTime) {
          fastest = result;
        }

        // Extract tier from name
        const tierMatch = result.name.match(/-([^-]+)-\d+$/);
        const tier = tierMatch ? tierMatch[1] : 'unknown';

        console.log(`  ${tier}: ${result.meanTime.toFixed(3)} ms`);
      }

      // Extract tier from name
      const tierMatch = fastest.name.match(/-([^-]+)-\d+$/);
      const tier = tierMatch ? tierMatch[1] : 'unknown';

      console.log(`  Fastest: ${tier} (${fastest.meanTime.toFixed(3)} ms)`);
    }

    console.log('\nBenchmark completed.');
  }

  /**
   * Extract input size from benchmark name
   * @param name Benchmark name
   * @returns Input size
   */
  protected extractInputSize(name: string): number | null {
    const match = name.match(/-(\d+)$/);

    if (match) {
      return parseInt(match[1], 10);
    }

    return null;
  }

  /**
   * Generate input for the benchmark
   * @param size Size of the input
   * @returns Input for the benchmark
   */
  protected abstract generateInput(size: number): T;

  /**
   * Get the size of the input
   * @param input Input for the benchmark
   * @returns Size of the input
   */
  protected abstract getInputSize(input: T): number;

  /**
   * Create an accelerator for the benchmark
   * @param tier Tier to use
   * @returns Accelerator for the benchmark
   */
  protected abstract createAccelerator(tier: AcceleratorTier): { execute: (input: T) => R };

  /**
   * Execute the native implementation
   * @param input Input for the benchmark
   * @returns Result of the native implementation
   */
  protected abstract executeNative(input: T): R;
}
