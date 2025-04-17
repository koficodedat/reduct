/**
 * Comparison Builder
 *
 * Provides a builder pattern for creating complex comparisons.
 *
 * @packageDocumentation
 */

import {
  ComplexComparisonConfig,
  ComplexImplementationAdapter,
  ComplexOperationAdapter,
  TestCase
} from '../registry/types';
import { findImplementationsWithCapabilities } from './capabilities';
import { getImplementation } from '../registry';

/**
 * Builder for creating complex comparisons
 */
export class ComparisonBuilder {
  private _name: string = 'Complex Comparison';
  private _description?: string;
  private _implementations: ComplexImplementationAdapter[] = [];
  private _testCases: TestCase[] = [];
  private _inputSizes: number[] = [1000, 10000];
  private _options: {
    iterations?: number;
    warmupIterations?: number;
    measureMemory?: boolean;
  } = {};

  /**
   * Sets the name of the comparison
   *
   * @param name - Name of the comparison
   * @returns This builder instance
   */
  public name(name: string): ComparisonBuilder {
    this._name = name;
    return this;
  }

  /**
   * Sets the description of the comparison
   *
   * @param description - Description of the comparison
   * @returns This builder instance
   */
  public description(description: string): ComparisonBuilder {
    this._description = description;
    return this;
  }

  /**
   * Adds an implementation to the comparison
   *
   * @param id - Implementation ID
   * @param customAdapter - Custom adapter for the implementation
   * @returns This builder instance
   */
  public addImplementation(
    id: string,
    customAdapter?: Partial<ComplexImplementationAdapter>
  ): ComparisonBuilder {
    const implementation = getImplementation(id);
    if (!implementation) {
      throw new Error(`Implementation with ID '${id}' not found`);
    }

    // Create default adapter
    const adapter: ComplexImplementationAdapter = {
      id,
      name: implementation.name,
      description: implementation.description,
      factory: (size, data) => {
        // Create an instance of the implementation
        const instance = implementation.create(size);

        // For arrays, we need to populate them with data
        if (id === 'native-array' && data && data.array) {
          return data.array.slice();
        } else if (id === 'reduct-list' && data && data.array) {
          // For Reduct List, we need to create it from the array
          return implementation.create(data.array);
        }

        return instance;
      },
      operations: {},
      ...customAdapter
    };

    // Add default operations if not provided
    if (Object.keys(adapter.operations).length === 0 && !customAdapter?.operations) {
      for (const [opName, opFn] of Object.entries(implementation.operations)) {
        adapter.operations[opName] = {
          name: opName,
          adapter: (instance, data) => {
            // Handle different operations based on implementation
            if (id === 'native-array') {
              // Native array operations
              if (opName === 'get') {
                const index = data.indices ? data.indices[0] : 0;
                return instance[index];
              } else if (opName === 'map') {
                return instance.map((x: number) => x * 2);
              } else if (opName === 'filter') {
                return instance.filter((x: number) => x % 2 === 0);
              } else if (opName === 'reduce') {
                return instance.reduce((acc: number, val: number) => acc + val, 0);
              }
            } else if (id === 'reduct-list') {
              // Reduct list operations
              if (opName === 'get') {
                const index = data.indices ? data.indices[0] : 0;
                return instance.get(index);
              } else if (opName === 'map') {
                return instance.map((x: number) => x * 2);
              } else if (opName === 'filter') {
                return instance.filter((x: number) => x % 2 === 0);
              } else if (opName === 'reduce') {
                return instance.reduce((acc: number, val: number) => acc + val, 0);
              }
            }

            // Default: try to call the operation directly
            try {
              if (typeof instance[opName] === 'function') {
                return instance[opName]();
              } else if (typeof opFn === 'function') {
                return opFn.call(instance, data);
              }
            } catch (e) {
              console.error(`Error calling ${opName} on ${id}:`, e);
            }

            return undefined;
          }
        };
      }
    }

    this._implementations.push(adapter);
    return this;
  }

  /**
   * Adds multiple implementations to the comparison
   *
   * @param ids - Implementation IDs
   * @returns This builder instance
   */
  public addImplementations(ids: string[]): ComparisonBuilder {
    for (const id of ids) {
      this.addImplementation(id);
    }
    return this;
  }

  /**
   * Adds implementations with a specific capability
   *
   * @param capabilityId - Capability ID
   * @returns This builder instance
   */
  public withCapability(capabilityId: string): ComparisonBuilder {
    const implementationIds = findImplementationsWithCapabilities([capabilityId]);
    return this.addImplementations(implementationIds);
  }

  /**
   * Adds implementations with all the specified capabilities
   *
   * @param capabilityIds - Capability IDs
   * @returns This builder instance
   */
  public withCapabilities(capabilityIds: string[]): ComparisonBuilder {
    const implementationIds = findImplementationsWithCapabilities(capabilityIds);
    return this.addImplementations(implementationIds);
  }

  /**
   * Adds a test case to the comparison
   *
   * @param name - Name of the test case
   * @param generator - Generator function for the test case
   * @param description - Description of the test case
   * @returns This builder instance
   */
  public addTestCase<T>(
    name: string,
    generator: (size: number) => T,
    description?: string
  ): ComparisonBuilder {
    this._testCases.push({
      name,
      description,
      generator
    });
    return this;
  }

  /**
   * Sets the operations to include in the comparison
   *
   * @param operations - Operation names
   * @returns This builder instance
   */
  public withOperations(operations: string[]): ComparisonBuilder {
    // Filter operations for each implementation
    for (const impl of this._implementations) {
      const filteredOperations: Record<string, ComplexOperationAdapter> = {};

      for (const opName of operations) {
        if (impl.operations[opName]) {
          filteredOperations[opName] = impl.operations[opName];
        }
      }

      impl.operations = filteredOperations;
    }

    return this;
  }

  /**
   * Sets the input sizes to test
   *
   * @param sizes - Input sizes
   * @returns This builder instance
   */
  public withInputSizes(sizes: number[]): ComparisonBuilder {
    this._inputSizes = sizes;
    return this;
  }

  /**
   * Sets the benchmark options
   *
   * @param options - Benchmark options
   * @returns This builder instance
   */
  public withOptions(options: {
    iterations?: number;
    warmupIterations?: number;
    measureMemory?: boolean;
  }): ComparisonBuilder {
    this._options = options;
    return this;
  }

  /**
   * Builds the comparison configuration
   *
   * @returns Comparison configuration
   */
  public build(): ComplexComparisonConfig {
    // Validate configuration
    if (this._implementations.length === 0) {
      throw new Error('No implementations added to the comparison');
    }

    if (this._testCases.length === 0) {
      // Add default test case if none provided
      this._testCases.push({
        name: 'Default',
        generator: (size) => size
      });
    }

    return {
      name: this._name,
      description: this._description,
      implementations: this._implementations,
      testCases: this._testCases,
      inputSizes: this._inputSizes,
      options: this._options
    };
  }
}
