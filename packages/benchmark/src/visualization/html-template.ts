/**
 * HTML templates for benchmark visualization
 *
 * @packageDocumentation
 */

/**
 * Base HTML template with Chart.js
 *
 * @param title - Page title
 * @param content - HTML content
 * @param scripts - Additional scripts to include
 * @returns Complete HTML document
 */
export function baseTemplate(title: string, content: string, scripts: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .chart-container {
      position: relative;
      height: 400px;
      width: 100%;
      margin-bottom: 30px;
    }
    .metadata {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .fastest {
      font-weight: bold;
      color: #009900;
    }
    .summary {
      background-color: #f0f7ff;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .toc {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .toc ul {
      margin: 0;
      padding-left: 20px;
    }
    /* View toggle styles */
    .view-toggles {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .view-toggle-btn {
      padding: 8px 16px;
      background-color: #f2f2f2;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .view-toggle-btn:hover {
      background-color: #e6e6e6;
    }
    .view-toggle-btn.active {
      background-color: #0066cc;
      color: white;
      border-color: #0066cc;
    }
    .view-container {
      display: none;
      margin-bottom: 30px;
    }
    .view-container.active {
      display: block;
    }
    /* Responsive styles */
    @media (max-width: 768px) {
      .view-toggles {
        flex-direction: column;
        gap: 5px;
      }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p><em>Generated: ${new Date().toISOString()}</em></p>

  ${content}

  <script>
    // Chart.js configuration
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    Chart.defaults.font.size = 14;
    Chart.defaults.color = '#333';

    // View toggle functionality
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize view toggles
      const viewToggles = document.querySelectorAll('.view-toggle-btn');
      if (viewToggles.length > 0) {
        viewToggles.forEach(toggle => {
          toggle.addEventListener('click', function() {
            const viewType = this.getAttribute('data-view');
            const section = this.closest('.benchmark-section');

            // Update active toggle button
            section.querySelectorAll('.view-toggle-btn').forEach(btn => {
              btn.classList.remove('active');
            });
            this.classList.add('active');

            // Show selected view, hide others
            section.querySelectorAll('.view-container').forEach(container => {
              container.classList.remove('active');
            });
            section.querySelector('.view-container[data-view="' + viewType + '"]').classList.add('active');
          });
        });
      }
    });

    ${scripts}
  </script>
</body>
</html>`;
}

/**
 * Chart configuration options
 */
export interface ChartOptions {
  /** Chart title */
  title?: string;
  /** Color scheme for the chart */
  colorScheme?: string[];
  /** Type of y-axis scale (linear, logarithmic) */
  yAxisScale?: 'linear' | 'logarithmic';
  /** Custom labels for the axes */
  axisLabels?: {
    x?: string;
    y?: string;
    y2?: string;
  };
  /** Whether to show the legend */
  showLegend?: boolean;
  /** Legend position */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Whether to show tooltips */
  showTooltips?: boolean;
  /** Whether to animate the chart */
  animate?: boolean;
}

/**
 * Default chart options
 */
const defaultChartOptions: ChartOptions = {
  colorScheme: [
    'rgba(54, 162, 235, 0.5)',   // Blue
    'rgba(75, 192, 192, 0.5)',    // Teal
    'rgba(255, 99, 132, 0.5)',    // Red
    'rgba(255, 159, 64, 0.5)',    // Orange
    'rgba(153, 102, 255, 0.5)',   // Purple
    'rgba(255, 205, 86, 0.5)',    // Yellow
    'rgba(201, 203, 207, 0.5)',   // Grey
    'rgba(0, 204, 150, 0.5)',     // Green
  ],
  yAxisScale: 'linear',
  axisLabels: {
    x: 'Implementation',
    y: 'Time (ms)',
    y2: 'Operations/sec'
  },
  showLegend: true,
  legendPosition: 'top',
  showTooltips: true,
  animate: true
};

/**
 * Creates a bar chart script for benchmark comparison
 *
 * @param chartId - Canvas element ID
 * @param title - Chart title
 * @param labels - Chart labels (implementations)
 * @param timeData - Time data in milliseconds
 * @param opsData - Operations per second data
 * @param options - Chart configuration options
 * @returns JavaScript code to create the chart
 */
export function createBarChartScript(
  chartId: string,
  title: string,
  labels: string[],
  timeData: number[],
  opsData: number[],
  options?: ChartOptions
): string {
  const opts = { ...defaultChartOptions, ...options };
  const colors = opts.colorScheme || defaultChartOptions.colorScheme;

  return `
  // Create ${title} chart
  const ${chartId}Ctx = document.getElementById('${chartId}').getContext('2d');
  new Chart(${chartId}Ctx, {
    type: 'bar',
    data: {
      labels: ${JSON.stringify(labels)},
      datasets: [
        {
          label: 'Time (ms)',
          data: ${JSON.stringify(timeData)},
          backgroundColor: '${colors[0]}',
          borderColor: '${colors[0].replace('0.5', '1')}',
          borderWidth: 1
        },
        {
          label: 'Operations/sec',
          data: ${JSON.stringify(opsData)},
          backgroundColor: '${colors[1]}',
          borderColor: '${colors[1].replace('0.5', '1')}',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: ${opts.animate !== false},
      plugins: {
        title: {
          display: true,
          text: '${title}',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          enabled: ${opts.showTooltips !== false},
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
        },
        legend: {
          display: ${opts.showLegend !== false},
          position: '${opts.legendPosition || 'top'}'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: '${opts.axisLabels?.x || 'Implementation'}'
          }
        },
        y: {
          type: '${opts.yAxisScale || 'linear'}',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '${opts.axisLabels?.y || 'Time (ms)'}'
          }
        },
        y1: {
          type: '${opts.yAxisScale || 'linear'}',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: '${opts.axisLabels?.y2 || 'Operations/sec'}'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });`;
}

/**
 * Creates a line chart script for scalability results
 *
 * @param chartId - Canvas element ID
 * @param title - Chart title
 * @param labels - Chart labels (input sizes)
 * @param timeData - Time data in milliseconds
 * @param opsData - Operations per second data
 * @param options - Chart configuration options
 * @returns JavaScript code to create the chart
 */
export function createLineChartScript(
  chartId: string,
  title: string,
  labels: number[],
  timeData: number[],
  opsData: number[],
  options?: ChartOptions
): string {
  const opts = { ...defaultChartOptions, ...options };
  const colors = opts.colorScheme || defaultChartOptions.colorScheme;

  return `
  // Create ${title} chart
  const ${chartId}Ctx = document.getElementById('${chartId}').getContext('2d');
  new Chart(${chartId}Ctx, {
    type: 'line',
    data: {
      labels: ${JSON.stringify(labels)},
      datasets: [
        {
          label: 'Time (ms)',
          data: ${JSON.stringify(timeData)},
          backgroundColor: '${colors[0]}',
          borderColor: '${colors[0].replace('0.5', '1')}',
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: 'Operations/sec',
          data: ${JSON.stringify(opsData)},
          backgroundColor: '${colors[1]}',
          borderColor: '${colors[1].replace('0.5', '1')}',
          borderWidth: 2,
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: ${opts.animate !== false},
      plugins: {
        title: {
          display: true,
          text: '${title}',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          enabled: ${opts.showTooltips !== false},
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
        },
        legend: {
          display: ${opts.showLegend !== false},
          position: '${opts.legendPosition || 'top'}'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: '${opts.axisLabels?.x || 'Input Size'}'
          }
        },
        y: {
          type: '${opts.yAxisScale || 'linear'}',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '${opts.axisLabels?.y || 'Time (ms)'}'
          }
        },
        y1: {
          type: '${opts.yAxisScale || 'linear'}',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: '${opts.axisLabels?.y2 || 'Operations/sec'}'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });`;
}

/**
 * Creates a pie chart script for operation distribution
 *
 * @param chartId - Canvas element ID
 * @param title - Chart title
 * @param labels - Chart labels (operation names)
 * @param data - Data values (percentages or counts)
 * @param options - Chart configuration options
 * @returns JavaScript code to create the chart
 */
export function createPieChartScript(
  chartId: string,
  title: string,
  labels: string[],
  data: number[],
  options?: ChartOptions
): string {
  const opts = { ...defaultChartOptions, ...options };
  const colors = opts.colorScheme || defaultChartOptions.colorScheme;

  // Generate background colors for each slice
  const backgroundColors = labels.map((_, i) => colors[i % colors.length]);
  const borderColors = backgroundColors.map(color => color.replace('0.5', '1'));

  return `
  // Create ${title} chart
  const ${chartId}Ctx = document.getElementById('${chartId}').getContext('2d');
  new Chart(${chartId}Ctx, {
    type: 'pie',
    data: {
      labels: ${JSON.stringify(labels)},
      datasets: [{
        data: ${JSON.stringify(data)},
        backgroundColor: ${JSON.stringify(backgroundColors)},
        borderColor: ${JSON.stringify(borderColors)},
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: ${opts.animate !== false},
      plugins: {
        title: {
          display: true,
          text: '${title}',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          enabled: ${opts.showTooltips !== false},
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.formattedValue;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((context.raw / total) * 100);
              return label + ': ' + value + ' (' + percentage + '%)';
            }
          }
        },
        legend: {
          display: ${opts.showLegend !== false},
          position: '${opts.legendPosition || 'right'}'
        }
      }
    }
  });
  `;
}

/**
 * Creates a radar chart script for multi-dimensional comparison
 *
 * @param chartId - Canvas element ID
 * @param title - Chart title
 * @param labels - Chart labels (metrics)
 * @param datasets - Array of datasets (implementations and their values)
 * @param options - Chart configuration options
 * @returns JavaScript code to create the chart
 */
export function createRadarChartScript(
  chartId: string,
  title: string,
  labels: string[],
  datasets: Array<{label: string, data: number[]}>,
  options?: ChartOptions
): string {
  const opts = { ...defaultChartOptions, ...options };
  const colors = opts.colorScheme || defaultChartOptions.colorScheme;

  // Generate dataset configuration with colors
  const datasetConfigs = datasets.map((dataset, i) => {
    const color = colors[i % colors.length];
    const borderColor = color.replace('0.5', '1');

    return {
      ...dataset,
      backgroundColor: color,
      borderColor: borderColor,
      borderWidth: 2,
      pointBackgroundColor: borderColor,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: borderColor,
      pointRadius: 4
    };
  });

  return `
  // Create ${title} chart
  const ${chartId}Ctx = document.getElementById('${chartId}').getContext('2d');
  new Chart(${chartId}Ctx, {
    type: 'radar',
    data: {
      labels: ${JSON.stringify(labels)},
      datasets: ${JSON.stringify(datasetConfigs)}
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: ${opts.animate !== false},
      plugins: {
        title: {
          display: true,
          text: '${title}',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          enabled: ${opts.showTooltips !== false}
        },
        legend: {
          display: ${opts.showLegend !== false},
          position: '${opts.legendPosition || 'top'}'
        }
      },
      scales: {
        r: {
          angleLines: {
            display: true
          },
          suggestedMin: 0
        }
      }
    }
  });
  `;
}

/**
 * Creates a toggleable view container for benchmark results
 *
 * @param sectionId - ID of the section
 * @param title - Section title
 * @param tableContent - HTML content for table view
 * @param chartContent - HTML content for chart view
 * @param rawContent - HTML content for raw data view
 * @returns HTML for the toggleable view container
 */
export function createToggleableViews(sectionId: string, title: string, tableContent: string, chartContent: string, rawContent: string): string {
  let html = `<div id="${sectionId}" class="benchmark-section">`;
  html += `\n  <h2>${title}</h2>\n`;

  // Add view toggle buttons
  html += '  <div class="view-toggles">\n';
  html += '    <button class="view-toggle-btn active" data-view="table">Table View</button>\n';
  html += '    <button class="view-toggle-btn" data-view="chart">Chart View</button>\n';
  html += '    <button class="view-toggle-btn" data-view="raw">Raw Data</button>\n';
  html += '  </div>\n';

  // Add view containers
  html += '  <div class="view-container active" data-view="table">\n';
  html += tableContent;
  html += '\n  </div>\n';

  html += '  <div class="view-container" data-view="chart">\n';
  html += chartContent;
  html += '\n  </div>\n';

  html += '  <div class="view-container" data-view="raw">\n';
  html += '    <pre>' + rawContent + '</pre>\n';
  html += '  </div>\n';

  html += '</div>\n';

  return html;
}

/**
 * Creates a table of contents HTML
 *
 * @param sections - Array of section names and their IDs
 * @returns HTML for the table of contents
 */
export function createTableOfContents(sections: Array<{name: string, id: string}>): string {
  let html = '<div class="toc">\n';
  html += '  <h2>Table of Contents</h2>\n';
  html += '  <ul>\n';

  for (const section of sections) {
    html += `    <li><a href="#${section.id}">${section.name}</a></li>\n`;
  }

  html += '  </ul>\n';
  html += '</div>\n';

  return html;
}
