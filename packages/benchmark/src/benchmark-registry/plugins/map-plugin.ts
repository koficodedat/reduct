/**
 * Map Benchmark Plugin
 * 
 * Provides benchmarks for map data structures.
 * 
 * @packageDocumentation
 */

import { BaseBenchmarkPlugin } from '../plugin';
import { AdapterFactory } from '../adapter-factory';
import { BenchmarkOperation, BenchmarkSpecialCase } from '../types';

/**
 * Creates a random map of the specified size
 * 
 * @param size - Size of the map
 * @returns Map with random key-value pairs
 */
function createRandomMap(size: number): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < size; i++) {
    map.set(`key${i}`, Math.floor(Math.random() * 1000));
  }
  return map;
}

/**
 * Creates a map with sequential keys
 * 
 * @param size - Size of the map
 * @returns Map with sequential key-value pairs
 */
function createSequentialMap(size: number): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < size; i++) {
    map.set(`key${i}`, i);
  }
  return map;
}

/**
 * Creates a map with string values
 * 
 * @param size - Size of the map
 * @returns Map with string values
 */
function createStringValueMap(size: number): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < size; i++) {
    map.set(`key${i}`, `value${i}`);
  }
  return map;
}

/**
 * Creates a map with object values
 * 
 * @param size - Size of the map
 * @returns Map with object values
 */
function createObjectValueMap(size: number): Map<string, object> {
  const map = new Map<string, object>();
  for (let i = 0; i < size; i++) {
    map.set(`key${i}`, { id: i, value: `value${i}` });
  }
  return map;
}

/**
 * Map benchmark plugin
 */
export class MapBenchmarkPlugin extends BaseBenchmarkPlugin {
  name = 'map-benchmark-plugin';
  description = 'Provides benchmarks for map data structures';

  /**
   * Register map benchmarks
   */
  register(): void {
    // Register adapters for map operations
    this.registerMapAdapters();

    // Register map benchmark definition
    this.registerBenchmark(
      this.createBenchmarkDefinition(
        'map',
        'Map Benchmarks',
        'data-structure',
        this.createMapOperations(),
        {
          description: 'Benchmarks for map data structures',
          setupFn: createRandomMap,
          specialCases: this.createMapSpecialCases(),
          defaultInputSizes: [100, 1000, 10000],
          defaultIterations: 1000,
          tags: ['map', 'dictionary', 'hash-map'],
          examples: [
            'benchmark map --operations get,set,has',
            'benchmark map --implementations reduct-map,native-map',
            'benchmark map --special-case string-values'
          ]
        }
      )
    );
  }

  /**
   * Register adapters for map operations
   */
  private registerMapAdapters(): void {
    // Access operations
    AdapterFactory.registerAdapter('map', 'get', (instance: Map<any, any>, key: any) => instance.get(key));
    AdapterFactory.registerAdapter('map', 'has', (instance: Map<any, any>, key: any) => instance.has(key));
    
    // Modification operations
    AdapterFactory.registerAdapter('map', 'set', (instance: Map<any, any>, key: any, value: any) => {
      const copy = new Map(instance);
      copy.set(key, value);
      return copy;
    });
    AdapterFactory.registerAdapter('map', 'delete', (instance: Map<any, any>, key: any) => {
      const copy = new Map(instance);
      copy.delete(key);
      return copy;
    });
    AdapterFactory.registerAdapter('map', 'clear', (instance: Map<any, any>) => {
      const copy = new Map(instance);
      copy.clear();
      return copy;
    });
    
    // Iteration operations
    AdapterFactory.registerAdapter('map', 'forEach', (instance: Map<any, any>, callback: (value: any, key: any) => void) => {
      instance.forEach(callback);
    });
    AdapterFactory.registerAdapter('map', 'entries', (instance: Map<any, any>) => {
      return Array.from(instance.entries());
    });
    AdapterFactory.registerAdapter('map', 'keys', (instance: Map<any, any>) => {
      return Array.from(instance.keys());
    });
    AdapterFactory.registerAdapter('map', 'values', (instance: Map<any, any>) => {
      return Array.from(instance.values());
    });
    
    // Utility operations
    AdapterFactory.registerAdapter('map', 'size', (instance: Map<any, any>) => instance.size);
  }

  /**
   * Create map operations
   * 
   * @returns Array of map operations
   */
  private createMapOperations(): BenchmarkOperation[] {
    const operations: BenchmarkOperation[] = [];
    
    // Access operations
    operations.push(this.createOperation(
      'get',
      AdapterFactory.getAdapter('map', 'get')!,
      'Get a value by key'
    ));
    operations.push(this.createOperation(
      'has',
      AdapterFactory.getAdapter('map', 'has')!,
      'Check if a key exists'
    ));
    
    // Modification operations
    operations.push(this.createOperation(
      'set',
      AdapterFactory.getAdapter('map', 'set')!,
      'Set a key-value pair'
    ));
    operations.push(this.createOperation(
      'delete',
      AdapterFactory.getAdapter('map', 'delete')!,
      'Delete a key-value pair'
    ));
    operations.push(this.createOperation(
      'clear',
      AdapterFactory.getAdapter('map', 'clear')!,
      'Clear all key-value pairs'
    ));
    
    // Iteration operations
    operations.push(this.createOperation(
      'forEach',
      AdapterFactory.getAdapter('map', 'forEach')!,
      'Execute a function for each key-value pair'
    ));
    operations.push(this.createOperation(
      'entries',
      AdapterFactory.getAdapter('map', 'entries')!,
      'Get all key-value pairs as an array'
    ));
    operations.push(this.createOperation(
      'keys',
      AdapterFactory.getAdapter('map', 'keys')!,
      'Get all keys as an array'
    ));
    operations.push(this.createOperation(
      'values',
      AdapterFactory.getAdapter('map', 'values')!,
      'Get all values as an array'
    ));
    
    // Utility operations
    operations.push(this.createOperation(
      'size',
      AdapterFactory.getAdapter('map', 'size')!,
      'Get the number of key-value pairs'
    ));
    
    return operations;
  }

  /**
   * Create special cases for map benchmarks
   * 
   * @returns Array of special cases
   */
  private createMapSpecialCases(): BenchmarkSpecialCase[] {
    return [
      this.createSpecialCase(
        'random',
        createRandomMap,
        'Random map with number values'
      ),
      this.createSpecialCase(
        'sequential',
        createSequentialMap,
        'Map with sequential keys and values'
      ),
      this.createSpecialCase(
        'string-values',
        createStringValueMap,
        'Map with string values'
      ),
      this.createSpecialCase(
        'object-values',
        createObjectValueMap,
        'Map with object values'
      )
    ];
  }
}
