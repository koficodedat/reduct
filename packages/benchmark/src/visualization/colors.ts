/**
 * Console color utilities
 * 
 * @packageDocumentation
 */

/**
 * ANSI color codes for console output
 */
export const colors = {
  // Text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Bright text colors
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  
  // Styles
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',
  hidden: '\x1b[8m',
  strikethrough: '\x1b[9m'
};

/**
 * Colorize a string with ANSI color codes
 * 
 * @param text - Text to colorize
 * @param color - Color to apply
 * @returns Colorized string
 */
export function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Determine if colors should be used based on environment
 * 
 * @returns Whether to use colors
 */
export function shouldUseColors(): boolean {
  // Check if colors are explicitly disabled
  if (process.env.NO_COLOR !== undefined) {
    return false;
  }
  
  // Check if colors are explicitly enabled
  if (process.env.FORCE_COLOR !== undefined) {
    return true;
  }
  
  // Check if stdout is a TTY
  return process.stdout.isTTY;
}

/**
 * Format a benchmark result for console output with colors
 * 
 * @param text - Text to format
 * @param isFastest - Whether this is the fastest result
 * @param isHeader - Whether this is a header
 * @param useColors - Whether to use colors
 * @returns Formatted string
 */
export function formatBenchmarkResult(
  text: string,
  isFastest: boolean = false,
  isHeader: boolean = false,
  useColors: boolean = shouldUseColors()
): string {
  if (!useColors) {
    return text;
  }
  
  if (isHeader) {
    return colorize(text, 'brightBlue');
  }
  
  if (isFastest) {
    return colorize(text, 'brightGreen');
  }
  
  return text;
}

/**
 * Format a relative factor for console output with colors
 * 
 * @param factor - Relative factor
 * @param useColors - Whether to use colors
 * @returns Formatted string
 */
export function formatRelativeFactor(
  factor: number,
  useColors: boolean = shouldUseColors()
): string {
  if (factor === 1) {
    const text = 'fastest';
    return useColors ? colorize(text, 'brightGreen') : text;
  }
  
  const text = `${factor.toFixed(2)}x slower`;
  
  if (!useColors) {
    return text;
  }
  
  // Color based on how much slower
  if (factor < 1.5) {
    return colorize(text, 'brightYellow');
  } else if (factor < 3) {
    return colorize(text, 'yellow');
  } else {
    return colorize(text, 'red');
  }
}

/**
 * Format a section header for console output with colors
 * 
 * @param text - Header text
 * @param useColors - Whether to use colors
 * @returns Formatted string
 */
export function formatSectionHeader(
  text: string,
  useColors: boolean = shouldUseColors()
): string {
  if (!useColors) {
    return `## ${text}`;
  }
  
  return colorize(`## ${text}`, 'brightCyan');
}

/**
 * Format a subsection header for console output with colors
 * 
 * @param text - Header text
 * @param useColors - Whether to use colors
 * @returns Formatted string
 */
export function formatSubsectionHeader(
  text: string,
  useColors: boolean = shouldUseColors()
): string {
  if (!useColors) {
    return text;
  }
  
  return colorize(text, 'cyan');
}
