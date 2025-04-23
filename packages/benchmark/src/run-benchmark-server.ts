/**
 * Script to run the benchmark server
 */

import path from 'path';

import { startBenchmarkServer } from './server/benchmark-server';

/**
 * Run the benchmark server
 */
function runBenchmarkServer(): void {
  console.log('Starting benchmark server...');

  // Parse command line arguments
  const port = parseInt(process.env.PORT || '3000', 10);
  const resultsDir = process.env.RESULTS_DIR || path.join(process.cwd(), 'benchmark-results');

  // Start the server
  startBenchmarkServer({ port, resultsDir });
}

/**
 * Run the script from the command line
 */
if (require.main === module) {
  runBenchmarkServer();
}
