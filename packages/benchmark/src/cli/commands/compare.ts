/**
 * Compare command handler
 *
 * Compares multiple data structures or algorithms.
 * This is now a wrapper around the adapter-compare command.
 *
 * @packageDocumentation
 */

import { adapterCompareCommand } from './adapter-compare';

/**
 * Command handler for the 'compare' command
 * This is now a wrapper around the adapter-compare command.
 *
 * @param types - Types to compare
 * @param options - Command options
 */
export function compareCommand(types: string[], options: any): void {
  console.log('Note: The compare command is now a wrapper around the adapter-compare command.');
  console.log('For more details, use: benchmark adapter-compare --help');
  console.log('');

  // Forward to the adapter-compare command
  adapterCompareCommand(types, options);
}
