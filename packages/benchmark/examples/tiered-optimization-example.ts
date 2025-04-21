/**
 * Example script to run a specific tiered optimization benchmark
 */
import { NumericArrayBenchmark } from '../src/suites/tiered-optimization';

// Create and run a numeric array map benchmark with adaptive thresholds
const benchmark = new NumericArrayBenchmark({
  operation: 'map',
  useAdaptiveThresholds: true,
  inputSizes: {
    min: 1000,
    max: 1000000,
    steps: 5,
  },
  iterations: 3,
});

// Run the benchmark
benchmark.run().catch(error => {
  console.error('Error running benchmark:', error);
  process.exit(1);
});
