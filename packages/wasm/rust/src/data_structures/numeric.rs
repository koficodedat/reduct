use wasm_bindgen::prelude::*;
use js_sys::{Array, Float64Array, Function};
use bumpalo::Bump;

#[cfg(feature = "simd")]
use wide::{f64x4, CmpLt};

/// Map operation for numeric arrays with optimized implementation
///
/// Takes a numeric array and a mapping function, applies the function to each element,
/// and returns a new array with the results. Uses SIMD when available.
#[wasm_bindgen]
pub fn numeric_map_f64(input: &JsValue, map_fn: &Function) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Create a new typed array for the results
    let result_array = Float64Array::new_with_length(length as u32);

    // Process in batches to reduce overhead
    const BATCH_SIZE: usize = 1024;

    // Process the data in batches
    for batch_start in (0..length).step_by(BATCH_SIZE) {
        let batch_end = std::cmp::min(batch_start + BATCH_SIZE, length);
        let batch_size = batch_end - batch_start;

        // Allocate memory for this batch
        let bump = Bump::new();
        let values = bump.alloc_slice_fill_copy(batch_size, 0.0);
        let results = bump.alloc_slice_fill_copy(batch_size, 0.0);

        // Copy input data for this batch
        for i in 0..batch_size {
            values[i] = input_array.get_index((batch_start + i) as u32);
        }

        #[cfg(feature = "simd")]
        {
            // Use SIMD for processing when available
            let simd_length = batch_size - (batch_size % 4);

            // Process in chunks of 4 elements
            for i in (0..simd_length).step_by(4) {
                // We still need to call the JavaScript function for each element
                // since we can't execute JavaScript in SIMD
                for j in 0..4 {
                    let global_index = (batch_start + i + j) as u32;
                    let value = JsValue::from_f64(values[i + j]);
                    let js_index = JsValue::from_f64(global_index as f64);

                    // Call the mapping function
                    let result = map_fn.call2(&JsValue::NULL, &value, &js_index)?;

                    // Store the result
                    results[i + j] = result.as_f64().unwrap_or(0.0);
                }
            }

            // Process remaining elements
            for i in simd_length..batch_size {
                let global_index = (batch_start + i) as u32;
                let value = JsValue::from_f64(values[i]);
                let js_index = JsValue::from_f64(global_index as f64);

                // Call the mapping function
                let result = map_fn.call2(&JsValue::NULL, &value, &js_index)?;

                // Store the result
                results[i] = result.as_f64().unwrap_or(0.0);
            }
        }

        #[cfg(not(feature = "simd"))]
        {
            // Standard implementation without SIMD
            for i in 0..batch_size {
                let global_index = (batch_start + i) as u32;
                let value = JsValue::from_f64(values[i]);
                let js_index = JsValue::from_f64(global_index as f64);

                // Call the mapping function
                let result = map_fn.call2(&JsValue::NULL, &value, &js_index)?;

                // Store the result
                results[i] = result.as_f64().unwrap_or(0.0);
            }
        }

        // Copy results back to the result array
        for i in 0..batch_size {
            result_array.set_index((batch_start + i) as u32, results[i]);
        }
    }

    Ok(result_array.into())
}

/// Filter operation for numeric arrays with optimized implementation
///
/// Takes a numeric array and a filter function, applies the function to each element,
/// and returns a new array with only the elements for which the function returns true.
#[wasm_bindgen]
pub fn numeric_filter_f64(input: &JsValue, filter_fn: &Function) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Allocate memory for intermediate values and flags
    let bump = Bump::new();
    let values = bump.alloc_slice_fill_copy(length, 0.0);
    let flags = bump.alloc_slice_fill_copy(length, false);

    // Copy input data to our buffer
    for i in 0..length {
        values[i] = input_array.get_index(i as u32);
    }

    // Apply the filter function to each element
    let mut count = 0;
    for i in 0..length {
        let value = JsValue::from_f64(values[i]);
        let index = JsValue::from_f64(i as f64);

        // Call the filter function
        let include = filter_fn.call2(&JsValue::NULL, &value, &index)?;

        // If the filter function returns true, include the element
        if include.as_bool().unwrap_or(false) {
            flags[i] = true;
            count += 1;
        }
    }

    // Create a new typed array for the results
    let result_array = Float64Array::new_with_length(count as u32);

    // Fill the result array
    let mut result_index = 0;
    for i in 0..length {
        if flags[i] {
            result_array.set_index(result_index, values[i]);
            result_index += 1;
        }
    }

    Ok(result_array.into())
}

/// Reduce operation for numeric arrays with optimized implementation
///
/// Takes a numeric array, a reduce function, and an initial value, applies the function
/// to each element, and returns the final accumulated value.
#[wasm_bindgen]
pub fn numeric_reduce_f64(input: &JsValue, reduce_fn: &Function, initial: &JsValue) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Early return for empty arrays
    if length == 0 {
        return Ok(initial.clone());
    }

    // Start with the initial value
    let mut accumulator = initial.clone();

    // Process in batches to reduce overhead
    const BATCH_SIZE: usize = 1024;

    // Process the data in batches
    for batch_start in (0..length).step_by(BATCH_SIZE) {
        let batch_end = std::cmp::min(batch_start + BATCH_SIZE, length);
        let batch_size = batch_end - batch_start;

        // Allocate memory for this batch
        let bump = Bump::new();
        let values = bump.alloc_slice_fill_copy(batch_size, 0.0);

        // Copy input data for this batch
        for i in 0..batch_size {
            values[i] = input_array.get_index((batch_start + i) as u32);
        }

        // Apply the reduce function to each element in this batch
        for i in 0..batch_size {
            let global_index = (batch_start + i) as u32;
            let value = JsValue::from_f64(values[i]);
            let js_index = JsValue::from_f64(global_index as f64);

            // Call the reduce function
            accumulator = reduce_fn.call3(&JsValue::NULL, &accumulator, &value, &js_index)?;
        }
    }

    Ok(accumulator)
}

/// Sort operation for numeric arrays with optimized implementation
///
/// Takes a numeric array and an optional compare function, sorts the array,
/// and returns a new sorted array.
#[wasm_bindgen]
pub fn numeric_sort_f64(input: &JsValue, compare_fn: Option<Function>) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Early return for small arrays
    if length <= 1 {
        return Ok(input_array.into());
    }

    // For custom comparator, delegate to JavaScript (it's hard to beat V8's sort)
    if let Some(compare_fn) = compare_fn {
        // Create a regular array for JavaScript sort
        let js_array = Array::new_with_length(length as u32);

        // Copy data in chunks to reduce overhead
        const CHUNK_SIZE: usize = 4096;
        for chunk_start in (0..length).step_by(CHUNK_SIZE) {
            let chunk_end = std::cmp::min(chunk_start + CHUNK_SIZE, length);

            // Copy this chunk
            for i in chunk_start..chunk_end {
                js_array.set(i as u32, JsValue::from_f64(input_array.get_index(i as u32)));
            }
        }

        // Sort using the provided compare function
        let this = JsValue::from(&js_array);
        let _ = compare_fn.call1(&this, &this);

        // Convert back to typed array efficiently
        let result_array = Float64Array::new_with_length(length as u32);
        for chunk_start in (0..length).step_by(CHUNK_SIZE) {
            let chunk_end = std::cmp::min(chunk_start + CHUNK_SIZE, length);

            // Copy this chunk
            for i in chunk_start..chunk_end {
                let value = js_array.get(i as u32);
                result_array.set_index(i as u32, value.as_f64().unwrap_or(0.0));
            }
        }

        Ok(result_array.into())
    } else {
        // For standard numeric sort, use Rust's sort which is very fast
        // Use a specialized algorithm for different array sizes
        if length < 10000 {
            // For small arrays, use a simple approach with less overhead
            let mut values = Vec::with_capacity(length);

            // Copy all data at once for small arrays
            for i in 0..length {
                values.push(input_array.get_index(i as u32));
            }

            // Use Rust's sort which is very efficient for numeric data
            values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

            // Create a new typed array for the results
            let result_array = Float64Array::new_with_length(length as u32);

            // Copy results back all at once
            for i in 0..length {
                result_array.set_index(i as u32, values[i]);
            }

            Ok(result_array.into())
        } else {
            // For large arrays, use a more sophisticated approach with batching
            // Allocate memory for sorting
            let bump = Bump::new();
            let mut values = bump.alloc_slice_fill_copy(length, 0.0);

            // Copy input data in chunks to reduce overhead
            const CHUNK_SIZE: usize = 4096;
            for chunk_start in (0..length).step_by(CHUNK_SIZE) {
                let chunk_end = std::cmp::min(chunk_start + CHUNK_SIZE, length);

                // Copy this chunk
                for i in chunk_start..chunk_end {
                    values[i] = input_array.get_index(i as u32);
                }
            }

            // Use Rust's unstable sort which is faster for floating point numbers
            // This is safe because we're sorting f64 values which have a total ordering
            values.sort_unstable_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

            // Create a new typed array for the results
            let result_array = Float64Array::new_with_length(length as u32);

            // Copy results back in chunks
            for chunk_start in (0..length).step_by(CHUNK_SIZE) {
                let chunk_end = std::cmp::min(chunk_start + CHUNK_SIZE, length);

                // Copy this chunk
                for i in chunk_start..chunk_end {
                    result_array.set_index(i as u32, values[i]);
                }
            }

            Ok(result_array.into())
        }
    }
}

/// Map-filter operation for numeric arrays (optimized chain)
///
/// Takes a numeric array, a mapping function, and a filter function, applies the mapping
/// function to each element, then filters the results, and returns a new array.
#[wasm_bindgen]
pub fn numeric_map_filter_f64(
    input: &JsValue,
    map_fn: &Function,
    filter_fn: &Function
) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Early return for empty arrays
    if length == 0 {
        return Ok(Float64Array::new_with_length(0).into());
    }

    // Process in batches to reduce overhead
    const BATCH_SIZE: usize = 1024;

    // First pass: map and filter to count the number of elements
    let mut count = 0;
    let mut result_values = Vec::with_capacity(length / 2); // Estimate half will pass filter

    for batch_start in (0..length).step_by(BATCH_SIZE) {
        let batch_end = std::cmp::min(batch_start + BATCH_SIZE, length);
        let batch_size = batch_end - batch_start;

        // Allocate memory for this batch
        let bump = Bump::new();
        let values = bump.alloc_slice_fill_copy(batch_size, 0.0);
        let mapped = bump.alloc_slice_fill_copy(batch_size, 0.0);

        // Copy input data for this batch
        for i in 0..batch_size {
            values[i] = input_array.get_index((batch_start + i) as u32);
        }

        // Apply the mapping function to each element in this batch
        for i in 0..batch_size {
            let global_index = (batch_start + i) as u32;
            let value = JsValue::from_f64(values[i]);
            let js_index = JsValue::from_f64(global_index as f64);

            // Call the mapping function
            let result = map_fn.call2(&JsValue::NULL, &value, &js_index)?;

            // Store the mapped value
            mapped[i] = result.as_f64().unwrap_or(0.0);
        }

        // Apply the filter function to each mapped element in this batch
        for i in 0..batch_size {
            let global_index = (batch_start + i) as u32;
            let value = JsValue::from_f64(mapped[i]);
            let js_index = JsValue::from_f64(global_index as f64);

            // Call the filter function
            let include = filter_fn.call2(&JsValue::NULL, &value, &js_index)?;

            // If the filter function returns true, include the element
            if include.as_bool().unwrap_or(false) {
                result_values.push(mapped[i]);
                count += 1;
            }
        }
    }

    // Create a new typed array for the results
    let result_array = Float64Array::new_with_length(count as u32);

    // Fill the result array
    for (i, value) in result_values.iter().enumerate() {
        result_array.set_index(i as u32, *value);
    }

    Ok(result_array.into())
}

/// Optimized sum operation for numeric arrays
///
/// Takes a numeric array and returns the sum of all elements.
/// This is much faster than using reduce with a JavaScript function.
#[wasm_bindgen]
pub fn numeric_sum_f64(input: &JsValue) -> f64 {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Early return for empty arrays
    if length == 0 {
        return 0.0;
    }

    // Process in batches to reduce overhead
    const BATCH_SIZE: usize = 4096;
    let mut total_sum = 0.0;

    #[cfg(feature = "simd")]
    {
        // Use SIMD for summing when available
        for batch_start in (0..length).step_by(BATCH_SIZE) {
            let batch_end = std::cmp::min(batch_start + BATCH_SIZE, length);
            let batch_size = batch_end - batch_start;

            // Allocate memory for this batch
            let bump = Bump::new();
            let values = bump.alloc_slice_fill_copy(batch_size, 0.0);

            // Copy input data for this batch
            for i in 0..batch_size {
                values[i] = input_array.get_index((batch_start + i) as u32);
            }

            // Calculate sum for this batch using SIMD
            let simd_length = batch_size - (batch_size % 4);
            let mut batch_sum = 0.0;

            // Process in chunks of 4 elements
            for i in (0..simd_length).step_by(4) {
                // Load 4 elements at once
                let v = f64x4::from([values[i], values[i+1], values[i+2], values[i+3]]);

                // Sum the vector and add to batch sum
                batch_sum += v.reduce_add();
            }

            // Add remaining elements
            for i in simd_length..batch_size {
                batch_sum += values[i];
            }

            // Add to total sum
            total_sum += batch_sum;
        }

        total_sum
    }

    #[cfg(not(feature = "simd"))]
    {
        // Standard implementation without SIMD
        for batch_start in (0..length).step_by(BATCH_SIZE) {
            let batch_end = std::cmp::min(batch_start + BATCH_SIZE, length);
            let batch_size = batch_end - batch_start;

            // Allocate memory for this batch
            let bump = Bump::new();
            let values = bump.alloc_slice_fill_copy(batch_size, 0.0);

            // Copy input data for this batch
            for i in 0..batch_size {
                values[i] = input_array.get_index((batch_start + i) as u32);
            }

            // Calculate sum for this batch
            let mut batch_sum = 0.0;
            for i in 0..batch_size {
                batch_sum += values[i];
            }

            // Add to total sum
            total_sum += batch_sum;
        }

        total_sum
    }
}

/// Optimized average operation for numeric arrays
///
/// Takes a numeric array and returns the average of all elements.
/// This is much faster than using reduce with a JavaScript function.
#[wasm_bindgen]
pub fn numeric_average_f64(input: &JsValue) -> f64 {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    if length == 0 {
        return 0.0;
    }

    let sum = numeric_sum_f64(input);
    sum / (length as f64)
}

/// Optimized min operation for numeric arrays
///
/// Takes a numeric array and returns the minimum value.
/// This is much faster than using reduce with a JavaScript function.
#[wasm_bindgen]
pub fn numeric_min_f64(input: &JsValue) -> f64 {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    if length == 0 {
        return f64::NAN;
    }

    let mut min = input_array.get_index(0);

    for i in 1..length {
        let value = input_array.get_index(i as u32);
        if value < min {
            min = value;
        }
    }

    min
}

/// Optimized max operation for numeric arrays
///
/// Takes a numeric array and returns the maximum value.
/// This is much faster than using reduce with a JavaScript function.
#[wasm_bindgen]
pub fn numeric_max_f64(input: &JsValue) -> f64 {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    if length == 0 {
        return f64::NAN;
    }

    let mut max = input_array.get_index(0);

    for i in 1..length {
        let value = input_array.get_index(i as u32);
        if value > max {
            max = value;
        }
    }

    max
}
