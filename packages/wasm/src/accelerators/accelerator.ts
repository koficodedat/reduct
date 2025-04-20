/**
 * WebAssembly accelerator interfaces and types
 */
import { WasmAcceleratorNotAvailableError } from '../core/error-handling';
import { isWebAssemblySupported, WebAssemblyFeature } from '../core/feature-detection';

/**
 * Performance profile for an accelerator
 */
export interface PerformanceProfile {
  /**
   * Estimated speedup factor compared to JavaScript
   */
  estimatedSpeedup: number;

  /**
   * Minimum input size for which the accelerator is effective
   */
  effectiveInputSize?: number;

  /**
   * Memory overhead of the accelerator
   */
  memoryOverhead?: number;
}

/**
 * Options for an accelerator
 */
export interface AcceleratorOptions {
  /**
   * Element type for the accelerator
   */
  elementType?: string;

  /**
   * Required WebAssembly features
   */
  requiredFeatures?: WebAssemblyFeature[];

  /**
   * Whether to use shared memory
   */
  useSharedMemory?: boolean;

  /**
   * Custom options for the accelerator
   */
  [key: string]: any;
}

/**
 * Accelerator interface
 */
export interface Accelerator<T, R> {
  /**
   * Execute the accelerated operation
   * @param input The input for the operation
   * @returns The result of the operation
   */
  execute(input: T): R;

  /**
   * Check if the accelerator is available in the current environment
   * @returns True if the accelerator is available, false otherwise
   */
  isAvailable(): boolean;

  /**
   * Get the performance profile of the accelerator
   * @returns The performance profile
   */
  getPerformanceProfile(): PerformanceProfile;
}

/**
 * Base class for accelerators
 */
export abstract class BaseAccelerator<T, R> implements Accelerator<T, R> {
  /**
   * Create a new accelerator
   * @param domain The domain of the accelerator (e.g., 'data-structures')
   * @param type The type of the accelerator (e.g., 'list')
   * @param operation The operation to accelerate (e.g., 'map')
   * @param options Options for the accelerator
   */
  constructor(
    protected readonly domain: string,
    protected readonly type: string,
    protected readonly operation: string,
    protected readonly options: AcceleratorOptions = {}
  ) {}

  /**
   * Execute the accelerated operation
   * @param input The input for the operation
   * @returns The result of the operation
   */
  public abstract execute(input: T): R;

  /**
   * Check if the accelerator is available in the current environment
   * @returns True if the accelerator is available, false otherwise
   */
  public isAvailable(): boolean {
    // Check if WebAssembly is supported
    if (!isWebAssemblySupported()) {
      return false;
    }

    // Check if required features are supported
    const { requiredFeatures = [] } = this.options;
    if (requiredFeatures.length > 0) {
      // This is a synchronous check, so we can't use the async isFeatureSupported
      // In a real implementation, we would cache the results of feature detection
      return true;
    }

    return true;
  }

  /**
   * Get the performance profile of the accelerator
   * @returns The performance profile
   */
  public abstract getPerformanceProfile(): PerformanceProfile;

  /**
   * Ensure that the accelerator is available
   * @throws WasmAcceleratorNotAvailableError if the accelerator is not available
   */
  protected ensureAvailable(): void {
    if (!this.isAvailable()) {
      throw new WasmAcceleratorNotAvailableError(this.domain, this.type, this.operation);
    }
  }
}

/**
 * JavaScript fallback accelerator
 */
export class JavaScriptFallbackAccelerator<T, R> extends BaseAccelerator<T, R> {
  /**
   * Create a new JavaScript fallback accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @param implementation The JavaScript implementation
   * @param options Options for the accelerator
   */
  constructor(
    domain: string,
    type: string,
    operation: string,
    private readonly implementation: (input: T) => R,
    options: AcceleratorOptions = {}
  ) {
    super(domain, type, operation, options);
  }

  /**
   * Execute the operation using the JavaScript implementation
   * @param input The input for the operation
   * @returns The result of the operation
   */
  public execute(input: T): R {
    return this.implementation(input);
  }

  /**
   * JavaScript fallback is always available
   * @returns Always true
   */
  public isAvailable(): boolean {
    return true;
  }

  /**
   * Get the performance profile of the JavaScript fallback
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 1.0, // No speedup compared to JavaScript
    };
  }
}

/**
 * Registry for accelerators
 */
export class AcceleratorRegistry {
  private static instance: AcceleratorRegistry;
  private accelerators: Map<string, Accelerator<any, any>> = new Map();

  /**
   * Get the singleton instance of the accelerator registry
   * @returns The accelerator registry instance
   */
  public static getInstance(): AcceleratorRegistry {
    if (!AcceleratorRegistry.instance) {
      AcceleratorRegistry.instance = new AcceleratorRegistry();
    }
    return AcceleratorRegistry.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Register an accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @param accelerator The accelerator to register
   */
  public register<T, R>(
    domain: string,
    type: string,
    operation: string,
    accelerator: Accelerator<T, R>
  ): void {
    const key = this.getKey(domain, type, operation);
    this.accelerators.set(key, accelerator);
  }

  /**
   * Get an accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns The accelerator, or undefined if not found
   */
  public get<T, R>(domain: string, type: string, operation: string): Accelerator<T, R> | undefined {
    const key = this.getKey(domain, type, operation);
    return this.accelerators.get(key) as Accelerator<T, R> | undefined;
  }

  /**
   * Check if an accelerator is registered
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns True if the accelerator is registered, false otherwise
   */
  public has(domain: string, type: string, operation: string): boolean {
    const key = this.getKey(domain, type, operation);
    return this.accelerators.has(key);
  }

  /**
   * Unregister an accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns True if the accelerator was unregistered, false otherwise
   */
  public unregister(domain: string, type: string, operation: string): boolean {
    const key = this.getKey(domain, type, operation);
    return this.accelerators.delete(key);
  }

  /**
   * Clear all registered accelerators
   */
  public clear(): void {
    this.accelerators.clear();
  }

  /**
   * Get the key for an accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @returns The key
   */
  private getKey(domain: string, type: string, operation: string): string {
    return `${domain}/${type}/${operation}`;
  }
}
