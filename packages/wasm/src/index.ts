/**
 * WebAssembly acceleration for Reduct
 */

// Export core utilities
export {
  isWebAssemblySupported,
  isFeatureSupported,
  getSupportedFeatures,
  WebAssemblyFeature,
  WasmLoader,
  createWasmMemory,
  copyToWasmMemory,
  copyFromWasmMemory,
  getTypedArrayView,
  WasmMemoryPool,
} from './core';

// Export accelerator interfaces and types
export {
  Accelerator,
  AcceleratorOptions,
  PerformanceProfile,
  BaseAccelerator,
  JavaScriptFallbackAccelerator,
  AcceleratorRegistry,
} from './accelerators';

// Export list accelerators
export {
  MapAccelerator,
  FilterAccelerator,
  ReduceAccelerator,
  SortAccelerator,
  MapInput,
  FilterInput,
  ReduceInput,
  SortInput,
} from './accelerators/data-structures/list';

// Export adapters
export {
  getListAccelerator,
  ListAdapter,
} from './adapters';

// Export utilities
export {
  benchmark,
  BenchmarkOptions,
  BenchmarkResult,
  formatBenchmarkResult,
  formatBenchmarkResultMarkdown,
  WasmProfiler,
  ProfileEntry,
  WasmTelemetry,
  TelemetryEvent,
} from './utils';

// Export error types
export {
  WasmNotSupportedError,
  WasmLoadError,
  WasmFeatureNotSupportedError,
  WasmMemoryError,
  WasmAcceleratorNotAvailableError,
  WasmOperationError,
  safeWasmOperation,
} from './core/error-handling';

// Import types for local functions
import { Accelerator, AcceleratorOptions, AcceleratorRegistry } from './accelerators';
import { getListAccelerator } from './adapters';

/**
 * Get an accelerator for a specific operation
 * @param domain The domain of the accelerator (e.g., 'data-structures')
 * @param type The type of the accelerator (e.g., 'list')
 * @param operation The operation to accelerate (e.g., 'map')
 * @param options Options for the accelerator
 * @returns The accelerator
 */
export function getAccelerator<T, R>(
  domain: string,
  type: string,
  operation: string,
  options: AcceleratorOptions = {}
): Accelerator<T, R> {
  const registry = AcceleratorRegistry.getInstance();

  // Check if the accelerator is registered
  let accelerator = registry.get<T, R>(domain, type, operation);

  if (!accelerator) {
    // Create a new accelerator based on the domain, type, and operation
    if (domain === 'data-structures') {
      if (type === 'list') {
        accelerator = getListAccelerator<any, any>(operation, options) as Accelerator<T, R>;
      } else {
        throw new Error(`Unsupported data structure type: ${type}`);
      }
    } else {
      throw new Error(`Unsupported domain: ${domain}`);
    }

    // Register the accelerator
    registry.register(domain, type, operation, accelerator);
  }

  return accelerator;
}

/**
 * Register a custom accelerator
 * @param domain The domain of the accelerator
 * @param type The type of the accelerator
 * @param operation The operation to accelerate
 * @param accelerator The accelerator to register
 */
export function registerAccelerator<T, R>(
  domain: string,
  type: string,
  operation: string,
  accelerator: Accelerator<T, R>
): void {
  const registry = AcceleratorRegistry.getInstance();
  registry.register(domain, type, operation, accelerator);
}
