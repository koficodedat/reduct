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
    
    ${scripts}
  </script>
</body>
</html>`;
}

/**
 * Creates a bar chart script for benchmark comparison
 * 
 * @param chartId - Canvas element ID
 * @param title - Chart title
 * @param labels - Chart labels (implementations)
 * @param timeData - Time data in milliseconds
 * @param opsData - Operations per second data
 * @returns JavaScript code to create the chart
 */
export function createBarChartScript(
  chartId: string,
  title: string,
  labels: string[],
  timeData: number[],
  opsData: number[]
): string {
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
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Operations/sec',
          data: ${JSON.stringify(opsData)},
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
          text: '${title}',
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
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Time (ms)'
          }
        },
        y1: {
          type: 'linear',
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
 * @returns JavaScript code to create the chart
 */
export function createLineChartScript(
  chartId: string,
  title: string,
  labels: number[],
  timeData: number[],
  opsData: number[]
): string {
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
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: 'Operations/sec',
          data: ${JSON.stringify(opsData)},
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
          text: '${title}',
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
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Time (ms)'
          }
        },
        y1: {
          type: 'linear',
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
  });`;
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
