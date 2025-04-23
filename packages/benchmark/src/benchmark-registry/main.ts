/**
 * Main export file for the benchmark registry
 *
 * @packageDocumentation
 */

// Import from other packages
import { benchmark } from '../utils';

// Import local modules
import { PluginRegistry } from './plugin';
import { registerAllPlugins } from './plugins';
// Types are imported via export type statements

// Export all components
export * from './adapter-factory';
export * from './config';
export * from './plugin';

// Re-export specific types to avoid duplication
export type {
  OperationAdapter,
  OperationAdapterFactory,
  OperationCompatibility,
  OperationInterface,
  OperationMatcher
} from './types';

// Re-export benchmark function with a different name
export { benchmark as runBenchmark };

/**
 * Initializes the benchmark registry system
 * This should be called once at the start of the application
 */
export function initializeBenchmarkRegistry(): void {
  // Register all plugins
  registerAllPlugins();

  // Initialize all plugins
  PluginRegistry.initializeAll();

  // Register benchmarks from all plugins
  PluginRegistry.registerAll();
}

// Export plugins
export * from './plugins';
