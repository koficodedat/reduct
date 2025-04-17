/**
 * Example of using the benchmark registry system
 */

import { 
  BenchmarkRegistry, 
  BaseBenchmarkPlugin, 
  PluginRegistry,
  AdapterFactory,
  createBenchmarkConfig,
  createComparisonConfig,
  initializeBenchmarkRegistry
} from '../src/benchmark-registry/main';

// Example adapter for list get operation
const listGetAdapter = (instance: any, index: number) => {
  return instance[index];
};

// Example adapter for list map operation
const listMapAdapter = (instance: any, fn: (item: any) => any) => {
  return instance.map(fn);
};

// Example plugin for list benchmarks
class ListBenchmarkPlugin extends BaseBenchmarkPlugin {
  name = 'list-benchmark-plugin';
  description = 'Provides benchmarks for list data structures';

  register(): void {
    // Register adapters
    AdapterFactory.registerAdapter('list', 'get', listGetAdapter);
    AdapterFactory.registerAdapter('list', 'map', listMapAdapter);

    // Register benchmark definition
    this.registerBenchmark(
      this.createBenchmarkDefinition(
        'list',
        'List Benchmarks',
        'data-structure',
        [
          this.createOperation('get', listGetAdapter, 'Get an element by index'),
          this.createOperation('map', listMapAdapter, 'Map over all elements')
        ],
        {
          description: 'Benchmarks for list data structures',
          setupFn: (size) => Array.from({ length: size }, (_, i) => i),
          defaultInputSizes: [100, 1000, 10000],
          defaultIterations: 1000,
          tags: ['list', 'array', 'sequence'],
          examples: [
            'benchmark list --operations get,map',
            'benchmark list --implementations reduct-list,native-array'
          ]
        }
      )
    );
  }
}

// Register the plugin
PluginRegistry.register(new ListBenchmarkPlugin());

// Initialize the benchmark registry
initializeBenchmarkRegistry();

// Example of using the registry
console.log('Available benchmark types:');
console.log(Array.from(BenchmarkRegistry.getAll().keys()));

console.log('\nList benchmark definition:');
console.log(BenchmarkRegistry.get('list'));

console.log('\nOperations for list:');
console.log(BenchmarkRegistry.getOperations('list'));

console.log('\nData structures that support get operation:');
console.log(AdapterFactory.getDataStructuresForOperation('get'));

// Example of creating configurations
const listConfig = createBenchmarkConfig('list', {
  operations: ['get', 'map'],
  inputSizes: [100, 1000],
  iterations: 100
});

console.log('\nList benchmark configuration:');
console.log(listConfig);

const comparisonConfig = createComparisonConfig(
  'list',
  ['reduct-list', 'native-array'],
  ['get', 'map']
);

console.log('\nComparison configuration:');
console.log(comparisonConfig);
