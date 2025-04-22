/**
 * Manager for hybrid accelerators
 * 
 * Provides methods for managing and using hybrid accelerators.
 */

import { HybridAcceleratorFactory } from './hybrid-accelerator-factory';
import { HybridOperationImplementation, HybridAcceleratorOptions } from './hybrid-accelerator';
import { AcceleratorTier } from './accelerator';

/**
 * Manager for hybrid accelerators
 * 
 * Provides methods for managing and using hybrid accelerators.
 */
export class HybridAcceleratorManager {
  /**
   * The singleton instance of the manager
   */
  private static instance: HybridAcceleratorManager;

  /**
   * The accelerator factory
   */
  private readonly factory: HybridAcceleratorFactory;

  /**
   * Get the singleton instance of the manager
   * 
   * @returns The manager instance
   */
  public static getInstance(): HybridAcceleratorManager {
    if (!HybridAcceleratorManager.instance) {
      HybridAcceleratorManager.instance = new HybridAcceleratorManager();
    }
    return HybridAcceleratorManager.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.factory = HybridAcceleratorFactory.getInstance();
  }

  /**
   * Register a hybrid accelerator
   * 
   * @param domain The domain of the accelerator (e.g., 'data-structures')
   * @param type The type of the accelerator (e.g., 'list')
   * @param operation The operation to accelerate (e.g., 'map')
   * @param implementation The hybrid operation implementation
   * @param options Additional options for the accelerator
   */
  public register<T, R, I = any>(
    domain: string,
    type: string,
    operation: string,
    implementation: HybridOperationImplementation<T, R, I>,
    options: Omit<HybridAcceleratorOptions, 'implementation'> = {}
  ): void {
    this.factory.create(domain, type, operation, implementation, options);
  }

  /**
   * Execute an operation with hybrid acceleration
   * 
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @param input The input for the operation
   * @returns The result of the operation
   */
  public execute<T, R>(domain: string, type: string, operation: string, input: T): R {
    // Get the accelerator
    const accelerator = this.factory.get<T, R>(domain, type, operation);

    // If the accelerator is not found, throw an error
    if (!accelerator) {
      throw new Error(`Accelerator not found: ${domain}/${type}/${operation}`);
    }

    // Execute the operation
    return accelerator.execute(input);
  }

  /**
   * Determine the appropriate tier for an operation
   * 
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @param input The input for the operation
   * @returns The appropriate tier
   */
  public determineTier<T>(domain: string, type: string, operation: string, input: T): AcceleratorTier {
    // Get the accelerator
    const accelerator = this.factory.get<T, any>(domain, type, operation);

    // If the accelerator is not found, default to JS_PREFERRED
    if (!accelerator) {
      return AcceleratorTier.JS_PREFERRED;
    }

    // Determine the tier
    return accelerator.determineTier(input);
  }

  /**
   * Get statistics for an accelerator
   * 
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns The statistics
   */
  public getStats(domain: string, type: string, operation: string): any {
    // Get the accelerator
    const accelerator = this.factory.get(domain, type, operation);

    // If the accelerator is not found, return undefined
    if (!accelerator) {
      return undefined;
    }

    // Get the statistics
    return {
      performance: accelerator.getPerformanceStats(),
      adaptiveThresholds: accelerator.getAdaptiveThresholdStats(),
      frequencyDetection: accelerator.getFrequencyDetectionStats()
    };
  }

  /**
   * Clear all registered accelerators
   */
  public clear(): void {
    // Clear the registry
    this.factory.unregister('*', '*', '*');
  }
}
