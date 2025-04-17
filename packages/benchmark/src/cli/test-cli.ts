/**
 * Test script for CLI
 */

import { createCLI } from './index';

const program = createCLI();
console.log('Testing CLI...');
program.parse(['node', 'test-cli.js', 'run', 'list', '-s', '100']);
