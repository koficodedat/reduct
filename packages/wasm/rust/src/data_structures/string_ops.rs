use wasm_bindgen::prelude::*;
use js_sys::{Array, JsString, Uint8Array, Uint16Array};
use bumpalo::Bump;

/// Sort strings using a fast algorithm
///
/// Takes an array of strings and returns a sorted array.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn string_sort(strings: &JsValue) -> Result<JsValue, JsValue> {
    // Convert input to JavaScript array
    let strings_array = Array::from(strings);
    let length = strings_array.length() as usize;
    
    // Early return for empty arrays
    if length == 0 {
        return Ok(Array::new().into());
    }
    
    // Copy strings to a Rust vector
    let mut strings_vec = Vec::with_capacity(length);
    for i in 0..length {
        let js_string = strings_array.get(i as u32);
        if let Some(string) = js_string.as_string() {
            strings_vec.push(string);
        } else {
            return Err(JsValue::from_str("Array must contain only strings"));
        }
    }
    
    // Sort the strings
    strings_vec.sort();
    
    // Create a new JavaScript array for the result
    let result = Array::new_with_length(length as u32);
    for (i, string) in strings_vec.iter().enumerate() {
        result.set(i as u32, JsValue::from_str(string));
    }
    
    Ok(result.into())
}

/// Sort strings using a locale-aware algorithm
///
/// Takes an array of strings and a locale, and returns a sorted array.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn string_sort_locale(strings: &JsValue, locale: &str) -> Result<JsValue, JsValue> {
    // Convert input to JavaScript array
    let strings_array = Array::from(strings);
    let length = strings_array.length() as usize;
    
    // Early return for empty arrays
    if length == 0 {
        return Ok(Array::new().into());
    }
    
    // Copy strings to a Rust vector
    let mut strings_vec = Vec::with_capacity(length);
    for i in 0..length {
        let js_string = strings_array.get(i as u32);
        if let Some(string) = js_string.as_string() {
            strings_vec.push(string);
        } else {
            return Err(JsValue::from_str("Array must contain only strings"));
        }
    }
    
    // Create a collator for the specified locale
    let collator = match icu::collator::Collator::try_new(locale) {
        Ok(collator) => collator,
        Err(_) => return Err(JsValue::from_str("Invalid locale")),
    };
    
    // Sort the strings using the collator
    strings_vec.sort_by(|a, b| collator.compare(a, b));
    
    // Create a new JavaScript array for the result
    let result = Array::new_with_length(length as u32);
    for (i, string) in strings_vec.iter().enumerate() {
        result.set(i as u32, JsValue::from_str(string));
    }
    
    Ok(result.into())
}

/// Find all occurrences of a pattern in a string
///
/// Takes a string and a pattern, and returns an array of indices where the pattern occurs.
/// This is much faster than using JavaScript, especially for large strings.
#[wasm_bindgen]
pub fn string_find_all(text: &str, pattern: &str) -> Result<JsValue, JsValue> {
    // Validate inputs
    if pattern.is_empty() {
        return Err(JsValue::from_str("Pattern cannot be empty"));
    }
    
    // Find all occurrences of the pattern
    let mut indices = Vec::new();
    let text_bytes = text.as_bytes();
    let pattern_bytes = pattern.as_bytes();
    
    // Use a simple sliding window algorithm
    for i in 0..=text_bytes.len().saturating_sub(pattern_bytes.len()) {
        if text_bytes[i..].starts_with(pattern_bytes) {
            indices.push(i);
        }
    }
    
    // Create a new JavaScript array for the result
    let result = Array::new_with_length(indices.len() as u32);
    for (i, &index) in indices.iter().enumerate() {
        result.set(i as u32, JsValue::from_f64(index as f64));
    }
    
    Ok(result.into())
}

/// Find all occurrences of a pattern in a string using the Boyer-Moore algorithm
///
/// Takes a string and a pattern, and returns an array of indices where the pattern occurs.
/// This is much faster than using JavaScript, especially for large strings.
#[wasm_bindgen]
pub fn string_find_all_boyer_moore(text: &str, pattern: &str) -> Result<JsValue, JsValue> {
    // Validate inputs
    if pattern.is_empty() {
        return Err(JsValue::from_str("Pattern cannot be empty"));
    }
    
    // Precompute the bad character table
    let mut bad_char = vec![pattern.len(); 256];
    let pattern_bytes = pattern.as_bytes();
    
    for (i, &c) in pattern_bytes.iter().enumerate().take(pattern_bytes.len() - 1) {
        bad_char[c as usize] = pattern_bytes.len() - 1 - i;
    }
    
    // Find all occurrences of the pattern
    let mut indices = Vec::new();
    let text_bytes = text.as_bytes();
    
    let mut i = pattern_bytes.len() - 1;
    while i < text_bytes.len() {
        let mut j = pattern_bytes.len() - 1;
        let mut k = i;
        
        while j < pattern_bytes.len() && pattern_bytes[j] == text_bytes[k] {
            if j == 0 {
                indices.push(k);
                break;
            }
            j -= 1;
            k -= 1;
        }
        
        i += if j < pattern_bytes.len() {
            bad_char[text_bytes[i] as usize]
        } else {
            1
        };
    }
    
    // Create a new JavaScript array for the result
    let result = Array::new_with_length(indices.len() as u32);
    for (i, &index) in indices.iter().enumerate() {
        result.set(i as u32, JsValue::from_f64(index as f64));
    }
    
    Ok(result.into())
}

/// Encode a string to UTF-8
///
/// Takes a string and returns a Uint8Array containing the UTF-8 encoded bytes.
/// This is much faster than using JavaScript, especially for large strings.
#[wasm_bindgen]
pub fn string_encode_utf8(text: &str) -> Result<JsValue, JsValue> {
    // Get the UTF-8 bytes
    let bytes = text.as_bytes();
    
    // Create a new Uint8Array for the result
    let result = Uint8Array::new_with_length(bytes.len() as u32);
    
    // Copy the bytes to the result
    for (i, &byte) in bytes.iter().enumerate() {
        result.set_index(i as u32, byte);
    }
    
    Ok(result.into())
}

/// Decode a UTF-8 encoded array to a string
///
/// Takes a Uint8Array containing UTF-8 encoded bytes and returns a string.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn string_decode_utf8(bytes: &JsValue) -> Result<JsValue, JsValue> {
    // Convert input to Uint8Array
    let bytes_array = Uint8Array::new(bytes);
    let length = bytes_array.length() as usize;
    
    // Copy bytes to a Rust vector
    let mut bytes_vec = vec![0u8; length];
    for i in 0..length {
        bytes_vec[i] = bytes_array.get_index(i as u32);
    }
    
    // Decode the bytes to a string
    match std::str::from_utf8(&bytes_vec) {
        Ok(text) => Ok(JsValue::from_str(text)),
        Err(_) => Err(JsValue::from_str("Invalid UTF-8 sequence")),
    }
}

/// Encode a string to UTF-16
///
/// Takes a string and returns a Uint16Array containing the UTF-16 encoded code units.
/// This is much faster than using JavaScript, especially for large strings.
#[wasm_bindgen]
pub fn string_encode_utf16(text: &str) -> Result<JsValue, JsValue> {
    // Get the UTF-16 code units
    let code_units: Vec<u16> = text.encode_utf16().collect();
    
    // Create a new Uint16Array for the result
    let result = Uint16Array::new_with_length(code_units.len() as u32);
    
    // Copy the code units to the result
    for (i, &code_unit) in code_units.iter().enumerate() {
        result.set_index(i as u32, code_unit);
    }
    
    Ok(result.into())
}

/// Decode a UTF-16 encoded array to a string
///
/// Takes a Uint16Array containing UTF-16 encoded code units and returns a string.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn string_decode_utf16(code_units: &JsValue) -> Result<JsValue, JsValue> {
    // Convert input to Uint16Array
    let code_units_array = Uint16Array::new(code_units);
    let length = code_units_array.length() as usize;
    
    // Copy code units to a Rust vector
    let mut code_units_vec = vec![0u16; length];
    for i in 0..length {
        code_units_vec[i] = code_units_array.get_index(i as u32);
    }
    
    // Decode the code units to a string
    let text = String::from_utf16_lossy(&code_units_vec);
    
    Ok(JsValue::from_str(&text))
}

/// Calculate the Levenshtein distance between two strings
///
/// Takes two strings and returns the Levenshtein distance between them.
/// This is much faster than using JavaScript, especially for large strings.
#[wasm_bindgen]
pub fn string_levenshtein_distance(a: &str, b: &str) -> usize {
    // Get the lengths of the strings
    let a_len = a.chars().count();
    let b_len = b.chars().count();
    
    // Handle edge cases
    if a_len == 0 {
        return b_len;
    }
    if b_len == 0 {
        return a_len;
    }
    
    // Convert strings to vectors of characters
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    
    // Initialize the distance matrix
    let mut distances = vec![vec![0; b_len + 1]; a_len + 1];
    
    // Initialize the first row and column
    for i in 0..=a_len {
        distances[i][0] = i;
    }
    for j in 0..=b_len {
        distances[0][j] = j;
    }
    
    // Fill in the rest of the matrix
    for i in 1..=a_len {
        for j in 1..=b_len {
            let cost = if a_chars[i - 1] == b_chars[j - 1] { 0 } else { 1 };
            
            distances[i][j] = std::cmp::min(
                distances[i - 1][j] + 1,
                std::cmp::min(
                    distances[i][j - 1] + 1,
                    distances[i - 1][j - 1] + cost,
                ),
            );
        }
    }
    
    // Return the distance
    distances[a_len][b_len]
}

/// Calculate the similarity between two strings
///
/// Takes two strings and returns a similarity score between 0 and 1.
/// This is much faster than using JavaScript, especially for large strings.
#[wasm_bindgen]
pub fn string_similarity(a: &str, b: &str) -> f64 {
    // Get the lengths of the strings
    let a_len = a.chars().count();
    let b_len = b.chars().count();
    
    // Handle edge cases
    if a_len == 0 && b_len == 0 {
        return 1.0;
    }
    if a_len == 0 || b_len == 0 {
        return 0.0;
    }
    
    // Calculate the Levenshtein distance
    let distance = string_levenshtein_distance(a, b);
    
    // Calculate the similarity score
    let max_len = std::cmp::max(a_len, b_len);
    1.0 - (distance as f64 / max_len as f64)
}

/// Tokenize a string into words
///
/// Takes a string and returns an array of words.
/// This is much faster than using JavaScript, especially for large strings.
#[wasm_bindgen]
pub fn string_tokenize(text: &str) -> Result<JsValue, JsValue> {
    // Tokenize the string
    let words: Vec<&str> = text.split_whitespace().collect();
    
    // Create a new JavaScript array for the result
    let result = Array::new_with_length(words.len() as u32);
    for (i, &word) in words.iter().enumerate() {
        result.set(i as u32, JsValue::from_str(word));
    }
    
    Ok(result.into())
}

/// Tokenize a string into words with custom delimiters
///
/// Takes a string and a set of delimiters, and returns an array of words.
/// This is much faster than using JavaScript, especially for large strings.
#[wasm_bindgen]
pub fn string_tokenize_with_delimiters(text: &str, delimiters: &str) -> Result<JsValue, JsValue> {
    // Create a predicate function for splitting
    let is_delimiter = |c: char| delimiters.contains(c);
    
    // Tokenize the string
    let mut words = Vec::new();
    let mut current_word = String::new();
    
    for c in text.chars() {
        if is_delimiter(c) {
            if !current_word.is_empty() {
                words.push(current_word);
                current_word = String::new();
            }
        } else {
            current_word.push(c);
        }
    }
    
    // Add the last word if it's not empty
    if !current_word.is_empty() {
        words.push(current_word);
    }
    
    // Create a new JavaScript array for the result
    let result = Array::new_with_length(words.len() as u32);
    for (i, word) in words.iter().enumerate() {
        result.set(i as u32, JsValue::from_str(word));
    }
    
    Ok(result.into())
}
