use wasm_bindgen::prelude::*;
use js_sys::{Array, Object, Reflect};
use unicode_normalization::UnicodeNormalization;
use unicode_segmentation::UnicodeSegmentation;

/// Unicode normalization form enum
#[wasm_bindgen]
pub enum NormalizationForm {
    NFC,
    NFD,
    NFKC,
    NFKD,
}

/// Normalize Unicode text
///
/// Takes a text string and normalization form, and returns the normalized text.
#[wasm_bindgen]
pub fn unicode_normalize(text: &str, form: NormalizationForm) -> String {
    match form {
        NormalizationForm::NFC => text.nfc().collect::<String>(),
        NormalizationForm::NFD => text.nfd().collect::<String>(),
        NormalizationForm::NFKC => text.nfkc().collect::<String>(),
        NormalizationForm::NFKD => text.nfkd().collect::<String>(),
    }
}

/// Convert text to uppercase
///
/// Takes a text string and returns the uppercase version.
#[wasm_bindgen]
pub fn unicode_to_uppercase(text: &str) -> String {
    text.to_uppercase()
}

/// Convert text to lowercase
///
/// Takes a text string and returns the lowercase version.
#[wasm_bindgen]
pub fn unicode_to_lowercase(text: &str) -> String {
    text.to_lowercase()
}

/// Check if a character is uppercase
///
/// Takes a character and returns true if it is uppercase.
#[wasm_bindgen]
pub fn unicode_is_uppercase(c: &str) -> Result<bool, JsValue> {
    let chars: Vec<char> = c.chars().collect();
    
    if chars.len() != 1 {
        return Err(JsValue::from_str("Input must be a single character"));
    }
    
    Ok(chars[0].is_uppercase())
}

/// Check if a character is lowercase
///
/// Takes a character and returns true if it is lowercase.
#[wasm_bindgen]
pub fn unicode_is_lowercase(c: &str) -> Result<bool, JsValue> {
    let chars: Vec<char> = c.chars().collect();
    
    if chars.len() != 1 {
        return Err(JsValue::from_str("Input must be a single character"));
    }
    
    Ok(chars[0].is_lowercase())
}

/// Check if a character is alphabetic
///
/// Takes a character and returns true if it is alphabetic.
#[wasm_bindgen]
pub fn unicode_is_alphabetic(c: &str) -> Result<bool, JsValue> {
    let chars: Vec<char> = c.chars().collect();
    
    if chars.len() != 1 {
        return Err(JsValue::from_str("Input must be a single character"));
    }
    
    Ok(chars[0].is_alphabetic())
}

/// Check if a character is numeric
///
/// Takes a character and returns true if it is numeric.
#[wasm_bindgen]
pub fn unicode_is_numeric(c: &str) -> Result<bool, JsValue> {
    let chars: Vec<char> = c.chars().collect();
    
    if chars.len() != 1 {
        return Err(JsValue::from_str("Input must be a single character"));
    }
    
    Ok(chars[0].is_numeric())
}

/// Check if a character is alphanumeric
///
/// Takes a character and returns true if it is alphanumeric.
#[wasm_bindgen]
pub fn unicode_is_alphanumeric(c: &str) -> Result<bool, JsValue> {
    let chars: Vec<char> = c.chars().collect();
    
    if chars.len() != 1 {
        return Err(JsValue::from_str("Input must be a single character"));
    }
    
    Ok(chars[0].is_alphanumeric())
}

/// Check if a character is whitespace
///
/// Takes a character and returns true if it is whitespace.
#[wasm_bindgen]
pub fn unicode_is_whitespace(c: &str) -> Result<bool, JsValue> {
    let chars: Vec<char> = c.chars().collect();
    
    if chars.len() != 1 {
        return Err(JsValue::from_str("Input must be a single character"));
    }
    
    Ok(chars[0].is_whitespace())
}

/// Check if a character is control
///
/// Takes a character and returns true if it is a control character.
#[wasm_bindgen]
pub fn unicode_is_control(c: &str) -> Result<bool, JsValue> {
    let chars: Vec<char> = c.chars().collect();
    
    if chars.len() != 1 {
        return Err(JsValue::from_str("Input must be a single character"));
    }
    
    Ok(chars[0].is_control())
}

/// Get the Unicode code point of a character
///
/// Takes a character and returns its Unicode code point.
#[wasm_bindgen]
pub fn unicode_code_point(c: &str) -> Result<u32, JsValue> {
    let chars: Vec<char> = c.chars().collect();
    
    if chars.len() != 1 {
        return Err(JsValue::from_str("Input must be a single character"));
    }
    
    Ok(chars[0] as u32)
}

/// Split text into grapheme clusters
///
/// Takes a text string and returns an array of grapheme clusters.
#[wasm_bindgen]
pub fn unicode_grapheme_clusters(text: &str) -> Result<JsValue, JsValue> {
    let clusters: Vec<&str> = text.graphemes(true).collect();
    
    // Create a JavaScript array for the result
    let result = Array::new_with_length(clusters.len() as u32);
    
    // Add each cluster to the array
    for (i, cluster) in clusters.iter().enumerate() {
        result.set(i as u32, JsValue::from_str(cluster));
    }
    
    Ok(result.into())
}

/// Count grapheme clusters in text
///
/// Takes a text string and returns the number of grapheme clusters.
#[wasm_bindgen]
pub fn unicode_grapheme_cluster_count(text: &str) -> usize {
    text.graphemes(true).count()
}

/// Split text into words
///
/// Takes a text string and returns an array of words.
#[wasm_bindgen]
pub fn unicode_words(text: &str) -> Result<JsValue, JsValue> {
    let words: Vec<&str> = text.unicode_words().collect();
    
    // Create a JavaScript array for the result
    let result = Array::new_with_length(words.len() as u32);
    
    // Add each word to the array
    for (i, word) in words.iter().enumerate() {
        result.set(i as u32, JsValue::from_str(word));
    }
    
    Ok(result.into())
}

/// Count words in text
///
/// Takes a text string and returns the number of words.
#[wasm_bindgen]
pub fn unicode_word_count(text: &str) -> usize {
    text.unicode_words().count()
}

/// Get Unicode character information
///
/// Takes a character and returns information about it.
#[wasm_bindgen]
pub fn unicode_char_info(c: &str) -> Result<JsValue, JsValue> {
    let chars: Vec<char> = c.chars().collect();
    
    if chars.len() != 1 {
        return Err(JsValue::from_str("Input must be a single character"));
    }
    
    let char = chars[0];
    
    // Create a JavaScript object for the result
    let result = Object::new();
    
    // Add character information to the object
    Reflect::set(&result, &JsValue::from_str("codePoint"), &JsValue::from_f64(char as u32 as f64))?;
    Reflect::set(&result, &JsValue::from_str("isUppercase"), &JsValue::from_bool(char.is_uppercase()))?;
    Reflect::set(&result, &JsValue::from_str("isLowercase"), &JsValue::from_bool(char.is_lowercase()))?;
    Reflect::set(&result, &JsValue::from_str("isAlphabetic"), &JsValue::from_bool(char.is_alphabetic()))?;
    Reflect::set(&result, &JsValue::from_str("isNumeric"), &JsValue::from_bool(char.is_numeric()))?;
    Reflect::set(&result, &JsValue::from_str("isAlphanumeric"), &JsValue::from_bool(char.is_alphanumeric()))?;
    Reflect::set(&result, &JsValue::from_str("isWhitespace"), &JsValue::from_bool(char.is_whitespace()))?;
    Reflect::set(&result, &JsValue::from_str("isControl"), &JsValue::from_bool(char.is_control()))?;
    
    Ok(result.into())
}

/// Fold case of text
///
/// Takes a text string and returns the case-folded version.
#[wasm_bindgen]
pub fn unicode_case_fold(text: &str) -> String {
    // Case folding is similar to lowercase but more comprehensive
    // For simplicity, we'll use lowercase as an approximation
    text.to_lowercase()
}

/// Compare strings with case folding
///
/// Takes two text strings and returns true if they are equal after case folding.
#[wasm_bindgen]
pub fn unicode_case_fold_compare(a: &str, b: &str) -> bool {
    let a_folded = a.to_lowercase();
    let b_folded = b.to_lowercase();
    
    a_folded == b_folded
}

/// Trim whitespace from text
///
/// Takes a text string and returns the trimmed version.
#[wasm_bindgen]
pub fn unicode_trim(text: &str) -> String {
    text.trim().to_string()
}

/// Trim whitespace from the start of text
///
/// Takes a text string and returns the trimmed version.
#[wasm_bindgen]
pub fn unicode_trim_start(text: &str) -> String {
    text.trim_start().to_string()
}

/// Trim whitespace from the end of text
///
/// Takes a text string and returns the trimmed version.
#[wasm_bindgen]
pub fn unicode_trim_end(text: &str) -> String {
    text.trim_end().to_string()
}
