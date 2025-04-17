/**
 * Benchmark Registry
 * 
 * A central registry for benchmark definitions that allows dynamic discovery
 * and registration of benchmarks.
 * 
 * @packageDocumentation
 */

import { BenchmarkDefinition, BenchmarkOperation } from './types';

/**
 * Registry of benchmark definitions
 */
class BenchmarkRegistry {
  /** Map of benchmark definitions by type */
  private static definitions: Map<string, BenchmarkDefinition> = new Map();

  /**
   * Registers a benchmark definition
   * 
   * @param definition - Benchmark definition to register
   * @throws Error if a benchmark with the same type already exists
   */
  static register(definition: BenchmarkDefinition): void {
    if (this.definitions.has(definition.type)) {
      throw new Error(`Benchmark definition for type '${definition.type}' already exists`);
    }

    this.definitions.set(definition.type, definition);
  }

  /**
   * Updates an existing benchmark definition
   * 
   * @param type - Type of the benchmark to update
   * @param definition - New benchmark definition
   * @throws Error if the benchmark does not exist
   */
  static update(type: string, definition: Partial<BenchmarkDefinition>): void {
    const existing = this.definitions.get(type);
    if (!existing) {
      throw new Error(`Benchmark definition for type '${type}' not found`);
    }

    this.definitions.set(type, { ...existing, ...definition });
  }

  /**
   * Gets a benchmark definition by type
   * 
   * @param type - Type of the benchmark
   * @returns Benchmark definition or undefined if not found
   */
  static get(type: string): BenchmarkDefinition | undefined {
    return this.definitions.get(type);
  }

  /**
   * Gets all benchmark definitions
   * 
   * @returns Map of all benchmark definitions
   */
  static getAll(): Map<string, BenchmarkDefinition> {
    return new Map(this.definitions);
  }

  /**
   * Gets benchmark definitions by category
   * 
   * @param category - Category to filter by
   * @returns Array of benchmark definitions in the category
   */
  static getByCategory(category: 'data-structure' | 'algorithm' | 'utility'): BenchmarkDefinition[] {
    return Array.from(this.definitions.values())
      .filter(def => def.category === category);
  }

  /**
   * Gets benchmark definitions by tag
   * 
   * @param tag - Tag to filter by
   * @returns Array of benchmark definitions with the tag
   */
  static getByTag(tag: string): BenchmarkDefinition[] {
    return Array.from(this.definitions.values())
      .filter(def => def.tags?.includes(tag));
  }

  /**
   * Checks if a benchmark definition exists
   * 
   * @param type - Type of the benchmark
   * @returns True if the benchmark definition exists
   */
  static has(type: string): boolean {
    return this.definitions.has(type);
  }

  /**
   * Removes a benchmark definition
   * 
   * @param type - Type of the benchmark to remove
   * @returns True if the benchmark was removed, false if it didn't exist
   */
  static remove(type: string): boolean {
    return this.definitions.delete(type);
  }

  /**
   * Adds an operation to a benchmark definition
   * 
   * @param type - Type of the benchmark
   * @param operation - Operation to add
   * @throws Error if the benchmark does not exist
   */
  static addOperation(type: string, operation: BenchmarkOperation): void {
    const definition = this.definitions.get(type);
    if (!definition) {
      throw new Error(`Benchmark definition for type '${type}' not found`);
    }

    // Check if operation already exists
    const existingIndex = definition.operations.findIndex(op => op.name === operation.name);
    if (existingIndex >= 0) {
      // Replace existing operation
      definition.operations[existingIndex] = operation;
    } else {
      // Add new operation
      definition.operations.push(operation);
    }
  }

  /**
   * Gets operations for a benchmark definition
   * 
   * @param type - Type of the benchmark
   * @returns Array of operation names or empty array if benchmark not found
   */
  static getOperations(type: string): string[] {
    const definition = this.definitions.get(type);
    if (!definition) {
      return [];
    }

    return definition.operations.map(op => op.name);
  }

  /**
   * Finds benchmark definitions that support a specific operation
   * 
   * @param operationName - Name of the operation
   * @returns Array of benchmark definitions that support the operation
   */
  static findByOperation(operationName: string): BenchmarkDefinition[] {
    return Array.from(this.definitions.values())
      .filter(def => def.operations.some(op => op.name === operationName));
  }

  /**
   * Clears all benchmark definitions
   * This is primarily useful for testing
   */
  static clear(): void {
    this.definitions.clear();
  }
}

export { BenchmarkRegistry };
export * from './types';
