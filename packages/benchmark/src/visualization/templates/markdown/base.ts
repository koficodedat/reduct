/**
 * Base Markdown templates
 * 
 * @packageDocumentation
 */

import { Template, registerTemplate } from '../engine';

/**
 * Base Markdown template
 */
const baseTemplate: Template = {
  name: 'markdown-base',
  format: 'markdown',
  description: 'Base Markdown template with common structure',
  content: `# {{ data.title || 'Benchmark Results' }}

{{ if options.header }}{{ options.header }}{{ endif }}

*Generated: {{ helpers.formatDate(new Date()) }}*

{{ block content }}
No content provided.
{{ endblock }}

{{ if options.footer }}{{ options.footer }}{{ endif }}`,
};

/**
 * Comparison Markdown template
 */
const comparisonTemplate: Template = {
  name: 'markdown-comparison',
  format: 'markdown',
  description: 'Markdown template for benchmark comparisons',
  parent: 'markdown-base',
  blocks: {
    content: `## Table of Contents

- [Summary](#summary)
- [Results](#results)
{{ if options.includeCharts }}
- [Charts](#charts)
{{ endif }}
- [Metadata](#metadata)

## Summary

- **Operation:** {{ data.operation }}
- **Input Size:** {{ helpers.formatNumber(data.inputSize) }}
- **Implementations:** {{ data.results.length }}

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
- **Fastest Implementation:** {{ fastest.implementation }} ({{ helpers.formatNumber(Math.floor(fastest.opsPerSecond)) }} ops/sec)
{{ endif }}

## Results

| Implementation | Time (ms) | Ops/Sec | vs. Fastest {{ if data.results && data.results.some(r => r.memoryBytes !== undefined) }}| Memory (KB) {{ endif }}|
| ------------- | -------- | ------- | ---------- {{ if data.results && data.results.some(r => r.memoryBytes !== undefined) }}| ----------- {{ endif }}|
{{ 
  // Sort results by time
  let sortedResults = [...data.results].sort((a, b) => a.timeMs - b.timeMs);
  let fastestTime = sortedResults.length > 0 ? sortedResults[0].timeMs : 0;
  
  // Generate table rows
  let rows = '';
  for (const result of sortedResults) {
    const relativeText = result.timeMs === fastestTime ? 'fastest' : \`\${result.relativeFactor.toFixed(2)}x slower\`;
    const memoryText = data.results.some(r => r.memoryBytes !== undefined) ? 
      \` | \${result.memoryBytes ? (result.memoryBytes / 1024).toFixed(2) : 'N/A'}\` : '';
    
    rows += \`| \${result.implementation} | \${helpers.formatNumber(result.timeMs)} | \${helpers.formatNumber(Math.floor(result.opsPerSecond))} | \${relativeText}\${memoryText} |\\n\`;
  }
  rows;
}}

{{ if options.includeCharts }}
## Charts

\`\`\`
Chart visualization would be here in HTML format
\`\`\`
{{ endif }}

## Metadata

\`\`\`json
{{ helpers.toJSON({
  name: data.name,
  description: data.description,
  operation: data.operation,
  inputSize: data.inputSize,
  timestamp: new Date().toISOString(),
  implementations: data.results.map(r => r.implementation)
}) }}
\`\`\``,
  },
};

/**
 * Scalability Markdown template
 */
const scalabilityTemplate: Template = {
  name: 'markdown-scalability',
  format: 'markdown',
  description: 'Markdown template for scalability results',
  parent: 'markdown-base',
  blocks: {
    content: `## Table of Contents

- [Summary](#summary)
- [Results](#results)
{{ if options.includeCharts }}
- [Charts](#charts)
{{ endif }}
- [Metadata](#metadata)

## Summary

- **Implementation:** {{ data.implementation }}
- **Operation:** {{ data.operation }}
- **Data Points:** {{ data.results.length }}
{{ if data.results && data.results.length > 0 }}
- **Input Size Range:** {{ helpers.formatNumber(Math.min(...data.results.map(r => r.inputSize))) }} - {{ helpers.formatNumber(Math.max(...data.results.map(r => r.inputSize))) }}
{{ endif }}

## Results

| Input Size | Time (ms) | Ops/Sec {{ if data.results && data.results.some(r => r.memoryBytes !== undefined) }}| Memory (KB) {{ endif }}|
| ---------- | -------- | ------- {{ if data.results && data.results.some(r => r.memoryBytes !== undefined) }}| ----------- {{ endif }}|
{{ 
  // Sort results by input size
  let sortedResults = [...data.results].sort((a, b) => a.inputSize - b.inputSize);
  
  // Generate table rows
  let rows = '';
  for (const result of sortedResults) {
    const memoryText = data.results.some(r => r.memoryBytes !== undefined) ? 
      \` | \${result.memoryBytes ? (result.memoryBytes / 1024).toFixed(2) : 'N/A'}\` : '';
    
    rows += \`| \${helpers.formatNumber(result.inputSize)} | \${helpers.formatNumber(result.timeMs)} | \${helpers.formatNumber(Math.floor(result.opsPerSecond))}\${memoryText} |\\n\`;
  }
  rows;
}}

{{ if options.includeCharts }}
## Charts

\`\`\`
Chart visualization would be here in HTML format
\`\`\`
{{ endif }}

## Metadata

\`\`\`json
{{ helpers.toJSON({
  implementation: data.implementation,
  operation: data.operation,
  timestamp: new Date().toISOString(),
  dataPoints: data.results.length,
  inputSizeRange: {
    min: Math.min(...data.results.map(r => r.inputSize)),
    max: Math.max(...data.results.map(r => r.inputSize))
  }
}) }}
\`\`\``,
  },
};

/**
 * Multi-operation Markdown template
 */
const multiOperationTemplate: Template = {
  name: 'markdown-multi-operation',
  format: 'markdown',
  description: 'Markdown template for multiple operations',
  parent: 'markdown-base',
  blocks: {
    content: `## Table of Contents

- [Summary](#summary)
- [Results](#results)
{{ if options.includeCharts }}
- [Charts](#charts)
{{ endif }}
- [Metadata](#metadata)

## Summary

{{ 
  // Get unique operations and implementations
  let operations = [...new Set(data.map(r => r.operation))];
  let implementations = [...new Set(data.map(r => r.name || r.implementation))];
}}

- **Total benchmarks:** {{ data.length }}
- **Operations:** {{ operations.join(', ') }}
- **Implementations:** {{ implementations.join(', ') }}

## Results

{{ 
  // Group results by operation
  let resultsByOperation = {};
  for (const result of data) {
    const operation = result.operation;
    if (!resultsByOperation[operation]) {
      resultsByOperation[operation] = [];
    }
    resultsByOperation[operation].push(result);
  }
  
  // Generate sections for each operation
  let sections = '';
  for (const [operation, results] of Object.entries(resultsByOperation)) {
    sections += \`### \${operation} Operation\\n\\n\`;
    
    // Check if we have memory data
    const hasMemory = results.some(r => r.memoryBytes !== undefined);
    
    // Table header
    sections += \`| Implementation | Input Size | Time (ms) | Ops/Sec\`;
    if (hasMemory) {
      sections += \` | Memory (KB)\`;
    }
    sections += \` |\\n| ------------- | ---------- | -------- | -------\`;
    if (hasMemory) {
      sections += \` | -----------\`;
    }
    sections += \` |\\n\`;
    
    // Sort results by implementation name
    const sortedResults = [...results].sort((a, b) => {
      const nameA = a.name || a.implementation;
      const nameB = b.name || b.implementation;
      return nameA.localeCompare(nameB);
    });
    
    // Table rows
    for (const result of sortedResults) {
      const name = result.name || result.implementation;
      const inputSize = result.inputSize;
      const timeMs = helpers.formatNumber(result.timeMs);
      const opsPerSec = helpers.formatNumber(Math.floor(result.opsPerSecond));
      
      sections += \`| \${name} | \${helpers.formatNumber(inputSize)} | \${timeMs} | \${opsPerSec}\`;
      
      if (hasMemory) {
        const memoryKB = result.memoryBytes ? 
          (result.memoryBytes / 1024).toFixed(2) : 'N/A';
        sections += \` | \${memoryKB}\`;
      }
      
      sections += \` |\\n\`;
    }
    
    sections += \`\\n\`;
  }
  
  sections;
}}

{{ if options.includeCharts }}
## Charts

\`\`\`
Chart visualization would be here in HTML format
\`\`\`
{{ endif }}

## Metadata

\`\`\`json
{{ helpers.toJSON({
  timestamp: new Date().toISOString(),
  benchmarks: data.length,
  operations: [...new Set(data.map(r => r.operation))],
  implementations: [...new Set(data.map(r => r.name || r.implementation))]
}) }}
\`\`\``,
  },
};

// Register templates
registerTemplate(baseTemplate);
registerTemplate(comparisonTemplate);
registerTemplate(scalabilityTemplate);
registerTemplate(multiOperationTemplate);

export {
  baseTemplate,
  comparisonTemplate,
  scalabilityTemplate,
  multiOperationTemplate,
};
