#!/usr/bin/env node
/**
 * CLI script to run tiered optimization benchmarks
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { BenchmarkRunner, BenchmarkRunnerOptions } from '../suites/tiered-optimization';

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('numeric', {
    alias: 'n',
    type: 'boolean',
    description: 'Run numeric array benchmarks',
    default: true,
  })
  .option('list', {
    alias: 'l',
    type: 'boolean',
    description: 'Run list benchmarks',
    default: true,
  })
  .option('adaptive', {
    alias: 'a',
    type: 'boolean',
    description: 'Use adaptive thresholds',
    default: true,
  })
  .option('min-size', {
    alias: 'min',
    type: 'number',
    description: 'Minimum input size',
    default: 100,
  })
  .option('max-size', {
    alias: 'max',
    type: 'number',
    description: 'Maximum input size',
    default: 1000000,
  })
  .option('steps', {
    alias: 's',
    type: 'number',
    description: 'Number of steps between min and max',
    default: 10,
  })
  .option('iterations', {
    alias: 'i',
    type: 'number',
    description: 'Number of iterations for each benchmark',
    default: 5,
  })
  .option('numeric-operations', {
    type: 'array',
    description: 'Numeric array operations to benchmark',
    default: ['map', 'filter', 'reduce', 'sort', 'mapFilter', 'sum', 'average', 'min', 'max'],
  })
  .option('list-operations', {
    type: 'array',
    description: 'List operations to benchmark',
    default: ['map', 'filter', 'reduce', 'sort', 'mapFilter', 'mapReduce', 'filterReduce', 'mapFilterReduce'],
  })
  .option('element-types', {
    type: 'array',
    description: 'List element types to benchmark',
    default: ['number', 'string', 'object'],
  })
  .help()
  .alias('help', 'h')
  .parseSync();

// Create benchmark runner options
const options: BenchmarkRunnerOptions = {
  runNumericArrayBenchmarks: argv.numeric,
  runListBenchmarks: argv.list,
  useAdaptiveThresholds: argv.adaptive,
  inputSizes: {
    min: argv.minSize,
    max: argv.maxSize,
    steps: argv.steps,
  },
  iterations: argv.iterations,
  numericArrayOperations: argv.numericOperations as any[],
  listOperations: argv.listOperations as any[],
  listElementTypes: argv.elementTypes as any[],
};

// Create and run benchmark runner
const runner = new BenchmarkRunner(options);
runner.run().catch(error => {
  console.error('Error running benchmarks:', error);
  process.exit(1);
});
