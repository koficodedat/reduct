/**
 * Complex Comparison Example
 * 
 * This example demonstrates how to use the complex comparison system
 * to compare different data structures with similar capabilities.
 */

import { ComparisonBuilder, runComplexComparison, formatComplexComparisonResult } from '../src/comparison';
import { registerCapability, updateImplementationCapabilities, updateOperationRequiredCapabilities } from '../src';
import * as fs from 'fs';

// Register capabilities for existing implementations
updateImplementationCapabilities('reduct-list', ['sequence', 'mappable', 'filterable', 'reducible']);
updateImplementationCapabilities('native-array', ['sequence', 'mappable', 'filterable', 'reducible']);
updateImplementationCapabilities('reduct-map', ['key-value-store']);
updateImplementationCapabilities('native-map', ['key-value-store']);
updateImplementationCapabilities('plain-object', ['key-value-store']);
updateImplementationCapabilities('reduct-stack', ['stack', 'mappable', 'filterable']);
updateImplementationCapabilities('native-array-stack', ['stack', 'mappable', 'filterable']);

// Register required capabilities for operations
updateOperationRequiredCapabilities('get', ['sequence']);
updateOperationRequiredCapabilities('map', ['mappable']);
updateOperationRequiredCapabilities('filter', ['filterable']);
updateOperationRequiredCapabilities('reduce', ['reducible']);
updateOperationRequiredCapabilities('has', ['key-value-store']);
updateOperationRequiredCapabilities('set', ['key-value-store']);
updateOperationRequiredCapabilities('delete', ['key-value-store']);
updateOperationRequiredCapabilities('push', ['stack']);
updateOperationRequiredCapabilities('pop', ['stack']);
updateOperationRequiredCapabilities('peek', ['stack']);

// Example 1: Compare all sequence implementations
function compareSequences() {
  const builder = new ComparisonBuilder()
    .name('Sequence Comparison')
    .description('Comparing different sequence implementations')
    .withCapability('sequence')
    .withOperations(['get', 'map', 'filter'])
    .withInputSizes([1000, 10000])
    .withOptions({
      iterations: 100,
      warmupIterations: 10
    })
    .addTestCase('Random Access', (size) => {
      return {
        array: Array.from({ length: size }, (_, i) => i),
        indices: Array.from({ length: 100 }, () => Math.floor(Math.random() * size))
      };
    });

  const config = builder.build();
  const results = runComplexComparison(config);
  
  console.log(formatComplexComparisonResult(results));
  
  // Save results to file
  fs.writeFileSync('sequence-comparison.md', formatComplexComparisonResult(results));
}

// Example 2: Compare key-value stores
function compareKeyValueStores() {
  const builder = new ComparisonBuilder()
    .name('Key-Value Store Comparison')
    .description('Comparing different key-value store implementations')
    .withCapability('key-value-store')
    .withOperations(['get', 'has', 'set', 'delete'])
    .withInputSizes([1000, 10000])
    .withOptions({
      iterations: 100,
      warmupIterations: 10
    })
    .addTestCase('String Keys', (size) => {
      const keys = Array.from({ length: size }, (_, i) => `key${i}`);
      const values = Array.from({ length: size }, (_, i) => i);
      const entries = keys.map((key, i) => [key, values[i]]);
      
      return {
        entries,
        lookupKeys: Array.from({ length: 100 }, () => keys[Math.floor(Math.random() * size)])
      };
    });

  const config = builder.build();
  const results = runComplexComparison(config);
  
  console.log(formatComplexComparisonResult(results));
  
  // Save results to file
  fs.writeFileSync('key-value-comparison.md', formatComplexComparisonResult(results));
}

// Example 3: Cross-category comparison (lookup performance)
function compareLookupPerformance() {
  const builder = new ComparisonBuilder()
    .name('Lookup Performance Comparison')
    .description('Comparing lookup performance across different data structures')
    .addImplementation('reduct-list', {
      operations: {
        lookup: {
          name: 'List.indexOf',
          adapter: (list, testCase) => {
            const { values, lookupValue } = testCase;
            return list.indexOf(lookupValue);
          }
        }
      }
    })
    .addImplementation('reduct-map', {
      operations: {
        lookup: {
          name: 'Map.has',
          adapter: (map, testCase) => {
            const { lookupValue } = testCase;
            return map.has(lookupValue.toString());
          }
        }
      }
    })
    .addImplementation('native-array', {
      operations: {
        lookup: {
          name: 'Array.indexOf',
          adapter: (array, testCase) => {
            const { lookupValue } = testCase;
            return array.indexOf(lookupValue);
          }
        }
      }
    })
    .addImplementation('native-map', {
      operations: {
        lookup: {
          name: 'Map.has',
          adapter: (map, testCase) => {
            const { lookupValue } = testCase;
            return map.has(lookupValue.toString());
          }
        }
      }
    })
    .withOperations(['lookup'])
    .withInputSizes([1000, 10000, 100000])
    .withOptions({
      iterations: 100,
      warmupIterations: 10
    })
    .addTestCase('Random Lookup', (size) => {
      const values = Array.from({ length: size }, (_, i) => i);
      const lookupValue = values[Math.floor(Math.random() * size)];
      
      return {
        values,
        lookupValue
      };
    });

  const config = builder.build();
  const results = runComplexComparison(config);
  
  console.log(formatComplexComparisonResult(results));
  
  // Save results to file
  fs.writeFileSync('lookup-comparison.md', formatComplexComparisonResult(results));
}

// Run the examples
console.log('Running sequence comparison...');
compareSequences();

console.log('\nRunning key-value store comparison...');
compareKeyValueStores();

console.log('\nRunning lookup performance comparison...');
compareLookupPerformance();
