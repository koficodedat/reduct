use wasm_bindgen::prelude::*;
use js_sys::Float64Array;
use bumpalo::Bump;

#[cfg(feature = "simd")]
use wide::{f64x4, CmpLt};

/// Calculate the covariance between two numeric arrays
///
/// Takes two numeric arrays and returns their covariance.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_covariance_f64(x: &JsValue, y: &JsValue) -> f64 {
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
        return 0.0;
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
        #[cfg(feature = "simd")]
        {
            let simd_length = batch_size - (batch_size % 4);

            // Process in chunks of 4 elements
            for i in (0..simd_length).step_by(4) {
                // Load 4 elements at once
                let vx = f64x4::from([x_values[i], x_values[i+1], x_values[i+2], x_values[i+3]]);
                let vy = f64x4::from([y_values[i], y_values[i+1], y_values[i+2], y_values[i+3]]);

                // Sum the vectors and add to total sums
                sum_x += vx.reduce_add();
                sum_y += vy.reduce_add();
            }

            // Add remaining elements
            for i in simd_length..batch_size {
                sum_x += x_values[i];
                sum_y += y_values[i];
            }
        }

        #[cfg(not(feature = "simd"))]
        {
            for i in 0..batch_size {
                sum_x += x_values[i];
                sum_y += y_values[i];
            }
        }
    }

    let mean_x = sum_x / (length as f64);
    let mean_y = sum_y / (length as f64);

    // Second pass: calculate covariance
    let mut sum_cov = 0.0;

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

        // Calculate covariance for this batch
        #[cfg(feature = "simd")]
        {
            let simd_length = batch_size - (batch_size % 4);
            let mean_x_vec = f64x4::splat(mean_x);
            let mean_y_vec = f64x4::splat(mean_y);

            // Process in chunks of 4 elements
            for i in (0..simd_length).step_by(4) {
                // Load 4 elements at once
                let vx = f64x4::from([x_values[i], x_values[i+1], x_values[i+2], x_values[i+3]]);
                let vy = f64x4::from([y_values[i], y_values[i+1], y_values[i+2], y_values[i+3]]);

                // Calculate differences from means
                let dx = vx - mean_x_vec;
                let dy = vy - mean_y_vec;

                // Calculate products and add to sum
                let products = dx * dy;
                sum_cov += products.reduce_add();
            }

            // Add remaining elements
            for i in simd_length..batch_size {
                let dx = x_values[i] - mean_x;
                let dy = y_values[i] - mean_y;
                sum_cov += dx * dy;
            }
        }

        #[cfg(not(feature = "simd"))]
        {
            for i in 0..batch_size {
                let dx = x_values[i] - mean_x;
                let dy = y_values[i] - mean_y;
                sum_cov += dx * dy;
            }
        }
    }

    // Calculate the covariance
    sum_cov / (length as f64)
}

/// Calculate the skewness of a numeric array
///
/// Takes a numeric array and returns its skewness.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_skewness_f64(input: &JsValue) -> f64 {
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

    // Second pass: calculate the second and third moments
    let mut m2 = 0.0;
    let mut m3 = 0.0;

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

        // Calculate moments for this batch
        for i in 0..batch_size {
            let diff = values[i] - mean;
            let diff2 = diff * diff;
            m2 += diff2;
            m3 += diff2 * diff;
        }
    }

    // Calculate the skewness
    let variance = m2 / (length as f64);
    let std_dev = variance.sqrt();
    
    if std_dev == 0.0 {
        return 0.0;
    }
    
    // Adjust for sample size (Fisher's moment coefficient of skewness)
    let n = length as f64;
    let adjustment = (n * (n - 1.0).sqrt()) / (n - 2.0);
    
    adjustment * (m3 / (length as f64)) / (std_dev * std_dev * std_dev)
}

/// Calculate the kurtosis of a numeric array
///
/// Takes a numeric array and returns its kurtosis.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_kurtosis_f64(input: &JsValue) -> f64 {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Early return for empty arrays
    if length == 0 {
        return f64::NAN;
    }

    // Early return for single-element arrays
    if length <= 3 {
        return f64::NAN;
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
        for i in 0..batch_size {
            sum += values[i];
        }
    }

    let mean = sum / (length as f64);

    // Second pass: calculate the second and fourth moments
    let mut m2 = 0.0;
    let mut m4 = 0.0;

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

        // Calculate moments for this batch
        for i in 0..batch_size {
            let diff = values[i] - mean;
            let diff2 = diff * diff;
            m2 += diff2;
            m4 += diff2 * diff2;
        }
    }

    // Calculate the kurtosis (excess kurtosis)
    let variance = m2 / (length as f64);
    
    if variance == 0.0 {
        return 0.0;
    }
    
    // Adjust for sample size
    let n = length as f64;
    let adjustment = (n * (n + 1.0)) / ((n - 1.0) * (n - 2.0) * (n - 3.0));
    let term1 = ((n + 1.0) * (m4 / (length as f64))) / (variance * variance);
    let term2 = 3.0 * (n - 1.0) * (n - 1.0) / ((n - 2.0) * (n - 3.0));
    
    adjustment * term1 - term2
}

/// Calculate the quantiles of a numeric array
///
/// Takes a numeric array and returns an array of quantiles.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_quantiles_f64(input: &JsValue, quantiles: &JsValue) -> Result<JsValue, JsValue> {
    // Convert inputs to typed arrays for better performance
    let input_array = Float64Array::new(input);
    let quantiles_array = Float64Array::new(quantiles);
    let input_length = input_array.length() as usize;
    let quantiles_length = quantiles_array.length() as usize;

    // Early return for empty arrays
    if input_length == 0 || quantiles_length == 0 {
        return Ok(Float64Array::new_with_length(0).into());
    }

    // Copy the input array to a vector for sorting
    let mut values = Vec::with_capacity(input_length);
    for i in 0..input_length {
        values.push(input_array.get_index(i as u32));
    }

    // Sort the values
    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    // Calculate the quantiles
    let result_array = Float64Array::new_with_length(quantiles_length as u32);
    for i in 0..quantiles_length {
        let q = quantiles_array.get_index(i as u32);
        
        // Validate quantile
        let p = if q < 0.0 {
            0.0
        } else if q > 1.0 {
            1.0
        } else {
            q
        };
        
        // Calculate the index
        let index = (p * (input_length - 1) as f64) as usize;
        let fraction = (p * (input_length - 1) as f64) - (index as f64);
        
        // Calculate the quantile value
        let value = if index + 1 < input_length {
            values[index] + fraction * (values[index + 1] - values[index])
        } else {
            values[index]
        };
        
        result_array.set_index(i as u32, value);
    }

    Ok(result_array.into())
}
