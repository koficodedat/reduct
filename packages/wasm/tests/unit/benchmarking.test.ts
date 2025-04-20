import { describe, it, expect, vi, beforeEach } from 'vitest';
import { benchmark, formatBenchmarkResult } from '../../src/utils/benchmarking';
import { JavaScriptFallbackAccelerator } from '../../src/accelerators/accelerator';

describe('Benchmarking Utilities', () => {
  // Mock performance.now
  let nowMock: ReturnType<typeof vi.fn>;
  let nowValues: number[];
  
  beforeEach(() => {
    // Reset the mock values
    nowValues = [
      // JS implementation
      100, 150, // First iteration
      200, 250, // Second iteration
      300, 350, // Third iteration
      
      // Wasm implementation
      400, 425, // First iteration
      450, 475, // Second iteration
      500, 525, // Third iteration
    ];
    
    // Create a mock for performance.now
    nowMock = vi.fn().mockImplementation(() => {
      return nowValues.shift() || 0;
    });
    
    // Replace the real performance.now with the mock
    const originalNow = performance.now;
    performance.now = nowMock;
    
    // Restore the original after the test
    return () => {
      performance.now = originalNow;
    };
  });
  
  it('should benchmark JavaScript vs WebAssembly implementations', () => {
    // Create a JavaScript implementation
    const jsImplementation = (input: number[]) => input.map(x => x * 2);
    
    // Create a WebAssembly accelerator
    const wasmAccelerator = new JavaScriptFallbackAccelerator(
      'test',
      'mock',
      'operation',
      (input: number[]) => input.map(x => x * 2)
    );
    
    // Run the benchmark
    const result = benchmark(
      jsImplementation,
      wasmAccelerator,
      [1, 2, 3],
      { iterations: 3, warmupIterations: 0 }
    );
    
    // Check the results
    expect(result.jsTime).toBe(50); // Average of (150-100), (250-200), (350-300)
    expect(result.wasmTime).toBe(25); // Average of (425-400), (475-450), (525-500)
    expect(result.speedup).toBe(2); // 50 / 25
    expect(result.jsResult).toEqual([2, 4, 6]);
    expect(result.wasmResult).toEqual([2, 4, 6]);
    expect(result.resultsEqual).toBe(true);
  });
  
  it('should format benchmark results', () => {
    // Create a benchmark result
    const result = {
      jsTime: 50,
      wasmTime: 25,
      speedup: 2,
      jsResult: [2, 4, 6],
      wasmResult: [2, 4, 6],
      resultsEqual: true,
      details: {
        jsTimings: [50, 50, 50],
        wasmTimings: [25, 25, 25],
      },
    };
    
    // Format the result
    const formatted = formatBenchmarkResult(result);
    
    // Check the formatted result
    expect(formatted).toContain('JavaScript time: 50.00ms');
    expect(formatted).toContain('WebAssembly time: 25.00ms');
    expect(formatted).toContain('Speedup: 2.00x');
    expect(formatted).toContain('Results equal: true');
  });
});
