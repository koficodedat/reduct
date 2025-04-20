// WebAssembly implementation of list operations

use wasm_bindgen::prelude::*;
use js_sys::{Array, Function, Reflect};
use web_sys::console;

// Map operation
#[wasm_bindgen]
pub fn vector_map(input: &JsValue, map_fn: &Function) -> Result<JsValue, JsValue> {
    // Get the input array
    let input_array = Array::from(input);
    let length = input_array.length() as usize;
    
    // Create a new array for the results
    let result_array = Array::new_with_length(length as u32);
    
    // Apply the mapping function to each element
    for i in 0..length {
        let value = input_array.get(i as u32);
        let index = JsValue::from_f64(i as f64);
        
        // Call the mapping function
        let result = map_fn.call2(&JsValue::NULL, &value, &index)?;
        
        // Store the result
        result_array.set(i as u32, result);
    }
    
    Ok(result_array.into())
}

// Filter operation
#[wasm_bindgen]
pub fn vector_filter(input: &JsValue, filter_fn: &Function) -> Result<JsValue, JsValue> {
    // Get the input array
    let input_array = Array::from(input);
    let length = input_array.length() as usize;
    
    // Create a new array for the results
    let result_array = Array::new();
    
    // Apply the filter function to each element
    for i in 0..length {
        let value = input_array.get(i as u32);
        let index = JsValue::from_f64(i as f64);
        
        // Call the filter function
        let include = filter_fn.call2(&JsValue::NULL, &value, &index)?;
        
        // If the filter function returns true, include the element
        if include.as_bool().unwrap_or(false) {
            result_array.push(&value);
        }
    }
    
    Ok(result_array.into())
}

// Reduce operation
#[wasm_bindgen]
pub fn vector_reduce(input: &JsValue, reduce_fn: &Function, initial: &JsValue) -> Result<JsValue, JsValue> {
    // Get the input array
    let input_array = Array::from(input);
    let length = input_array.length() as usize;
    
    // Start with the initial value
    let mut accumulator = initial.clone();
    
    // Apply the reduce function to each element
    for i in 0..length {
        let value = input_array.get(i as u32);
        let index = JsValue::from_f64(i as f64);
        
        // Call the reduce function
        accumulator = reduce_fn.call3(&JsValue::NULL, &accumulator, &value, &index)?;
    }
    
    Ok(accumulator)
}

// Sort operation
#[wasm_bindgen]
pub fn vector_sort(input: &JsValue, compare_fn: &Function) -> Result<JsValue, JsValue> {
    // Get the input array
    let input_array = Array::from(input);
    let length = input_array.length() as usize;
    
    // Create a copy of the input array
    let result_array = Array::new();
    for i in 0..length {
        result_array.push(&input_array.get(i as u32));
    }
    
    // Sort the array
    result_array.sort(&compare_fn);
    
    Ok(result_array.into())
}
