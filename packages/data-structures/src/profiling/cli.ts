/**
 * CLI interface for the profiling system
 * 
 * This module provides a command-line interface for the profiling system.
 */

import fs from 'fs';
import path from 'path';
import { getProfilingSystem, enableProfiling, disableProfiling, generateProfilingReport, clearProfilingData } from './index';
import { generateChunkPoolReport, clearChunkPoolStats } from './chunk-pool-monitor';
import { generateNodeCacheReport, clearNodeCacheStats } from './node-cache-monitor';
import { generateMemoryReport, clearMemoryStats } from './memory-monitor';

/**
 * Generate a report and save it to a file
 * 
 * @param reportType - The type of report to generate
 * @param outputPath - The path to save the report to
 */
export function generateReport(reportType: string, outputPath?: string): void {
  let report = '';
  
  switch (reportType.toLowerCase()) {
    case 'profiling':
      report = generateProfilingReport();
      break;
    case 'chunkpool':
      report = generateChunkPoolReport();
      break;
    case 'nodecache':
      report = generateNodeCacheReport();
      break;
    case 'memory':
      report = generateMemoryReport();
      break;
    case 'all':
      report = '# Reduct Library Comprehensive Report\n\n';
      report += `Generated at: ${new Date().toISOString()}\n\n`;
      report += '---\n\n';
      report += generateProfilingReport();
      report += '\n---\n\n';
      report += generateChunkPoolReport();
      report += '\n---\n\n';
      report += generateNodeCacheReport();
      report += '\n---\n\n';
      report += generateMemoryReport();
      break;
    default:
      console.error(`Unknown report type: ${reportType}`);
      console.error('Available report types: profiling, chunkpool, nodecache, memory, all');
      return;
  }
  
  if (outputPath) {
    // Ensure the directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the report to the file
    fs.writeFileSync(outputPath, report);
    console.log(`Report saved to ${outputPath}`);
  } else {
    // Print the report to the console
    console.log(report);
  }
}

/**
 * Clear all profiling data
 * 
 * @param dataType - The type of data to clear
 */
export function clearData(dataType: string): void {
  switch (dataType.toLowerCase()) {
    case 'profiling':
      clearProfilingData();
      console.log('Profiling data cleared');
      break;
    case 'chunkpool':
      clearChunkPoolStats();
      console.log('Chunk pool statistics cleared');
      break;
    case 'nodecache':
      clearNodeCacheStats();
      console.log('Node cache statistics cleared');
      break;
    case 'memory':
      clearMemoryStats();
      console.log('Memory statistics cleared');
      break;
    case 'all':
      clearProfilingData();
      clearChunkPoolStats();
      clearNodeCacheStats();
      clearMemoryStats();
      console.log('All data cleared');
      break;
    default:
      console.error(`Unknown data type: ${dataType}`);
      console.error('Available data types: profiling, chunkpool, nodecache, memory, all');
      return;
  }
}

/**
 * Set profiling options
 * 
 * @param options - The options to set
 */
export function setProfilingOptions(options: {
  enabled?: boolean;
  logToConsole?: boolean;
  collectMemoryData?: boolean;
  samplingRate?: number;
  maxEntries?: number;
}): void {
  const profiler = getProfilingSystem();
  profiler.setOptions(options);
  
  console.log('Profiling options set:');
  console.log(JSON.stringify(options, null, 2));
}

/**
 * Parse command-line arguments and execute the appropriate command
 * 
 * @param args - Command-line arguments
 */
export function parseArgs(args: string[]): void {
  const command = args[0];
  
  switch (command) {
    case 'enable':
      enableProfiling();
      console.log('Profiling enabled');
      break;
      
    case 'disable':
      disableProfiling();
      console.log('Profiling disabled');
      break;
      
    case 'report':
      const reportType = args[1] || 'all';
      const outputPath = args[2];
      generateReport(reportType, outputPath);
      break;
      
    case 'clear':
      const dataType = args[1] || 'all';
      clearData(dataType);
      break;
      
    case 'options':
      const options: any = {};
      
      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        const [key, value] = arg.split('=');
        
        if (key && value) {
          switch (key) {
            case 'enabled':
              options.enabled = value.toLowerCase() === 'true';
              break;
            case 'logToConsole':
              options.logToConsole = value.toLowerCase() === 'true';
              break;
            case 'collectMemoryData':
              options.collectMemoryData = value.toLowerCase() === 'true';
              break;
            case 'samplingRate':
              options.samplingRate = parseFloat(value);
              break;
            case 'maxEntries':
              options.maxEntries = parseInt(value, 10);
              break;
            default:
              console.warn(`Unknown option: ${key}`);
              break;
          }
        }
      }
      
      setProfilingOptions(options);
      break;
      
    case 'help':
    default:
      console.log('Reduct Profiling CLI');
      console.log('-------------------');
      console.log('Commands:');
      console.log('  enable                     Enable profiling');
      console.log('  disable                    Disable profiling');
      console.log('  report [type] [outputPath] Generate a report');
      console.log('    type: profiling, chunkpool, nodecache, memory, all (default: all)');
      console.log('    outputPath: Path to save the report to (optional)');
      console.log('  clear [type]               Clear profiling data');
      console.log('    type: profiling, chunkpool, nodecache, memory, all (default: all)');
      console.log('  options [key=value...]     Set profiling options');
      console.log('    enabled=true|false       Enable or disable profiling');
      console.log('    logToConsole=true|false  Log profiling data to the console');
      console.log('    collectMemoryData=true|false Collect memory usage data');
      console.log('    samplingRate=0.01        Sampling rate (0-1)');
      console.log('    maxEntries=1000          Maximum number of profiling entries to keep');
      console.log('  help                       Show this help message');
      break;
  }
}

// If this file is run directly, parse command-line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  parseArgs(args);
}
