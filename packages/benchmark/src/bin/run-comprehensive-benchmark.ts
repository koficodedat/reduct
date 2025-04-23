#!/usr/bin/env node
/**
 * Run Comprehensive Benchmark
 *
 * This script runs comprehensive benchmarks comparing List vs. native arrays.
 */

import { runDataTypeBenchmarkAndSave } from '../custom/data-type-benchmark';
import { runImmutabilityBenchmarkAndSave } from '../custom/immutability-benchmark';
import { runOperationPatternBenchmarkAndSave } from '../custom/operation-pattern-benchmark';
import { runSizeVariationBenchmarkAndSave } from '../custom/size-variation-benchmark';

async function main(): Promise<void> {
  console.log('Running Comprehensive Benchmarks...');
  
  // Run size variation benchmark
  await runSizeVariationBenchmarkAndSave();
  
  // Run data type benchmark
  await runDataTypeBenchmarkAndSave();
  
  // Run operation pattern benchmark
  await runOperationPatternBenchmarkAndSave();
  
  // Run immutability benchmark
  await runImmutabilityBenchmarkAndSave();
  
  console.log('All benchmarks completed!');
}

main().catch(console.error);
