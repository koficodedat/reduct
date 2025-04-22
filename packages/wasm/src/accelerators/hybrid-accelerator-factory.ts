/**
 * Factory for creating hybrid accelerators
 * 
 * Provides methods for creating accelerators that use both JavaScript and WebAssembly
 * for different parts of an operation.
 */

import { AcceleratorRegistry } from './accelerator';
import { HybridAccelerator, HybridAcceleratorOptions, HybridOperationImplementation } from './hybrid-accelerator';

/**
 * Factory for creating hybrid accelerators
 * 
 * Provides methods for creating accelerators that use both JavaScript and WebAssembly
 * for different parts of an operation.
 */
export class HybridAcceleratorFactory {
  /**
   * The singleton instance of the factory
   */
  private static instance: HybridAcceleratorFactory;

  /**
   * The accelerator registry
   */
  private readonly registry: AcceleratorRegistry;

  /**
   * Get the singleton instance of the factory
   * 
   * @returns The factory instance
   */
  public static getInstance(): HybridAcceleratorFactory {
    if (!HybridAcceleratorFactory.instance) {
      HybridAcceleratorFactory.instance = new HybridAcceleratorFactory();
    }
    return HybridAcceleratorFactory.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.registry = AcceleratorRegistry.getInstance();
  }

  /**
   * Create a hybrid accelerator
   * 
   * @param domain The domain of the accelerator (e.g., 'data-structures')
   * @param type The type of the accelerator (e.g., 'list')
   * @param operation The operation to accelerate (e.g., 'map')
   * @param implementation The hybrid operation implementation
   * @param options Additional options for the accelerator
   * @returns The accelerator
   */
  public create<T, R, I = any>(
    domain: string,
    type: string,
    operation: string,
    implementation: HybridOperationImplementation<T, R, I>,
    options: Omit<HybridAcceleratorOptions, 'implementation'> = {}
  ): HybridAccelerator<T, R, I> {
    // Create the accelerator options
    const acceleratorOptions: HybridAcceleratorOptions = {
      ...options,
      implementation
    };

    // Create the accelerator
    const accelerator = new HybridAccelerator<T, R, I>(domain, type, operation, acceleratorOptions);

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
  public get<T, R, I = any>(domain: string, type: string, operation: string): HybridAccelerator<T, R, I> | undefined {
    return this.registry.get(domain, type, operation) as HybridAccelerator<T, R, I> | undefined;
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
