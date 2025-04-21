use wasm_bindgen::prelude::*;
use js_sys::{Float64Array, Int32Array};
use bumpalo::Bump;

// Constants
const BITS_PER_LEVEL: usize = 5;
const BRANCH_SIZE: usize = 1 << BITS_PER_LEVEL; // 32
const MASK: usize = BRANCH_SIZE - 1; // 0x1F

/// Find the path to a node at the specified index
///
/// Returns an array of positions, one for each level of the trie.
#[wasm_bindgen]
pub fn hamt_find_path(index: usize, height: usize, _size: usize) -> Result<JsValue, JsValue> {
    // Allocate memory for the path
    let bump = Bump::new();
    let mut path = bump.alloc_slice_fill_copy(height as usize + 1, 0);
    
    // Calculate the positions at each level
    for level in (0..=height).rev() {
        let shift = level * BITS_PER_LEVEL;
        let position = (index >> shift) & MASK;
        path[height as usize - level] = position as i32;
    }
    
    // Create a typed array for the result
    let result = Int32Array::new_with_length((height + 1) as u32);
    for i in 0..=height {
        result.set_index(i as u32, path[i] as i32);
    }
    
    Ok(result.into())
}

/// Get the index in the sparse array for a given position
///
/// Counts the number of bits set in the bitmap before the position.
#[wasm_bindgen]
pub fn hamt_get_index(bitmap: u32, position: usize) -> Result<usize, JsValue> {
    // Count the number of bits set in the bitmap before the position
    let mask = (1 << position) - 1;
    let count = (bitmap & mask).count_ones() as usize;
    
    Ok(count)
}

/// Set a bit in the bitmap
#[wasm_bindgen]
pub fn hamt_set_bit(bitmap: u32, position: usize) -> Result<u32, JsValue> {
    Ok(bitmap | (1 << position))
}

/// Clear a bit in the bitmap
#[wasm_bindgen]
pub fn hamt_clear_bit(bitmap: u32, position: usize) -> Result<u32, JsValue> {
    Ok(bitmap & !(1 << position))
}

/// Append a value to an array
#[wasm_bindgen]
pub fn hamt_append(data: &JsValue, value: f64) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let data_array = Float64Array::new(data);
    let n = data_array.length() as usize;
    
    // Create a new array with the value appended
    let result_array = Float64Array::new_with_length((n + 1) as u32);
    
    // Copy the original data
    for i in 0..n {
        result_array.set_index(i as u32, data_array.get_index(i as u32));
    }
    
    // Append the new value
    result_array.set_index(n as u32, value);
    
    Ok(result_array.into())
}

/// Prepend a value to an array
#[wasm_bindgen]
pub fn hamt_prepend(data: &JsValue, value: f64) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let data_array = Float64Array::new(data);
    let n = data_array.length() as usize;
    
    // Create a new array with the value prepended
    let result_array = Float64Array::new_with_length((n + 1) as u32);
    
    // Set the new value
    result_array.set_index(0, value);
    
    // Copy the original data
    for i in 0..n {
        result_array.set_index((i + 1) as u32, data_array.get_index(i as u32));
    }
    
    Ok(result_array.into())
}

/// Insert a value into an array at the specified index
#[wasm_bindgen]
pub fn hamt_insert(data: &JsValue, index: usize, value: f64) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let data_array = Float64Array::new(data);
    let n = data_array.length() as usize;
    
    // Check if the index is valid
    if index > n {
        return Err(JsValue::from_str(&format!("Index {} out of bounds for insertion", index)));
    }
    
    // Create a new array with the value inserted
    let result_array = Float64Array::new_with_length((n + 1) as u32);
    
    // Copy the data before the insertion point
    for i in 0..index {
        result_array.set_index(i as u32, data_array.get_index(i as u32));
    }
    
    // Insert the new value
    result_array.set_index(index as u32, value);
    
    // Copy the data after the insertion point
    for i in index..n {
        result_array.set_index((i + 1) as u32, data_array.get_index(i as u32));
    }
    
    Ok(result_array.into())
}

/// Remove a value from an array at the specified index
#[wasm_bindgen]
pub fn hamt_remove(data: &JsValue, index: usize) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let data_array = Float64Array::new(data);
    let n = data_array.length() as usize;
    
    // Check if the index is valid
    if index >= n {
        return Err(JsValue::from_str(&format!("Index {} out of bounds", index)));
    }
    
    // Create a new array with the value removed
    let result_array = Float64Array::new_with_length((n - 1) as u32);
    
    // Copy the data before the removal point
    for i in 0..index {
        result_array.set_index(i as u32, data_array.get_index(i as u32));
    }
    
    // Copy the data after the removal point
    for i in (index + 1)..n {
        result_array.set_index((i - 1) as u32, data_array.get_index(i as u32));
    }
    
    Ok(result_array.into())
}

/// Optimized bulk operations for HAMTPersistentVector
///
/// This module provides SIMD-optimized implementations of common operations
/// for HAMTPersistentVector when available.
#[cfg(feature = "simd")]
mod simd {
    use super::*;
    use wide::{f64x4};
    
    /// Append multiple values to an array
    #[wasm_bindgen]
    pub fn hamt_append_multiple(data: &JsValue, values: &JsValue) -> Result<JsValue, JsValue> {
        // Convert inputs to typed arrays for better performance
        let data_array = Float64Array::new(data);
        let values_array = Float64Array::new(values);
        let n = data_array.length() as usize;
        let m = values_array.length() as usize;
        
        // Create a new array with the values appended
        let result_array = Float64Array::new_with_length((n + m) as u32);
        
        // Copy the original data
        for i in 0..n {
            result_array.set_index(i as u32, data_array.get_index(i as u32));
        }
        
        // Append the new values
        for i in 0..m {
            result_array.set_index((n + i) as u32, values_array.get_index(i as u32));
        }
        
        Ok(result_array.into())
    }
    
    /// Prepend multiple values to an array
    #[wasm_bindgen]
    pub fn hamt_prepend_multiple(data: &JsValue, values: &JsValue) -> Result<JsValue, JsValue> {
        // Convert inputs to typed arrays for better performance
        let data_array = Float64Array::new(data);
        let values_array = Float64Array::new(values);
        let n = data_array.length() as usize;
        let m = values_array.length() as usize;
        
        // Create a new array with the values prepended
        let result_array = Float64Array::new_with_length((n + m) as u32);
        
        // Prepend the new values
        for i in 0..m {
            result_array.set_index(i as u32, values_array.get_index(i as u32));
        }
        
        // Copy the original data
        for i in 0..n {
            result_array.set_index((m + i) as u32, data_array.get_index(i as u32));
        }
        
        Ok(result_array.into())
    }
    
    /// Concatenate two arrays
    #[wasm_bindgen]
    pub fn hamt_concat(data1: &JsValue, data2: &JsValue) -> Result<JsValue, JsValue> {
        // Convert inputs to typed arrays for better performance
        let data1_array = Float64Array::new(data1);
        let data2_array = Float64Array::new(data2);
        let n1 = data1_array.length() as usize;
        let n2 = data2_array.length() as usize;
        
        // Create a new array for the concatenated result
        let result_array = Float64Array::new_with_length((n1 + n2) as u32);
        
        // Process the first array in chunks of 4 elements
        const CHUNK_SIZE: usize = 4;
        let simd_length1 = (n1 / CHUNK_SIZE) * CHUNK_SIZE;
        
        for i in (0..simd_length1).step_by(CHUNK_SIZE) {
            let chunk = f64x4::from([
                data1_array.get_index(i as u32),
                data1_array.get_index((i + 1) as u32),
                data1_array.get_index((i + 2) as u32),
                data1_array.get_index((i + 3) as u32),
            ]);
            
            result_array.set_index(i as u32, chunk.extract(0));
            result_array.set_index((i + 1) as u32, chunk.extract(1));
            result_array.set_index((i + 2) as u32, chunk.extract(2));
            result_array.set_index((i + 3) as u32, chunk.extract(3));
        }
        
        // Process remaining elements of the first array
        for i in simd_length1..n1 {
            result_array.set_index(i as u32, data1_array.get_index(i as u32));
        }
        
        // Process the second array in chunks of 4 elements
        let simd_length2 = (n2 / CHUNK_SIZE) * CHUNK_SIZE;
        
        for i in (0..simd_length2).step_by(CHUNK_SIZE) {
            let chunk = f64x4::from([
                data2_array.get_index(i as u32),
                data2_array.get_index((i + 1) as u32),
                data2_array.get_index((i + 2) as u32),
                data2_array.get_index((i + 3) as u32),
            ]);
            
            result_array.set_index((n1 + i) as u32, chunk.extract(0));
            result_array.set_index((n1 + i + 1) as u32, chunk.extract(1));
            result_array.set_index((n1 + i + 2) as u32, chunk.extract(2));
            result_array.set_index((n1 + i + 3) as u32, chunk.extract(3));
        }
        
        // Process remaining elements of the second array
        for i in simd_length2..n2 {
            result_array.set_index((n1 + i) as u32, data2_array.get_index(i as u32));
        }
        
        Ok(result_array.into())
    }
}
