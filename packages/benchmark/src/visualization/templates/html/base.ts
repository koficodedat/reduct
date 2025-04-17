/**
 * Base HTML templates
 * 
 * @packageDocumentation
 */

import { Template, registerTemplate } from '../engine';

/**
 * Base HTML template
 */
const baseTemplate: Template = {
  name: 'html-base',
  format: 'html',
  description: 'Base HTML template with common structure',
  content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ data.title || 'Benchmark Results' }}</title>
  <style>
    {{ include html-base-styles }}
    {{ if options.customCSS }}{{ options.customCSS }}{{ endif }}
  </style>
  {{ block head }}{{ endblock }}
</head>
<body>
  <div class="container">
    <header>
      <h1>{{ data.title || 'Benchmark Results' }}</h1>
      {{ if options.header }}{{ options.header }}{{ endif }}
    </header>
    
    <main>
      {{ block content }}
        <p>No content provided.</p>
      {{ endblock }}
    </main>
    
    <footer>
      <p>Generated: {{ helpers.formatDate(new Date()) }}</p>
      {{ if options.footer }}{{ options.footer }}{{ endif }}
    </footer>
  </div>
  
  {{ block scripts }}{{ endblock }}
</body>
</html>`,
};

/**
 * Base HTML styles
 */
const baseStyles: Template = {
  name: 'html-base-styles',
  format: 'html',
  description: 'Base CSS styles for HTML templates',
  content: `body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f9f9f9;
  margin: 0;
  padding: 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  margin-bottom: 30px;
}

h1, h2, h3, h4, h5, h6 {
  color: #0066cc;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

h1 {
  font-size: 2.2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

h2 {
  font-size: 1.8em;
}

h3 {
  font-size: 1.5em;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 20px 0;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #f0f7ff;
}

.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
  margin: 30px 0;
}

.metadata {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  margin-top: 30px;
  font-family: monospace;
  white-space: pre-wrap;
}

.summary {
  background-color: #f0f7ff;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 30px;
}

.toc {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 30px;
}

.toc ul {
  margin: 0;
  padding-left: 20px;
}

.fastest {
  font-weight: bold;
  color: #009900;
}

footer {
  margin-top: 50px;
  padding-top: 20px;
  border-top: 1px solid #eaecef;
  color: #666;
  font-size: 0.9em;
}

/* Theme: Dark */
.theme-dark {
  color: #eee;
  background-color: #222;
}

.theme-dark .container {
  background-color: #333;
  border-radius: 5px;
}

.theme-dark h1, .theme-dark h2, .theme-dark h3, .theme-dark h4, .theme-dark h5, .theme-dark h6 {
  color: #58a6ff;
}

.theme-dark h1 {
  border-bottom-color: #444;
}

.theme-dark table {
  border-color: #444;
}

.theme-dark th, .theme-dark td {
  border-color: #444;
}

.theme-dark th {
  background-color: #444;
}

.theme-dark tr:nth-child(even) {
  background-color: #3a3a3a;
}

.theme-dark tr:hover {
  background-color: #404040;
}

.theme-dark .metadata {
  background-color: #2d2d2d;
  color: #ddd;
}

.theme-dark .summary {
  background-color: #2d2d2d;
}

.theme-dark .toc {
  background-color: #2d2d2d;
}

.theme-dark footer {
  border-top-color: #444;
  color: #aaa;
}

/* Theme: Light Blue */
.theme-light-blue {
  color: #333;
  background-color: #f0f8ff;
}

.theme-light-blue .container {
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.theme-light-blue h1, .theme-light-blue h2, .theme-light-blue h3, 
.theme-light-blue h4, .theme-light-blue h5, .theme-light-blue h6 {
  color: #0077cc;
}

.theme-light-blue h1 {
  border-bottom-color: #d1e5f9;
}

.theme-light-blue th {
  background-color: #e6f2ff;
}

.theme-light-blue tr:nth-child(even) {
  background-color: #f5faff;
}

.theme-light-blue tr:hover {
  background-color: #e6f2ff;
}

.theme-light-blue .metadata {
  background-color: #f0f8ff;
}

.theme-light-blue .summary {
  background-color: #e6f2ff;
}

.theme-light-blue .toc {
  background-color: #f0f8ff;
}

.theme-light-blue footer {
  border-top-color: #d1e5f9;
}`,
};

/**
 * Comparison HTML template
 */
const comparisonTemplate: Template = {
  name: 'html-comparison',
  format: 'html',
  description: 'HTML template for benchmark comparisons',
  parent: 'html-base',
  blocks: {
    content: `<div class="toc">
  <h2>Table of Contents</h2>
  <ul>
    <li><a href="#summary">Summary</a></li>
    <li><a href="#results">Results</a></li>
    <li><a href="#charts">Charts</a></li>
    <li><a href="#metadata">Metadata</a></li>
  </ul>
</div>

<div id="summary" class="summary">
  <h2>Summary</h2>
  <p><strong>Operation:</strong> {{ data.operation }}</p>
  <p><strong>Input Size:</strong> {{ helpers.formatNumber(data.inputSize) }}</p>
  <p><strong>Implementations:</strong> {{ data.results.length }}</p>
  
  {{ if data.results && data.results.length > 0 }}
    {{ 
      // Find the fastest implementation
      let fastest = data.results[0];
      for (let i = 1; i < data.results.length; i++) {
        if (data.results[i].timeMs < fastest.timeMs) {
          fastest = data.results[i];
        }
      }
    }}
    <p><strong>Fastest Implementation:</strong> {{ fastest.implementation }} ({{ helpers.formatNumber(Math.floor(fastest.opsPerSecond)) }} ops/sec)</p>
  {{ endif }}
</div>

<div id="results">
  <h2>Results</h2>
  <table>
    <thead>
      <tr>
        <th>Implementation</th>
        <th>Time (ms)</th>
        <th>Ops/Sec</th>
        <th>vs. Fastest</th>
        {{ if data.results && data.results.some(r => r.memoryBytes !== undefined) }}
          <th>Memory (KB)</th>
        {{ endif }}
      </tr>
    </thead>
    <tbody>
      {{ 
        // Sort results by time
        let sortedResults = [...data.results].sort((a, b) => a.timeMs - b.timeMs);
        let fastestTime = sortedResults.length > 0 ? sortedResults[0].timeMs : 0;
      }}
      
      {{ for result in sortedResults }}
        <tr class="{{ result.timeMs === fastestTime ? 'fastest' : '' }}">
          <td>{{ result.implementation }}</td>
          <td>{{ helpers.formatNumber(result.timeMs) }}</td>
          <td>{{ helpers.formatNumber(Math.floor(result.opsPerSecond)) }}</td>
          <td>{{ result.timeMs === fastestTime ? 'fastest' : (result.relativeFactor.toFixed(2) + 'x slower') }}</td>
          {{ if data.results && data.results.some(r => r.memoryBytes !== undefined) }}
            <td>{{ result.memoryBytes ? (result.memoryBytes / 1024).toFixed(2) : 'N/A' }}</td>
          {{ endif }}
        </tr>
      {{ endfor }}
    </tbody>
  </table>
</div>

<div id="charts">
  <h2>Charts</h2>
  <div class="chart-container">
    <canvas id="comparison_chart"></canvas>
  </div>
</div>

<div id="metadata" class="metadata">
  <h2>Metadata</h2>
  <pre>{{ helpers.toJSON({
    name: data.name,
    description: data.description,
    operation: data.operation,
    inputSize: data.inputSize,
    timestamp: new Date().toISOString(),
    implementations: data.results.map(r => r.implementation)
  }) }}</pre>
</div>`,
    scripts: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  // Chart.js configuration
  Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  Chart.defaults.font.size = 14;
  Chart.defaults.color = '#333';
  
  // Create comparison chart
  const chartCtx = document.getElementById('comparison_chart').getContext('2d');
  
  {{ 
    // Sort results by name for consistent ordering
    let chartResults = [...data.results].sort((a, b) => a.implementation.localeCompare(b.implementation));
    let labels = chartResults.map(r => r.implementation);
    let timeData = chartResults.map(r => r.timeMs);
    let opsData = chartResults.map(r => Math.floor(r.opsPerSecond));
  }}
  
  new Chart(chartCtx, {
    type: '{{ options.chartType || "bar" }}',
    data: {
      labels: {{ JSON.stringify(labels) }},
      datasets: [
        {
          label: 'Time (ms)',
          data: {{ JSON.stringify(timeData) }},
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Operations/sec',
          data: {{ JSON.stringify(opsData) }},
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: '{{ data.operation }} Operation (Size: {{ data.inputSize }})',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toLocaleString();
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Implementation'
          }
        },
        y: {
          type: '{{ options.yAxisScale || "linear" }}',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Time (ms)'
          }
        },
        y1: {
          type: '{{ options.yAxisScale || "linear" }}',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Operations/sec'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
</script>`,
  },
};

/**
 * Scalability HTML template
 */
const scalabilityTemplate: Template = {
  name: 'html-scalability',
  format: 'html',
  description: 'HTML template for scalability results',
  parent: 'html-base',
  blocks: {
    content: `<div class="toc">
  <h2>Table of Contents</h2>
  <ul>
    <li><a href="#summary">Summary</a></li>
    <li><a href="#results">Results</a></li>
    <li><a href="#charts">Charts</a></li>
    <li><a href="#metadata">Metadata</a></li>
  </ul>
</div>

<div id="summary" class="summary">
  <h2>Summary</h2>
  <p><strong>Implementation:</strong> {{ data.implementation }}</p>
  <p><strong>Operation:</strong> {{ data.operation }}</p>
  <p><strong>Data Points:</strong> {{ data.results.length }}</p>
  {{ if data.results && data.results.length > 0 }}
    <p><strong>Input Size Range:</strong> {{ helpers.formatNumber(Math.min(...data.results.map(r => r.inputSize))) }} - {{ helpers.formatNumber(Math.max(...data.results.map(r => r.inputSize))) }}</p>
  {{ endif }}
</div>

<div id="results">
  <h2>Results</h2>
  <table>
    <thead>
      <tr>
        <th>Input Size</th>
        <th>Time (ms)</th>
        <th>Ops/Sec</th>
        {{ if data.results && data.results.some(r => r.memoryBytes !== undefined) }}
          <th>Memory (KB)</th>
        {{ endif }}
      </tr>
    </thead>
    <tbody>
      {{ 
        // Sort results by input size
        let sortedResults = [...data.results].sort((a, b) => a.inputSize - b.inputSize);
      }}
      
      {{ for result in sortedResults }}
        <tr>
          <td>{{ helpers.formatNumber(result.inputSize) }}</td>
          <td>{{ helpers.formatNumber(result.timeMs) }}</td>
          <td>{{ helpers.formatNumber(Math.floor(result.opsPerSecond)) }}</td>
          {{ if data.results && data.results.some(r => r.memoryBytes !== undefined) }}
            <td>{{ result.memoryBytes ? (result.memoryBytes / 1024).toFixed(2) : 'N/A' }}</td>
          {{ endif }}
        </tr>
      {{ endfor }}
    </tbody>
  </table>
</div>

<div id="charts">
  <h2>Charts</h2>
  <div class="chart-container">
    <canvas id="scalability_chart"></canvas>
  </div>
</div>

<div id="metadata" class="metadata">
  <h2>Metadata</h2>
  <pre>{{ helpers.toJSON({
    implementation: data.implementation,
    operation: data.operation,
    timestamp: new Date().toISOString(),
    dataPoints: data.results.length,
    inputSizeRange: {
      min: Math.min(...data.results.map(r => r.inputSize)),
      max: Math.max(...data.results.map(r => r.inputSize))
    }
  }) }}</pre>
</div>`,
    scripts: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  // Chart.js configuration
  Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  Chart.defaults.font.size = 14;
  Chart.defaults.color = '#333';
  
  // Create scalability chart
  const chartCtx = document.getElementById('scalability_chart').getContext('2d');
  
  {{ 
    // Sort results by input size
    let sortedResults = [...data.results].sort((a, b) => a.inputSize - b.inputSize);
    let labels = sortedResults.map(r => r.inputSize);
    let timeData = sortedResults.map(r => r.timeMs);
    let opsData = sortedResults.map(r => Math.floor(r.opsPerSecond));
  }}
  
  new Chart(chartCtx, {
    type: '{{ options.chartType || "line" }}',
    data: {
      labels: {{ JSON.stringify(labels) }},
      datasets: [
        {
          label: 'Time (ms)',
          data: {{ JSON.stringify(timeData) }},
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: 'Operations/sec',
          data: {{ JSON.stringify(opsData) }},
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: '{{ data.operation }} Scalability for {{ data.implementation }}',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toLocaleString();
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Input Size'
          }
        },
        y: {
          type: '{{ options.yAxisScale || "linear" }}',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Time (ms)'
          }
        },
        y1: {
          type: '{{ options.yAxisScale || "linear" }}',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Operations/sec'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
</script>`,
  },
};

// Register templates
registerTemplate(baseTemplate);
registerTemplate(baseStyles);
registerTemplate(comparisonTemplate);
registerTemplate(scalabilityTemplate);

export {
  baseTemplate,
  baseStyles,
  comparisonTemplate,
  scalabilityTemplate,
};
