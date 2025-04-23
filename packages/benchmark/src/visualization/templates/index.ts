/**
 * Template system for benchmark visualization
 *
 * @packageDocumentation
 */

// Import and re-export templates
import './csv/base';
import './html/base';
import './markdown/base';

// Export template engine functions and types
export {
  // Functions
  registerTemplate,
  getTemplate,
  getAllTemplates,
  getTemplatesByFormat,
  renderTemplate,
  defaultHelpers,

  // Types
  Template,
  TemplateContext,
  TemplateOptions
} from './engine';
