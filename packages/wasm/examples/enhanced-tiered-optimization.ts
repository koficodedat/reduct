/**
 * Example demonstrating the enhanced tiered optimization framework
 */
import { ListAccelerator } from '../src/accelerators/data-structures/list-accelerator';
import { adaptiveThresholdManager } from '../src/utils/adaptive-threshold-manager';
import { performanceCounter } from '../src/utils/performance-counter';
import { AcceleratorTier } from '../src/accelerators/accelerator';
import { InputCharacteristicsAnalyzer, InputSizeCategory, InputDataType } from '../src/utils/input-characteristics';

// Create a list accelerator with adaptive thresholds
const listAccelerator = new ListAccelerator({
  thresholds: {
    adaptive: true,
    minArraySize: 1000,
    adaptiveConfig: {
      minInputSize: 1000,
      maxInputSize: 100000,
      minSpeedupRatio: 1.1,
      maxSamples: 100,
      adaptiveThresholds: true,
      learningRate: 0.1,
    },
  },
});

// Function to generate test data
function generateTestData(size: number, type: 'random' | 'sequential' | 'constant' = 'random'): number[] {
  if (type === 'sequential') {
    return Array.from({ length: size }, (_, i) => i);
  } else if (type === 'constant') {
    return Array.from({ length: size }, () => 42);
  } else {
    return Array.from({ length: size }, () => Math.random() * 1000);
  }
}

// Function to run a benchmark
async function runBenchmark(sizes: number[]): Promise<void> {
  console.log('Running benchmark...');
  console.log('===================');
  console.log('');
  
  // Run the benchmark for each size
  for (const size of sizes) {
    console.log(`Testing with array size: ${size}`);
    
    // Generate different types of test data
    const randomData = generateTestData(size, 'random');
    const sequentialData = generateTestData(size, 'sequential');
    const constantData = generateTestData(size, 'constant');
    
    // Analyze the characteristics of each dataset
    console.log('  Analyzing data characteristics...');
    const randomCharacteristics = InputCharacteristicsAnalyzer.analyzeArray(randomData);
    const sequentialCharacteristics = InputCharacteristicsAnalyzer.analyzeArray(sequentialData);
    const constantCharacteristics = InputCharacteristicsAnalyzer.analyzeArray(constantData);
    
    console.log(`  Random data: ${randomCharacteristics.dataType}, ${randomCharacteristics.sizeCategory}, ${randomCharacteristics.valueRangeCategory}`);
    console.log(`  Sequential data: ${sequentialCharacteristics.dataType}, ${sequentialCharacteristics.sizeCategory}, ${sequentialCharacteristics.valueRangeCategory}`);
    console.log(`  Constant data: ${constantCharacteristics.dataType}, ${constantCharacteristics.sizeCategory}, ${constantCharacteristics.valueRangeCategory}`);
    
    // Run the map operation on random data
    console.log('  Running map operation on random data...');
    const randomResult = listAccelerator.map(randomData, x => x * 2);
    
    // Run the map operation on sequential data
    console.log('  Running map operation on sequential data...');
    const sequentialResult = listAccelerator.map(sequentialData, x => x * 2);
    
    // Run the map operation on constant data
    console.log('  Running map operation on constant data...');
    const constantResult = listAccelerator.map(constantData, x => x * 2);
    
    // Get the tier that was used for each dataset
    const randomTier = listAccelerator.determineTier(randomData);
    const sequentialTier = listAccelerator.determineTier(sequentialData);
    const constantTier = listAccelerator.determineTier(constantData);
    
    console.log(`  Used tier for random data: ${randomTier}`);
    console.log(`  Used tier for sequential data: ${sequentialTier}`);
    console.log(`  Used tier for constant data: ${constantTier}`);
    
    // Get performance metrics
    const metrics = performanceCounter.getMetrics('data-structures', 'list', 'map');
    console.log(`  Total executions: ${metrics.totalExecutions}`);
    console.log(`  WebAssembly executions: ${metrics.wasmExecutions}`);
    console.log(`  JavaScript executions: ${metrics.jsExecutions}`);
    console.log(`  Average speedup: ${metrics.avgSpeedup.toFixed(2)}x`);
    console.log(`  Time saved: ${metrics.totalTimeSaved.toFixed(2)}ms`);
    
    // Get adaptive threshold
    const threshold = adaptiveThresholdManager.getThreshold('data-structures', 'list', 'map');
    console.log(`  Current threshold: ${threshold}`);
    
    console.log('');
  }
  
  // Print overall statistics
  console.log('Overall Statistics');
  console.log('=================');
  
  const metrics = performanceCounter.getMetrics('data-structures', 'list', 'map');
  console.log(`Total executions: ${metrics.totalExecutions}`);
  console.log(`WebAssembly executions: ${metrics.wasmExecutions} (${(metrics.wasmExecutions / metrics.totalExecutions * 100).toFixed(2)}%)`);
  console.log(`JavaScript executions: ${metrics.jsExecutions} (${(metrics.jsExecutions / metrics.totalExecutions * 100).toFixed(2)}%)`);
  console.log(`Average JavaScript time: ${metrics.avgJsTime.toFixed(2)}ms`);
  console.log(`Average WebAssembly time: ${metrics.avgWasmTime.toFixed(2)}ms`);
  console.log(`Average speedup: ${metrics.avgSpeedup.toFixed(2)}x`);
  console.log(`Maximum speedup: ${metrics.maxSpeedup.toFixed(2)}x`);
  console.log(`Total time saved: ${metrics.totalTimeSaved.toFixed(2)}ms`);
  
  // Print adaptive threshold statistics
  console.log('');
  console.log('Adaptive Threshold Statistics');
  console.log('============================');
  
  const config = adaptiveThresholdManager.config;
  console.log(`Minimum input size: ${config.minInputSize}`);
  console.log(`Maximum input size: ${config.maxInputSize}`);
  console.log(`Minimum speedup ratio: ${config.minSpeedupRatio}`);
  console.log(`Learning rate: ${config.learningRate}`);
  
  const threshold = adaptiveThresholdManager.getThreshold('data-structures', 'list', 'map');
  console.log(`Current threshold for map: ${threshold}`);
  
  const samples = adaptiveThresholdManager.getSamples('data-structures', 'list', 'map');
  console.log(`Number of samples: ${samples.length}`);
  
  if (samples.length > 0) {
    // Calculate average speedup
    const avgSpeedup = samples.reduce((sum, sample) => sum + (sample.jsTime / sample.wasmTime), 0) / samples.length;
    console.log(`Average speedup from samples: ${avgSpeedup.toFixed(2)}x`);
    
    // Print sample distribution
    const sizeDistribution: Record<string, number> = {};
    for (const sample of samples) {
      const size = sample.inputSize;
      sizeDistribution[size] = (sizeDistribution[size] || 0) + 1;
    }
    
    console.log('Sample size distribution:');
    for (const [size, count] of Object.entries(sizeDistribution)) {
      console.log(`  ${size}: ${count}`);
    }
  }
  
  // Test different operations
  console.log('');
  console.log('Testing Different Operations');
  console.log('==========================');
  
  // Generate a large array for testing
  const testArray = generateTestData(50000, 'random');
  
  // Test map operation
  console.log('  Testing map operation...');
  console.time('  map');
  listAccelerator.map(testArray, x => x * 2);
  console.timeEnd('  map');
  
  // Test filter operation
  console.log('  Testing filter operation...');
  console.time('  filter');
  listAccelerator.filter(testArray, x => x > 500);
  console.timeEnd('  filter');
  
  // Test reduce operation
  console.log('  Testing reduce operation...');
  console.time('  reduce');
  listAccelerator.reduce(testArray, (acc, x) => acc + x, 0);
  console.timeEnd('  reduce');
  
  // Test sort operation
  console.log('  Testing sort operation...');
  console.time('  sort');
  listAccelerator.sort(testArray);
  console.timeEnd('  sort');
  
  // Test combined operations
  console.log('  Testing mapFilter operation...');
  console.time('  mapFilter');
  listAccelerator.mapFilter(testArray, x => x * 2, x => x > 1000);
  console.timeEnd('  mapFilter');
  
  console.log('  Testing mapReduce operation...');
  console.time('  mapReduce');
  listAccelerator.mapReduce(testArray, x => x * 2, (acc, x) => acc + x, 0);
  console.timeEnd('  mapReduce');
  
  console.log('  Testing filterReduce operation...');
  console.time('  filterReduce');
  listAccelerator.filterReduce(testArray, x => x > 500, (acc, x) => acc + x, 0);
  console.timeEnd('  filterReduce');
  
  console.log('  Testing mapFilterReduce operation...');
  console.time('  mapFilterReduce');
  listAccelerator.mapFilterReduce(testArray, x => x * 2, x => x > 1000, (acc, x) => acc + x, 0);
  console.timeEnd('  mapFilterReduce');
}

// Run the benchmark with different sizes
const sizes = [10, 100, 1000, 10000, 100000];
runBenchmark(sizes)
  .then(() => console.log('Benchmark complete!'))
  .catch(error => console.error('Error running benchmark:', error));
