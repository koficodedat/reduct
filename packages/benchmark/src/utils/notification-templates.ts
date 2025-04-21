/**
 * Notification templates for different channels
 */
import { RegressionDetectionResult } from './regression-detection';

/**
 * Template context for notifications
 */
export interface TemplateContext {
  /**
   * Regression detection result
   */
  result: RegressionDetectionResult;

  /**
   * Whether to include improvements
   */
  includeImprovements: boolean;

  /**
   * Whether to include new benchmarks
   */
  includeNewBenchmarks: boolean;

  /**
   * Whether to include missing benchmarks
   */
  includeMissingBenchmarks: boolean;

  /**
   * Additional context data
   */
  [key: string]: any;
}

/**
 * Template renderer function
 */
export type TemplateRenderer<T> = (context: TemplateContext) => T;

/**
 * Console template renderer
 */
export const consoleTemplate: TemplateRenderer<string> = (context) => {
  const { result, includeImprovements, includeNewBenchmarks, includeMissingBenchmarks } = context;

  let output = 'Performance Regression Notification\n';
  output += '==================================\n';
  output += `Regressions: ${result.regressions.length}\n`;
  output += `Improvements: ${result.improvements.length}\n`;
  output += `No significant changes: ${result.noChanges.length}\n`;
  output += `New benchmarks: ${result.newBenchmarks.length}\n`;
  output += `Missing benchmarks: ${result.missingBenchmarks.length}\n\n`;

  // Add regressions
  if (result.regressions.length > 0) {
    output += 'Regressions:\n';
    output += '------------\n';

    for (const regression of result.regressions) {
      output += `${regression.name}:\n`;
      output += `  Current: ${regression.current.meanTime.toFixed(3)}ms\n`;
      output += `  Previous: ${regression.previous.meanTime.toFixed(3)}ms\n`;
      output += `  Change: ${regression.percentageChange.toFixed(2)}% (${regression.absoluteChange.toFixed(3)}ms)\n\n`;
    }
  }

  // Add improvements
  if (includeImprovements && result.improvements.length > 0) {
    output += 'Improvements:\n';
    output += '-------------\n';

    for (const improvement of result.improvements) {
      output += `${improvement.name}:\n`;
      output += `  Current: ${improvement.current.meanTime.toFixed(3)}ms\n`;
      output += `  Previous: ${improvement.previous.meanTime.toFixed(3)}ms\n`;
      output += `  Change: ${improvement.percentageChange.toFixed(2)}% (${improvement.absoluteChange.toFixed(3)}ms)\n\n`;
    }
  }

  // Add new benchmarks
  if (includeNewBenchmarks && result.newBenchmarks.length > 0) {
    output += 'New Benchmarks:\n';
    output += '--------------\n';

    for (const benchmark of result.newBenchmarks) {
      output += `${benchmark.name}:\n`;
      output += `  Mean: ${benchmark.meanTime.toFixed(3)}ms\n`;
      output += `  Std Dev: ${benchmark.stdDev.toFixed(3)}ms\n`;
      output += `  Min: ${benchmark.minTime.toFixed(3)}ms\n`;
      output += `  Max: ${benchmark.maxTime.toFixed(3)}ms\n\n`;
    }
  }

  // Add missing benchmarks
  if (includeMissingBenchmarks && result.missingBenchmarks.length > 0) {
    output += 'Missing Benchmarks:\n';
    output += '------------------\n';

    for (const benchmark of result.missingBenchmarks) {
      output += `${benchmark.name}:\n`;
      output += `  Mean: ${benchmark.meanTime.toFixed(3)}ms\n`;
      output += `  Std Dev: ${benchmark.stdDev.toFixed(3)}ms\n`;
      output += `  Min: ${benchmark.minTime.toFixed(3)}ms\n`;
      output += `  Max: ${benchmark.maxTime.toFixed(3)}ms\n\n`;
    }
  }

  return output;
};

/**
 * Slack template renderer
 */
export const slackTemplate: TemplateRenderer<any> = (context) => {
  const { result, includeImprovements } = context;

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Performance Regression Alert',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Regressions:* ${result.regressions.length}\n*Improvements:* ${result.improvements.length}\n*No significant changes:* ${result.noChanges.length}\n*New benchmarks:* ${result.newBenchmarks.length}\n*Missing benchmarks:* ${result.missingBenchmarks.length}`,
      },
    },
    {
      type: 'divider',
    },
  ];

  // Add regressions
  if (result.regressions.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Regressions:*',
      },
    });

    for (const regression of result.regressions) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${regression.name}*\nCurrent: ${regression.current.meanTime.toFixed(3)}ms\nPrevious: ${regression.previous.meanTime.toFixed(3)}ms\nChange: ${regression.percentageChange.toFixed(2)}% (${regression.absoluteChange.toFixed(3)}ms)`,
        },
      });
    }

    blocks.push({
      type: 'divider',
    });
  }

  // Add improvements
  if (includeImprovements && result.improvements.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Improvements:*',
      },
    });

    for (const improvement of result.improvements) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${improvement.name}*\nCurrent: ${improvement.current.meanTime.toFixed(3)}ms\nPrevious: ${improvement.previous.meanTime.toFixed(3)}ms\nChange: ${improvement.percentageChange.toFixed(2)}% (${improvement.absoluteChange.toFixed(3)}ms)`,
        },
      });
    }

    blocks.push({
      type: 'divider',
    });
  }

  return { blocks };
};

/**
 * GitHub issue template renderer
 */
export const githubIssueTemplate: TemplateRenderer<{ title: string; body: string; labels: string[] }> = (context) => {
  const { result, includeImprovements } = context;

  let body = '# Performance Regression Alert\n\n';
  body += `- Regressions: ${result.regressions.length}\n`;
  body += `- Improvements: ${result.improvements.length}\n`;
  body += `- No significant changes: ${result.noChanges.length}\n`;
  body += `- New benchmarks: ${result.newBenchmarks.length}\n`;
  body += `- Missing benchmarks: ${result.missingBenchmarks.length}\n\n`;

  // Add regressions
  if (result.regressions.length > 0) {
    body += '## Regressions\n\n';
    body += '| Benchmark | Current (ms) | Previous (ms) | Change (%) | Change (ms) |\n';
    body += '| --------- | ------------ | ------------- | ---------- | ----------- |\n';

    for (const regression of result.regressions) {
      body += `| ${regression.name} | ${regression.current.meanTime.toFixed(3)} | ${regression.previous.meanTime.toFixed(3)} | ${regression.percentageChange.toFixed(2)}% | ${regression.absoluteChange.toFixed(3)} |\n`;
    }

    body += '\n';
  }

  // Add improvements
  if (includeImprovements && result.improvements.length > 0) {
    body += '## Improvements\n\n';
    body += '| Benchmark | Current (ms) | Previous (ms) | Change (%) | Change (ms) |\n';
    body += '| --------- | ------------ | ------------- | ---------- | ----------- |\n';

    for (const improvement of result.improvements) {
      body += `| ${improvement.name} | ${improvement.current.meanTime.toFixed(3)} | ${improvement.previous.meanTime.toFixed(3)} | ${improvement.percentageChange.toFixed(2)}% | ${improvement.absoluteChange.toFixed(3)} |\n`;
    }

    body += '\n';
  }

  return {
    title: 'Performance Regression Alert',
    body,
    labels: ['performance', 'regression'],
  };
};

/**
 * Email template renderer
 */
export const emailTemplate: TemplateRenderer<{ subject: string; body: string }> = (context) => {
  const { result, includeImprovements } = context;

  let body = '<h1>Performance Regression Alert</h1>';
  body += '<ul>';
  body += `<li>Regressions: ${result.regressions.length}</li>`;
  body += `<li>Improvements: ${result.improvements.length}</li>`;
  body += `<li>No significant changes: ${result.noChanges.length}</li>`;
  body += `<li>New benchmarks: ${result.newBenchmarks.length}</li>`;
  body += `<li>Missing benchmarks: ${result.missingBenchmarks.length}</li>`;
  body += '</ul>';

  // Add regressions
  if (result.regressions.length > 0) {
    body += '<h2>Regressions</h2>';
    body += '<table border="1" cellpadding="5" cellspacing="0">';
    body += '<tr><th>Benchmark</th><th>Current (ms)</th><th>Previous (ms)</th><th>Change (%)</th><th>Change (ms)</th></tr>';

    for (const regression of result.regressions) {
      body += `<tr><td>${regression.name}</td><td>${regression.current.meanTime.toFixed(3)}</td><td>${regression.previous.meanTime.toFixed(3)}</td><td>${regression.percentageChange.toFixed(2)}%</td><td>${regression.absoluteChange.toFixed(3)}</td></tr>`;
    }

    body += '</table>';
  }

  // Add improvements
  if (includeImprovements && result.improvements.length > 0) {
    body += '<h2>Improvements</h2>';
    body += '<table border="1" cellpadding="5" cellspacing="0">';
    body += '<tr><th>Benchmark</th><th>Current (ms)</th><th>Previous (ms)</th><th>Change (%)</th><th>Change (ms)</th></tr>';

    for (const improvement of result.improvements) {
      body += `<tr><td>${improvement.name}</td><td>${improvement.current.meanTime.toFixed(3)}</td><td>${improvement.previous.meanTime.toFixed(3)}</td><td>${improvement.percentageChange.toFixed(2)}%</td><td>${improvement.absoluteChange.toFixed(3)}</td></tr>`;
    }

    body += '</table>';
  }

  return {
    subject: 'Performance Regression Alert',
    body,
  };
};

/**
 * Template registry
 */
export const templates = {
  console: consoleTemplate,
  slack: slackTemplate,
  githubIssue: githubIssueTemplate,
  email: emailTemplate,
};
