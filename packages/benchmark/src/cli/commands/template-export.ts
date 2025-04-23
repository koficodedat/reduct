/**
 * Template-based export command
 *
 * @packageDocumentation
 */

import fs from 'fs';
// path is used indirectly via resolveReportPath
import _path from 'path';

import { Command } from 'commander';

import { resolveReportPath } from '../../utils/paths';
import { exportToHTMLTemplate, exportToMarkdownTemplate, exportToCSVTemplate } from '../../visualization/template-exporters';
import { getTemplate, getAllTemplates } from '../../visualization/templates';

/**
 * Template export command options
 */
interface TemplateExportOptions {
  /** Input file */
  input: string;
  /** Output file */
  output?: string;
  /** Template name */
  template: string;
  /** Chart type */
  chartType?: 'bar' | 'line' | 'pie' | 'radar';
  /** Title */
  title?: string;
  /** Include charts */
  charts?: boolean;
  /** Headers */
  headers?: boolean;
  /** Delimiter */
  delimiter?: string;
  /** Format numbers */
  formatNumbers?: boolean;
  /** Log scale */
  logScale?: boolean;
  /** Show legend */
  legend?: boolean;
  /** Legend position */
  legendPosition?: string;
  /** Animation */
  animation?: boolean;
  /** Theme */
  theme?: string;
  /** Custom CSS file */
  css?: string;
  /** Custom header file */
  headerFile?: string;
  /** Custom footer file */
  footerFile?: string;
  /** List available templates */
  list?: boolean;
}

/**
 * Template export command
 *
 * @param format - Output format
 * @param options - Command options
 */
export async function templateExportCommand(format: string, options: TemplateExportOptions): Promise<void> {
  // List available templates
  if (options.list) {
    console.log('Available templates:');
    const templates = getAllTemplates();
    const formatTemplates = templates.filter(t => t.format === format);

    if (formatTemplates.length === 0) {
      console.log(`No templates found for format: ${format}`);
      return;
    }

    for (const template of formatTemplates) {
      console.log(`- ${template.name}: ${template.description || 'No description'}`);
    }
    return;
  }

  // Check if template exists
  if (options.template && !getTemplate(options.template)) {
    console.error(`Template not found: ${options.template}`);
    console.log('Available templates:');
    const templates = getAllTemplates();
    const formatTemplates = templates.filter(t => t.format === format);

    for (const template of formatTemplates) {
      console.log(`- ${template.name}: ${template.description || 'No description'}`);
    }
    return;
  }

  // Check if input file exists
  if (!options.input) {
    console.error('Input file is required');
    return;
  }

  if (!fs.existsSync(options.input)) {
    console.error(`Input file not found: ${options.input}`);
    return;
  }

  // Read input file
  let data;
  try {
    const fileContent = fs.readFileSync(options.input, 'utf-8');
    data = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error parsing input file: ${error}`);
    return;
  }

  // Read custom CSS file
  let customCSS = '';
  if (options.css && fs.existsSync(options.css)) {
    customCSS = fs.readFileSync(options.css, 'utf-8');
  }

  // Read custom header file
  let header = '';
  if (options.headerFile && fs.existsSync(options.headerFile)) {
    header = fs.readFileSync(options.headerFile, 'utf-8');
  }

  // Read custom footer file
  let footer = '';
  if (options.footerFile && fs.existsSync(options.footerFile)) {
    footer = fs.readFileSync(options.footerFile, 'utf-8');
  }

  // Export data
  let result = '';

  switch (format) {
    case 'html':
      result = exportToHTMLTemplate(data, {
        includeCharts: options.charts !== false,
        chartType: options.chartType || 'bar',
        formatNumbers: options.formatNumbers || true,
        title: options.title,
        theme: options.theme || 'default',
        customCSS,
        header,
        footer,
        chartOptions: {
          yAxisScale: options.logScale ? 'logarithmic' : 'linear',
          showLegend: options.legend !== false,
          legendPosition: options.legendPosition || 'top',
          animate: options.animation !== false,
        }
      });
      break;
    case 'md':
    case 'markdown':
      result = exportToMarkdownTemplate(data, {
        includeCharts: options.charts || false,
        formatNumbers: options.formatNumbers || true,
        title: options.title,
        header,
        footer,
      });
      break;
    case 'csv':
      result = exportToCSVTemplate(data, {
        includeHeader: options.headers !== false,
        includeColumns: options.headers !== false,
        formatNumbers: options.formatNumbers || false,
        delimiter: options.delimiter || ',',
        header,
      });
      break;
    default:
      console.error(`Unknown format: ${format}`);
      return;
  }

  // Write output
  if (options.output) {
    const outputPath = resolveReportPath(options.output);
    fs.writeFileSync(outputPath, result);
    console.log(`Results exported to ${outputPath}`);
  } else {
    console.log(result);
  }
}

/**
 * Registers the template export command
 *
 * @param program - Commander program
 */
export function registerTemplateExportCommand(program: Command): void {
  program
    .command('template-export')
    .description('Export benchmark results using templates')
    .argument('<format>', 'Output format (html, md, csv)')
    .option('-i, --input <file>', 'Input JSON file with benchmark results')
    .option('-o, --output <file>', 'Output file')
    .option('-t, --template <name>', 'Template name')
    .option('--list', 'List available templates')
    .option('--title <title>', 'Title for the output document')
    .option('-c, --chart-type <type>', 'Chart type for HTML output (bar, line, pie, radar)', 'bar')
    .option('--charts', 'Include charts in the output (for md and html formats)')
    .option('--no-headers', 'Exclude headers from CSV output')
    .option('--delimiter <char>', 'Delimiter for CSV output (default: comma)')
    .option('--format-numbers', 'Format numbers with thousands separator')
    .option('--log-scale', 'Use logarithmic scale for charts')
    .option('--no-legend', 'Hide chart legends')
    .option('--legend-position <position>', 'Legend position (top, bottom, left, right)', 'top')
    .option('--no-animation', 'Disable chart animations')
    .option('--theme <theme>', 'Theme name (default, dark, light-blue)')
    .option('--css <file>', 'Custom CSS file')
    .option('--header-file <file>', 'Custom header file')
    .option('--footer-file <file>', 'Custom footer file')
    .action(templateExportCommand);
}
