use wasm_bindgen::prelude::*;
use js_sys::{Array, Object, Reflect};

/// Tokenize text into words
///
/// Takes a text string and returns an array of words.
#[wasm_bindgen]
pub fn nlp_tokenize(text: &str) -> Result<JsValue, JsValue> {
    // Split the text into words
    let words: Vec<&str> = text.split_whitespace().collect();
    
    // Create a JavaScript array for the result
    let result = Array::new_with_length(words.len() as u32);
    
    // Add each word to the array
    for (i, word) in words.iter().enumerate() {
        result.set(i as u32, JsValue::from_str(word));
    }
    
    Ok(result.into())
}

/// Count word frequencies in text
///
/// Takes a text string and returns an object with word frequencies.
#[wasm_bindgen]
pub fn nlp_word_frequencies(text: &str) -> Result<JsValue, JsValue> {
    // Split the text into words
    let words: Vec<&str> = text.split_whitespace()
        .map(|word| word.trim_matches(|c: char| !c.is_alphanumeric()))
        .filter(|word| !word.is_empty())
        .collect();
    
    // Count word frequencies
    let mut frequencies = std::collections::HashMap::new();
    
    for word in words {
        let word_lower = word.to_lowercase();
        *frequencies.entry(word_lower).or_insert(0) += 1;
    }
    
    // Create a JavaScript object for the result
    let result = Object::new();
    
    // Add each word frequency to the object
    for (word, count) in frequencies {
        Reflect::set(&result, &JsValue::from_str(&word), &JsValue::from_f64(count as f64))?;
    }
    
    Ok(result.into())
}

/// Calculate the TF-IDF score for words in a document
///
/// Takes a document and a corpus of documents, and returns TF-IDF scores.
#[wasm_bindgen]
pub fn nlp_tf_idf(document: &str, corpus: &JsValue) -> Result<JsValue, JsValue> {
    // Convert corpus to a vector of strings
    let corpus_array = Array::from(corpus);
    let corpus_len = corpus_array.length() as usize;
    
    let mut corpus_docs = Vec::with_capacity(corpus_len);
    for i in 0..corpus_len {
        let doc = corpus_array.get(i as u32);
        if let Some(doc_str) = doc.as_string() {
            corpus_docs.push(doc_str);
        } else {
            return Err(JsValue::from_str("Corpus must contain only strings"));
        }
    }
    
    // Tokenize the document
    let doc_words: Vec<String> = document.split_whitespace()
        .map(|word| word.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase())
        .filter(|word| !word.is_empty())
        .collect();
    
    // Calculate term frequency (TF) for the document
    let mut term_freq = std::collections::HashMap::new();
    let doc_len = doc_words.len() as f64;
    
    for word in &doc_words {
        *term_freq.entry(word.clone()).or_insert(0.0) += 1.0 / doc_len;
    }
    
    // Calculate inverse document frequency (IDF) for each term
    let mut doc_freq = std::collections::HashMap::new();
    
    for doc in &corpus_docs {
        let doc_unique_words: std::collections::HashSet<String> = doc.split_whitespace()
            .map(|word| word.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase())
            .filter(|word| !word.is_empty())
            .collect();
        
        for word in doc_unique_words {
            *doc_freq.entry(word).or_insert(0) += 1;
        }
    }
    
    // Calculate TF-IDF scores
    let mut tf_idf = std::collections::HashMap::new();
    
    for word in term_freq.keys() {
        let tf = *term_freq.get(word).unwrap_or(&0.0);
        let df = *doc_freq.get(word).unwrap_or(&0) as f64;
        let idf = if df > 0.0 {
            (corpus_len as f64 / df).ln()
        } else {
            0.0
        };
        
        tf_idf.insert(word.clone(), tf * idf);
    }
    
    // Create a JavaScript object for the result
    let result = Object::new();
    
    // Add each TF-IDF score to the object
    for (word, score) in tf_idf {
        Reflect::set(&result, &JsValue::from_str(&word), &JsValue::from_f64(score))?;
    }
    
    Ok(result.into())
}

/// Extract sentences from text
///
/// Takes a text string and returns an array of sentences.
#[wasm_bindgen]
pub fn nlp_extract_sentences(text: &str) -> Result<JsValue, JsValue> {
    // Simple sentence boundary detection
    let sentence_endings = ['.', '!', '?'];
    let mut sentences = Vec::new();
    let mut current_sentence = String::new();
    
    for c in text.chars() {
        current_sentence.push(c);
        
        if sentence_endings.contains(&c) {
            // Check if the next character is whitespace or end of text
            let is_sentence_end = text.chars().skip(current_sentence.len()).next()
                .map_or(true, |next_char| next_char.is_whitespace());
            
            if is_sentence_end {
                sentences.push(current_sentence.trim().to_string());
                current_sentence.clear();
            }
        }
    }
    
    // Add the last sentence if it's not empty
    if !current_sentence.trim().is_empty() {
        sentences.push(current_sentence.trim().to_string());
    }
    
    // Create a JavaScript array for the result
    let result = Array::new_with_length(sentences.len() as u32);
    
    // Add each sentence to the array
    for (i, sentence) in sentences.iter().enumerate() {
        result.set(i as u32, JsValue::from_str(sentence));
    }
    
    Ok(result.into())
}

/// Calculate the similarity between two texts using Jaccard similarity
///
/// Takes two text strings and returns a similarity score between 0 and 1.
#[wasm_bindgen]
pub fn nlp_jaccard_similarity(text1: &str, text2: &str) -> f64 {
    // Tokenize the texts
    let words1: std::collections::HashSet<String> = text1.split_whitespace()
        .map(|word| word.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase())
        .filter(|word| !word.is_empty())
        .collect();
    
    let words2: std::collections::HashSet<String> = text2.split_whitespace()
        .map(|word| word.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase())
        .filter(|word| !word.is_empty())
        .collect();
    
    // Calculate Jaccard similarity
    let intersection_size = words1.intersection(&words2).count() as f64;
    let union_size = words1.union(&words2).count() as f64;
    
    if union_size == 0.0 {
        return 1.0; // Both texts are empty
    }
    
    intersection_size / union_size
}
