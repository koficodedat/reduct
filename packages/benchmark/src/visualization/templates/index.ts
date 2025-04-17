/**
 * Template system for benchmark visualization
 * 
 * @packageDocumentation
 */

// Export template engine
export * from './engine';

// Import and re-export templates
import './html/base';
import './markdown/base';
import './csv/base';

// Export template types
export { Template, TemplateContext, TemplateOptions } from './engine';
