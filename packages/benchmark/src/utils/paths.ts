/**
 * Path utilities for the benchmark package
 * 
 * @packageDocumentation
 */

import path from 'path';
import fs from 'fs';

/**
 * Gets the benchmark package root directory
 * 
 * @returns Path to the benchmark package root
 */
export function getBenchmarkRoot(): string {
  // Start with the current file's directory
  let currentDir = __dirname;
  
  // Navigate up until we find the package.json file
  while (!fs.existsSync(path.join(currentDir, 'package.json'))) {
    const parentDir = path.dirname(currentDir);
    
    // If we've reached the root directory and still haven't found package.json
    if (parentDir === currentDir) {
      throw new Error('Could not find benchmark package root');
    }
    
    currentDir = parentDir;
  }
  
  // Verify this is the benchmark package by checking package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(currentDir, 'package.json'), 'utf-8'));
    if (packageJson.name !== '@reduct/benchmark') {
      throw new Error('Found package.json does not belong to @reduct/benchmark');
    }
  } catch (error) {
    throw new Error(`Error verifying benchmark package: ${error}`);
  }
  
  return currentDir;
}

/**
 * Gets the default reports directory
 * 
 * @returns Path to the reports directory
 */
export function getReportsDirectory(): string {
  const reportsDir = path.join(getBenchmarkRoot(), 'reports');
  
  // Create the directory if it doesn't exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  return reportsDir;
}

/**
 * Resolves a report file path
 * 
 * If the path is absolute, returns it as is.
 * If the path is relative and starts with './', returns it relative to the current directory.
 * Otherwise, returns it relative to the reports directory.
 * 
 * @param filePath - File path to resolve
 * @returns Resolved file path
 */
export function resolveReportPath(filePath: string): string {
  // If the path is absolute, return it as is
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  
  // If the path starts with './', return it relative to the current directory
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return path.resolve(filePath);
  }
  
  // Otherwise, return it relative to the reports directory
  return path.join(getReportsDirectory(), filePath);
}
