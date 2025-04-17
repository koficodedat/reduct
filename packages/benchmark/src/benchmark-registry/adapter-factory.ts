/**
 * Adapter Factory Pattern
 * 
 * Provides a factory for creating operation adapters dynamically.
 * 
 * @packageDocumentation
 */

import { OperationAdapter } from '../adapters/types';

/**
 * Factory for creating operation adapters
 */
export class AdapterFactory {
  /** Map of adapters by data structure and operation */
  private static adapters: Map<string, Map<string, OperationAdapter>> = new Map();

  /**
   * Registers an adapter for a data structure and operation
   * 
   * @param dataStructure - Type of data structure
   * @param operation - Name of the operation
   * @param adapter - Adapter function
   */
  static registerAdapter(dataStructure: string, operation: string, adapter: OperationAdapter): void {
    if (!this.adapters.has(dataStructure)) {
      this.adapters.set(dataStructure, new Map());
    }
    this.adapters.get(dataStructure)!.set(operation, adapter);
  }

  /**
   * Gets an adapter for a data structure and operation
   * 
   * @param dataStructure - Type of data structure
   * @param operation - Name of the operation
   * @returns Adapter function or undefined if not found
   */
  static getAdapter(dataStructure: string, operation: string): OperationAdapter | undefined {
    return this.adapters.get(dataStructure)?.get(operation);
  }

  /**
   * Gets all supported operations for a data structure
   * 
   * @param dataStructure - Type of data structure
   * @returns Array of operation names
   */
  static getSupportedOperations(dataStructure: string): string[] {
    return Array.from(this.adapters.get(dataStructure)?.keys() || []);
  }

  /**
   * Gets all data structures that support an operation
   * 
   * @param operation - Name of the operation
   * @returns Array of data structure types
   */
  static getDataStructuresForOperation(operation: string): string[] {
    const result: string[] = [];
    for (const [dataStructure, operations] of this.adapters.entries()) {
      if (operations.has(operation)) {
        result.push(dataStructure);
      }
    }
    return result;
  }

  /**
   * Checks if a data structure supports an operation
   * 
   * @param dataStructure - Type of data structure
   * @param operation - Name of the operation
   * @returns True if the operation is supported
   */
  static supportsOperation(dataStructure: string, operation: string): boolean {
    return !!this.adapters.get(dataStructure)?.has(operation);
  }

  /**
   * Gets all registered data structures
   * 
   * @returns Array of data structure types
   */
  static getAllDataStructures(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Gets all registered operations
   * 
   * @returns Array of operation names
   */
  static getAllOperations(): string[] {
    const operations = new Set<string>();
    for (const operationsMap of this.adapters.values()) {
      for (const operation of operationsMap.keys()) {
        operations.add(operation);
      }
    }
    return Array.from(operations);
  }

  /**
   * Removes an adapter
   * 
   * @param dataStructure - Type of data structure
   * @param operation - Name of the operation
   * @returns True if the adapter was removed
   */
  static removeAdapter(dataStructure: string, operation: string): boolean {
    return !!this.adapters.get(dataStructure)?.delete(operation);
  }

  /**
   * Removes all adapters for a data structure
   * 
   * @param dataStructure - Type of data structure
   * @returns True if any adapters were removed
   */
  static removeDataStructure(dataStructure: string): boolean {
    return this.adapters.delete(dataStructure);
  }

  /**
   * Clears all adapters
   * This is primarily useful for testing
   */
  static clear(): void {
    this.adapters.clear();
  }
}
