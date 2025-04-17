/**
 * Benchmark Plugin System
 * 
 * Provides a plugin architecture for registering benchmark definitions.
 * 
 * @packageDocumentation
 */

import { BenchmarkDefinition, BenchmarkOperation, BenchmarkSpecialCase } from './types';
import { BenchmarkRegistry } from './index';

/**
 * Interface for a benchmark plugin
 */
export interface BenchmarkPlugin {
  /** Name of the plugin */
  name: string;
  /** Description of the plugin */
  description?: string;
  /** Initialize the plugin */
  initialize(): void;
  /** Register benchmark definitions */
  register(): void;
}

/**
 * Abstract base class for benchmark plugins
 */
export abstract class BaseBenchmarkPlugin implements BenchmarkPlugin {
  /** Name of the plugin */
  abstract name: string;
  /** Description of the plugin */
  description?: string;

  /**
   * Initialize the plugin
   * Override this method to perform initialization tasks
   */
  initialize(): void {
    // Default implementation does nothing
  }

  /**
   * Register benchmark definitions
   * Override this method to register benchmark definitions
   */
  abstract register(): void;

  /**
   * Helper method to create a benchmark definition
   * 
   * @param type - Type of the benchmark
   * @param name - Name of the benchmark
   * @param category - Category of the benchmark
   * @param operations - Operations supported by the benchmark
   * @param options - Additional options for the benchmark
   * @returns Benchmark definition
   */
  protected createBenchmarkDefinition(
    type: string,
    name: string,
    category: 'data-structure' | 'algorithm' | 'utility',
    operations: BenchmarkOperation[],
    options?: Partial<Omit<BenchmarkDefinition, 'type' | 'name' | 'category' | 'operations'>>
  ): BenchmarkDefinition {
    return {
      type,
      name,
      category,
      operations,
      ...options
    };
  }

  /**
   * Helper method to create a benchmark operation
   * 
   * @param name - Name of the operation
   * @param adapter - Adapter function for the operation
   * @param description - Description of the operation
   * @returns Benchmark operation
   */
  protected createOperation(
    name: string,
    adapter: any,
    description?: string
  ): BenchmarkOperation {
    return {
      name,
      adapter,
      description
    };
  }

  /**
   * Helper method to create a benchmark special case
   * 
   * @param name - Name of the special case
   * @param setupFn - Setup function for the special case
   * @param description - Description of the special case
   * @returns Benchmark special case
   */
  protected createSpecialCase(
    name: string,
    setupFn: (size: number) => any,
    description?: string
  ): BenchmarkSpecialCase {
    return {
      name,
      setupFn,
      description
    };
  }

  /**
   * Register a benchmark definition
   * 
   * @param definition - Benchmark definition to register
   */
  protected registerBenchmark(definition: BenchmarkDefinition): void {
    BenchmarkRegistry.register(definition);
  }
}

/**
 * Registry of benchmark plugins
 */
export class PluginRegistry {
  /** Map of registered plugins by name */
  private static plugins: Map<string, BenchmarkPlugin> = new Map();

  /**
   * Registers a plugin
   * 
   * @param plugin - Plugin to register
   * @throws Error if a plugin with the same name already exists
   */
  static register(plugin: BenchmarkPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin with name '${plugin.name}' already exists`);
    }

    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Gets a plugin by name
   * 
   * @param name - Name of the plugin
   * @returns Plugin or undefined if not found
   */
  static get(name: string): BenchmarkPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Gets all registered plugins
   * 
   * @returns Map of all plugins
   */
  static getAll(): Map<string, BenchmarkPlugin> {
    return new Map(this.plugins);
  }

  /**
   * Initializes all registered plugins
   */
  static initializeAll(): void {
    for (const plugin of this.plugins.values()) {
      plugin.initialize();
    }
  }

  /**
   * Registers benchmarks from all plugins
   */
  static registerAll(): void {
    for (const plugin of this.plugins.values()) {
      plugin.register();
    }
  }

  /**
   * Removes a plugin
   * 
   * @param name - Name of the plugin to remove
   * @returns True if the plugin was removed, false if it didn't exist
   */
  static remove(name: string): boolean {
    return this.plugins.delete(name);
  }

  /**
   * Clears all plugins
   * This is primarily useful for testing
   */
  static clear(): void {
    this.plugins.clear();
  }
}
