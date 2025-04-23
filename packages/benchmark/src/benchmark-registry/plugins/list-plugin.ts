/**
 * List Benchmark Plugin
 *
 * Provides benchmarks for list data structures.
 *
 * @packageDocumentation
 */

import { AdapterFactory } from '../adapter-factory';
import { BaseBenchmarkPlugin } from '../plugin';
import { BenchmarkOperation, BenchmarkSpecialCase } from '../types';

/**
 * Creates a random list of the specified size
 *
 * @param size - Size of the list
 * @returns Array of random numbers
 */
function createRandomList(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
}

/**
 * Creates a sorted list of the specified size
 *
 * @param size - Size of the list
 * @returns Sorted array of numbers
 */
function createSortedList(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i);
}

/**
 * Creates a reversed list of the specified size
 *
 * @param size - Size of the list
 * @returns Reversed sorted array of numbers
 */
function createReversedList(size: number): number[] {
  return Array.from({ length: size }, (_, i) => size - i - 1);
}

/**
 * Creates a nearly sorted list of the specified size
 *
 * @param size - Size of the list
 * @returns Nearly sorted array of numbers
 */
function createNearlySortedList(size: number): number[] {
  const list = Array.from({ length: size }, (_, i) => i);
  // Swap about 5% of elements
  const swaps = Math.floor(size * 0.05);
  for (let i = 0; i < swaps; i++) {
    const idx1 = Math.floor(Math.random() * size);
    const idx2 = Math.floor(Math.random() * size);
    const temp = list[idx1];
    list[idx1] = list[idx2];
    list[idx2] = temp;
  }
  return list;
}

/**
 * List benchmark plugin
 */
export class ListBenchmarkPlugin extends BaseBenchmarkPlugin {
  name = 'list-benchmark-plugin';
  description = 'Provides benchmarks for list data structures';

  /**
   * Register list benchmarks
   */
  register(): void {
    // Register adapters for list operations
    this.registerListAdapters();

    // Register list benchmark definition
    this.registerBenchmark(
      this.createBenchmarkDefinition(
        'list',
        'List Benchmarks',
        'data-structure',
        this.createListOperations(),
        {
          description: 'Benchmarks for list data structures',
          setupFn: createRandomList,
          specialCases: this.createListSpecialCases(),
          defaultInputSizes: [100, 1000, 10000],
          defaultIterations: 1000,
          tags: ['list', 'array', 'sequence'],
          examples: [
            'benchmark list --operations get,map,filter',
            'benchmark list --implementations reduct-list,native-array',
            'benchmark list --special-case sorted'
          ]
        }
      )
    );
  }

  /**
   * Register adapters for list operations
   */
  private registerListAdapters(): void {
    // Access operations
    AdapterFactory.registerAdapter('list', 'get', (instance: any[], index: number) => instance[index]);
    AdapterFactory.registerAdapter('list', 'indexOf', (instance: any[], value: any) => instance.indexOf(value));
    AdapterFactory.registerAdapter('list', 'includes', (instance: any[], value: any) => instance.includes(value));

    // Modification operations
    AdapterFactory.registerAdapter('list', 'push', (instance: any[], value: any) => {
      const copy = [...instance];
      copy.push(value);
      return copy;
    });
    AdapterFactory.registerAdapter('list', 'pop', (instance: any[]) => {
      const copy = [...instance];
      copy.pop();
      return copy;
    });
    AdapterFactory.registerAdapter('list', 'unshift', (instance: any[], value: any) => {
      const copy = [...instance];
      copy.unshift(value);
      return copy;
    });
    AdapterFactory.registerAdapter('list', 'shift', (instance: any[]) => {
      const copy = [...instance];
      copy.shift();
      return copy;
    });
    AdapterFactory.registerAdapter('list', 'splice', (instance: any[], start: number, deleteCount: number, ...items: any[]) => {
      const copy = [...instance];
      copy.splice(start, deleteCount, ...items);
      return copy;
    });

    // Iteration operations
    AdapterFactory.registerAdapter('list', 'forEach', (instance: any[], callback: (value: any, index: number) => void) => {
      instance.forEach(callback);
    });
    AdapterFactory.registerAdapter('list', 'map', (instance: any[], callback: (value: any, index: number) => any) => {
      return instance.map(callback);
    });
    AdapterFactory.registerAdapter('list', 'filter', (instance: any[], callback: (value: any, index: number) => boolean) => {
      return instance.filter(callback);
    });
    AdapterFactory.registerAdapter('list', 'reduce', (instance: any[], callback: (accumulator: any, value: any) => any, initialValue: any) => {
      return instance.reduce(callback, initialValue);
    });
    AdapterFactory.registerAdapter('list', 'every', (instance: any[], callback: (value: any) => boolean) => {
      return instance.every(callback);
    });
    AdapterFactory.registerAdapter('list', 'some', (instance: any[], callback: (value: any) => boolean) => {
      return instance.some(callback);
    });

    // Utility operations
    AdapterFactory.registerAdapter('list', 'slice', (instance: any[], start: number, end?: number) => {
      return instance.slice(start, end);
    });
    AdapterFactory.registerAdapter('list', 'concat', (instance: any[], other: any[]) => {
      return instance.concat(other);
    });
    AdapterFactory.registerAdapter('list', 'join', (instance: any[], separator: string) => {
      return instance.join(separator);
    });
    AdapterFactory.registerAdapter('list', 'reverse', (instance: any[]) => {
      return [...instance].reverse();
    });
    AdapterFactory.registerAdapter('list', 'sort', (instance: any[], compareFn?: (a: any, b: any) => number) => {
      return [...instance].sort(compareFn);
    });
  }

  /**
   * Create list operations
   *
   * @returns Array of list operations
   */
  private createListOperations(): BenchmarkOperation[] {
    const operations: BenchmarkOperation[] = [];

    // Access operations
    operations.push(this.createOperation(
      'get',
      AdapterFactory.getAdapter('list', 'get')!,
      'Get an element by index'
    ));
    operations.push(this.createOperation(
      'indexOf',
      AdapterFactory.getAdapter('list', 'indexOf')!,
      'Find the index of an element'
    ));
    operations.push(this.createOperation(
      'includes',
      AdapterFactory.getAdapter('list', 'includes')!,
      'Check if the list includes an element'
    ));

    // Modification operations
    operations.push(this.createOperation(
      'push',
      AdapterFactory.getAdapter('list', 'push')!,
      'Add an element to the end of the list'
    ));
    operations.push(this.createOperation(
      'pop',
      AdapterFactory.getAdapter('list', 'pop')!,
      'Remove the last element from the list'
    ));
    operations.push(this.createOperation(
      'unshift',
      AdapterFactory.getAdapter('list', 'unshift')!,
      'Add an element to the beginning of the list'
    ));
    operations.push(this.createOperation(
      'shift',
      AdapterFactory.getAdapter('list', 'shift')!,
      'Remove the first element from the list'
    ));
    operations.push(this.createOperation(
      'splice',
      AdapterFactory.getAdapter('list', 'splice')!,
      'Change the contents of the list by removing or replacing elements'
    ));

    // Iteration operations
    operations.push(this.createOperation(
      'forEach',
      AdapterFactory.getAdapter('list', 'forEach')!,
      'Execute a function for each element in the list'
    ));
    operations.push(this.createOperation(
      'map',
      AdapterFactory.getAdapter('list', 'map')!,
      'Create a new list with the results of calling a function on every element'
    ));
    operations.push(this.createOperation(
      'filter',
      AdapterFactory.getAdapter('list', 'filter')!,
      'Create a new list with elements that pass a test'
    ));
    operations.push(this.createOperation(
      'reduce',
      AdapterFactory.getAdapter('list', 'reduce')!,
      'Reduce the list to a single value'
    ));
    operations.push(this.createOperation(
      'every',
      AdapterFactory.getAdapter('list', 'every')!,
      'Check if all elements pass a test'
    ));
    operations.push(this.createOperation(
      'some',
      AdapterFactory.getAdapter('list', 'some')!,
      'Check if at least one element passes a test'
    ));

    // Utility operations
    operations.push(this.createOperation(
      'slice',
      AdapterFactory.getAdapter('list', 'slice')!,
      'Extract a section of the list'
    ));
    operations.push(this.createOperation(
      'concat',
      AdapterFactory.getAdapter('list', 'concat')!,
      'Merge two or more lists'
    ));
    operations.push(this.createOperation(
      'join',
      AdapterFactory.getAdapter('list', 'join')!,
      'Join all elements into a string'
    ));
    operations.push(this.createOperation(
      'reverse',
      AdapterFactory.getAdapter('list', 'reverse')!,
      'Reverse the order of elements'
    ));
    operations.push(this.createOperation(
      'sort',
      AdapterFactory.getAdapter('list', 'sort')!,
      'Sort the elements'
    ));

    return operations;
  }

  /**
   * Create special cases for list benchmarks
   *
   * @returns Array of special cases
   */
  private createListSpecialCases(): BenchmarkSpecialCase[] {
    return [
      this.createSpecialCase(
        'random',
        createRandomList,
        'Random list of numbers'
      ),
      this.createSpecialCase(
        'sorted',
        createSortedList,
        'Sorted list of numbers'
      ),
      this.createSpecialCase(
        'reversed',
        createReversedList,
        'Reversed sorted list of numbers'
      ),
      this.createSpecialCase(
        'nearly-sorted',
        createNearlySortedList,
        'Nearly sorted list of numbers (95% sorted)'
      )
    ];
  }
}
