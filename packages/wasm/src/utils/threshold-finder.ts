/**
 * Utilities for finding optimal thresholds for WebAssembly acceleration
 */
import { Accelerator } from '../accelerators/accelerator';

/**
 * Result of a threshold finding operation
 */
export interface ThresholdResult {
  /**
   * The optimal threshold for switching between JavaScript and WebAssembly
   */
  threshold: number;
  
  /**
   * Performance data for each input size
   */
  performanceData: Array<{
    /**
     * Input size
     */
    size: number;
    
    /**
     * JavaScript execution time in milliseconds
     */
    jsTime: number;
    
    /**
     * WebAssembly execution time in milliseconds
     */
    wasmTime: number;
    
    /**
     * Speedup factor (JS time / WASM time)
     */
    speedup: number;
  }>;
  
  /**
   * The crossover point where WebAssembly becomes faster than JavaScript
   */
  crossoverPoint: number | null;
}

/**
 * Find the optimal threshold for switching between JavaScript and WebAssembly
 * 
 * @param jsImplementation The JavaScript implementation
 * @param wasmImplementation The WebAssembly implementation
 * @param generateInput A function that generates input of a given size
 * @param sizeRange The range of input sizes to test [min, max]
 * @param steps The number of steps to test
 * @returns The threshold finding result
 */
export async function findOptimalThreshold<T, R>(
  jsImplementation: (input: T) => R,
  wasmImplementation: Accelerator<T, R>,
  generateInput: (size: number) => T,
  sizeRange: [number, number],
  steps: number = 10
): Promise<ThresholdResult> {
  const [minSize, maxSize] = sizeRange;
  const stepSize = (maxSize - minSize) / (steps - 1);
  
  // Performance data for each input size
  const performanceData: ThresholdResult['performanceData'] = [];
  
  // Test each input size
  for (let i = 0; i < steps; i++) {
    const size = Math.round(minSize + i * stepSize);
    const input = generateInput(size);
    
    // Measure JavaScript execution time
    const jsStartTime = performance.now();
    jsImplementation(input);
    const jsEndTime = performance.now();
    const jsTime = jsEndTime - jsStartTime;
    
    // Measure WebAssembly execution time
    const wasmStartTime = performance.now();
    wasmImplementation.execute(input);
    const wasmEndTime = performance.now();
    const wasmTime = wasmEndTime - wasmStartTime;
    
    // Calculate speedup
    const speedup = jsTime / wasmTime;
    
    // Add to performance data
    performanceData.push({
      size,
      jsTime,
      wasmTime,
      speedup,
    });
  }
  
  // Find the crossover point where WebAssembly becomes faster than JavaScript
  let crossoverPoint: number | null = null;
  
  for (let i = 0; i < performanceData.length - 1; i++) {
    const current = performanceData[i];
    const next = performanceData[i + 1];
    
    if (current.speedup < 1 && next.speedup >= 1) {
      // Linear interpolation to find the exact crossover point
      const t = (1 - current.speedup) / (next.speedup - current.speedup);
      crossoverPoint = current.size + t * (next.size - current.size);
      break;
    }
  }
  
  // If no crossover point is found, use a default threshold
  let threshold: number;
  
  if (crossoverPoint === null) {
    // Check if WebAssembly is always faster
    const alwaysFaster = performanceData.every(data => data.speedup >= 1);
    
    if (alwaysFaster) {
      // WebAssembly is always faster, use the minimum size
      threshold = minSize;
    } else {
      // WebAssembly is never faster, use a very large threshold
      threshold = Number.MAX_SAFE_INTEGER;
    }
  } else {
    // Add a safety margin to the threshold
    threshold = Math.ceil(crossoverPoint * 1.1);
  }
  
  return {
    threshold,
    performanceData,
    crossoverPoint,
  };
}

/**
 * Generate a visualization of the threshold finding result
 * 
 * @param result The threshold finding result
 * @returns A string containing an ASCII chart
 */
export function visualizeThreshold(result: ThresholdResult): string {
  const { performanceData, crossoverPoint, threshold } = result;
  
  // Find the maximum speedup for scaling
  const maxSpeedup = Math.max(...performanceData.map(data => data.speedup));
  const chartHeight = 20;
  const chartWidth = 80;
  
  // Create the chart
  const chart: string[] = [];
  
  // Add the header
  chart.push('Input Size vs. Speedup (JS Time / WASM Time)');
  chart.push(''.padEnd(chartWidth, '-'));
  
  // Add the y-axis labels
  chart.push(`${maxSpeedup.toFixed(2)} |`);
  chart.push(`1.00 |${'-'.repeat(chartWidth - 6)}> Speedup = 1.0`);
  chart.push(`0.00 |`);
  
  // Add the data points
  const dataPoints: string[] = [];
  
  for (let i = 0; i < chartHeight; i++) {
    const row: string[] = [];
    const speedup = maxSpeedup * (1 - i / chartHeight);
    
    // Add the y-axis
    if (i === 0) {
      row.push('     |');
    } else if (i === chartHeight - 1) {
      row.push('     |');
    } else if (Math.abs(speedup - 1.0) < maxSpeedup / chartHeight) {
      row.push('1.00 |');
    } else {
      row.push('     |');
    }
    
    // Add the data points
    for (let j = 0; j < chartWidth - 6; j++) {
      const size = performanceData[0].size + (j / (chartWidth - 7)) * (performanceData[performanceData.length - 1].size - performanceData[0].size);
      
      // Check if this is the threshold
      if (Math.abs(size - threshold) < (performanceData[performanceData.length - 1].size - performanceData[0].size) / (chartWidth - 7)) {
        row.push('T');
        continue;
      }
      
      // Check if this is the crossover point
      if (crossoverPoint !== null && Math.abs(size - crossoverPoint) < (performanceData[performanceData.length - 1].size - performanceData[0].size) / (chartWidth - 7)) {
        row.push('X');
        continue;
      }
      
      // Interpolate the speedup at this size
      let interpolatedSpeedup = 0;
      
      for (let k = 0; k < performanceData.length - 1; k++) {
        const current = performanceData[k];
        const next = performanceData[k + 1];
        
        if (size >= current.size && size <= next.size) {
          const t = (size - current.size) / (next.size - current.size);
          interpolatedSpeedup = current.speedup + t * (next.speedup - current.speedup);
          break;
        }
      }
      
      // Add the data point
      if (Math.abs(interpolatedSpeedup - speedup) < maxSpeedup / chartHeight) {
        row.push('*');
      } else {
        row.push(' ');
      }
    }
    
    dataPoints.push(row.join(''));
  }
  
  chart.push(...dataPoints);
  
  // Add the x-axis
  chart.push('     ' + ''.padEnd(chartWidth - 5, '-'));
  chart.push(`     ${performanceData[0].size}${' '.repeat(chartWidth - 12)}${performanceData[performanceData.length - 1].size}`);
  chart.push(''.padEnd(chartWidth, ' ') + 'Input Size');
  
  // Add the legend
  chart.push('');
  chart.push('Legend:');
  chart.push('* - Data point');
  chart.push('X - Crossover point (WebAssembly becomes faster than JavaScript)');
  chart.push('T - Recommended threshold');
  
  // Add the summary
  chart.push('');
  chart.push('Summary:');
  chart.push(`Optimal threshold: ${threshold}`);
  
  if (crossoverPoint !== null) {
    chart.push(`Crossover point: ${crossoverPoint.toFixed(2)}`);
  } else {
    if (threshold === Number.MAX_SAFE_INTEGER) {
      chart.push('WebAssembly is never faster than JavaScript for the tested input sizes');
    } else {
      chart.push('WebAssembly is always faster than JavaScript for the tested input sizes');
    }
  }
  
  return chart.join('\n');
}
