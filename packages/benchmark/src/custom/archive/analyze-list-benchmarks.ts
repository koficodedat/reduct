/**
 * Analyze List Benchmarks
 *
 * Analyzes the benchmark results and recommends optimal thresholds for transitions
 * between different List implementations.
 */

// External libraries
import * as fs from 'fs';
import * as path from 'path';

import * as glob from 'glob';

/**
 * Parses a markdown table into an array of objects
 */
function parseMarkdownTable(markdown: string): any[] {
  const lines = markdown.split('\n');
  const headerLine = lines.find(line => line.startsWith('| Size |'));

  if (!headerLine) {
    return [];
  }

  const headers = headerLine
    .split('|')
    .map(h => h.trim())
    .filter(Boolean);

  const dataLines = lines.filter(line =>
    line.startsWith('|') &&
    line !== headerLine &&
    !line.includes('---')
  );

  return dataLines.map(line => {
    const values = line
      .split('|')
      .map(v => v.trim())
      .filter(Boolean);

    const result: Record<string, any> = {};

    headers.forEach((header, index) => {
      const value = values[index];
      if (header === 'Size') {
        result[header.toLowerCase()] = parseInt(value, 10);
      } else {
        result[header.replace(/\s+/g, '')] = parseFloat(value);
      }
    });

    return result;
  });
}

/**
 * Finds the optimal threshold between two implementations
 */
function findOptimalThreshold(
  data: any[],
  impl1: string,
  impl2: string
): number {
  // Sort data by size
  const sortedData = [...data].sort((a, b) => a.size - b.size);

  // Find the crossover point where impl2 becomes faster than impl1
  for (let i = 0; i < sortedData.length - 1; i++) {
    const current = sortedData[i];
    const next = sortedData[i + 1];

    if (current[impl1] <= current[impl2] && next[impl1] > next[impl2]) {
      // Crossover detected between these two sizes
      // Use linear interpolation to estimate the exact threshold
      const x1 = current.size;
      const y1 = current[impl1] - current[impl2];
      const x2 = next.size;
      const y2 = next[impl1] - next[impl2];

      // Find where y = 0 (the exact crossover point)
      const threshold = x1 - y1 * (x2 - x1) / (y2 - y1);

      return Math.round(threshold);
    }
  }

  // If no crossover is found, return the maximum size
  return sortedData[sortedData.length - 1].size;
}

/**
 * Analyzes benchmark results and recommends thresholds
 */
function analyzeResults(reportPath: string): void {
  console.log(`Analyzing benchmark results from ${reportPath}...`);

  const markdown = fs.readFileSync(reportPath, 'utf-8');

  // Extract sections for each operation
  const operationSections: Record<string, string> = {};
  const operations = [
    'get', 'append', 'prepend', 'set', 'map', 'filter', 'reduce', 'slice', 'concat'
  ];

  for (const operation of operations) {
    const regex = new RegExp(`### ${operation}\\s*\\n\\n([\\s\\S]*?)(?=###|$)`, 'i');
    const match = markdown.match(regex);

    if (match && match[1]) {
      operationSections[operation] = match[1].trim();
    }
  }

  // Parse data for each operation
  const parsedData: Record<string, any[]> = {};

  for (const [operation, section] of Object.entries(operationSections)) {
    parsedData[operation] = parseMarkdownTable(section);
  }

  // Find optimal thresholds for each operation
  const thresholds: Record<string, { smallToChunked: number; chunkedToVector: number }> = {};

  for (const [operation, data] of Object.entries(parsedData)) {
    if (data.length === 0) continue;

    const smallToChunked = findOptimalThreshold(data, 'SmallList', 'ChunkedList');
    const chunkedToVector = findOptimalThreshold(data, 'ChunkedList', 'PersistentVector');

    thresholds[operation] = { smallToChunked, chunkedToVector };
  }

  // Calculate average thresholds across all operations
  let totalSmallToChunked = 0;
  let totalChunkedToVector = 0;
  let count = 0;

  for (const { smallToChunked, chunkedToVector } of Object.values(thresholds)) {
    totalSmallToChunked += smallToChunked;
    totalChunkedToVector += chunkedToVector;
    count++;
  }

  const avgSmallToChunked = Math.round(totalSmallToChunked / count);
  const avgChunkedToVector = Math.round(totalChunkedToVector / count);

  // Generate recommendations
  let recommendations = '# List Implementation Threshold Recommendations\n\n';
  recommendations += `Based on benchmark results from ${path.basename(reportPath)}\n\n`;

  recommendations += '## Recommended Thresholds\n\n';
  recommendations += `- Small to Chunked: **${avgSmallToChunked}**\n`;
  recommendations += `- Chunked to Vector: **${avgChunkedToVector}**\n\n`;

  recommendations += '## Thresholds by Operation\n\n';
  recommendations += '| Operation | Small to Chunked | Chunked to Vector |\n';
  recommendations += '|-----------|-----------------|-------------------|\n';

  for (const [operation, { smallToChunked, chunkedToVector }] of Object.entries(thresholds)) {
    recommendations += `| ${operation} | ${smallToChunked} | ${chunkedToVector} |\n`;
  }

  // Save recommendations
  const recommendationsPath = path.join(
    path.dirname(reportPath),
    `list-threshold-recommendations-${Date.now()}.md`
  );

  fs.writeFileSync(recommendationsPath, recommendations);

  console.log(`Analysis complete. Recommendations saved to ${recommendationsPath}`);
}

/**
 * Main function
 */
function main() {
  // Find the most recent benchmark report
  const reportDir = path.resolve(__dirname, '../../reports');
  const reportFiles = glob.sync(path.join(reportDir, 'list-implementation-benchmark-*.md'));

  if (reportFiles.length === 0) {
    console.error('No benchmark reports found. Run the list implementation benchmark first.');
    process.exit(1);
  }

  // Sort by file creation time (most recent first)
  reportFiles.sort((a, b) => {
    const statA = fs.statSync(a);
    const statB = fs.statSync(b);
    return statB.mtime.getTime() - statA.mtime.getTime();
  });

  const mostRecentReport = reportFiles[0];
  analyzeResults(mostRecentReport);
}

// Run the analysis
main();
