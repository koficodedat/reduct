use wasm_bindgen::prelude::*;
use js_sys::{Array, Object, Reflect, RegExp};
use regex::Regex;
use bumpalo::Bump;

/// Test if a string matches a regular expression
///
/// Takes a string and a regular expression pattern, and returns true if the string matches the pattern.
/// This is much faster than using JavaScript, especially for complex patterns and large strings.
#[wasm_bindgen]
pub fn regex_test(text: &str, pattern: &str) -> Result<bool, JsValue> {
    // Compile the regular expression
    let regex = match Regex::new(pattern) {
        Ok(re) => re,
        Err(err) => return Err(JsValue::from_str(&format!("Invalid regex pattern: {}", err))),
    };
    
    // Test if the string matches the pattern
    Ok(regex.is_match(text))
}

/// Find the first match of a regular expression in a string
///
/// Takes a string and a regular expression pattern, and returns the first match.
/// This is much faster than using JavaScript, especially for complex patterns and large strings.
#[wasm_bindgen]
pub fn regex_find_first(text: &str, pattern: &str) -> Result<JsValue, JsValue> {
    // Compile the regular expression
    let regex = match Regex::new(pattern) {
        Ok(re) => re,
        Err(err) => return Err(JsValue::from_str(&format!("Invalid regex pattern: {}", err))),
    };
    
    // Find the first match
    match regex.find(text) {
        Some(m) => {
            // Create a result object
            let result = Object::new();
            Reflect::set(&result, &JsValue::from_str("index"), &JsValue::from_f64(m.start() as f64))?;
            Reflect::set(&result, &JsValue::from_str("length"), &JsValue::from_f64(m.len() as f64))?;
            Reflect::set(&result, &JsValue::from_str("text"), &JsValue::from_str(&text[m.start()..m.end()]))?;
            Ok(result.into())
        },
        None => Ok(JsValue::null()),
    }
}

/// Find all matches of a regular expression in a string
///
/// Takes a string and a regular expression pattern, and returns all matches.
/// This is much faster than using JavaScript, especially for complex patterns and large strings.
#[wasm_bindgen]
pub fn regex_find_all(text: &str, pattern: &str) -> Result<JsValue, JsValue> {
    // Compile the regular expression
    let regex = match Regex::new(pattern) {
        Ok(re) => re,
        Err(err) => return Err(JsValue::from_str(&format!("Invalid regex pattern: {}", err))),
    };
    
    // Find all matches
    let matches: Vec<_> = regex.find_iter(text).collect();
    
    // Create a result array
    let result = Array::new_with_length(matches.len() as u32);
    
    for (i, m) in matches.iter().enumerate() {
        // Create a match object
        let match_obj = Object::new();
        Reflect::set(&match_obj, &JsValue::from_str("index"), &JsValue::from_f64(m.start() as f64))?;
        Reflect::set(&match_obj, &JsValue::from_str("length"), &JsValue::from_f64(m.len() as f64))?;
        Reflect::set(&match_obj, &JsValue::from_str("text"), &JsValue::from_str(&text[m.start()..m.end()]))?;
        
        // Add the match object to the result array
        result.set(i as u32, match_obj.into());
    }
    
    Ok(result.into())
}

/// Replace all matches of a regular expression in a string
///
/// Takes a string, a regular expression pattern, and a replacement string, and returns the result.
/// This is much faster than using JavaScript, especially for complex patterns and large strings.
#[wasm_bindgen]
pub fn regex_replace_all(text: &str, pattern: &str, replacement: &str) -> Result<String, JsValue> {
    // Compile the regular expression
    let regex = match Regex::new(pattern) {
        Ok(re) => re,
        Err(err) => return Err(JsValue::from_str(&format!("Invalid regex pattern: {}", err))),
    };
    
    // Replace all matches
    Ok(regex.replace_all(text, replacement).to_string())
}

/// Split a string by a regular expression
///
/// Takes a string and a regular expression pattern, and returns an array of substrings.
/// This is much faster than using JavaScript, especially for complex patterns and large strings.
#[wasm_bindgen]
pub fn regex_split(text: &str, pattern: &str) -> Result<JsValue, JsValue> {
    // Compile the regular expression
    let regex = match Regex::new(pattern) {
        Ok(re) => re,
        Err(err) => return Err(JsValue::from_str(&format!("Invalid regex pattern: {}", err))),
    };
    
    // Split the string
    let parts: Vec<&str> = regex.split(text).collect();
    
    // Create a result array
    let result = Array::new_with_length(parts.len() as u32);
    
    for (i, part) in parts.iter().enumerate() {
        result.set(i as u32, JsValue::from_str(part));
    }
    
    Ok(result.into())
}

/// Extract capture groups from a regular expression match
///
/// Takes a string and a regular expression pattern with capture groups, and returns the captured groups.
/// This is much faster than using JavaScript, especially for complex patterns and large strings.
#[wasm_bindgen]
pub fn regex_capture_groups(text: &str, pattern: &str) -> Result<JsValue, JsValue> {
    // Compile the regular expression
    let regex = match Regex::new(pattern) {
        Ok(re) => re,
        Err(err) => return Err(JsValue::from_str(&format!("Invalid regex pattern: {}", err))),
    };
    
    // Find captures
    match regex.captures(text) {
        Some(caps) => {
            // Create a result array
            let result = Array::new_with_length(caps.len() as u32);
            
            for i in 0..caps.len() {
                match caps.get(i) {
                    Some(m) => {
                        // Create a capture object
                        let capture_obj = Object::new();
                        Reflect::set(&capture_obj, &JsValue::from_str("index"), &JsValue::from_f64(m.start() as f64))?;
                        Reflect::set(&capture_obj, &JsValue::from_str("length"), &JsValue::from_f64(m.len() as f64))?;
                        Reflect::set(&capture_obj, &JsValue::from_str("text"), &JsValue::from_str(&text[m.start()..m.end()]))?;
                        
                        // Add the capture object to the result array
                        result.set(i as u32, capture_obj.into());
                    },
                    None => {
                        result.set(i as u32, JsValue::null());
                    },
                }
            }
            
            Ok(result.into())
        },
        None => Ok(JsValue::null()),
    }
}

/// Extract named capture groups from a regular expression match
///
/// Takes a string and a regular expression pattern with named capture groups, and returns the captured groups.
/// This is much faster than using JavaScript, especially for complex patterns and large strings.
#[wasm_bindgen]
pub fn regex_named_capture_groups(text: &str, pattern: &str) -> Result<JsValue, JsValue> {
    // Compile the regular expression
    let regex = match Regex::new(pattern) {
        Ok(re) => re,
        Err(err) => return Err(JsValue::from_str(&format!("Invalid regex pattern: {}", err))),
    };
    
    // Find captures
    match regex.captures(text) {
        Some(caps) => {
            // Create a result object
            let result = Object::new();
            
            // Add the full match
            if let Some(m) = caps.get(0) {
                let match_obj = Object::new();
                Reflect::set(&match_obj, &JsValue::from_str("index"), &JsValue::from_f64(m.start() as f64))?;
                Reflect::set(&match_obj, &JsValue::from_str("length"), &JsValue::from_f64(m.len() as f64))?;
                Reflect::set(&match_obj, &JsValue::from_str("text"), &JsValue::from_str(&text[m.start()..m.end()]))?;
                
                Reflect::set(&result, &JsValue::from_str("match"), &match_obj)?;
            }
            
            // Add named captures
            let groups = Object::new();
            
            for name in regex.capture_names().flatten() {
                if let Some(m) = caps.name(name) {
                    let capture_obj = Object::new();
                    Reflect::set(&capture_obj, &JsValue::from_str("index"), &JsValue::from_f64(m.start() as f64))?;
                    Reflect::set(&capture_obj, &JsValue::from_str("length"), &JsValue::from_f64(m.len() as f64))?;
                    Reflect::set(&capture_obj, &JsValue::from_str("text"), &JsValue::from_str(&text[m.start()..m.end()]))?;
                    
                    Reflect::set(&groups, &JsValue::from_str(name), &capture_obj)?;
                }
            }
            
            Reflect::set(&result, &JsValue::from_str("groups"), &groups)?;
            
            Ok(result.into())
        },
        None => Ok(JsValue::null()),
    }
}

/// Validate if a string is a valid regular expression pattern
///
/// Takes a string and returns true if it is a valid regular expression pattern.
#[wasm_bindgen]
pub fn regex_validate_pattern(pattern: &str) -> bool {
    Regex::new(pattern).is_ok()
}

/// Escape a string for use in a regular expression
///
/// Takes a string and returns a string with all regular expression metacharacters escaped.
#[wasm_bindgen]
pub fn regex_escape(text: &str) -> String {
    regex::escape(text)
}

/// Check if a regular expression pattern is a valid regular expression
///
/// Takes a regular expression pattern and returns true if it is valid.
#[wasm_bindgen]
pub fn regex_is_valid(pattern: &str) -> bool {
    Regex::new(pattern).is_ok()
}

/// Get information about a regular expression pattern
///
/// Takes a regular expression pattern and returns information about it.
#[wasm_bindgen]
pub fn regex_get_info(pattern: &str) -> Result<JsValue, JsValue> {
    // Compile the regular expression
    let regex = match Regex::new(pattern) {
        Ok(re) => re,
        Err(err) => return Err(JsValue::from_str(&format!("Invalid regex pattern: {}", err))),
    };
    
    // Create a result object
    let result = Object::new();
    
    // Add capture names
    let capture_names = Array::new();
    for (i, name) in regex.capture_names().enumerate() {
        if let Some(name) = name {
            let capture_obj = Object::new();
            Reflect::set(&capture_obj, &JsValue::from_str("index"), &JsValue::from_f64(i as f64))?;
            Reflect::set(&capture_obj, &JsValue::from_str("name"), &JsValue::from_str(name))?;
            
            capture_names.set(capture_names.length(), capture_obj.into());
        }
    }
    
    Reflect::set(&result, &JsValue::from_str("captureNames"), &capture_names)?;
    Reflect::set(&result, &JsValue::from_str("captureCount"), &JsValue::from_f64(regex.captures_len() as f64))?;
    
    Ok(result.into())
}
