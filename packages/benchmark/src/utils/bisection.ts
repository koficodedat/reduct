/**
 * Utilities for automatic bisection to identify the commit that introduced a regression
 */
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { RegressionDetectionResult, hasRegressions } from './regression-detection';

/**
 * Bisection options
 */
export interface BisectionOptions {
  /**
   * Path to the repository
   */
  repoPath?: string;
  
  /**
   * Good commit (known to be without regression)
   */
  goodCommit?: string;
  
  /**
   * Bad commit (known to have regression)
   */
  badCommit?: string;
  
  /**
   * Command to run the benchmark
   */
  benchmarkCommand: string;
  
  /**
   * Command to run to detect regressions
   */
  regressionDetectionCommand: string;
  
  /**
   * Maximum number of iterations
   */
  maxIterations?: number;
  
  /**
   * Timeout for each command in milliseconds
   */
  timeout?: number;
  
  /**
   * Whether to skip verification of good and bad commits
   */
  skipVerification?: boolean;
  
  /**
   * Whether to clean the working directory before each checkout
   */
  cleanWorkingDir?: boolean;
  
  /**
   * Output file for bisection results
   */
  outputFile?: string;
}

/**
 * Bisection result
 */
export interface BisectionResult {
  /**
   * First bad commit
   */
  firstBadCommit: {
    /**
     * Commit hash
     */
    hash: string;
    
    /**
     * Commit author
     */
    author: string;
    
    /**
     * Commit date
     */
    date: string;
    
    /**
     * Commit message
     */
    message: string;
  };
  
  /**
   * Number of iterations
   */
  iterations: number;
  
  /**
   * Tested commits
   */
  testedCommits: Array<{
    /**
     * Commit hash
     */
    hash: string;
    
    /**
     * Whether the commit is good
     */
    isGood: boolean;
  }>;
  
  /**
   * Start time
   */
  startTime: string;
  
  /**
   * End time
   */
  endTime: string;
  
  /**
   * Duration in milliseconds
   */
  duration: number;
}

/**
 * Default bisection options
 */
const DEFAULT_OPTIONS: Partial<BisectionOptions> = {
  repoPath: process.cwd(),
  maxIterations: 20,
  timeout: 10 * 60 * 1000, // 10 minutes
  skipVerification: false,
  cleanWorkingDir: true,
  outputFile: path.join(process.cwd(), 'packages/benchmark/bisection-results.json'),
};

/**
 * Execute a command
 * @param command Command to execute
 * @param options Options for execution
 * @returns Promise that resolves with the command output
 */
async function executeCommand(command: string, options: { cwd: string; timeout: number }): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, { shell: true, cwd: options.cwd });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    const timeoutId = setTimeout(() => {
      process.kill();
      reject(new Error(`Command timed out after ${options.timeout}ms: ${command}`));
    }, options.timeout);
    
    process.on('close', (code) => {
      clearTimeout(timeoutId);
      
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${command}\n${stderr}`));
      }
    });
  });
}

/**
 * Get commit details
 * @param commit Commit hash
 * @param repoPath Path to the repository
 * @returns Promise that resolves with the commit details
 */
async function getCommitDetails(commit: string, repoPath: string): Promise<{ hash: string; author: string; date: string; message: string }> {
  const format = '%H%n%an%n%ad%n%s';
  const output = await executeCommand(`git show -s --format="${format}" ${commit}`, { cwd: repoPath, timeout: 30000 });
  const [hash, author, date, message] = output.trim().split('\n');
  
  return { hash, author, date, message };
}

/**
 * Check if a commit is good (no regressions)
 * @param options Bisection options
 * @returns Promise that resolves with true if the commit is good
 */
async function isCommitGood(options: Required<BisectionOptions>): Promise<boolean> {
  try {
    // Checkout the commit
    await executeCommand(`git checkout -q ${options.cleanWorkingDir ? ' -f' : ''} HEAD`, { cwd: options.repoPath, timeout: options.timeout });
    
    // Clean the working directory if needed
    if (options.cleanWorkingDir) {
      await executeCommand('git clean -fdx', { cwd: options.repoPath, timeout: options.timeout });
    }
    
    // Install dependencies
    await executeCommand('npm ci', { cwd: options.repoPath, timeout: options.timeout });
    
    // Build the project
    await executeCommand('npm run build', { cwd: options.repoPath, timeout: options.timeout });
    
    // Run the benchmark
    await executeCommand(options.benchmarkCommand, { cwd: options.repoPath, timeout: options.timeout });
    
    // Run regression detection
    const output = await executeCommand(options.regressionDetectionCommand, { cwd: options.repoPath, timeout: options.timeout });
    
    // Parse the output to determine if there are regressions
    try {
      // Try to parse the output as JSON
      const result = JSON.parse(output) as RegressionDetectionResult;
      return !hasRegressions(result);
    } catch (error) {
      // If parsing fails, check if the output contains "No regressions"
      return output.includes('No regressions');
    }
  } catch (error) {
    console.error('Error checking if commit is good:', error);
    return false;
  }
}

/**
 * Perform automatic bisection
 * @param options Bisection options
 * @returns Promise that resolves with the bisection result
 */
export async function performBisection(options: BisectionOptions): Promise<BisectionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options } as Required<BisectionOptions>;
  const startTime = new Date();
  
  console.log('Starting automatic bisection...');
  console.log(`Repository path: ${opts.repoPath}`);
  console.log(`Good commit: ${opts.goodCommit || 'auto'}`);
  console.log(`Bad commit: ${opts.badCommit || 'auto'}`);
  console.log(`Benchmark command: ${opts.benchmarkCommand}`);
  console.log(`Regression detection command: ${opts.regressionDetectionCommand}`);
  console.log(`Maximum iterations: ${opts.maxIterations}`);
  console.log(`Timeout: ${opts.timeout}ms`);
  console.log(`Skip verification: ${opts.skipVerification}`);
  console.log(`Clean working directory: ${opts.cleanWorkingDir}`);
  console.log('');
  
  // Save the current branch
  const currentBranch = (await executeCommand('git rev-parse --abbrev-ref HEAD', { cwd: opts.repoPath, timeout: 30000 })).trim();
  
  try {
    // Determine good and bad commits if not provided
    if (!opts.goodCommit || !opts.badCommit) {
      console.log('Determining good and bad commits...');
      
      // Get the list of commits
      const commitsOutput = await executeCommand('git log --pretty=format:"%H" -n 100', { cwd: opts.repoPath, timeout: 30000 });
      const commits = commitsOutput.trim().split('\n');
      
      if (!opts.badCommit) {
        // Use the latest commit as the bad commit
        opts.badCommit = commits[0];
        console.log(`Using latest commit as bad commit: ${opts.badCommit}`);
      }
      
      if (!opts.goodCommit) {
        // Use the oldest commit as the good commit
        opts.goodCommit = commits[commits.length - 1];
        console.log(`Using oldest commit as good commit: ${opts.goodCommit}`);
      }
    }
    
    // Verify good and bad commits if needed
    if (!opts.skipVerification) {
      console.log('Verifying good and bad commits...');
      
      // Checkout and verify good commit
      await executeCommand(`git checkout -q ${opts.cleanWorkingDir ? ' -f' : ''} ${opts.goodCommit}`, { cwd: opts.repoPath, timeout: opts.timeout });
      const isGoodCommitGood = await isCommitGood(opts);
      
      if (!isGoodCommitGood) {
        throw new Error(`Good commit ${opts.goodCommit} is not actually good (has regressions).`);
      }
      
      // Checkout and verify bad commit
      await executeCommand(`git checkout -q ${opts.cleanWorkingDir ? ' -f' : ''} ${opts.badCommit}`, { cwd: opts.repoPath, timeout: opts.timeout });
      const isBadCommitBad = !await isCommitGood(opts);
      
      if (!isBadCommitBad) {
        throw new Error(`Bad commit ${opts.badCommit} is not actually bad (no regressions).`);
      }
    }
    
    // Start bisection
    console.log('Starting bisection...');
    await executeCommand('git bisect start', { cwd: opts.repoPath, timeout: 30000 });
    await executeCommand(`git bisect bad ${opts.badCommit}`, { cwd: opts.repoPath, timeout: 30000 });
    await executeCommand(`git bisect good ${opts.goodCommit}`, { cwd: opts.repoPath, timeout: 30000 });
    
    // Perform bisection
    const testedCommits: Array<{ hash: string; isGood: boolean }> = [];
    let iterations = 0;
    
    while (iterations < opts.maxIterations) {
      iterations++;
      console.log(`\nIteration ${iterations}/${opts.maxIterations}`);
      
      // Get current commit
      const currentCommit = (await executeCommand('git rev-parse HEAD', { cwd: opts.repoPath, timeout: 30000 })).trim();
      console.log(`Testing commit: ${currentCommit}`);
      
      // Check if the commit is good
      const isGood = await isCommitGood(opts);
      console.log(`Commit ${currentCommit} is ${isGood ? 'good' : 'bad'}`);
      
      // Record the tested commit
      testedCommits.push({ hash: currentCommit, isGood });
      
      // Mark the commit as good or bad
      await executeCommand(`git bisect ${isGood ? 'good' : 'bad'}`, { cwd: opts.repoPath, timeout: 30000 });
      
      // Check if bisection is complete
      const bisectOutput = await executeCommand('git bisect log', { cwd: opts.repoPath, timeout: 30000 });
      
      if (bisectOutput.includes('first bad commit')) {
        console.log('Bisection complete!');
        break;
      }
    }
    
    // Get the first bad commit
    const bisectOutput = await executeCommand('git bisect log', { cwd: opts.repoPath, timeout: 30000 });
    const firstBadCommitMatch = bisectOutput.match(/([a-f0-9]{40}) is the first bad commit/);
    
    if (!firstBadCommitMatch) {
      throw new Error('Failed to find the first bad commit.');
    }
    
    const firstBadCommitHash = firstBadCommitMatch[1];
    const firstBadCommit = await getCommitDetails(firstBadCommitHash, opts.repoPath);
    
    // End bisection
    await executeCommand('git bisect reset', { cwd: opts.repoPath, timeout: 30000 });
    
    // Restore the original branch
    await executeCommand(`git checkout -q ${currentBranch}`, { cwd: opts.repoPath, timeout: 30000 });
    
    // Create the result
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    const result: BisectionResult = {
      firstBadCommit,
      iterations,
      testedCommits,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
    };
    
    // Save the result
    if (opts.outputFile) {
      const outputDir = path.dirname(opts.outputFile);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(opts.outputFile, JSON.stringify(result, null, 2));
      console.log(`\nBisection results saved to: ${opts.outputFile}`);
    }
    
    return result;
  } catch (error) {
    // End bisection in case of error
    try {
      await executeCommand('git bisect reset', { cwd: opts.repoPath, timeout: 30000 });
      await executeCommand(`git checkout -q ${currentBranch}`, { cwd: opts.repoPath, timeout: 30000 });
    } catch (resetError) {
      console.error('Error resetting bisection:', resetError);
    }
    
    throw error;
  }
}

/**
 * Format bisection result as markdown
 * @param result Bisection result
 * @returns Markdown string
 */
export function formatBisectionResultMarkdown(result: BisectionResult): string {
  let markdown = '# Bisection Result\n\n';
  
  // Add summary
  markdown += '## Summary\n\n';
  markdown += `- **First Bad Commit**: ${result.firstBadCommit.hash}\n`;
  markdown += `- **Author**: ${result.firstBadCommit.author}\n`;
  markdown += `- **Date**: ${result.firstBadCommit.date}\n`;
  markdown += `- **Message**: ${result.firstBadCommit.message}\n`;
  markdown += `- **Iterations**: ${result.iterations}\n`;
  markdown += `- **Duration**: ${(result.duration / 1000 / 60).toFixed(2)} minutes\n\n`;
  
  // Add tested commits
  markdown += '## Tested Commits\n\n';
  markdown += '| Commit | Result |\n';
  markdown += '| ------ | ------ |\n';
  
  for (const commit of result.testedCommits) {
    markdown += `| ${commit.hash} | ${commit.isGood ? '✅ Good' : '❌ Bad'} |\n`;
  }
  
  return markdown;
}
