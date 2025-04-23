/**
 * Benchmark suite for testing WebAssembly performance across different input sizes
 */

// Internal shared types
import { AcceleratorTier } from '@reduct/shared-types/wasm/accelerator';

// Local imports from the same package
import { BenchmarkResult, BenchmarkSuite } from '../../types';
import { benchmark as runBenchmark } from '../../utils';

class HybridAccelerator {
  constructor(_name: string, _dataType: string, _operation: string, _options: any) {}
  determineTier: () => AcceleratorTier = () => AcceleratorTier.JS_PREFERRED;
  execute(input: any): any {
    return input;
  }
}

// Mock implementation for formatBenchmarkResult
function formatBenchmarkResult(result: BenchmarkResult): string {
  return `Time: ${result.timeMs}ms, Ops/sec: ${result.opsPerSecond}`;
}

/**
 * Input size categories for benchmarking
 */
export enum InputSizeCategory {
  TINY = 'tiny',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  VERY_LARGE = 'very_large'
}

/**
 * Input size ranges for different categories
 */
export const INPUT_SIZE_RANGES = {
  [InputSizeCategory.TINY]: { min: 1, max: 10 },
  [InputSizeCategory.SMALL]: { min: 11, max: 100 },
  [InputSizeCategory.MEDIUM]: { min: 101, max: 1000 },
  [InputSizeCategory.LARGE]: { min: 1001, max: 10000 },
  [InputSizeCategory.VERY_LARGE]: { min: 10001, max: 100000 }
};

/**
 * Data type categories for benchmarking
 */
export enum DataTypeCategory {
  NUMBER = 'number',
  STRING = 'string',
  OBJECT = 'object',
  MIXED = 'mixed'
}

/**
 * Options for the input size benchmark
 */
export interface InputSizeBenchmarkOptions {
  /**
   * The name of the benchmark
   */
  name: string;

  /**
   * The operation to benchmark
   */
  operation: string;

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
}

/**
 * Benchmark result with input size information
 */
export interface InputSizeBenchmarkResult extends BenchmarkResult {
  /**
   * The input size
   */
  inputSize: number;

  /**
   * The input size category
   */
  sizeCategory: InputSizeCategory;

  /**
   * The data type category
   */
  dataTypeCategory: DataTypeCategory;

  /**
   * The tier used for the benchmark
   */
  tier: AcceleratorTier;
}

/**
 * Benchmark suite for testing WebAssembly performance across different input sizes
 */
export class InputSizeBenchmarkSuite implements BenchmarkSuite {
  /**
   * The name of the benchmark suite
   */
  public readonly name: string;

  /**
   * The operation to benchmark
   */
  private readonly operation: string;

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
   * The results of the benchmark
   */
  private results: InputSizeBenchmarkResult[] = [];

  /**
   * Create a new input size benchmark suite
   *
   * @param options The benchmark options
   */
  constructor(options: InputSizeBenchmarkOptions) {
    this.name = options.name;
    this.operation = options.operation;
    this.sizeCategories = options.sizeCategories || Object.values(InputSizeCategory);
    this.dataTypeCategories = options.dataTypeCategories || [DataTypeCategory.NUMBER];
    this.iterations = options.iterations || 100;
    this.warmupIterations = options.warmupIterations || 10;
  }

  /**
   * Run the benchmark suite
   */
  public async run(): Promise<void> {
    // Clear previous results
    this.results = [];

    // Run benchmarks for each size category and data type
    for (const sizeCategory of this.sizeCategories) {
      for (const dataTypeCategory of this.dataTypeCategories) {
        // Get the input size range for this category
        const range = INPUT_SIZE_RANGES[sizeCategory];

        // Create inputs of different sizes within the range
        const sizes = [
          range.min,
          Math.floor((range.min + range.max) / 4),
          Math.floor((range.min + range.max) / 2),
          Math.floor(3 * (range.min + range.max) / 4),
          range.max
        ];

        for (const size of sizes) {
          // Create input data
          const input = this.createInput(size, dataTypeCategory);

          // Run benchmarks for each tier
          for (const tier of Object.values(AcceleratorTier)) {
            const result = await this.runBenchmark(input, tier, sizeCategory, dataTypeCategory);
            this.results.push(result);
          }
        }
      }
    }
  }

  /**
   * Create input data for the benchmark
   *
   * @param size The size of the input
   * @param dataType The data type of the input
   * @returns The input data
   */
  private createInput(size: number, dataType: DataTypeCategory): any[] {
    switch (dataType) {
      case DataTypeCategory.NUMBER:
        return Array.from({ length: size }, (_, i) => i);

      case DataTypeCategory.STRING:
        return Array.from({ length: size }, (_, i) => `item-${i}`);

      case DataTypeCategory.OBJECT:
        return Array.from({ length: size }, (_, i) => ({ id: i, value: `value-${i}` }));

      case DataTypeCategory.MIXED:
        return Array.from({ length: size }, (_, i) => {
          const type = i % 3;
          if (type === 0) return i;
          if (type === 1) return `item-${i}`;
          return { id: i, value: `value-${i}` };
        });

      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
  }

  /**
   * Run a benchmark for a specific input and tier
   *
   * @param input The input data
   * @param tier The tier to use
   * @param sizeCategory The input size category
   * @param dataTypeCategory The data type category
   * @returns The benchmark result
   */
  private async runBenchmark(
    input: any[],
    tier: AcceleratorTier,
    sizeCategory: InputSizeCategory,
    dataTypeCategory: DataTypeCategory
  ): Promise<InputSizeBenchmarkResult> {
    // Create a hybrid accelerator for the operation
    const accelerator = new HybridAccelerator('benchmark', 'array', this.operation, {
      implementation: {
        // Simple implementations for common operations
        preprocess: (data: any[]) => data,
        process: (data: any[]) => {
          switch (this.operation) {
            case 'map':
              return data.map(x => typeof x === 'number' ? x * 2 : x);
            case 'filter':
              return data.filter(x => typeof x === 'number' ? x % 2 === 0 : true);
            case 'reduce':
              return data.reduce((acc, x) => {
                if (typeof x === 'number') return acc + x;
                if (typeof x === 'string') return acc + x.length;
                return acc + 1;
              }, 0);
            case 'sort':
              return [...data].sort();
            case 'find':
              return data.find(x => typeof x === 'number' ? x === data.length / 2 : false);
            default:
              return data;
          }
        },
        postprocess: (data: any) => data,
        jsImplementation: (data: any[]) => {
          switch (this.operation) {
            case 'map':
              return data.map(x => typeof x === 'number' ? x * 2 : x);
            case 'filter':
              return data.filter(x => typeof x === 'number' ? x % 2 === 0 : true);
            case 'reduce':
              return data.reduce((acc, x) => {
                if (typeof x === 'number') return acc + x;
                if (typeof x === 'string') return acc + x.length;
                return acc + 1;
              }, 0);
            case 'sort':
              return [...data].sort();
            case 'find':
              return data.find(x => typeof x === 'number' ? x === data.length / 2 : false);
            default:
              return data;
          }
        }
      }
    });

    // Force the accelerator to use the specified tier
    const originalDetermineTier = accelerator.determineTier;
    accelerator.determineTier = () => tier;

    // Create benchmark function
    const benchmarkFn = () => {
      return accelerator.execute(input);
    };

    // Run benchmark
    const result = await runBenchmark(benchmarkFn, {
      iterations: this.iterations,
      name: `${this.name}-${tier}-${sizeCategory}-${dataTypeCategory}-${input.length}`,
      warmupIterations: this.warmupIterations,
    });

    // Restore the original determineTier method
    accelerator.determineTier = originalDetermineTier;

    // Return the result with additional information
    return {
      ...result,
      inputSize: input.length,
      sizeCategory,
      dataTypeCategory,
      tier
    };
  }

  /**
   * Get the results of the benchmark
   *
   * @returns The benchmark results
   */
  public getResults(): InputSizeBenchmarkResult[] {
    return this.results;
  }

  /**
   * Format the benchmark results as a string
   *
   * @returns The formatted benchmark results
   */
  public formatResults(): string {
    let output = `# ${this.name} Benchmark Results\n\n`;

    // Group results by size category and data type
    const groupedResults = new Map<string, InputSizeBenchmarkResult[]>();

    for (const result of this.results) {
      const key = `${result.sizeCategory}-${result.dataTypeCategory}-${result.inputSize}`;
      if (!groupedResults.has(key)) {
        groupedResults.set(key, []);
      }
      groupedResults.get(key)!.push(result);
    }

    // Format each group
    for (const [key, results] of groupedResults.entries()) {
      const [sizeCategory, dataTypeCategory, inputSize] = key.split('-');

      output += `## ${sizeCategory} ${dataTypeCategory} (size: ${inputSize})\n\n`;

      // Sort results by tier
      results.sort((a, b) => {
        const tierOrder = {
          [AcceleratorTier.JS_PREFERRED]: 0,
          [AcceleratorTier.CONDITIONAL]: 1,
          [AcceleratorTier.HIGH_VALUE]: 2
        };
        return tierOrder[a.tier] - tierOrder[b.tier];
      });

      // Format each result
      for (const result of results) {
        output += `### ${result.tier}\n\n`;
        output += formatBenchmarkResult(result) + '\n\n';
      }

      // Calculate speedup between tiers
      if (results.length > 1) {
        const jsResult = results.find(r => r.tier === AcceleratorTier.JS_PREFERRED);
        const conditionalResult = results.find(r => r.tier === AcceleratorTier.CONDITIONAL);
        const highValueResult = results.find(r => r.tier === AcceleratorTier.HIGH_VALUE);

        output += `### Speedup\n\n`;

        if (jsResult && conditionalResult) {
          const speedup = jsResult.executionTime / conditionalResult.executionTime;
          output += `JS vs CONDITIONAL: ${speedup.toFixed(2)}x\n\n`;
        }

        if (jsResult && highValueResult) {
          const speedup = jsResult.executionTime / highValueResult.executionTime;
          output += `JS vs HIGH_VALUE: ${speedup.toFixed(2)}x\n\n`;
        }

        if (conditionalResult && highValueResult) {
          const speedup = conditionalResult.executionTime / highValueResult.executionTime;
          output += `CONDITIONAL vs HIGH_VALUE: ${speedup.toFixed(2)}x\n\n`;
        }
      }
    }

    // Add summary
    output += `## Summary\n\n`;
    output += `- Operation: ${this.operation}\n`;
    output += `- Size categories: ${this.sizeCategories.join(', ')}\n`;
    output += `- Data types: ${this.dataTypeCategories.join(', ')}\n`;
    output += `- Iterations: ${this.iterations}\n`;
    output += `- Warmup iterations: ${this.warmupIterations}\n\n`;

    // Add performance crossover points
    output += `## Performance Crossover Points\n\n`;

    // Find the crossover points where WebAssembly becomes faster than JavaScript
    const crossoverPoints = this.findCrossoverPoints();

    if (crossoverPoints.length === 0) {
      output += `No crossover points found. WebAssembly is either always faster or always slower.\n\n`;
    } else {
      for (const point of crossoverPoints) {
        output += `- ${point.dataTypeCategory} data: WebAssembly becomes faster at input size ${point.inputSize} (${point.sizeCategory})\n`;
      }
      output += '\n';
    }

    return output;
  }

  /**
   * Find the crossover points where WebAssembly becomes faster than JavaScript
   *
   * @returns The crossover points
   */
  private findCrossoverPoints(): Array<{
    dataTypeCategory: DataTypeCategory;
    sizeCategory: InputSizeCategory;
    inputSize: number;
  }> {
    const crossoverPoints: Array<{
      dataTypeCategory: DataTypeCategory;
      sizeCategory: InputSizeCategory;
      inputSize: number;
    }> = [];

    // Group results by data type
    const groupedByDataType = new Map<DataTypeCategory, InputSizeBenchmarkResult[]>();

    for (const result of this.results) {
      if (!groupedByDataType.has(result.dataTypeCategory)) {
        groupedByDataType.set(result.dataTypeCategory, []);
      }
      groupedByDataType.get(result.dataTypeCategory)!.push(result);
    }

    // Find crossover points for each data type
    for (const [dataTypeCategory, results] of groupedByDataType.entries()) {
      // Group by input size
      const groupedBySize = new Map<number, InputSizeBenchmarkResult[]>();

      for (const result of results) {
        if (!groupedBySize.has(result.inputSize)) {
          groupedBySize.set(result.inputSize, []);
        }
        groupedBySize.get(result.inputSize)!.push(result);
      }

      // Sort input sizes
      const sizes = Array.from(groupedBySize.keys()).sort((a, b) => a - b);

      // Find the crossover point
      let crossoverSize: number | null = null;
      let crossoverCategory: InputSizeCategory | null = null;

      for (const size of sizes) {
        const sizeResults = groupedBySize.get(size)!;

        const jsResult = sizeResults.find(r => r.tier === AcceleratorTier.JS_PREFERRED);
        const wasmResult = sizeResults.find(r => r.tier === AcceleratorTier.HIGH_VALUE);

        if (jsResult && wasmResult && wasmResult.executionTime < jsResult.executionTime) {
          crossoverSize = size;
          crossoverCategory = sizeResults[0].sizeCategory;
          break;
        }
      }

      if (crossoverSize !== null && crossoverCategory !== null) {
        crossoverPoints.push({
          dataTypeCategory,
          sizeCategory: crossoverCategory,
          inputSize: crossoverSize
        });
      }
    }

    return crossoverPoints;
  }
}
