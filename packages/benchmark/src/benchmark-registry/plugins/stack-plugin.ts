/**
 * Stack Benchmark Plugin
 * 
 * Provides benchmarks for stack data structures.
 * 
 * @packageDocumentation
 */

import { BaseBenchmarkPlugin } from '../plugin';
import { AdapterFactory } from '../adapter-factory';
import { BenchmarkOperation, BenchmarkSpecialCase } from '../types';

/**
 * Simple stack implementation for testing
 */
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  toArray(): T[] {
    return [...this.items];
  }
}

/**
 * Creates a random stack of the specified size
 * 
 * @param size - Size of the stack
 * @returns Stack with random values
 */
function createRandomStack(size: number): Stack<number> {
  const stack = new Stack<number>();
  for (let i = 0; i < size; i++) {
    stack.push(Math.floor(Math.random() * 1000));
  }
  return stack;
}

/**
 * Creates a sequential stack of the specified size
 * 
 * @param size - Size of the stack
 * @returns Stack with sequential values
 */
function createSequentialStack(size: number): Stack<number> {
  const stack = new Stack<number>();
  for (let i = 0; i < size; i++) {
    stack.push(i);
  }
  return stack;
}

/**
 * Creates a stack with string values
 * 
 * @param size - Size of the stack
 * @returns Stack with string values
 */
function createStringStack(size: number): Stack<string> {
  const stack = new Stack<string>();
  for (let i = 0; i < size; i++) {
    stack.push(`item${i}`);
  }
  return stack;
}

/**
 * Creates a stack with object values
 * 
 * @param size - Size of the stack
 * @returns Stack with object values
 */
function createObjectStack(size: number): Stack<object> {
  const stack = new Stack<object>();
  for (let i = 0; i < size; i++) {
    stack.push({ id: i, value: `value${i}` });
  }
  return stack;
}

/**
 * Stack benchmark plugin
 */
export class StackBenchmarkPlugin extends BaseBenchmarkPlugin {
  name = 'stack-benchmark-plugin';
  description = 'Provides benchmarks for stack data structures';

  /**
   * Register stack benchmarks
   */
  register(): void {
    // Register adapters for stack operations
    this.registerStackAdapters();

    // Register stack benchmark definition
    this.registerBenchmark(
      this.createBenchmarkDefinition(
        'stack',
        'Stack Benchmarks',
        'data-structure',
        this.createStackOperations(),
        {
          description: 'Benchmarks for stack data structures',
          setupFn: createRandomStack,
          specialCases: this.createStackSpecialCases(),
          defaultInputSizes: [100, 1000, 10000],
          defaultIterations: 1000,
          tags: ['stack', 'lifo'],
          examples: [
            'benchmark stack --operations push,pop,peek',
            'benchmark stack --implementations reduct-stack,native-array',
            'benchmark stack --special-case string-values'
          ]
        }
      )
    );
  }

  /**
   * Register adapters for stack operations
   */
  private registerStackAdapters(): void {
    // Access operations
    AdapterFactory.registerAdapter('stack', 'peek', (instance: Stack<any>) => instance.peek());
    AdapterFactory.registerAdapter('stack', 'isEmpty', (instance: Stack<any>) => instance.isEmpty());
    AdapterFactory.registerAdapter('stack', 'size', (instance: Stack<any>) => instance.size());
    
    // Modification operations
    AdapterFactory.registerAdapter('stack', 'push', (instance: Stack<any>, item: any) => {
      const copy = new Stack<any>();
      instance.toArray().forEach(i => copy.push(i));
      copy.push(item);
      return copy;
    });
    AdapterFactory.registerAdapter('stack', 'pop', (instance: Stack<any>) => {
      const copy = new Stack<any>();
      const items = instance.toArray();
      items.slice(0, items.length - 1).forEach(i => copy.push(i));
      return copy;
    });
    AdapterFactory.registerAdapter('stack', 'clear', (instance: Stack<any>) => {
      const copy = new Stack<any>();
      instance.toArray().forEach(i => copy.push(i));
      copy.clear();
      return copy;
    });
    
    // Iteration operations
    AdapterFactory.registerAdapter('stack', 'toArray', (instance: Stack<any>) => instance.toArray());
    AdapterFactory.registerAdapter('stack', 'forEach', (instance: Stack<any>, callback: (value: any) => void) => {
      instance.toArray().forEach(callback);
    });
    AdapterFactory.registerAdapter('stack', 'map', (instance: Stack<any>, callback: (value: any) => any) => {
      return instance.toArray().map(callback);
    });
    AdapterFactory.registerAdapter('stack', 'filter', (instance: Stack<any>, callback: (value: any) => boolean) => {
      return instance.toArray().filter(callback);
    });
  }

  /**
   * Create stack operations
   * 
   * @returns Array of stack operations
   */
  private createStackOperations(): BenchmarkOperation[] {
    const operations: BenchmarkOperation[] = [];
    
    // Access operations
    operations.push(this.createOperation(
      'peek',
      AdapterFactory.getAdapter('stack', 'peek')!,
      'Get the top element without removing it'
    ));
    operations.push(this.createOperation(
      'isEmpty',
      AdapterFactory.getAdapter('stack', 'isEmpty')!,
      'Check if the stack is empty'
    ));
    operations.push(this.createOperation(
      'size',
      AdapterFactory.getAdapter('stack', 'size')!,
      'Get the number of elements in the stack'
    ));
    
    // Modification operations
    operations.push(this.createOperation(
      'push',
      AdapterFactory.getAdapter('stack', 'push')!,
      'Add an element to the top of the stack'
    ));
    operations.push(this.createOperation(
      'pop',
      AdapterFactory.getAdapter('stack', 'pop')!,
      'Remove and return the top element'
    ));
    operations.push(this.createOperation(
      'clear',
      AdapterFactory.getAdapter('stack', 'clear')!,
      'Remove all elements from the stack'
    ));
    
    // Iteration operations
    operations.push(this.createOperation(
      'toArray',
      AdapterFactory.getAdapter('stack', 'toArray')!,
      'Convert the stack to an array'
    ));
    operations.push(this.createOperation(
      'forEach',
      AdapterFactory.getAdapter('stack', 'forEach')!,
      'Execute a function for each element'
    ));
    operations.push(this.createOperation(
      'map',
      AdapterFactory.getAdapter('stack', 'map')!,
      'Create a new array with the results of calling a function on every element'
    ));
    operations.push(this.createOperation(
      'filter',
      AdapterFactory.getAdapter('stack', 'filter')!,
      'Create a new array with elements that pass a test'
    ));
    
    return operations;
  }

  /**
   * Create special cases for stack benchmarks
   * 
   * @returns Array of special cases
   */
  private createStackSpecialCases(): BenchmarkSpecialCase[] {
    return [
      this.createSpecialCase(
        'random',
        createRandomStack,
        'Random stack with number values'
      ),
      this.createSpecialCase(
        'sequential',
        createSequentialStack,
        'Stack with sequential values'
      ),
      this.createSpecialCase(
        'string-values',
        createStringStack,
        'Stack with string values'
      ),
      this.createSpecialCase(
        'object-values',
        createObjectStack,
        'Stack with object values'
      )
    ];
  }
}
