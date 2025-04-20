/**
 * Example demonstrating the profiling system
 */

import { List } from '@reduct/data-structures';
import { 
  enableProfiling, 
  disableProfiling, 
  generateProfilingReport,
  clearProfilingData,
  getProfilingSystem
} from '@reduct/data-structures/src/profiling';
import { 
  generateChunkPoolReport, 
  clearChunkPoolStats 
} from '@reduct/data-structures/src/profiling/chunk-pool-monitor';
import { 
  generateNodeCacheReport, 
  clearNodeCacheStats 
} from '@reduct/data-structures/src/profiling/node-cache-monitor';
import { 
  generateMemoryReport, 
  clearMemoryStats 
} from '@reduct/data-structures/src/profiling/memory-monitor';
import fs from 'fs';
import path from 'path';

// Enable profiling with custom options
enableProfiling({
  enabled: true,
  logToConsole: false,
  collectMemoryData: true,
  samplingRate: 1.0, // Profile every operation for this example
  maxEntries: 10000
});

// Clear any existing profiling data
clearProfilingData();
clearChunkPoolStats();
clearNodeCacheStats();
clearMemoryStats();

console.log('Running profiling example...');

// Create a list and perform various operations
let list = List.empty<number>();

// Append elements to trigger transitions between representations
console.log('Appending elements...');
for (let i = 0; i < 100; i++) {
  list = list.append(i);
}

// Prepend elements
console.log('Prepending elements...');
for (let i = 0; i < 20; i++) {
  list = list.prepend(i);
}

// Get elements
console.log('Getting elements...');
for (let i = 0; i < list.size; i++) {
  list.get(i);
}

// Set elements
console.log('Setting elements...');
for (let i = 0; i < 50; i++) {
  list = list.set(i, i * 2);
}

// Insert elements
console.log('Inserting elements...');
for (let i = 0; i < 10; i++) {
  list = list.insert(i * 5, i * 10);
}

// Remove elements
console.log('Removing elements...');
for (let i = 0; i < 10; i++) {
  list = list.remove(i * 3);
}

// Map, filter, reduce
console.log('Mapping, filtering, reducing...');
list.map(x => x * 2);
list.filter(x => x % 2 === 0);
list.reduce((acc, x) => acc + x, 0);

// Slice
console.log('Slicing...');
list.slice(10, 50);

// Concat
console.log('Concatenating...');
list = list.concat(List.from([1, 2, 3, 4, 5]));

// Transient operations
console.log('Transient operations...');
const transient = list.asTransient();
for (let i = 0; i < 20; i++) {
  transient.append(i * 100);
}
list = transient.asPersistent();

// Generate reports
console.log('Generating reports...');

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Generate and save profiling report
const profilingReport = generateProfilingReport();
fs.writeFileSync(path.join(reportsDir, 'profiling-report.md'), profilingReport);

// Generate and save chunk pool report
const chunkPoolReport = generateChunkPoolReport();
fs.writeFileSync(path.join(reportsDir, 'chunk-pool-report.md'), chunkPoolReport);

// Generate and save node cache report
const nodeCacheReport = generateNodeCacheReport();
fs.writeFileSync(path.join(reportsDir, 'node-cache-report.md'), nodeCacheReport);

// Generate and save memory report
const memoryReport = generateMemoryReport();
fs.writeFileSync(path.join(reportsDir, 'memory-report.md'), memoryReport);

// Get profiling summary
const profiler = getProfilingSystem();
const summary = profiler.getSummary();

console.log('Profiling summary:');
console.log(`- Total operations: ${Object.values(summary.operationCounts).reduce((a, b) => a + b, 0)}`);
console.log(`- Chunk pool hit rate: ${(summary.poolStats.hitRate * 100).toFixed(2)}%`);
console.log(`- Node cache hit rate: ${(summary.cacheStats.hitRate * 100).toFixed(2)}%`);
console.log(`- Transitions: ${Object.keys(summary.transitionStats).length}`);

console.log('Reports saved to:');
console.log(`- ${path.join(reportsDir, 'profiling-report.md')}`);
console.log(`- ${path.join(reportsDir, 'chunk-pool-report.md')}`);
console.log(`- ${path.join(reportsDir, 'node-cache-report.md')}`);
console.log(`- ${path.join(reportsDir, 'memory-report.md')}`);

// Disable profiling
disableProfiling();
