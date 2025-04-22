/**
 * Factory for creating frequency-aware accelerators
 * 
 * Provides methods for creating accelerators that use frequency detection to optimize operations in tight loops.
 */

import { AcceleratorRegistry } from './accelerator';
import { FrequencyAwareAccelerator, FrequencyAwareAcceleratorOptions } from './frequency-aware-accelerator';

/**
 * Factory for creating frequency-aware accelerators
 * 
 * Provides methods for creating accelerators that use frequency detection to optimize operations in tight loops.
 */
export class FrequencyAwareAcceleratorFactory {
  /**
   * The singleton instance of the factory
   */
  private static instance: FrequencyAwareAcceleratorFactory;

  /**
   * The accelerator registry
   */
  private readonly registry: AcceleratorRegistry;

  /**
   * Get the singleton instance of the factory
   * 
   * @returns The factory instance
   */
  public static getInstance(): FrequencyAwareAcceleratorFactory {
    if (!FrequencyAwareAcceleratorFactory.instance) {
      FrequencyAwareAcceleratorFactory.instance = new FrequencyAwareAcceleratorFactory();
    }
    return FrequencyAwareAcceleratorFactory.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.registry = AcceleratorRegistry.getInstance();
  }

  /**
   * Create a frequency-aware accelerator
   * 
   * @param domain The domain of the accelerator (e.g., 'data-structures')
   * @param type The type of the accelerator (e.g., 'list')
   * @param operation The operation to accelerate (e.g., 'map')
   * @param options Options for the accelerator
   * @returns The accelerator
   */
  public create<T, R>(
    domain: string,
    type: string,
    operation: string,
    options: FrequencyAwareAcceleratorOptions
  ): FrequencyAwareAccelerator<T, R> {
    // Create the accelerator
    const accelerator = new FrequencyAwareAccelerator<T, R>(domain, type, operation, options);

    // Register the accelerator
    this.registry.register(domain, type, operation, accelerator);

    return accelerator;
  }

  /**
   * Get a registered accelerator
   * 
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns The accelerator, or undefined if not found
   */
  public get<T, R>(domain: string, type: string, operation: string): FrequencyAwareAccelerator<T, R> | undefined {
    return this.registry.get(domain, type, operation) as FrequencyAwareAccelerator<T, R> | undefined;
  }

  /**
   * Check if an accelerator is registered
   * 
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns True if the accelerator is registered, false otherwise
   */
  public has(domain: string, type: string, operation: string): boolean {
    return this.registry.has(domain, type, operation);
  }

  /**
   * Unregister an accelerator
   * 
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns True if the accelerator was unregistered, false otherwise
   */
  public unregister(domain: string, type: string, operation: string): boolean {
    return this.registry.unregister(domain, type, operation);
  }
}
