/**
 * WebAssembly module loader
 */
import { WasmModule } from './wasm-module';

/**
 * WebAssembly module loader
 * 
 * Handles loading and caching the WebAssembly module
 */
export class WasmModuleLoader {
  /**
   * The WebAssembly module
   */
  private module: WasmModule | null = null;

  /**
   * Promise for the loading operation
   */
  private loading: Promise<WasmModule | null> | null = null;

  /**
   * Create a new WebAssembly module loader
   */
  constructor() {}

  /**
   * Load the WebAssembly module
   * @returns A promise that resolves to the WebAssembly module
   */
  public async loadModule(): Promise<WasmModule | null> {
    // If the module is already loaded, return it
    if (this.module) {
      return this.module;
    }

    // If the module is already being loaded, return the loading promise
    if (this.loading) {
      return this.loading;
    }

    // Load the module
    this.loading = this.loadModuleInternal();
    
    try {
      // Wait for the module to load
      this.module = await this.loading;
      return this.module;
    } catch (error) {
      // Clear the loading promise on error
      this.loading = null;
      throw error;
    }
  }

  /**
   * Internal method to load the WebAssembly module
   * @returns A promise that resolves to the WebAssembly module
   */
  private async loadModuleInternal(): Promise<WasmModule | null> {
    try {
      // Import the WebAssembly module
      // Use a dynamic import with a string literal to avoid TypeScript errors
      const wasmModulePath = '../../../dist/wasm/reduct_wasm.js';
      const wasmModule = await (Function('return import("' + wasmModulePath + '")')() as Promise<any>);
      
      // Initialize the module
      wasmModule.init_panic_hook();
      
      return wasmModule as unknown as WasmModule;
    } catch (error) {
      console.error('Failed to load WebAssembly module:', error);
      return null;
    }
  }

  /**
   * Get the WebAssembly module
   * @returns The WebAssembly module, or null if not loaded
   */
  public getModule(): WasmModule | null {
    return this.module;
  }

  /**
   * Check if the WebAssembly module is loaded
   * @returns True if the module is loaded, false otherwise
   */
  public isModuleLoaded(): boolean {
    return this.module !== null;
  }

  /**
   * Clear the loaded module
   */
  public clearModule(): void {
    this.module = null;
    this.loading = null;
  }
}
