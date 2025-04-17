/**
 * Operation Matchers
 * 
 * Provides default operation matchers for determining compatibility
 * between operations.
 * 
 * @packageDocumentation
 */

import {
  OperationMatcher,
  OperationInterface,
  OperationCategory,
  OperationCompatibility,
} from './types';

/**
 * Exact matcher
 * 
 * Checks if two operations have the same name and category.
 */
export const exactMatcher: OperationMatcher = {
  id: 'exact-matcher',
  description: 'Matches operations with the same name and category',
  isCompatible: (op1: OperationInterface, op2: OperationInterface): OperationCompatibility => {
    const nameMatch = op1.metadata.name === op2.metadata.name;
    const categoryMatch = op1.metadata.category === op2.metadata.category;
    
    if (nameMatch && categoryMatch) {
      return {
        compatible: true,
        score: 1.0,
      };
    }
    
    return {
      compatible: false,
      reason: nameMatch
        ? `Category mismatch: ${op1.metadata.category} vs ${op2.metadata.category}`
        : `Name mismatch: ${op1.metadata.name} vs ${op2.metadata.name}`,
    };
  },
  priority: 100,
};

/**
 * Category matcher
 * 
 * Checks if two operations have the same category and similar names.
 */
export const categoryMatcher: OperationMatcher = {
  id: 'category-matcher',
  description: 'Matches operations with the same category and similar names',
  isCompatible: (op1: OperationInterface, op2: OperationInterface): OperationCompatibility => {
    // Check if categories match
    if (op1.metadata.category !== op2.metadata.category) {
      return {
        compatible: false,
        reason: `Category mismatch: ${op1.metadata.category} vs ${op2.metadata.category}`,
      };
    }
    
    // Check if names are similar
    const name1 = op1.metadata.name.toLowerCase();
    const name2 = op2.metadata.name.toLowerCase();
    
    // Check for exact match
    if (name1 === name2) {
      return {
        compatible: true,
        score: 1.0,
      };
    }
    
    // Check for prefix/suffix match
    if (name1.startsWith(name2) || name2.startsWith(name1) ||
        name1.endsWith(name2) || name2.endsWith(name1)) {
      return {
        compatible: true,
        score: 0.8,
      };
    }
    
    // Check for substring match
    if (name1.includes(name2) || name2.includes(name1)) {
      return {
        compatible: true,
        score: 0.6,
      };
    }
    
    // Check for common words
    const words1 = name1.split(/[^a-z0-9]+/);
    const words2 = name2.split(/[^a-z0-9]+/);
    const commonWords = words1.filter(w => words2.includes(w));
    
    if (commonWords.length > 0) {
      const score = commonWords.length / Math.max(words1.length, words2.length);
      return {
        compatible: true,
        score: 0.4 + score * 0.4, // Score between 0.4 and 0.8
      };
    }
    
    return {
      compatible: false,
      reason: `Name mismatch: ${op1.metadata.name} vs ${op2.metadata.name}`,
    };
  },
  priority: 50,
};

/**
 * Tag matcher
 * 
 * Checks if two operations have common tags.
 */
export const tagMatcher: OperationMatcher = {
  id: 'tag-matcher',
  description: 'Matches operations with common tags',
  isCompatible: (op1: OperationInterface, op2: OperationInterface): OperationCompatibility => {
    const tags1 = op1.metadata.tags || [];
    const tags2 = op2.metadata.tags || [];
    
    if (tags1.length === 0 || tags2.length === 0) {
      return {
        compatible: false,
        reason: 'One or both operations have no tags',
      };
    }
    
    const commonTags = tags1.filter(t => tags2.includes(t));
    
    if (commonTags.length > 0) {
      const score = commonTags.length / Math.max(tags1.length, tags2.length);
      return {
        compatible: true,
        score: 0.3 + score * 0.5, // Score between 0.3 and 0.8
      };
    }
    
    return {
      compatible: false,
      reason: 'No common tags',
    };
  },
  priority: 25,
};

/**
 * Access/modification matcher
 * 
 * Checks if two operations have the same read-only property.
 */
export const accessModificationMatcher: OperationMatcher = {
  id: 'access-modification-matcher',
  description: 'Matches operations with the same read-only property',
  isCompatible: (op1: OperationInterface, op2: OperationInterface): OperationCompatibility => {
    if (op1.metadata.readOnly === op2.metadata.readOnly) {
      // Both are read-only or both are modifying
      const accessCategory = op1.metadata.readOnly ? OperationCategory.ACCESS : OperationCategory.MODIFICATION;
      
      // Check if both operations are in the expected category
      if (op1.metadata.category === accessCategory && op2.metadata.category === accessCategory) {
        return {
          compatible: true,
          score: 0.5,
        };
      }
    }
    
    return {
      compatible: false,
      reason: `Read-only mismatch: ${op1.metadata.readOnly} vs ${op2.metadata.readOnly}`,
    };
  },
  priority: 10,
};
