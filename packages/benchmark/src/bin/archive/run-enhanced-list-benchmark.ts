#!/usr/bin/env node
/**
 * Run Enhanced List Benchmark
 *
 * This script runs benchmarks for the enhanced List implementation.
 */

import { runBenchmarks, saveResults } from '../custom/enhanced-list-benchmark';

async function main(): Promise<void> {
  console.log('Running Enhanced List Benchmarks...');
  const results = await runBenchmarks();
  await saveResults(results);
  console.log('Benchmarks completed!');
}

main().catch(console.error);
