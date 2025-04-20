/**
 * Profiling utilities for WebAssembly
 */

/**
 * Profile entry
 */
export interface ProfileEntry {
  /**
   * Name of the operation
   */
  name: string;
  
  /**
   * Start time (ms)
   */
  startTime: number;
  
  /**
   * End time (ms)
   */
  endTime: number;
  
  /**
   * Duration (ms)
   */
  duration: number;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Profiler for WebAssembly operations
 */
export class WasmProfiler {
  private static instance: WasmProfiler;
  private entries: ProfileEntry[] = [];
  private enabled = false;
  
  /**
   * Get the singleton instance of the profiler
   * @returns The profiler instance
   */
  public static getInstance(): WasmProfiler {
    if (!WasmProfiler.instance) {
      WasmProfiler.instance = new WasmProfiler();
    }
    return WasmProfiler.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Enable profiling
   */
  public enable(): void {
    this.enabled = true;
  }
  
  /**
   * Disable profiling
   */
  public disable(): void {
    this.enabled = false;
  }
  
  /**
   * Check if profiling is enabled
   * @returns True if profiling is enabled, false otherwise
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Start profiling an operation
   * @param name Name of the operation
   * @param metadata Additional metadata
   * @returns The start time (ms)
   */
  public start(name: string, metadata?: Record<string, any>): number {
    if (!this.enabled) return 0;
    
    const startTime = performance.now();
    
    // Store the start time in a temporary entry
    this.entries.push({
      name,
      startTime,
      endTime: 0,
      duration: 0,
      metadata,
    });
    
    return startTime;
  }
  
  /**
   * End profiling an operation
   * @param name Name of the operation
   * @returns The duration (ms)
   */
  public end(name: string): number {
    if (!this.enabled) return 0;
    
    const endTime = performance.now();
    
    // Find the most recent entry with the given name
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const entry = this.entries[i];
      if (entry.name === name && entry.endTime === 0) {
        entry.endTime = endTime;
        entry.duration = endTime - entry.startTime;
        return entry.duration;
      }
    }
    
    return 0;
  }
  
  /**
   * Profile a function
   * @param name Name of the operation
   * @param fn Function to profile
   * @param metadata Additional metadata
   * @returns The result of the function
   */
  public profile<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    if (!this.enabled) return fn();
    
    this.start(name, metadata);
    try {
      return fn();
    } finally {
      this.end(name);
    }
  }
  
  /**
   * Profile an async function
   * @param name Name of the operation
   * @param fn Async function to profile
   * @param metadata Additional metadata
   * @returns A promise that resolves to the result of the function
   */
  public async profileAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    if (!this.enabled) return fn();
    
    this.start(name, metadata);
    try {
      return await fn();
    } finally {
      this.end(name);
    }
  }
  
  /**
   * Get all profile entries
   * @returns The profile entries
   */
  public getEntries(): ProfileEntry[] {
    return [...this.entries];
  }
  
  /**
   * Clear all profile entries
   */
  public clear(): void {
    this.entries = [];
  }
  
  /**
   * Get a summary of the profile entries
   * @returns A summary of the profile entries
   */
  public getSummary(): Record<string, { count: number; totalDuration: number; averageDuration: number }> {
    const summary: Record<string, { count: number; totalDuration: number; averageDuration: number }> = {};
    
    for (const entry of this.entries) {
      if (entry.endTime === 0) continue; // Skip incomplete entries
      
      if (!summary[entry.name]) {
        summary[entry.name] = {
          count: 0,
          totalDuration: 0,
          averageDuration: 0,
        };
      }
      
      summary[entry.name].count++;
      summary[entry.name].totalDuration += entry.duration;
    }
    
    // Calculate average durations
    for (const name in summary) {
      summary[name].averageDuration = summary[name].totalDuration / summary[name].count;
    }
    
    return summary;
  }
  
  /**
   * Format the profile summary as a string
   * @returns The formatted summary
   */
  public formatSummary(): string {
    const summary = this.getSummary();
    let result = 'Profile Summary:\n';
    
    for (const name in summary) {
      const { count, totalDuration, averageDuration } = summary[name];
      result += `${name}: ${count} calls, ${totalDuration.toFixed(2)}ms total, ${averageDuration.toFixed(2)}ms avg\n`;
    }
    
    return result;
  }
  
  /**
   * Format the profile summary as Markdown
   * @returns The formatted summary as Markdown
   */
  public formatSummaryMarkdown(): string {
    const summary = this.getSummary();
    let result = '## Profile Summary\n\n';
    
    result += '| Operation | Calls | Total Duration | Average Duration |\n';
    result += '|-----------|-------|---------------|------------------|\n';
    
    for (const name in summary) {
      const { count, totalDuration, averageDuration } = summary[name];
      result += `| ${name} | ${count} | ${totalDuration.toFixed(2)}ms | ${averageDuration.toFixed(2)}ms |\n`;
    }
    
    return result;
  }
}
