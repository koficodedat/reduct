use wasm_bindgen::prelude::*;
use js_sys::{Array, Function};

// Helper function to log errors
fn log_error(msg: &str) {
    #[cfg(feature = "console_error_panic_hook")]
    web_sys::console::error_1(&JsValue::from_str(msg));
}

/// Map operation for arrays
///
/// Takes an array and a mapping function, applies the function to each element,
/// and returns a new array with the results.
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

/// Filter operation for arrays
///
/// Takes an array and a filter function, applies the function to each element,
/// and returns a new array with only the elements for which the function returns true.
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

/// Reduce operation for arrays
///
/// Takes an array, a reduce function, and an initial value, applies the function
/// to each element, and returns the final accumulated value.
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

/// Sort operation for arrays
///
/// Takes an array and an optional compare function, sorts the array,
/// and returns a new sorted array.
#[wasm_bindgen]
pub fn vector_sort(input: &JsValue, compare_fn: &Function) -> Result<JsValue, JsValue> {
    // Get the input array
    let input_array = Array::from(input);

    // Create a copy of the input array
    let result_array = Array::new();
    for i in 0..input_array.length() {
        result_array.push(&input_array.get(i));
    }

    // Sort the array using JavaScript's sort method
    // We need to use the JavaScript API directly since js_sys::Array::sort doesn't take a comparator
    let this = JsValue::from(&result_array);
    let _ = js_sys::Reflect::set(
        &this,
        &JsValue::from_str("sort"),
        &compare_fn
    );
    let _ = js_sys::Function::from(js_sys::Reflect::get(
        &this,
        &JsValue::from_str("sort")
    ).unwrap()).call0(&this);

    Ok(result_array.into())
}

/// Map-filter operation for arrays (optimized chain)
///
/// Takes an array, a mapping function, and a filter function, applies the mapping
/// function to each element, then filters the results, and returns a new array.
#[wasm_bindgen]
pub fn vector_map_filter(
    input: &JsValue,
    map_fn: &Function,
    filter_fn: &Function
) -> Result<JsValue, JsValue> {
    // Get the input array
    let input_array = Array::from(input);
    let length = input_array.length() as usize;

    // Create a new array for the results
    let result_array = Array::new();

    // Apply the mapping function to each element, then filter
    for i in 0..length {
        let value = input_array.get(i as u32);
        let index = JsValue::from_f64(i as f64);

        // Call the mapping function
        let mapped = map_fn.call2(&JsValue::NULL, &value, &index)?;

        // Call the filter function on the mapped value
        let include = filter_fn.call2(&JsValue::NULL, &mapped, &index)?;

        // If the filter function returns true, include the element
        if include.as_bool().unwrap_or(false) {
            result_array.push(&mapped);
        }
    }

    Ok(result_array.into())
}

/// Map-reduce operation for arrays (optimized chain)
///
/// Takes an array, a mapping function, a reduce function, and an initial value,
/// applies the mapping function to each element, then reduces the results.
#[wasm_bindgen]
pub fn vector_map_reduce(
    input: &JsValue,
    map_fn: &Function,
    reduce_fn: &Function,
    initial: &JsValue
) -> Result<JsValue, JsValue> {
    // Get the input array
    let input_array = Array::from(input);
    let length = input_array.length() as usize;

    // Start with the initial value
    let mut accumulator = initial.clone();

    // Apply the mapping function to each element, then reduce
    for i in 0..length {
        let value = input_array.get(i as u32);
        let index = JsValue::from_f64(i as f64);

        // Call the mapping function
        let mapped = map_fn.call2(&JsValue::NULL, &value, &index)?;

        // Call the reduce function on the mapped value
        accumulator = reduce_fn.call3(&JsValue::NULL, &accumulator, &mapped, &index)?;
    }

    Ok(accumulator)
}

/// Filter-reduce operation for arrays (optimized chain)
///
/// Takes an array, a filter function, a reduce function, and an initial value,
/// filters the array, then reduces the results.
#[wasm_bindgen]
pub fn vector_filter_reduce(
    input: &JsValue,
    filter_fn: &Function,
    reduce_fn: &Function,
    initial: &JsValue
) -> Result<JsValue, JsValue> {
    // Get the input array
    let input_array = Array::from(input);
    let length = input_array.length() as usize;

    // Start with the initial value
    let mut accumulator = initial.clone();

    // Apply the filter function to each element, then reduce
    for i in 0..length {
        let value = input_array.get(i as u32);
        let index = JsValue::from_f64(i as f64);

        // Call the filter function
        let include = filter_fn.call2(&JsValue::NULL, &value, &index)?;

        // If the filter function returns true, reduce the element
        if include.as_bool().unwrap_or(false) {
            accumulator = reduce_fn.call3(&JsValue::NULL, &accumulator, &value, &index)?;
        }
    }

    Ok(accumulator)
}

/// Map-filter-reduce operation for arrays (optimized chain)
///
/// Takes an array, a mapping function, a filter function, a reduce function, and an initial value,
/// applies the mapping function to each element, filters the results, then reduces them.
#[wasm_bindgen]
pub fn vector_map_filter_reduce(
    input: &JsValue,
    map_fn: &Function,
    filter_fn: &Function,
    reduce_fn: &Function,
    initial: &JsValue
) -> Result<JsValue, JsValue> {
    // Get the input array
    let input_array = Array::from(input);
    let length = input_array.length() as usize;

    // Start with the initial value
    let mut accumulator = initial.clone();

    // Apply the mapping function to each element, filter, then reduce
    for i in 0..length {
        let value = input_array.get(i as u32);
        let index = JsValue::from_f64(i as f64);

        // Call the mapping function
        let mapped = map_fn.call2(&JsValue::NULL, &value, &index)?;

        // Call the filter function on the mapped value
        let include = filter_fn.call2(&JsValue::NULL, &mapped, &index)?;

        // If the filter function returns true, reduce the element
        if include.as_bool().unwrap_or(false) {
            accumulator = reduce_fn.call3(&JsValue::NULL, &accumulator, &mapped, &index)?;
        }
    }

    Ok(accumulator)
}
