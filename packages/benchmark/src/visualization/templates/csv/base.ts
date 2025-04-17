/**
 * Base CSV templates
 * 
 * @packageDocumentation
 */

import { Template, registerTemplate } from '../engine';

/**
 * Base CSV template
 */
const baseTemplate: Template = {
  name: 'csv-base',
  format: 'csv',
  description: 'Base CSV template with common structure',
  content: `{{ if options.includeHeader }}
# {{ data.title || 'Benchmark Results' }}
# Generated: {{ helpers.formatDate(new Date()) }}
{{ if options.header }}{{ options.header }}{{ endif }}
{{ endif }}

{{ block content }}
No content provided.
{{ endblock }}`,
};

/**
 * Comparison CSV template
 */
const comparisonTemplate: Template = {
  name: 'csv-comparison',
  format: 'csv',
  description: 'CSV template for benchmark comparisons',
  parent: 'csv-base',
  blocks: {
    content: `{{ if options.includeHeader }}
# Comparison: {{ data.name || data.operation + ' Operation Comparison' }}
# Description: {{ data.description || 'Comparing ' + data.operation + ' across different implementations' }}
# Operation: {{ data.operation }}
# Input Size: {{ data.inputSize }}
# Number of implementations: {{ data.results.length }}
# Implementations: {{ data.results.map(r => r.implementation).join(', ') }}
#
{{ endif }}

{{ if options.includeColumns }}
Implementation,Operation,InputSize,TimeMs,OpsPerSecond,RelativeFactor{{ if data.results && data.results.some(r => r.memoryBytes !== undefined) }},MemoryBytes{{ endif }}
{{ endif }}

{{ 
  // Generate CSV rows
  let rows = '';
  for (const result of data.results) {
    const implementation = result.implementation;
    const operation = data.operation;
    const inputSize = options.formatNumbers ? helpers.formatNumber(data.inputSize) : data.inputSize;
    const timeMs = options.formatNumbers ? helpers.formatNumber(result.timeMs) : result.timeMs;
    const opsPerSecond = options.formatNumbers ? helpers.formatNumber(Math.floor(result.opsPerSecond)) : Math.floor(result.opsPerSecond);
    const relativeFactor = result.relativeFactor;
    
    rows += \`\${implementation},\${operation},\${inputSize},\${timeMs},\${opsPerSecond},\${relativeFactor}\`;
    
    if (data.results && data.results.some(r => r.memoryBytes !== undefined)) {
      rows += \`,\${result.memoryBytes || ''}\`;
    }
    
    rows += \`\\n\`;
  }
  
  rows;
}}`,
  },
};

/**
 * Scalability CSV template
 */
const scalabilityTemplate: Template = {
  name: 'csv-scalability',
  format: 'csv',
  description: 'CSV template for scalability results',
  parent: 'csv-base',
  blocks: {
    content: `{{ if options.includeHeader }}
# Scalability: {{ data.implementation }} - {{ data.operation }}
# Implementation: {{ data.implementation }}
# Operation: {{ data.operation }}
# Data Points: {{ data.results.length }}
{{ if data.results && data.results.length > 0 }}
# Input Size Range: {{ Math.min(...data.results.map(r => r.inputSize)) }} - {{ Math.max(...data.results.map(r => r.inputSize)) }}
{{ endif }}
#
{{ endif }}

{{ if options.includeColumns }}
Implementation,Operation,InputSize,TimeMs,OpsPerSecond{{ if data.results && data.results.some(r => r.memoryBytes !== undefined) }},MemoryBytes{{ endif }}
{{ endif }}

{{ 
  // Sort results by input size
  let sortedResults = [...data.results].sort((a, b) => a.inputSize - b.inputSize);
  
  // Generate CSV rows
  let rows = '';
  for (const result of sortedResults) {
    const implementation = data.implementation;
    const operation = data.operation;
    const inputSize = options.formatNumbers ? helpers.formatNumber(result.inputSize) : result.inputSize;
    const timeMs = options.formatNumbers ? helpers.formatNumber(result.timeMs) : result.timeMs;
    const opsPerSecond = options.formatNumbers ? helpers.formatNumber(Math.floor(result.opsPerSecond)) : Math.floor(result.opsPerSecond);
    
    rows += \`\${implementation},\${operation},\${inputSize},\${timeMs},\${opsPerSecond}\`;
    
    if (data.results && data.results.some(r => r.memoryBytes !== undefined)) {
      rows += \`,\${result.memoryBytes || ''}\`;
    }
    
    rows += \`\\n\`;
  }
  
  rows;
}}`,
  },
};

/**
 * Multi-operation CSV template
 */
const multiOperationTemplate: Template = {
  name: 'csv-multi-operation',
  format: 'csv',
  description: 'CSV template for multiple operations',
  parent: 'csv-base',
  blocks: {
    content: `{{ if options.includeHeader }}
# Benchmark Results
# Generated: {{ helpers.formatDate(new Date()) }}
# Number of results: {{ data.length }}
# Operations: {{ [...new Set(data.map(r => r.operation))].join(', ') }}
# Implementations: {{ [...new Set(data.map(r => r.name || r.implementation))].join(', ') }}
#
{{ endif }}

{{ if options.includeColumns }}
Name,Operation,InputSize,TimeMs,OpsPerSecond{{ if data.some(r => r.memoryBytes !== undefined) }},MemoryBytes{{ endif }}
{{ endif }}

{{ 
  // Generate CSV rows
  let rows = '';
  for (const result of data) {
    const name = result.name || result.implementation;
    const operation = result.operation;
    const inputSize = options.formatNumbers ? helpers.formatNumber(result.inputSize) : result.inputSize;
    const timeMs = options.formatNumbers ? helpers.formatNumber(result.timeMs) : result.timeMs;
    const opsPerSecond = options.formatNumbers ? helpers.formatNumber(Math.floor(result.opsPerSecond)) : Math.floor(result.opsPerSecond);
    
    rows += \`\${name},\${operation},\${inputSize},\${timeMs},\${opsPerSecond}\`;
    
    if (data.some(r => r.memoryBytes !== undefined)) {
      rows += \`,\${result.memoryBytes || ''}\`;
    }
    
    rows += \`\\n\`;
  }
  
  rows;
}}`,
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
