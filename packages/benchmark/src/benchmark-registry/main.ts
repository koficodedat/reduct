/**
 * Main export file for the benchmark registry
 *
 * @packageDocumentation
 */

// Export all components
export * from './types';
export * from './index';
export * from './plugin';
export * from './config';
export * from './adapter-factory';

// Import and re-export from the benchmark runner
import { benchmark } from '../utils';
export { benchmark as runBenchmark };

// Import plugins
import { registerAllPlugins } from './plugins';

/**
 * Initializes the benchmark registry system
 * This should be called once at the start of the application
 */
export function initializeBenchmarkRegistry(): void {
  // Register all plugins
  registerAllPlugins();

  // Initialize all plugins
  const { PluginRegistry } = require('./plugin');
  PluginRegistry.initializeAll();

  // Register benchmarks from all plugins
  PluginRegistry.registerAll();
}

// Export plugins
export * from './plugins';
