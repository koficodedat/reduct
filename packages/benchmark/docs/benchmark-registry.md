# Benchmark Registry System

The Benchmark Registry System provides a scalable and extensible architecture for defining, discovering, and running benchmarks. It allows easy addition of new data structures and algorithms without modifying existing code.

## Key Components

### 1. Registry-Based System

The `BenchmarkRegistry` provides a central registry for benchmark definitions:

```typescript
// Register a benchmark definition
BenchmarkRegistry.register({
  type: 'list',
  name: 'List Benchmarks',
  category: 'data-structure',
  operations: [
    { name: 'get', adapter: listGetAdapter },
    { name: 'map', adapter: listMapAdapter }
  ],
  setupFn: (size) => Array.from({ length: size }, (_, i) => i)
});

// Get a benchmark definition
const listBenchmark = BenchmarkRegistry.get('list');

// Get all benchmark definitions
const allBenchmarks = BenchmarkRegistry.getAll();

// Get benchmarks by category
const dataStructureBenchmarks = BenchmarkRegistry.getByCategory('data-structure');
```

### 2. Plugin Architecture

The plugin system allows for modular registration of benchmarks:

```typescript
// Create a benchmark plugin
class ListBenchmarkPlugin extends BaseBenchmarkPlugin {
  name = 'list-benchmark-plugin';
  
  register(): void {
    // Register benchmark definitions
    this.registerBenchmark({
      type: 'list',
      name: 'List Benchmarks',
      category: 'data-structure',
      operations: [
        this.createOperation('get', listGetAdapter),
        this.createOperation('map', listMapAdapter)
      ]
    });
  }
}

// Register the plugin
PluginRegistry.register(new ListBenchmarkPlugin());

// Initialize all plugins
PluginRegistry.initializeAll();

// Register benchmarks from all plugins
PluginRegistry.registerAll();
```

### 3. Configuration-Driven Approach

The configuration system provides a flexible way to define benchmark runs:

```typescript
// Create a benchmark configuration
const config = createBenchmarkConfig('list', {
  operations: ['get', 'map'],
  inputSizes: [100, 1000, 10000],
  iterations: 1000
});

// Create a comparison configuration
const comparisonConfig = createComparisonConfig(
  'list',
  ['reduct-list', 'native-array'],
  ['get', 'map']
);

// Validate a configuration
validateBenchmarkConfig(config);
```

### 4. Adapter Factory Pattern

The adapter factory provides a way to dynamically create adapters for operations:

```typescript
// Register an adapter
AdapterFactory.registerAdapter('list', 'get', listGetAdapter);

// Get an adapter
const getAdapter = AdapterFactory.getAdapter('list', 'get');

// Get supported operations for a data structure
const listOperations = AdapterFactory.getSupportedOperations('list');

// Get data structures that support an operation
const dataStructuresWithGet = AdapterFactory.getDataStructuresForOperation('get');
```

## Creating a Custom Benchmark

To create a custom benchmark, follow these steps:

1. Create a plugin that extends `BaseBenchmarkPlugin`
2. Register adapters for your operations using `AdapterFactory`
3. Create a benchmark definition with operations, setup functions, etc.
4. Register your plugin with `PluginRegistry`

Example:

```typescript
class MyBenchmarkPlugin extends BaseBenchmarkPlugin {
  name = 'my-benchmark-plugin';
  
  register(): void {
    // Register adapters
    AdapterFactory.registerAdapter('my-data-structure', 'operation1', myAdapter1);
    AdapterFactory.registerAdapter('my-data-structure', 'operation2', myAdapter2);
    
    // Register benchmark definition
    this.registerBenchmark(
      this.createBenchmarkDefinition(
        'my-data-structure',
        'My Data Structure Benchmarks',
        'data-structure',
        [
          this.createOperation('operation1', myAdapter1),
          this.createOperation('operation2', myAdapter2)
        ],
        {
          setupFn: (size) => createMyDataStructure(size),
          defaultInputSizes: [100, 1000, 10000]
        }
      )
    );
  }
}

// Register the plugin
PluginRegistry.register(new MyBenchmarkPlugin());
```

## Integration with CLI

The benchmark registry system can be integrated with the CLI to provide a user-friendly interface for running benchmarks:

```typescript
// Example CLI command
cli
  .command('benchmark <type>')
  .description('Run benchmarks for a specific type')
  .option('-o, --operations <operations>', 'Operations to benchmark')
  .option('-i, --implementations <implementations>', 'Implementations to benchmark')
  .option('-s, --sizes <sizes>', 'Input sizes to test')
  .action((type, options) => {
    const config = createBenchmarkConfig(type, {
      operations: options.operations?.split(','),
      implementations: options.implementations?.split(','),
      inputSizes: options.sizes?.split(',').map(Number)
    });
    
    // Run the benchmark with the configuration
    runBenchmark(config);
  });
```

## Best Practices

1. **Use the plugin system** for registering benchmarks to keep the code modular
2. **Create adapters** for operations to ensure consistent benchmarking
3. **Provide metadata** like descriptions and examples to make benchmarks discoverable
4. **Use configuration objects** rather than hardcoding benchmark parameters
5. **Separate benchmark definitions** from implementation details
