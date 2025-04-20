use wasm_bindgen::prelude::*;
use js_sys::Float64Array;
use bumpalo::Bump;

#[cfg(feature = "simd")]
use wide::{f64x4, CmpLt};

/// Calculate the median of a numeric array
///
/// Takes a numeric array and returns the median value.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_median_f64(input: &JsValue) -> f64 {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Early return for empty arrays
    if length == 0 {
        return f64::NAN;
    }

    // Early return for single-element arrays
    if length == 1 {
        return input_array.get_index(0);
    }

    // Copy the array to a vector for sorting
    let mut values = Vec::with_capacity(length);
    for i in 0..length {
        values.push(input_array.get_index(i as u32));
    }

    // Sort the values
    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    // Calculate the median
    if length % 2 == 0 {
        // Even number of elements, average the middle two
        let mid = length / 2;
        (values[mid - 1] + values[mid]) / 2.0
    } else {
        // Odd number of elements, return the middle one
        values[length / 2]
    }
}

/// Calculate the standard deviation of a numeric array
///
/// Takes a numeric array and returns the standard deviation.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_std_dev_f64(input: &JsValue) -> f64 {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Early return for empty arrays
    if length == 0 {
        return f64::NAN;
    }

    // Early return for single-element arrays
    if length == 1 {
        return 0.0;
    }

    // Process in batches to reduce overhead
    const BATCH_SIZE: usize = 4096;

    // First pass: calculate the mean
    let mut sum = 0.0;

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
        #[cfg(feature = "simd")]
        {
            let simd_length = batch_size - (batch_size % 4);

            // Process in chunks of 4 elements
            for i in (0..simd_length).step_by(4) {
                // Load 4 elements at once
                let v = f64x4::from([values[i], values[i+1], values[i+2], values[i+3]]);

                // Sum the vector and add to total sum
                sum += v.reduce_add();
            }

            // Add remaining elements
            for i in simd_length..batch_size {
                sum += values[i];
            }
        }

        #[cfg(not(feature = "simd"))]
        {
            for i in 0..batch_size {
                sum += values[i];
            }
        }
    }

    let mean = sum / (length as f64);

    // Second pass: calculate the variance
    let mut sum_squared_diff = 0.0;

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

        // Calculate sum of squared differences for this batch
        #[cfg(feature = "simd")]
        {
            let simd_length = batch_size - (batch_size % 4);
            let mean_vec = f64x4::splat(mean);

            // Process in chunks of 4 elements
            for i in (0..simd_length).step_by(4) {
                // Load 4 elements at once
                let v = f64x4::from([values[i], values[i+1], values[i+2], values[i+3]]);

                // Calculate differences from mean
                let diff = v - mean_vec;

                // Square differences and add to sum
                let squared = diff * diff;
                sum_squared_diff += squared.reduce_add();
            }

            // Add remaining elements
            for i in simd_length..batch_size {
                let diff = values[i] - mean;
                sum_squared_diff += diff * diff;
            }
        }

        #[cfg(not(feature = "simd"))]
        {
            for i in 0..batch_size {
                let diff = values[i] - mean;
                sum_squared_diff += diff * diff;
            }
        }
    }

    // Calculate the standard deviation
    (sum_squared_diff / (length as f64)).sqrt()
}

/// Calculate the correlation coefficient between two numeric arrays
///
/// Takes two numeric arrays and returns the Pearson correlation coefficient.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_correlation_f64(x: &JsValue, y: &JsValue) -> f64 {
    // Convert inputs to typed arrays for better performance
    let x_array = Float64Array::new(x);
    let y_array = Float64Array::new(y);
    let length = std::cmp::min(x_array.length(), y_array.length()) as usize;

    // Early return for empty arrays
    if length == 0 {
        return f64::NAN;
    }

    // Early return for single-element arrays
    if length == 1 {
        return 1.0;
    }

    // Process in batches to reduce overhead
    const BATCH_SIZE: usize = 4096;

    // First pass: calculate means
    let mut sum_x = 0.0;
    let mut sum_y = 0.0;

    for batch_start in (0..length).step_by(BATCH_SIZE) {
        let batch_end = std::cmp::min(batch_start + BATCH_SIZE, length);
        let batch_size = batch_end - batch_start;

        // Allocate memory for this batch
        let bump = Bump::new();
        let x_values = bump.alloc_slice_fill_copy(batch_size, 0.0);
        let y_values = bump.alloc_slice_fill_copy(batch_size, 0.0);

        // Copy input data for this batch
        for i in 0..batch_size {
            x_values[i] = x_array.get_index((batch_start + i) as u32);
            y_values[i] = y_array.get_index((batch_start + i) as u32);
        }

        // Calculate sums for this batch
        for i in 0..batch_size {
            sum_x += x_values[i];
            sum_y += y_values[i];
        }
    }

    let mean_x = sum_x / (length as f64);
    let mean_y = sum_y / (length as f64);

    // Second pass: calculate correlation
    let mut sum_xy = 0.0;
    let mut sum_x2 = 0.0;
    let mut sum_y2 = 0.0;

    for batch_start in (0..length).step_by(BATCH_SIZE) {
        let batch_end = std::cmp::min(batch_start + BATCH_SIZE, length);
        let batch_size = batch_end - batch_start;

        // Allocate memory for this batch
        let bump = Bump::new();
        let x_values = bump.alloc_slice_fill_copy(batch_size, 0.0);
        let y_values = bump.alloc_slice_fill_copy(batch_size, 0.0);

        // Copy input data for this batch
        for i in 0..batch_size {
            x_values[i] = x_array.get_index((batch_start + i) as u32);
            y_values[i] = y_array.get_index((batch_start + i) as u32);
        }

        // Calculate correlation components for this batch
        for i in 0..batch_size {
            let x_diff = x_values[i] - mean_x;
            let y_diff = y_values[i] - mean_y;
            sum_xy += x_diff * y_diff;
            sum_x2 += x_diff * x_diff;
            sum_y2 += y_diff * y_diff;
        }
    }

    // Calculate the correlation coefficient
    if sum_x2 == 0.0 || sum_y2 == 0.0 {
        0.0
    } else {
        sum_xy / (sum_x2.sqrt() * sum_y2.sqrt())
    }
}

/// Calculate the percentile of a numeric array
///
/// Takes a numeric array and a percentile value (0-100) and returns the value at that percentile.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_percentile_f64(input: &JsValue, percentile: f64) -> f64 {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Early return for empty arrays
    if length == 0 {
        return f64::NAN;
    }

    // Early return for single-element arrays
    if length == 1 {
        return input_array.get_index(0);
    }

    // Validate percentile
    let p = if percentile < 0.0 {
        0.0
    } else if percentile > 100.0 {
        100.0
    } else {
        percentile
    };

    // Copy the array to a vector for sorting
    let mut values = Vec::with_capacity(length);
    for i in 0..length {
        values.push(input_array.get_index(i as u32));
    }

    // Sort the values
    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    // Calculate the index
    let index = (p / 100.0 * (length - 1) as f64) as usize;
    let fraction = (p / 100.0 * (length - 1) as f64) - (index as f64);

    // Calculate the percentile value
    if index + 1 < length {
        values[index] + fraction * (values[index + 1] - values[index])
    } else {
        values[index]
    }
}
