/**
 * Notification dashboard for visualizing notification history
 */
import * as fs from 'fs';
import * as path from 'path';

import { getHistory, NotificationHistoryEntry, NotificationHistoryOptions } from './notification-history';

/**
 * Dashboard options
 */
export interface NotificationDashboardOptions extends NotificationHistoryOptions {
  /**
   * Output file for dashboard
   */
  outputFile?: string;

  /**
   * Title of the dashboard
   */
  title?: string;

  /**
   * Description of the dashboard
   */
  description?: string;
}

/**
 * Default dashboard options
 */
const DEFAULT_OPTIONS: Required<NotificationDashboardOptions> = {
  historyDir: path.join(process.cwd(), 'packages/benchmark/notification-history'),
  outputFile: path.join(process.cwd(), 'packages/benchmark/notification-dashboard/index.html'),
  maxEntries: 100,
  title: 'Reduct Performance Notification Dashboard',
  description: 'Dashboard for performance regression notifications',
};

/**
 * Generate notification dashboard
 * @param options Dashboard options
 */
export function generateNotificationDashboard(options: NotificationDashboardOptions = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Get notification history
  const history = getHistory(opts);

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(opts.outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate dashboard HTML
  const html = generateDashboardHtml(history, opts);

  // Write dashboard to file
  fs.writeFileSync(opts.outputFile, html);

  console.log(`Notification dashboard generated at: ${opts.outputFile}`);
}

/**
 * Generate dashboard HTML
 * @param history Notification history
 * @param options Dashboard options
 * @returns Dashboard HTML
 */
function generateDashboardHtml(history: NotificationHistoryEntry[], options: Required<NotificationDashboardOptions>): string {
  // Calculate statistics
  const totalNotifications = history.length;
  const successfulNotifications = history.filter(entry => entry.success).length;
  const failedNotifications = history.filter(entry => !entry.success).length;
  const channelCounts: Record<string, number> = {};

  for (const entry of history) {
    for (const channel of entry.channels) {
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    }
  }

  // Group notifications by date
  const notificationsByDate: Record<string, NotificationHistoryEntry[]> = {};

  for (const entry of history) {
    const date = entry.timestamp.split('T')[0];

    if (!notificationsByDate[date]) {
      notificationsByDate[date] = [];
    }

    notificationsByDate[date].push(entry);
  }

  // Generate HTML
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3, h4 {
      color: #0066cc;
    }
    .dashboard-header {
      margin-bottom: 30px;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
    }
    .dashboard-timestamp {
      color: #666;
      font-size: 0.9em;
    }
    .stats-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background-color: #f5f5f5;
      border-radius: 5px;
      padding: 15px;
      flex: 1;
      min-width: 200px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .stat-card h3 {
      margin-top: 0;
      margin-bottom: 10px;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #0066cc;
    }
    .chart-container {
      width: 100%;
      height: 400px;
      margin-bottom: 30px;
    }
    .notification-list {
      margin-top: 30px;
    }
    .notification-item {
      background-color: #f9f9f9;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .notification-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .notification-timestamp {
      color: #666;
    }
    .notification-channels {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    .channel-badge {
      background-color: #0066cc;
      color: white;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.8em;
    }
    .notification-status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.8em;
      font-weight: bold;
    }
    .status-success {
      background-color: #34A853;
      color: white;
    }
    .status-failure {
      background-color: #EA4335;
      color: white;
    }
    .notification-details {
      margin-top: 10px;
    }
    .notification-details h4 {
      margin-top: 0;
      margin-bottom: 10px;
    }
    .notification-details ul {
      margin-top: 0;
    }
    .collapsible {
      cursor: pointer;
      padding: 10px;
      width: 100%;
      border: none;
      text-align: left;
      outline: none;
      font-size: 1em;
      background-color: #f1f1f1;
      border-radius: 3px;
    }
    .active, .collapsible:hover {
      background-color: #e1e1e1;
    }
    .content {
      padding: 0 18px;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.2s ease-out;
      background-color: white;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="dashboard-header">
    <h1>${options.title}</h1>
    <p>${options.description}</p>
    <p class="dashboard-timestamp">Generated: ${new Date().toISOString()}</p>
  </div>

  <div class="stats-container">
    <div class="stat-card">
      <h3>Total Notifications</h3>
      <div class="stat-value">${totalNotifications}</div>
    </div>
    <div class="stat-card">
      <h3>Successful</h3>
      <div class="stat-value">${successfulNotifications}</div>
    </div>
    <div class="stat-card">
      <h3>Failed</h3>
      <div class="stat-value">${failedNotifications}</div>
    </div>
  </div>

  <h2>Notification Channels</h2>
  <div class="chart-container">
    <canvas id="channelsChart"></canvas>
  </div>

  <h2>Notifications Over Time</h2>
  <div class="chart-container">
    <canvas id="timelineChart"></canvas>
  </div>

  <h2>Recent Notifications</h2>
  <div class="notification-list">`;

  // Add notification items
  for (const entry of history.slice(0, 10)) {
    const timestamp = new Date(entry.timestamp).toLocaleString();
    // const status = entry.success ? 'success' : 'failure'; // Not used
    const statusClass = entry.success ? 'status-success' : 'status-failure';
    const statusText = entry.success ? 'Success' : 'Failure';
    const errorText = entry.error ? `<p>Error: ${entry.error}</p>` : '';

    html += `
    <div class="notification-item">
      <div class="notification-header">
        <div class="notification-timestamp">${timestamp}</div>
        <div class="notification-status ${statusClass}">${statusText}</div>
      </div>
      <div class="notification-channels">`;

    for (const channel of entry.channels) {
      html += `<div class="channel-badge">${channel}</div>`;
    }

    html += `
      </div>
      ${errorText}
      <button class="collapsible">Show Details</button>
      <div class="content">
        <div class="notification-details">
          <h4>Regression Summary</h4>
          <ul>
            <li>Regressions: ${entry.result.regressions.length}</li>
            <li>Improvements: ${entry.result.improvements.length}</li>
            <li>No significant changes: ${entry.result.noChanges.length}</li>
            <li>New benchmarks: ${entry.result.newBenchmarks.length}</li>
            <li>Missing benchmarks: ${entry.result.missingBenchmarks.length}</li>
          </ul>`;

    if (entry.result.regressions.length > 0) {
      html += `
          <h4>Regressions</h4>
          <ul>`;

      for (const regression of entry.result.regressions.slice(0, 5)) {
        html += `<li>${regression.name}: ${regression.percentageChange.toFixed(2)}% (${regression.absoluteChange.toFixed(3)}ms)</li>`;
      }

      if (entry.result.regressions.length > 5) {
        html += `<li>... and ${entry.result.regressions.length - 5} more</li>`;
      }

      html += `</ul>`;
    }

    html += `
        </div>
      </div>
    </div>`;
  }

  html += `
  </div>

  <script>
    // Initialize charts
    document.addEventListener('DOMContentLoaded', function() {
      // Channels chart
      const channelsCtx = document.getElementById('channelsChart').getContext('2d');
      new Chart(channelsCtx, {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(Object.keys(channelCounts))},
          datasets: [{
            label: 'Notifications by Channel',
            data: ${JSON.stringify(Object.values(channelCounts))},
            backgroundColor: [
              '#4285F4',
              '#EA4335',
              '#FBBC05',
              '#34A853'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Notifications'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Channel'
              }
            }
          }
        }
      });

      // Timeline chart
      const timelineCtx = document.getElementById('timelineChart').getContext('2d');
      new Chart(timelineCtx, {
        type: 'line',
        data: {
          labels: ${JSON.stringify(Object.keys(notificationsByDate))},
          datasets: [{
            label: 'Notifications',
            data: ${JSON.stringify(Object.values(notificationsByDate).map(entries => entries.length))},
            borderColor: '#4285F4',
            backgroundColor: 'rgba(66, 133, 244, 0.2)',
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Notifications'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          }
        }
      });

      // Collapsible sections
      const coll = document.getElementsByClassName('collapsible');
      for (let i = 0; i < coll.length; i++) {
        coll[i].addEventListener('click', function() {
          this.classList.toggle('active');
          const content = this.nextElementSibling;
          if (content.style.maxHeight) {
            content.style.maxHeight = null;
          } else {
            content.style.maxHeight = content.scrollHeight + 'px';
          }
        });
      }
    });
  </script>
</body>
</html>`;

  return html;
}
