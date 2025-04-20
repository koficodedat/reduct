use wasm_bindgen::prelude::*;
use js_sys::{Array, Float64Array, Function};
use bumpalo::Bump;

#[cfg(feature = "simd")]
use wide::{f64x4, CmpLt};

/// Specialized sorting algorithm for numeric arrays
/// 
/// This implementation uses a hybrid approach:
/// - For small arrays (< 20 elements): Insertion sort
/// - For medium arrays (< 1000 elements): Quick sort
/// - For large arrays (>= 1000 elements): Merge sort
/// 
/// This approach provides good performance across different array sizes.
#[wasm_bindgen]
pub fn specialized_sort_f64(input: &JsValue) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;
    
    // Early return for small arrays
    if length <= 1 {
        return Ok(input_array.into());
    }
    
    // Copy data to a vector for sorting
    let mut values = Vec::with_capacity(length);
    for i in 0..length {
        values.push(input_array.get_index(i as u32));
    }
    
    // Choose sorting algorithm based on array size
    if length < 20 {
        // Insertion sort for very small arrays
        insertion_sort(&mut values);
    } else if length < 1000 {
        // Quick sort for medium-sized arrays
        values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    } else {
        // Merge sort for large arrays
        merge_sort(&mut values);
    }
    
    // Create a new typed array for the results
    let result_array = Float64Array::new_with_length(length as u32);
    
    // Copy results back
    for i in 0..length {
        result_array.set_index(i as u32, values[i]);
    }
    
    Ok(result_array.into())
}

/// Insertion sort implementation
/// 
/// Efficient for small arrays (< 20 elements)
fn insertion_sort(arr: &mut [f64]) {
    for i in 1..arr.len() {
        let mut j = i;
        while j > 0 && arr[j-1] > arr[j] {
            arr.swap(j, j-1);
            j -= 1;
        }
    }
}

/// Merge sort implementation
/// 
/// Efficient for large arrays and stable
fn merge_sort(arr: &mut [f64]) {
    let len = arr.len();
    if len <= 1 {
        return;
    }
    
    let mid = len / 2;
    let mut left = Vec::with_capacity(mid);
    let mut right = Vec::with_capacity(len - mid);
    
    // Split the array
    for i in 0..mid {
        left.push(arr[i]);
    }
    for i in mid..len {
        right.push(arr[i]);
    }
    
    // Recursively sort both halves
    merge_sort(&mut left);
    merge_sort(&mut right);
    
    // Merge the sorted halves
    let mut i = 0; // Index for left array
    let mut j = 0; // Index for right array
    let mut k = 0; // Index for merged array
    
    while i < left.len() && j < right.len() {
        if left[i] <= right[j] {
            arr[k] = left[i];
            i += 1;
        } else {
            arr[k] = right[j];
            j += 1;
        }
        k += 1;
    }
    
    // Copy remaining elements
    while i < left.len() {
        arr[k] = left[i];
        i += 1;
        k += 1;
    }
    
    while j < right.len() {
        arr[k] = right[j];
        j += 1;
        k += 1;
    }
}

/// Radix sort for integers (specialized for positive integers)
/// 
/// This is much faster than comparison-based sorts for integer data
#[wasm_bindgen]
pub fn radix_sort_u32(input: &JsValue) -> Result<JsValue, JsValue> {
    // Convert input to typed array
    let input_array = js_sys::Uint32Array::new(input);
    let length = input_array.length() as usize;
    
    // Early return for small arrays
    if length <= 1 {
        return Ok(input_array.into());
    }
    
    // Copy data to a vector for sorting
    let mut values = Vec::with_capacity(length);
    for i in 0..length {
        values.push(input_array.get_index(i as u32));
    }
    
    // Perform radix sort
    let mut temp = vec![0; length];
    let mut count = vec![0; 256];
    
    // Sort by each byte (4 bytes for u32)
    for shift in (0..32).step_by(8) {
        // Count occurrences of each byte
        count.fill(0);
        for &val in &values {
            let byte = ((val >> shift) & 0xFF) as usize;
            count[byte] += 1;
        }
        
        // Calculate cumulative count
        let mut total = 0;
        for i in 0..256 {
            let c = count[i];
            count[i] = total;
            total += c;
        }
        
        // Build output array
        for &val in &values {
            let byte = ((val >> shift) & 0xFF) as usize;
            let pos = count[byte];
            temp[pos] = val;
            count[byte] += 1;
        }
        
        // Swap arrays
        std::mem::swap(&mut values, &mut temp);
    }
    
    // Create a new typed array for the results
    let result_array = js_sys::Uint32Array::new_with_length(length as u32);
    
    // Copy results back
    for i in 0..length {
        result_array.set_index(i as u32, values[i]);
    }
    
    Ok(result_array.into())
}

/// Counting sort for small integers (specialized for values in a small range)
/// 
/// This is much faster than comparison-based sorts for small integer ranges
#[wasm_bindgen]
pub fn counting_sort_u8(input: &JsValue) -> Result<JsValue, JsValue> {
    // Convert input to typed array
    let input_array = js_sys::Uint8Array::new(input);
    let length = input_array.length() as usize;
    
    // Early return for small arrays
    if length <= 1 {
        return Ok(input_array.into());
    }
    
    // Count occurrences of each value (0-255)
    let mut count = [0; 256];
    for i in 0..length {
        let val = input_array.get_index(i as u32) as usize;
        count[val] += 1;
    }
    
    // Create a new typed array for the results
    let result_array = js_sys::Uint8Array::new_with_length(length as u32);
    
    // Fill the result array
    let mut index = 0;
    for (val, &cnt) in count.iter().enumerate() {
        for _ in 0..cnt {
            result_array.set_index(index, val as u8);
            index += 1;
        }
    }
    
    Ok(result_array.into())
}
