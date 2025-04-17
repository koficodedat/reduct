/**
 * Progress indicator utilities for benchmark runs
 * 
 * @packageDocumentation
 */

import { colors, shouldUseColors } from './colors';

/**
 * Progress indicator types
 */
export enum ProgressIndicatorType {
  /** Spinner animation */
  SPINNER = 'spinner',
  /** Progress bar */
  BAR = 'bar',
  /** Percentage indicator */
  PERCENTAGE = 'percentage',
  /** No indicator */
  NONE = 'none'
}

/**
 * Progress indicator options
 */
export interface ProgressIndicatorOptions {
  /** Type of progress indicator */
  type?: ProgressIndicatorType;
  /** Width of the progress bar (for BAR type) */
  width?: number;
  /** Whether to use colors */
  useColors?: boolean;
  /** Whether to show percentage */
  showPercentage?: boolean;
  /** Whether to show elapsed time */
  showElapsedTime?: boolean;
  /** Whether to show estimated time remaining */
  showEta?: boolean;
  /** Custom spinner frames (for SPINNER type) */
  spinnerFrames?: string[];
  /** Frame rate for spinner animation (ms) */
  frameRate?: number;
}

/**
 * Default progress indicator options
 */
const defaultOptions: ProgressIndicatorOptions = {
  type: ProgressIndicatorType.BAR,
  width: 30,
  useColors: shouldUseColors(),
  showPercentage: true,
  showElapsedTime: true,
  showEta: true,
  spinnerFrames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  frameRate: 80
};

/**
 * Progress indicator class
 */
export class ProgressIndicator {
  private options: Required<ProgressIndicatorOptions>;
  private startTime: number;
  private frameIndex: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private lastRender: string = '';
  private progress: number = 0;
  private total: number;
  private message: string;
  private isComplete: boolean = false;

  /**
   * Create a new progress indicator
   * 
   * @param total - Total number of steps
   * @param message - Message to display
   * @param options - Progress indicator options
   */
  constructor(total: number, message: string = '', options: ProgressIndicatorOptions = {}) {
    this.options = { ...defaultOptions, ...options } as Required<ProgressIndicatorOptions>;
    this.total = total;
    this.message = message;
    this.startTime = Date.now();
  }

  /**
   * Start the progress indicator
   * 
   * @returns This progress indicator
   */
  start(): ProgressIndicator {
    if (this.options.type === ProgressIndicatorType.NONE) {
      return this;
    }

    this.startTime = Date.now();
    this.render();

    if (this.options.type === ProgressIndicatorType.SPINNER) {
      this.intervalId = setInterval(() => {
        this.frameIndex = (this.frameIndex + 1) % this.options.spinnerFrames.length;
        this.render();
      }, this.options.frameRate);
    }

    return this;
  }

  /**
   * Update the progress indicator
   * 
   * @param progress - Current progress (0-1 or step count)
   * @param message - Optional new message
   * @returns This progress indicator
   */
  update(progress: number, message?: string): ProgressIndicator {
    if (this.isComplete) {
      return this;
    }

    // If progress is > 1, assume it's a step count
    this.progress = progress > 1 ? progress / this.total : progress;
    
    if (message !== undefined) {
      this.message = message;
    }

    if (this.options.type !== ProgressIndicatorType.SPINNER) {
      this.render();
    }

    return this;
  }

  /**
   * Complete the progress indicator
   * 
   * @param message - Optional completion message
   */
  complete(message?: string): void {
    if (this.isComplete) {
      return;
    }

    this.isComplete = true;
    this.progress = 1;
    
    if (message !== undefined) {
      this.message = message;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.render();
    process.stdout.write('\n');
  }

  /**
   * Render the progress indicator
   */
  private render(): void {
    if (this.options.type === ProgressIndicatorType.NONE) {
      return;
    }

    // Clear the last render
    if (this.lastRender) {
      process.stdout.write('\r' + ' '.repeat(this.lastRender.length) + '\r');
    }

    let output = '';

    // Add the appropriate progress indicator
    switch (this.options.type) {
      case ProgressIndicatorType.SPINNER:
        output += this.renderSpinner();
        break;
      case ProgressIndicatorType.BAR:
        output += this.renderBar();
        break;
      case ProgressIndicatorType.PERCENTAGE:
        output += this.renderPercentage();
        break;
    }

    // Add the message
    if (this.message) {
      output += ' ' + this.message;
    }

    // Add timing information
    output += this.renderTiming();

    this.lastRender = output;
    process.stdout.write('\r' + output);
  }

  /**
   * Render a spinner
   * 
   * @returns Spinner string
   */
  private renderSpinner(): string {
    const frame = this.options.spinnerFrames[this.frameIndex];
    
    if (this.options.useColors) {
      return colors.cyan + frame + colors.reset;
    }
    
    return frame;
  }

  /**
   * Render a progress bar
   * 
   * @returns Progress bar string
   */
  private renderBar(): string {
    const width = this.options.width;
    const completeSize = Math.round(width * this.progress);
    const incompleteSize = width - completeSize;
    
    let bar = '[';
    
    if (this.options.useColors) {
      bar += colors.green + '='.repeat(completeSize) + colors.reset;
      bar += ' '.repeat(incompleteSize);
    } else {
      bar += '='.repeat(completeSize) + ' '.repeat(incompleteSize);
    }
    
    bar += ']';
    
    if (this.options.showPercentage) {
      const percent = Math.round(this.progress * 100);
      bar += ` ${percent}%`;
    }
    
    return bar;
  }

  /**
   * Render a percentage
   * 
   * @returns Percentage string
   */
  private renderPercentage(): string {
    const percent = Math.round(this.progress * 100);
    
    if (this.options.useColors) {
      return colors.green + `${percent}%` + colors.reset;
    }
    
    return `${percent}%`;
  }

  /**
   * Render timing information
   * 
   * @returns Timing string
   */
  private renderTiming(): string {
    let timing = '';
    const elapsed = (Date.now() - this.startTime) / 1000;
    
    if (this.options.showElapsedTime) {
      timing += ` [${this.formatTime(elapsed)}]`;
    }
    
    if (this.options.showEta && this.progress > 0 && this.progress < 1) {
      const eta = (elapsed / this.progress) * (1 - this.progress);
      timing += ` ETA: ${this.formatTime(eta)}`;
    }
    
    return timing;
  }

  /**
   * Format time in seconds
   * 
   * @param seconds - Time in seconds
   * @returns Formatted time string
   */
  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }
}
