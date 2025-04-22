/**
 * Browser-based benchmark UI
 */

import { BrowserBenchmarkRunner, BrowserBenchmarkResult, BrowserBenchmarkConfig } from './browser-benchmark-runner';
import { InputSizeCategory, DataTypeCategory } from '../suites/wasm-optimization/input-size-benchmark';
import { AcceleratorTier } from '../../../wasm/src/accelerators/accelerator';

/**
 * Browser benchmark UI
 */
export class BrowserBenchmarkUI {
  /**
   * The benchmark configuration
   */
  private config: BrowserBenchmarkConfig = {
    operations: ['map', 'filter', 'reduce', 'sort', 'find'],
    sizeCategories: [
      InputSizeCategory.TINY,
      InputSizeCategory.SMALL,
      InputSizeCategory.MEDIUM
    ],
    dataTypeCategories: [
      DataTypeCategory.NUMBER,
      DataTypeCategory.STRING
    ],
    iterations: 50,
    warmupIterations: 5
  };

  /**
   * The benchmark results
   */
  private results: BrowserBenchmarkResult[] = [];

  /**
   * The benchmark runner
   */
  private runner: BrowserBenchmarkRunner | null = null;

  /**
   * Whether the benchmark is running
   */
  private running = false;

  /**
   * The server URL to send results to
   */
  private serverUrl: string | null = null;

  /**
   * Initialize the UI
   * 
   * @param containerId The ID of the container element
   * @param serverUrl The server URL to send results to
   */
  public initialize(containerId: string, serverUrl?: string): void {
    // Set the server URL
    this.serverUrl = serverUrl || null;

    // Get the container element
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with ID "${containerId}" not found`);
    }

    // Create the UI
    container.innerHTML = `
      <div class="benchmark-ui">
        <h1>WebAssembly Benchmark</h1>
        
        <div class="benchmark-config">
          <h2>Configuration</h2>
          
          <div class="config-section">
            <h3>Operations</h3>
            <div class="checkbox-group" id="operations">
              <label><input type="checkbox" value="map" checked> Map</label>
              <label><input type="checkbox" value="filter" checked> Filter</label>
              <label><input type="checkbox" value="reduce" checked> Reduce</label>
              <label><input type="checkbox" value="sort" checked> Sort</label>
              <label><input type="checkbox" value="find" checked> Find</label>
            </div>
          </div>
          
          <div class="config-section">
            <h3>Input Sizes</h3>
            <div class="checkbox-group" id="sizes">
              <label><input type="checkbox" value="tiny" checked> Tiny (1-10)</label>
              <label><input type="checkbox" value="small" checked> Small (11-100)</label>
              <label><input type="checkbox" value="medium" checked> Medium (101-1000)</label>
              <label><input type="checkbox" value="large"> Large (1001-10000)</label>
              <label><input type="checkbox" value="very_large"> Very Large (10001-100000)</label>
            </div>
          </div>
          
          <div class="config-section">
            <h3>Data Types</h3>
            <div class="checkbox-group" id="dataTypes">
              <label><input type="checkbox" value="number" checked> Numbers</label>
              <label><input type="checkbox" value="string" checked> Strings</label>
              <label><input type="checkbox" value="object"> Objects</label>
              <label><input type="checkbox" value="mixed"> Mixed</label>
            </div>
          </div>
          
          <div class="config-section">
            <h3>Iterations</h3>
            <div class="input-group">
              <label>Iterations: <input type="number" id="iterations" value="50" min="1" max="1000"></label>
              <label>Warmup Iterations: <input type="number" id="warmupIterations" value="5" min="0" max="100"></label>
            </div>
          </div>
        </div>
        
        <div class="benchmark-controls">
          <button id="runButton" class="primary-button">Run Benchmark</button>
          <button id="resetButton" class="secondary-button">Reset</button>
          <button id="exportButton" class="secondary-button">Export Results</button>
        </div>
        
        <div class="benchmark-progress" style="display: none;">
          <div class="progress-bar">
            <div class="progress-bar-inner" style="width: 0%;"></div>
          </div>
          <div class="progress-text">0%</div>
        </div>
        
        <div class="benchmark-results">
          <h2>Results</h2>
          <div id="resultsContainer"></div>
        </div>
      </div>
      
      <style>
        .benchmark-ui {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h1, h2, h3 {
          color: #333;
        }
        
        .benchmark-config {
          margin-bottom: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          background-color: #f9f9f9;
        }
        
        .config-section {
          margin-bottom: 15px;
        }
        
        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .checkbox-group label {
          display: flex;
          align-items: center;
          margin-right: 10px;
        }
        
        .input-group {
          display: flex;
          gap: 20px;
        }
        
        .input-group input {
          width: 60px;
          padding: 5px;
        }
        
        .benchmark-controls {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
        }
        
        .primary-button {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        }
        
        .secondary-button {
          background-color: #f1f1f1;
          color: #333;
          border: 1px solid #ddd;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        }
        
        .benchmark-progress {
          margin-bottom: 20px;
        }
        
        .progress-bar {
          height: 20px;
          background-color: #f1f1f1;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 5px;
        }
        
        .progress-bar-inner {
          height: 100%;
          background-color: #4CAF50;
          transition: width 0.3s;
        }
        
        .progress-text {
          text-align: center;
          font-size: 14px;
        }
        
        .benchmark-results {
          margin-top: 20px;
        }
        
        .result-card {
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 15px;
          background-color: white;
        }
        
        .result-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .result-title {
          font-weight: bold;
          font-size: 16px;
        }
        
        .result-details {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        
        .result-detail {
          display: flex;
          flex-direction: column;
        }
        
        .result-label {
          font-size: 12px;
          color: #666;
        }
        
        .result-value {
          font-size: 14px;
          font-weight: bold;
        }
        
        .tier-comparison {
          margin-top: 15px;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        
        .tier-bar {
          height: 30px;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
        }
        
        .tier-label {
          width: 120px;
          font-size: 14px;
        }
        
        .tier-value {
          flex-grow: 1;
          height: 20px;
          background-color: #4CAF50;
          position: relative;
        }
        
        .tier-text {
          position: absolute;
          right: -50px;
          top: 0;
          font-size: 12px;
        }
      </style>
    `;

    // Add event listeners
    this.addEventListeners();
  }

  /**
   * Add event listeners to the UI
   */
  private addEventListeners(): void {
    // Run button
    const runButton = document.getElementById('runButton');
    if (runButton) {
      runButton.addEventListener('click', () => this.runBenchmark());
    }

    // Reset button
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
      resetButton.addEventListener('click', () => this.resetBenchmark());
    }

    // Export button
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
      exportButton.addEventListener('click', () => this.exportResults());
    }
  }

  /**
   * Update the configuration from the UI
   */
  private updateConfigFromUI(): void {
    // Operations
    const operationCheckboxes = document.querySelectorAll<HTMLInputElement>('#operations input[type="checkbox"]:checked');
    this.config.operations = Array.from(operationCheckboxes).map(checkbox => checkbox.value);

    // Sizes
    const sizeCheckboxes = document.querySelectorAll<HTMLInputElement>('#sizes input[type="checkbox"]:checked');
    this.config.sizeCategories = Array.from(sizeCheckboxes).map(checkbox => checkbox.value as InputSizeCategory);

    // Data types
    const dataTypeCheckboxes = document.querySelectorAll<HTMLInputElement>('#dataTypes input[type="checkbox"]:checked');
    this.config.dataTypeCategories = Array.from(dataTypeCheckboxes).map(checkbox => checkbox.value as DataTypeCategory);

    // Iterations
    const iterationsInput = document.getElementById('iterations') as HTMLInputElement;
    this.config.iterations = parseInt(iterationsInput.value, 10);

    // Warmup iterations
    const warmupIterationsInput = document.getElementById('warmupIterations') as HTMLInputElement;
    this.config.warmupIterations = parseInt(warmupIterationsInput.value, 10);
  }

  /**
   * Run the benchmark
   */
  private runBenchmark(): void {
    if (this.running) {
      return;
    }

    // Update the configuration from the UI
    this.updateConfigFromUI();

    // Clear previous results
    this.results = [];
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }

    // Show progress bar
    const progressContainer = document.querySelector('.benchmark-progress');
    if (progressContainer) {
      progressContainer.style.display = 'block';
    }

    // Disable run button
    const runButton = document.getElementById('runButton');
    if (runButton) {
      runButton.disabled = true;
      runButton.textContent = 'Running...';
    }

    // Set running flag
    this.running = true;

    // Create the benchmark runner
    this.runner = new BrowserBenchmarkRunner(
      this.config,
      this.onProgress.bind(this),
      this.onResult.bind(this),
      this.onComplete.bind(this)
    );

    // Run the benchmark
    this.runner.run();
  }

  /**
   * Reset the benchmark
   */
  private resetBenchmark(): void {
    // Clear results
    this.results = [];
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }

    // Hide progress bar
    const progressContainer = document.querySelector('.benchmark-progress');
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }

    // Reset progress bar
    const progressBar = document.querySelector('.progress-bar-inner');
    if (progressBar) {
      progressBar.style.width = '0%';
    }

    // Reset progress text
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
      progressText.textContent = '0%';
    }

    // Enable run button
    const runButton = document.getElementById('runButton');
    if (runButton) {
      runButton.disabled = false;
      runButton.textContent = 'Run Benchmark';
    }

    // Reset running flag
    this.running = false;
  }

  /**
   * Export the benchmark results
   */
  private exportResults(): void {
    if (this.results.length === 0) {
      alert('No results to export');
      return;
    }

    // Create a JSON string
    const json = JSON.stringify(this.results, null, 2);

    // Create a blob
    const blob = new Blob([json], { type: 'application/json' });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wasm-benchmark-results-${new Date().toISOString().replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Handle progress updates
   * 
   * @param progress The current progress
   * @param total The total number of benchmarks
   */
  private onProgress(progress: number, total: number): void {
    const percent = Math.round((progress / total) * 100);

    // Update progress bar
    const progressBar = document.querySelector('.progress-bar-inner');
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }

    // Update progress text
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
      progressText.textContent = `${percent}% (${progress}/${total})`;
    }
  }

  /**
   * Handle benchmark results
   * 
   * @param result The benchmark result
   */
  private onResult(result: BrowserBenchmarkResult): void {
    // Add the result to the results array
    this.results.push(result);

    // Send the result to the server if a server URL is provided
    if (this.serverUrl) {
      this.sendResultToServer(result);
    }

    // Group results by operation, size category, data type category, and input size
    const key = `${result.operation}-${result.sizeCategory}-${result.dataTypeCategory}-${result.inputSize}`;
    
    // Check if a result card already exists for this key
    let resultCard = document.getElementById(`result-${key}`);
    
    if (!resultCard) {
      // Create a new result card
      resultCard = document.createElement('div');
      resultCard.id = `result-${key}`;
      resultCard.className = 'result-card';
      
      // Add the result card to the results container
      const resultsContainer = document.getElementById('resultsContainer');
      if (resultsContainer) {
        resultsContainer.appendChild(resultCard);
      }
      
      // Add the result header
      resultCard.innerHTML = `
        <div class="result-header">
          <div class="result-title">${result.operation} - ${result.sizeCategory} ${result.dataTypeCategory} (size: ${result.inputSize})</div>
        </div>
        <div class="result-details">
          <div class="result-detail">
            <div class="result-label">Browser</div>
            <div class="result-value">${result.browserInfo.name} ${result.browserInfo.version}</div>
          </div>
          <div class="result-detail">
            <div class="result-label">OS</div>
            <div class="result-value">${result.browserInfo.os}</div>
          </div>
          <div class="result-detail">
            <div class="result-label">Device</div>
            <div class="result-value">${result.browserInfo.deviceType}</div>
          </div>
          <div class="result-detail">
            <div class="result-label">CPU</div>
            <div class="result-value">${result.browserInfo.cpuArchitecture} (${result.browserInfo.cpuCores} cores)</div>
          </div>
        </div>
        <div class="tier-comparison">
          <h3>Performance by Tier</h3>
          <div class="tier-bars"></div>
        </div>
      `;
    }
    
    // Get the tier bars container
    const tierBarsContainer = resultCard.querySelector('.tier-bars');
    if (!tierBarsContainer) return;
    
    // Add or update the tier bar
    let tierBar = resultCard.querySelector(`.tier-bar-${result.tier}`);
    
    if (!tierBar) {
      // Create a new tier bar
      tierBar = document.createElement('div');
      tierBar.className = `tier-bar tier-bar-${result.tier}`;
      tierBarsContainer.appendChild(tierBar);
      
      // Add the tier label
      const tierLabel = document.createElement('div');
      tierLabel.className = 'tier-label';
      tierLabel.textContent = result.tier;
      tierBar.appendChild(tierLabel);
      
      // Add the tier value
      const tierValue = document.createElement('div');
      tierValue.className = 'tier-value';
      tierBar.appendChild(tierValue);
      
      // Add the tier text
      const tierText = document.createElement('div');
      tierText.className = 'tier-text';
      tierValue.appendChild(tierText);
    }
    
    // Update the tier bar
    const tierValue = tierBar.querySelector('.tier-value');
    const tierText = tierBar.querySelector('.tier-text');
    
    if (tierValue && tierText) {
      // Set the tier value width based on the execution time
      // We'll use a logarithmic scale to better visualize the differences
      const maxWidth = 100; // Maximum width in percentage
      const minTime = 0.01; // Minimum execution time in ms
      const maxTime = 1000; // Maximum execution time in ms
      
      // Calculate the width using a logarithmic scale
      const logMinTime = Math.log(minTime);
      const logMaxTime = Math.log(maxTime);
      const logTime = Math.log(Math.max(minTime, Math.min(maxTime, result.executionTime)));
      
      const width = maxWidth * (1 - (logTime - logMinTime) / (logMaxTime - logMinTime));
      
      tierValue.style.width = `${width}%`;
      tierText.textContent = `${result.executionTime.toFixed(2)} ms`;
    }
    
    // Update the tier bars to show relative performance
    this.updateTierBars(key);
  }

  /**
   * Update the tier bars to show relative performance
   * 
   * @param key The result key
   */
  private updateTierBars(key: string): void {
    // Get all results for this key
    const keyResults = this.results.filter(r => 
      `${r.operation}-${r.sizeCategory}-${r.dataTypeCategory}-${r.inputSize}` === key
    );
    
    // If we have results for all tiers, update the tier bars
    const tiers = Object.values(AcceleratorTier);
    
    if (keyResults.length === tiers.length) {
      // Find the fastest tier
      const fastestResult = keyResults.reduce((fastest, current) => 
        current.executionTime < fastest.executionTime ? current : fastest
      );
      
      // Update the tier bars
      const resultCard = document.getElementById(`result-${key}`);
      if (!resultCard) return;
      
      for (const result of keyResults) {
        const tierBar = resultCard.querySelector(`.tier-bar-${result.tier}`);
        if (!tierBar) continue;
        
        const tierValue = tierBar.querySelector('.tier-value');
        if (!tierValue) continue;
        
        // Set the color based on the relative performance
        const ratio = result.executionTime / fastestResult.executionTime;
        
        if (ratio <= 1.1) {
          // Fastest or within 10% of fastest
          tierValue.style.backgroundColor = '#4CAF50'; // Green
        } else if (ratio <= 2) {
          // Up to 2x slower
          tierValue.style.backgroundColor = '#FFC107'; // Yellow
        } else {
          // More than 2x slower
          tierValue.style.backgroundColor = '#F44336'; // Red
        }
      }
    }
  }

  /**
   * Send a benchmark result to the server
   * 
   * @param result The benchmark result
   */
  private sendResultToServer(result: BrowserBenchmarkResult): void {
    if (!this.serverUrl) return;

    // Send the result to the server
    fetch(this.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    }).catch(error => {
      console.error('Error sending result to server:', error);
    });
  }

  /**
   * Handle benchmark completion
   */
  private onComplete(): void {
    // Hide progress bar
    const progressContainer = document.querySelector('.benchmark-progress');
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }

    // Enable run button
    const runButton = document.getElementById('runButton');
    if (runButton) {
      runButton.disabled = false;
      runButton.textContent = 'Run Benchmark';
    }

    // Reset running flag
    this.running = false;

    // Show completion message
    alert('Benchmark completed!');
  }
}
