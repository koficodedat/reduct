/**
 * Benchmark Plugins
 * 
 * Registers all benchmark plugins.
 * 
 * @packageDocumentation
 */

import { PluginRegistry } from '../plugin';
import { ListBenchmarkPlugin } from './list-plugin';
import { MapBenchmarkPlugin } from './map-plugin';
import { StackBenchmarkPlugin } from './stack-plugin';
import { SortingBenchmarkPlugin } from './sorting-plugin';
import { SearchingBenchmarkPlugin } from './searching-plugin';

/**
 * Registers all benchmark plugins
 */
export function registerAllPlugins(): void {
  // Register data structure plugins
  PluginRegistry.register(new ListBenchmarkPlugin());
  PluginRegistry.register(new MapBenchmarkPlugin());
  PluginRegistry.register(new StackBenchmarkPlugin());
  
  // Register algorithm plugins
  PluginRegistry.register(new SortingBenchmarkPlugin());
  PluginRegistry.register(new SearchingBenchmarkPlugin());
}

// Export all plugins
export { ListBenchmarkPlugin } from './list-plugin';
export { MapBenchmarkPlugin } from './map-plugin';
export { StackBenchmarkPlugin } from './stack-plugin';
export { SortingBenchmarkPlugin } from './sorting-plugin';
export { SearchingBenchmarkPlugin } from './searching-plugin';
