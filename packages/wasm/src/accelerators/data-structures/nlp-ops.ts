import { WasmAccelerator } from '../wasm-accelerator';
import { PerformanceProfile, AcceleratorOptions } from '../accelerator';
import { WebAssemblyFeature } from '../../core/feature-detection';

/**
 * Word frequency map interface
 */
export interface WordFrequencyMap {
  [word: string]: number;
}

/**
 * TF-IDF score map interface
 */
export interface TfIdfScoreMap {
  [word: string]: number;
}

/**
 * Natural language processing operations accelerator
 * 
 * Provides optimized implementations of natural language processing operations
 * using WebAssembly.
 */
export class NlpOperationsAccelerator extends WasmAccelerator {
  /**
   * Create a new natural language processing operations accelerator
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    super('data-structures', 'nlp-ops', 'operations', {
      ...options,
      requiredFeatures: [WebAssemblyFeature.BASIC],
    });
  }

  /**
   * Tokenize text into words
   * 
   * @param text The text to tokenize
   * @returns An array of words
   */
  public tokenize(text: string): string[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.tokenizeJs(text);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.nlp_tokenize(text);
      
      // Convert the result back to a regular array
      return Array.from(result as any[]) as string[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.tokenizeJs(text);
    }
  }

  /**
   * Count word frequencies in text
   * 
   * @param text The text to analyze
   * @returns A map of word frequencies
   */
  public wordFrequencies(text: string): WordFrequencyMap {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.wordFrequenciesJs(text);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.nlp_word_frequencies(text);
      
      // Convert the result to a WordFrequencyMap
      return result as WordFrequencyMap;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.wordFrequenciesJs(text);
    }
  }

  /**
   * Calculate the TF-IDF score for words in a document
   * 
   * @param document The document to analyze
   * @param corpus The corpus of documents
   * @returns A map of TF-IDF scores
   */
  public tfIdf(document: string, corpus: string[]): TfIdfScoreMap {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.tfIdfJs(document, corpus);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.nlp_tf_idf(document, corpus);
      
      // Convert the result to a TfIdfScoreMap
      return result as TfIdfScoreMap;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.tfIdfJs(document, corpus);
    }
  }

  /**
   * Extract sentences from text
   * 
   * @param text The text to analyze
   * @returns An array of sentences
   */
  public extractSentences(text: string): string[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.extractSentencesJs(text);
    }

    try {
      // Call the WebAssembly implementation
      const result = module.nlp_extract_sentences(text);
      
      // Convert the result back to a regular array
      return Array.from(result as any[]) as string[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.extractSentencesJs(text);
    }
  }

  /**
   * Calculate the similarity between two texts using Jaccard similarity
   * 
   * @param text1 The first text
   * @param text2 The second text
   * @returns A similarity score between 0 and 1
   */
  public jaccardSimilarity(text1: string, text2: string): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.jaccardSimilarityJs(text1, text2);
    }

    try {
      // Call the WebAssembly implementation
      return module.nlp_jaccard_similarity(text1, text2) as number;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.jaccardSimilarityJs(text1, text2);
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
   * Get the performance profile of the natural language processing operations accelerator
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 5.0,
      effectiveInputSize: 1000,
    };
  }

  /**
   * Tokenize text into words using JavaScript
   * 
   * @param text The text to tokenize
   * @returns An array of words
   */
  private tokenizeJs(text: string): string[] {
    return text.split(/\s+/).filter(word => word.length > 0);
  }

  /**
   * Count word frequencies in text using JavaScript
   * 
   * @param text The text to analyze
   * @returns A map of word frequencies
   */
  private wordFrequenciesJs(text: string): WordFrequencyMap {
    const words = text.split(/\s+/)
      .map(word => word.replace(/[^\w]/g, '').toLowerCase())
      .filter(word => word.length > 0);
    
    const frequencies: WordFrequencyMap = {};
    
    for (const word of words) {
      frequencies[word] = (frequencies[word] || 0) + 1;
    }
    
    return frequencies;
  }

  /**
   * Calculate the TF-IDF score for words in a document using JavaScript
   * 
   * @param document The document to analyze
   * @param corpus The corpus of documents
   * @returns A map of TF-IDF scores
   */
  private tfIdfJs(document: string, corpus: string[]): TfIdfScoreMap {
    // Tokenize the document
    const docWords = document.split(/\s+/)
      .map(word => word.replace(/[^\w]/g, '').toLowerCase())
      .filter(word => word.length > 0);
    
    // Calculate term frequency (TF) for the document
    const termFreq: Record<string, number> = {};
    const docLen = docWords.length;
    
    for (const word of docWords) {
      termFreq[word] = (termFreq[word] || 0) + 1 / docLen;
    }
    
    // Calculate inverse document frequency (IDF) for each term
    const docFreq: Record<string, number> = {};
    
    for (const doc of corpus) {
      const docUniqueWords = new Set(
        doc.split(/\s+/)
          .map(word => word.replace(/[^\w]/g, '').toLowerCase())
          .filter(word => word.length > 0)
      );
      
      for (const word of docUniqueWords) {
        docFreq[word] = (docFreq[word] || 0) + 1;
      }
    }
    
    // Calculate TF-IDF scores
    const tfIdf: TfIdfScoreMap = {};
    
    for (const word in termFreq) {
      const tf = termFreq[word];
      const df = docFreq[word] || 0;
      const idf = df > 0 ? Math.log(corpus.length / df) : 0;
      
      tfIdf[word] = tf * idf;
    }
    
    return tfIdf;
  }

  /**
   * Extract sentences from text using JavaScript
   * 
   * @param text The text to analyze
   * @returns An array of sentences
   */
  private extractSentencesJs(text: string): string[] {
    // Simple sentence boundary detection
    const sentenceEndings = ['.', '!', '?'];
    const sentences: string[] = [];
    let currentSentence = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      currentSentence += char;
      
      if (sentenceEndings.includes(char)) {
        // Check if the next character is whitespace or end of text
        const isEndOfSentence = i === text.length - 1 || text[i + 1].match(/\s/);
        
        if (isEndOfSentence) {
          sentences.push(currentSentence.trim());
          currentSentence = '';
        }
      }
    }
    
    // Add the last sentence if it's not empty
    if (currentSentence.trim().length > 0) {
      sentences.push(currentSentence.trim());
    }
    
    return sentences;
  }

  /**
   * Calculate the similarity between two texts using Jaccard similarity using JavaScript
   * 
   * @param text1 The first text
   * @param text2 The second text
   * @returns A similarity score between 0 and 1
   */
  private jaccardSimilarityJs(text1: string, text2: string): number {
    // Tokenize the texts
    const words1 = new Set(
      text1.split(/\s+/)
        .map(word => word.replace(/[^\w]/g, '').toLowerCase())
        .filter(word => word.length > 0)
    );
    
    const words2 = new Set(
      text2.split(/\s+/)
        .map(word => word.replace(/[^\w]/g, '').toLowerCase())
        .filter(word => word.length > 0)
    );
    
    // Calculate intersection and union
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    // Calculate Jaccard similarity
    if (union.size === 0) {
      return 1.0; // Both texts are empty
    }
    
    return intersection.size / union.size;
  }
}
