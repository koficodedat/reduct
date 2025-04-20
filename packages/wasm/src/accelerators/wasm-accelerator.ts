/**
 * Base class for WebAssembly accelerators
 */
import { BaseAccelerator, PerformanceProfile, AcceleratorOptions } from './accelerator';
import { WasmModule } from '../core/wasm-module';
import { WasmModuleLoader } from '../core/wasm-module-loader';

/**
 * Base class for WebAssembly accelerators
 */
export abstract class WasmAccelerator extends BaseAccelerator<any, any> {
  /**
   * The WebAssembly module loader
   */
  private static moduleLoader: WasmModuleLoader | null = null;

  /**
   * Create a new WebAssembly accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @param options Options for the accelerator
   */
  constructor(
    domain: string,
    type: string,
    operation: string,
    options: AcceleratorOptions = {}
  ) {
    super(domain, type, operation, options);

    // Initialize the module loader if not already initialized
    if (!WasmAccelerator.moduleLoader) {
      WasmAccelerator.moduleLoader = new WasmModuleLoader();
    }
  }

  /**
   * Get the WebAssembly module
   * @returns The WebAssembly module, or null if not loaded
   */
  protected getModule(): WasmModule | null {
    if (!WasmAccelerator.moduleLoader) {
      return null;
    }

    return WasmAccelerator.moduleLoader.getModule();
  }

  /**
   * Load the WebAssembly module
   * @returns A promise that resolves when the module is loaded
   */
  protected async loadModule(): Promise<WasmModule | null> {
    if (!WasmAccelerator.moduleLoader) {
      return null;
    }

    return WasmAccelerator.moduleLoader.loadModule();
  }

  /**
   * Check if the WebAssembly module is loaded
   * @returns True if the module is loaded, false otherwise
   */
  protected isModuleLoaded(): boolean {
    if (!WasmAccelerator.moduleLoader) {
      return false;
    }

    return WasmAccelerator.moduleLoader.isModuleLoaded();
  }

  /**
   * Execute the accelerated operation
   * @param input The input for the operation
   * @returns The result of the operation
   */
  public abstract execute(input: any): any;

  /**
   * Get the performance profile of the accelerator
   * @returns The performance profile
   */
  public abstract getPerformanceProfile(): PerformanceProfile;
}
