import { WasmAccelerator } from '../wasm-accelerator';
import { PerformanceProfile, AcceleratorOptions } from '../accelerator';
import { WebAssemblyFeature } from '../../core/feature-detection';

/**
 * Regular expression match result interface
 */
export interface RegexMatch {
  /** The index of the match in the string */
  index: number;
  /** The length of the match */
  length: number;
  /** The matched text */
  text: string;
}

/**
 * Regular expression capture groups result interface
 */
export interface RegexCaptureGroups {
  /** The full match */
  match: RegexMatch;
  /** The named capture groups */
  groups: Record<string, RegexMatch>;
}

/**
 * Regular expression pattern information interface
 */
export interface RegexInfo {
  /** The capture names */
  captureNames: Array<{ index: number; name: string }>;
  /** The number of capture groups */
  captureCount: number;
}

/**
 * Regular expression operations accelerator
 *
 * Provides optimized implementations of regular expression operations
 * using WebAssembly.
 */
export class RegexOperationsAccelerator extends WasmAccelerator {
  /**
   * Create a new regular expression operations accelerator
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    super('data-structures', 'regex-ops', 'operations', {
      ...options,
      requiredFeatures: [WebAssemblyFeature.BASIC],
    });
  }

  /**
   * Test if a string matches a regular expression
   *
   * @param text The text to test
   * @param pattern The regular expression pattern
   * @returns True if the string matches the pattern
   */
  public test(text: string, pattern: string): boolean {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.testJs(text, pattern);
    }

    try {
      // Validate the pattern
      if (!this.isValidPattern(pattern)) {
        throw new Error('Invalid regular expression pattern');
      }

      // Call the WebAssembly implementation
      return module.regex_test(text, pattern) as boolean;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.testJs(text, pattern);
    }
  }

  /**
   * Find the first match of a regular expression in a string
   *
   * @param text The text to search in
   * @param pattern The regular expression pattern
   * @returns The first match, or null if no match is found
   */
  public findFirst(text: string, pattern: string): RegexMatch | null {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.findFirstJs(text, pattern);
    }

    try {
      // Validate the pattern
      if (!this.isValidPattern(pattern)) {
        throw new Error('Invalid regular expression pattern');
      }

      // Call the WebAssembly implementation
      const result = module.regex_find_first(text, pattern);

      // Convert the result
      if (result === null) {
        return null;
      }

      return {
        index: result.index as number,
        length: result.length as number,
        text: result.text as string,
      };
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.findFirstJs(text, pattern);
    }
  }

  /**
   * Find all matches of a regular expression in a string
   *
   * @param text The text to search in
   * @param pattern The regular expression pattern
   * @returns An array of matches
   */
  public findAll(text: string, pattern: string): RegexMatch[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.findAllJs(text, pattern);
    }

    try {
      // Validate the pattern
      if (!this.isValidPattern(pattern)) {
        throw new Error('Invalid regular expression pattern');
      }

      // Call the WebAssembly implementation
      const result = module.regex_find_all(text, pattern);

      // Convert the result
      return Array.from(result as any[]).map(match => ({
        index: match.index as number,
        length: match.length as number,
        text: match.text as string,
      }));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.findAllJs(text, pattern);
    }
  }

  /**
   * Replace all matches of a regular expression in a string
   *
   * @param text The text to search in
   * @param pattern The regular expression pattern
   * @param replacement The replacement string
   * @returns The result of replacing all matches
   */
  public replaceAll(text: string, pattern: string, replacement: string): string {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.replaceAllJs(text, pattern, replacement);
    }

    try {
      // Validate the pattern
      if (!this.isValidPattern(pattern)) {
        throw new Error('Invalid regular expression pattern');
      }

      // Call the WebAssembly implementation
      return module.regex_replace_all(text, pattern, replacement) as string;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.replaceAllJs(text, pattern, replacement);
    }
  }

  /**
   * Split a string by a regular expression
   *
   * @param text The text to split
   * @param pattern The regular expression pattern
   * @returns An array of substrings
   */
  public split(text: string, pattern: string): string[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.splitJs(text, pattern);
    }

    try {
      // Validate the pattern
      if (!this.isValidPattern(pattern)) {
        throw new Error('Invalid regular expression pattern');
      }

      // Call the WebAssembly implementation
      const result = module.regex_split(text, pattern);

      // Convert the result
      return Array.from(result as any[]) as string[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.splitJs(text, pattern);
    }
  }

  /**
   * Extract capture groups from a regular expression match
   *
   * @param text The text to search in
   * @param pattern The regular expression pattern with capture groups
   * @returns An array of capture groups, or null if no match is found
   */
  public captureGroups(text: string, pattern: string): RegexMatch[] | null {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.captureGroupsJs(text, pattern);
    }

    try {
      // Validate the pattern
      if (!this.isValidPattern(pattern)) {
        throw new Error('Invalid regular expression pattern');
      }

      // Call the WebAssembly implementation
      const result = module.regex_capture_groups(text, pattern);

      // Convert the result
      if (result === null) {
        return null;
      }

      return Array.from(result as any[]).map(capture => {
        if (capture === null) {
          return null;
        }

        return {
          index: capture.index as number,
          length: capture.length as number,
          text: capture.text as string,
        };
      }).filter(Boolean) as RegexMatch[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.captureGroupsJs(text, pattern);
    }
  }

  /**
   * Extract named capture groups from a regular expression match
   *
   * @param text The text to search in
   * @param pattern The regular expression pattern with named capture groups
   * @returns An object with named capture groups, or null if no match is found
   */
  public namedCaptureGroups(text: string, pattern: string): RegexCaptureGroups | null {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.namedCaptureGroupsJs(text, pattern);
    }

    try {
      // Validate the pattern
      if (!this.isValidPattern(pattern)) {
        throw new Error('Invalid regular expression pattern');
      }

      // Call the WebAssembly implementation
      const result = module.regex_named_capture_groups(text, pattern);

      // Convert the result
      if (result === null) {
        return null;
      }

      const match = result.match as any;
      const groups = result.groups as Record<string, any>;

      const convertedMatch: RegexMatch = {
        index: match.index as number,
        length: match.length as number,
        text: match.text as string,
      };

      const convertedGroups: Record<string, RegexMatch> = {};

      for (const name in groups) {
        const group = groups[name];
        convertedGroups[name] = {
          index: group.index as number,
          length: group.length as number,
          text: group.text as string,
        };
      }

      return {
        match: convertedMatch,
        groups: convertedGroups,
      };
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.namedCaptureGroupsJs(text, pattern);
    }
  }

  /**
   * Validate if a string is a valid regular expression pattern
   *
   * @param pattern The regular expression pattern
   * @returns True if the pattern is valid
   */
  public validatePattern(pattern: string): boolean {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.validatePatternJs(pattern);
    }

    try {
      // Call the WebAssembly implementation
      return module.regex_validate_pattern(pattern) as boolean;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.validatePatternJs(pattern);
    }
  }

  /**
   * Escape a string for use in a regular expression
   *
   * @param text The string to escape
   * @returns The escaped string
   */
  public escape(text: string): string {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.escapeJs(text);
    }

    try {
      // Call the WebAssembly implementation
      return module.regex_escape(text) as string;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.escapeJs(text);
    }
  }

  /**
   * Check if a regular expression pattern is valid
   *
   * @param pattern The regular expression pattern
   * @returns True if the pattern is valid
   */
  public isValid(pattern: string): boolean {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.isValidJs(pattern);
    }

    try {
      // Call the WebAssembly implementation
      return module.regex_is_valid(pattern) as boolean;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.isValidJs(pattern);
    }
  }

  /**
   * Get information about a regular expression pattern
   *
   * @param pattern The regular expression pattern
   * @returns Information about the pattern
   */
  public getInfo(pattern: string): RegexInfo {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.getInfoJs(pattern);
    }

    try {
      // Validate the pattern
      if (!this.isValidPattern(pattern)) {
        throw new Error('Invalid regular expression pattern');
      }

      // Call the WebAssembly implementation
      const result = module.regex_get_info(pattern);

      // Convert the result
      return {
        captureNames: Array.from(result.captureNames as any[]).map(name => ({
          index: name.index as number,
          name: name.name as string,
        })),
        captureCount: result.captureCount as number,
      };
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.getInfoJs(pattern);
    }
  }

  /**
   * Execute the accelerated operation
   * @param _input The input for the operation
   * @returns The result of the operation
   */
  public execute(_input: any): any {
    throw new Error('Method not implemented. Use specific operation methods instead.');
  }

  /**
   * Get the performance profile of the regular expression operations accelerator
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 10.0,
      effectiveInputSize: 1000,
    };
  }

  /**
   * Check if a pattern is valid
   *
   * @param pattern The regular expression pattern
   * @returns True if the pattern is valid
   */
  private isValidPattern(pattern: string): boolean {
    try {
      new RegExp(pattern);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test if a string matches a regular expression using JavaScript
   *
   * @param text The text to test
   * @param pattern The regular expression pattern
   * @returns True if the string matches the pattern
   */
  private testJs(text: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern);
      return regex.test(text);
    } catch (error) {
      throw new Error(`Invalid regular expression pattern: ${error}`);
    }
  }

  /**
   * Find the first match of a regular expression in a string using JavaScript
   *
   * @param text The text to search in
   * @param pattern The regular expression pattern
   * @returns The first match, or null if no match is found
   */
  private findFirstJs(text: string, pattern: string): RegexMatch | null {
    try {
      const regex = new RegExp(pattern);
      const match = regex.exec(text);

      if (match === null) {
        return null;
      }

      return {
        index: match.index,
        length: match[0].length,
        text: match[0],
      };
    } catch (error) {
      throw new Error(`Invalid regular expression pattern: ${error}`);
    }
  }

  /**
   * Find all matches of a regular expression in a string using JavaScript
   *
   * @param text The text to search in
   * @param pattern The regular expression pattern
   * @returns An array of matches
   */
  private findAllJs(text: string, pattern: string): RegexMatch[] {
    try {
      const regex = new RegExp(pattern, 'g');
      const matches: RegexMatch[] = [];

      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          text: match[0],
        });

        // Avoid infinite loops for zero-length matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }

      return matches;
    } catch (error) {
      throw new Error(`Invalid regular expression pattern: ${error}`);
    }
  }

  /**
   * Replace all matches of a regular expression in a string using JavaScript
   *
   * @param text The text to search in
   * @param pattern The regular expression pattern
   * @param replacement The replacement string
   * @returns The result of replacing all matches
   */
  private replaceAllJs(text: string, pattern: string, replacement: string): string {
    try {
      const regex = new RegExp(pattern, 'g');
      return text.replace(regex, replacement);
    } catch (error) {
      throw new Error(`Invalid regular expression pattern: ${error}`);
    }
  }

  /**
   * Split a string by a regular expression using JavaScript
   *
   * @param text The text to split
   * @param pattern The regular expression pattern
   * @returns An array of substrings
   */
  private splitJs(text: string, pattern: string): string[] {
    try {
      const regex = new RegExp(pattern);
      return text.split(regex);
    } catch (error) {
      throw new Error(`Invalid regular expression pattern: ${error}`);
    }
  }

  /**
   * Extract capture groups from a regular expression match using JavaScript
   *
   * @param text The text to search in
   * @param pattern The regular expression pattern with capture groups
   * @returns An array of capture groups, or null if no match is found
   */
  private captureGroupsJs(text: string, pattern: string): RegexMatch[] | null {
    try {
      const regex = new RegExp(pattern);
      const match = regex.exec(text);

      if (match === null) {
        return null;
      }

      const captures: RegexMatch[] = [];

      for (let i = 0; i < match.length; i++) {
        if (match[i] === undefined) {
          captures.push(null as any);
          continue;
        }

        // Find the index of the capture group
        let index = match.index;
        for (let j = 0; j < i; j++) {
          if (match[j] !== undefined) {
            index += match[j].length;
          }
        }

        captures.push({
          index,
          length: match[i].length,
          text: match[i],
        });
      }

      return captures;
    } catch (error) {
      throw new Error(`Invalid regular expression pattern: ${error}`);
    }
  }

  /**
   * Extract named capture groups from a regular expression match using JavaScript
   *
   * @param text The text to search in
   * @param pattern The regular expression pattern with named capture groups
   * @returns An object with named capture groups, or null if no match is found
   */
  private namedCaptureGroupsJs(text: string, pattern: string): RegexCaptureGroups | null {
    try {
      const regex = new RegExp(pattern);
      const match = regex.exec(text);

      if (match === null) {
        return null;
      }

      const convertedMatch: RegexMatch = {
        index: match.index,
        length: match[0].length,
        text: match[0],
      };

      const convertedGroups: Record<string, RegexMatch> = {};

      if (match.groups) {
        for (const name in match.groups) {
          const value = match.groups[name];

          // Find the index of the named capture group
          const namedIndex = text.indexOf(value, match.index);

          convertedGroups[name] = {
            index: namedIndex,
            length: value.length,
            text: value,
          };
        }
      }

      return {
        match: convertedMatch,
        groups: convertedGroups,
      };
    } catch (error) {
      throw new Error(`Invalid regular expression pattern: ${error}`);
    }
  }

  /**
   * Validate if a string is a valid regular expression pattern using JavaScript
   *
   * @param pattern The regular expression pattern
   * @returns True if the pattern is valid
   */
  private validatePatternJs(pattern: string): boolean {
    try {
      new RegExp(pattern);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Escape a string for use in a regular expression using JavaScript
   *
   * @param text The string to escape
   * @returns The escaped string
   */
  private escapeJs(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check if a regular expression pattern is valid using JavaScript
   *
   * @param pattern The regular expression pattern
   * @returns True if the pattern is valid
   */
  private isValidJs(pattern: string): boolean {
    try {
      new RegExp(pattern);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get information about a regular expression pattern using JavaScript
   *
   * @param pattern The regular expression pattern
   * @returns Information about the pattern
   */
  private getInfoJs(pattern: string): RegexInfo {
    try {
      // Validate the pattern
      new RegExp(pattern);

      // Get the number of capture groups
      const captureCount = new RegExp(`${pattern}|`).exec('')!.length - 1;

      // Get the capture names
      const captureNames: Array<{ index: number; name: string }> = [];

      // Extract named capture groups
      const namedGroupsMatch = pattern.match(/\(\?<([^>]+)>/g);
      if (namedGroupsMatch) {
        for (const namedGroup of namedGroupsMatch) {
          const name = namedGroup.slice(3, -1);

          // Find the index of the named group
          const index = pattern.indexOf(namedGroup);

          captureNames.push({
            index,
            name,
          });
        }
      }

      return {
        captureNames,
        captureCount,
      };
    } catch (error) {
      throw new Error(`Invalid regular expression pattern: ${error}`);
    }
  }
}
