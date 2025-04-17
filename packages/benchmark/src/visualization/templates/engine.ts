/**
 * Template Engine
 * 
 * Provides a simple template engine for rendering benchmark results
 * in different formats.
 * 
 * @packageDocumentation
 */

/**
 * Template context for rendering
 */
export interface TemplateContext {
  /** Template data (benchmark results, etc.) */
  data: any;
  /** Template options */
  options?: TemplateOptions;
  /** Helper functions */
  helpers?: Record<string, Function>;
}

/**
 * Template options
 */
export interface TemplateOptions {
  /** Theme name */
  theme?: string;
  /** Custom CSS for HTML templates */
  customCSS?: string;
  /** Custom header content */
  header?: string;
  /** Custom footer content */
  footer?: string;
  /** Additional template variables */
  variables?: Record<string, any>;
}

/**
 * Template definition
 */
export interface Template {
  /** Template name */
  name: string;
  /** Template content */
  content: string;
  /** Template format */
  format: 'html' | 'markdown' | 'csv' | 'text';
  /** Template description */
  description?: string;
  /** Parent template (for inheritance) */
  parent?: string;
  /** Template blocks (for inheritance) */
  blocks?: Record<string, string>;
}

/**
 * Template registry
 */
const templates: Record<string, Template> = {};

/**
 * Registers a template
 * 
 * @param template - Template to register
 */
export function registerTemplate(template: Template): void {
  templates[template.name] = template;
}

/**
 * Gets a template by name
 * 
 * @param name - Template name
 * @returns Template or undefined if not found
 */
export function getTemplate(name: string): Template | undefined {
  return templates[name];
}

/**
 * Gets all templates
 * 
 * @returns All registered templates
 */
export function getAllTemplates(): Template[] {
  return Object.values(templates);
}

/**
 * Gets templates by format
 * 
 * @param format - Template format
 * @returns Templates with the specified format
 */
export function getTemplatesByFormat(format: string): Template[] {
  return Object.values(templates).filter(t => t.format === format);
}

/**
 * Renders a template with the given context
 * 
 * @param templateName - Template name
 * @param context - Template context
 * @returns Rendered template
 */
export function renderTemplate(templateName: string, context: TemplateContext): string {
  const template = getTemplate(templateName);
  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }
  
  // Process template inheritance
  let content = template.content;
  if (template.parent) {
    const parentTemplate = getTemplate(template.parent);
    if (!parentTemplate) {
      throw new Error(`Parent template '${template.parent}' not found`);
    }
    
    // Start with parent content
    content = parentTemplate.content;
    
    // Replace blocks
    if (template.blocks) {
      for (const [blockName, blockContent] of Object.entries(template.blocks)) {
        const blockRegex = new RegExp(`\\{\\{\\s*block\\s+${blockName}\\s*\\}\\}`, 'g');
        content = content.replace(blockRegex, blockContent);
      }
    }
  }
  
  // Process includes
  const includeRegex = /\{\{\s*include\s+([a-zA-Z0-9_-]+)\s*\}\}/g;
  let match;
  while ((match = includeRegex.exec(content)) !== null) {
    const includeName = match[1];
    const includeTemplate = getTemplate(includeName);
    if (!includeTemplate) {
      throw new Error(`Include template '${includeName}' not found`);
    }
    content = content.replace(match[0], includeTemplate.content);
  }
  
  // Process conditionals
  content = processConditionals(content, context);
  
  // Process loops
  content = processLoops(content, context);
  
  // Process variables
  content = processVariables(content, context);
  
  return content;
}

/**
 * Processes conditional statements in a template
 * 
 * @param content - Template content
 * @param context - Template context
 * @returns Processed content
 */
function processConditionals(content: string, context: TemplateContext): string {
  // Process if statements
  const ifRegex = /\{\{\s*if\s+([^}]+)\s*\}\}([\s\S]*?)(?:\{\{\s*else\s*\}\}([\s\S]*?))?\{\{\s*endif\s*\}\}/g;
  return content.replace(ifRegex, (match, condition, ifContent, elseContent = '') => {
    try {
      // Create a function to evaluate the condition
      const conditionFn = new Function('data', 'options', 'helpers', `return ${condition};`);
      const result = conditionFn(context.data, context.options, context.helpers);
      return result ? ifContent : elseContent;
    } catch (error) {
      console.error(`Error evaluating condition '${condition}':`, error);
      return '';
    }
  });
}

/**
 * Processes loop statements in a template
 * 
 * @param content - Template content
 * @param context - Template context
 * @returns Processed content
 */
function processLoops(content: string, context: TemplateContext): string {
  // Process for loops
  const forRegex = /\{\{\s*for\s+([a-zA-Z0-9_]+)\s+in\s+([^}]+)\s*\}\}([\s\S]*?)\{\{\s*endfor\s*\}\}/g;
  return content.replace(forRegex, (match, itemName, collection, loopContent) => {
    try {
      // Create a function to evaluate the collection
      const collectionFn = new Function('data', 'options', 'helpers', `return ${collection};`);
      const items = collectionFn(context.data, context.options, context.helpers);
      
      if (!Array.isArray(items)) {
        console.error(`Collection '${collection}' is not an array`);
        return '';
      }
      
      // Process each item in the collection
      return items.map(item => {
        // Create a new context with the item
        const itemContext: TemplateContext = {
          ...context,
          data: {
            ...context.data,
            [itemName]: item,
          },
        };
        
        // Process the loop content with the item context
        let itemContent = loopContent;
        itemContent = processConditionals(itemContent, itemContext);
        itemContent = processVariables(itemContent, itemContext);
        return itemContent;
      }).join('');
    } catch (error) {
      console.error(`Error evaluating collection '${collection}':`, error);
      return '';
    }
  });
}

/**
 * Processes variables in a template
 * 
 * @param content - Template content
 * @param context - Template context
 * @returns Processed content
 */
function processVariables(content: string, context: TemplateContext): string {
  // Process variables
  const variableRegex = /\{\{\s*([^}]+)\s*\}\}/g;
  return content.replace(variableRegex, (match, variable) => {
    // Skip if it's a block, include, if, else, endif, for, or endfor
    if (/^\s*(block|include|if|else|endif|for|endfor)\s/.test(variable)) {
      return match;
    }
    
    try {
      // Create a function to evaluate the variable
      const variableFn = new Function('data', 'options', 'helpers', `return ${variable};`);
      const result = variableFn(context.data, context.options, context.helpers);
      return result !== undefined ? String(result) : '';
    } catch (error) {
      console.error(`Error evaluating variable '${variable}':`, error);
      return '';
    }
  });
}

/**
 * Helper functions for templates
 */
export const defaultHelpers = {
  /**
   * Formats a number with thousands separator
   * 
   * @param value - Number to format
   * @returns Formatted number
   */
  formatNumber: (value: number): string => {
    return value.toLocaleString();
  },
  
  /**
   * Formats a date
   * 
   * @param value - Date to format
   * @param format - Date format (default: ISO string)
   * @returns Formatted date
   */
  formatDate: (value: Date, format?: string): string => {
    if (!format) {
      return value.toISOString();
    }
    
    // Simple date formatting
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    const seconds = String(value.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },
  
  /**
   * Truncates a string to a maximum length
   * 
   * @param value - String to truncate
   * @param maxLength - Maximum length
   * @param suffix - Suffix to add if truncated (default: '...')
   * @returns Truncated string
   */
  truncate: (value: string, maxLength: number, suffix: string = '...'): string => {
    if (value.length <= maxLength) {
      return value;
    }
    return value.substring(0, maxLength) + suffix;
  },
  
  /**
   * Escapes HTML special characters
   * 
   * @param value - String to escape
   * @returns Escaped string
   */
  escapeHTML: (value: string): string => {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
  
  /**
   * Converts a value to JSON
   * 
   * @param value - Value to convert
   * @param pretty - Whether to pretty-print the JSON (default: true)
   * @returns JSON string
   */
  toJSON: (value: any, pretty: boolean = true): string => {
    return JSON.stringify(value, null, pretty ? 2 : 0);
  },
};
