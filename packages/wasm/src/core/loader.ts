/**
 * WebAssembly module loader
 */
import { isWebAssemblySupported } from './feature-detection';

/**
 * Options for loading a WebAssembly module
 */
export interface WasmModuleOptions {
  /**
   * URL of the WebAssembly module
   */
  url: string;
  
  /**
   * Imports to provide to the WebAssembly module
   */
  imports?: WebAssembly.Imports;
  
  /**
   * Whether to cache the module
   * @default true
   */
  cache?: boolean;
  
  /**
   * Whether to use streaming instantiation
   * @default true
   */
  streaming?: boolean;
}

/**
 * Result of loading a WebAssembly module
 */
export interface WasmModuleResult {
  /**
   * The WebAssembly module
   */
  module: WebAssembly.Module;
  
  /**
   * The WebAssembly instance
   */
  instance: WebAssembly.Instance;
  
  /**
   * The WebAssembly exports
   */
  exports: WebAssembly.Exports;
}

/**
 * WebAssembly module loader
 */
export class WasmLoader {
  private static instance: WasmLoader;
  private moduleCache: Map<string, WebAssembly.Module> = new Map();
  private instanceCache: Map<string, WebAssembly.Instance> = new Map();
  
  /**
   * Get the singleton instance of the WebAssembly loader
   * @returns The WebAssembly loader instance
   */
  public static getInstance(): WasmLoader {
    if (!WasmLoader.instance) {
      WasmLoader.instance = new WasmLoader();
    }
    return WasmLoader.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Check if WebAssembly is supported
    if (!isWebAssemblySupported()) {
      throw new Error('WebAssembly is not supported in this environment');
    }
  }
  
  /**
   * Load a WebAssembly module
   * @param options Options for loading the module
   * @returns A promise that resolves to the WebAssembly module result
   */
  public async loadModule(options: WasmModuleOptions): Promise<WasmModuleResult> {
    const { url, imports = {}, cache = true, streaming = true } = options;
    
    // Check if the module is already cached
    const cacheKey = url + JSON.stringify(imports);
    if (cache && this.moduleCache.has(cacheKey) && this.instanceCache.has(cacheKey)) {
      const module = this.moduleCache.get(cacheKey)!;
      const instance = this.instanceCache.get(cacheKey)!;
      return {
        module,
        instance,
        exports: instance.exports
      };
    }
    
    try {
      let module: WebAssembly.Module;
      let instance: WebAssembly.Instance;
      
      if (streaming && typeof WebAssembly.instantiateStreaming === 'function') {
        // Use streaming instantiation if available
        const response = await fetch(url);
        const result = await WebAssembly.instantiateStreaming(response, imports);
        module = result.module;
        instance = result.instance;
      } else {
        // Fall back to non-streaming instantiation
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const result = await WebAssembly.instantiate(buffer, imports);
        module = result.module;
        instance = result.instance;
      }
      
      // Cache the module and instance if requested
      if (cache) {
        this.moduleCache.set(cacheKey, module);
        this.instanceCache.set(cacheKey, instance);
      }
      
      return {
        module,
        instance,
        exports: instance.exports
      };
    } catch (error) {
      throw new Error(`Failed to load WebAssembly module from ${url}: ${error}`);
    }
  }
  
  /**
   * Load a WebAssembly module from a binary buffer
   * @param buffer The WebAssembly binary buffer
   * @param imports Imports to provide to the WebAssembly module
   * @param cache Whether to cache the module
   * @returns A promise that resolves to the WebAssembly module result
   */
  public async loadModuleFromBuffer(
    buffer: ArrayBuffer | Uint8Array,
    imports: WebAssembly.Imports = {},
    cache = true
  ): Promise<WasmModuleResult> {
    // Generate a cache key based on the buffer content and imports
    const cacheKey = `buffer-${buffer.byteLength}-${JSON.stringify(imports)}`;
    
    // Check if the module is already cached
    if (cache && this.moduleCache.has(cacheKey) && this.instanceCache.has(cacheKey)) {
      const module = this.moduleCache.get(cacheKey)!;
      const instance = this.instanceCache.get(cacheKey)!;
      return {
        module,
        instance,
        exports: instance.exports
      };
    }
    
    try {
      // Instantiate the module from the buffer
      const result = await WebAssembly.instantiate(buffer, imports);
      const module = result.module;
      const instance = result.instance;
      
      // Cache the module and instance if requested
      if (cache) {
        this.moduleCache.set(cacheKey, module);
        this.instanceCache.set(cacheKey, instance);
      }
      
      return {
        module,
        instance,
        exports: instance.exports
      };
    } catch (error) {
      throw new Error(`Failed to load WebAssembly module from buffer: ${error}`);
    }
  }
  
  /**
   * Clear the module cache
   */
  public clearCache(): void {
    this.moduleCache.clear();
    this.instanceCache.clear();
  }
}
