use wasm_bindgen::prelude::*;
use js_sys::Float64Array;
use bumpalo::Bump;

#[cfg(feature = "simd")]
use wide::{f64x4, CmpLt};

/// Calculate the simple moving average (SMA) of a numeric array
///
/// Takes a numeric array and a window size, and returns an array of moving averages.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_moving_average_f64(input: &JsValue, window_size: usize) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Validate window size
    if window_size == 0 {
        return Err(JsValue::from_str("Window size must be greater than 0"));
    }

    if window_size > length {
        return Err(JsValue::from_str("Window size cannot be larger than the array length"));
    }

    // Calculate the result length
    let result_length = length - window_size + 1;
    
    // Create a new typed array for the results
    let result_array = Float64Array::new_with_length(result_length as u32);
    
    // Process in batches to reduce overhead
    const BATCH_SIZE: usize = 4096;
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let values = bump.alloc_slice_fill_copy(length, 0.0);
    
    // Copy input data
    for i in 0..length {
        values[i] = input_array.get_index(i as u32);
    }
    
    // Calculate the first window sum
    let mut window_sum = 0.0;
    for i in 0..window_size {
        window_sum += values[i];
    }
    
    // Set the first result
    result_array.set_index(0, window_sum / window_size as f64);
    
    // Calculate the rest of the moving averages using a sliding window
    for i in 1..result_length {
        window_sum = window_sum - values[i - 1] + values[i + window_size - 1];
        result_array.set_index(i as u32, window_sum / window_size as f64);
    }
    
    Ok(result_array.into())
}

/// Calculate the exponential moving average (EMA) of a numeric array
///
/// Takes a numeric array and a smoothing factor (alpha), and returns an array of exponential moving averages.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_exponential_moving_average_f64(input: &JsValue, alpha: f64) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Validate alpha
    if alpha <= 0.0 || alpha > 1.0 {
        return Err(JsValue::from_str("Alpha must be between 0 and 1 (exclusive of 0)"));
    }

    // Early return for empty arrays
    if length == 0 {
        return Ok(Float64Array::new_with_length(0).into());
    }

    // Create a new typed array for the results
    let result_array = Float64Array::new_with_length(length as u32);
    
    // Process in batches to reduce overhead
    const BATCH_SIZE: usize = 4096;
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let values = bump.alloc_slice_fill_copy(length, 0.0);
    
    // Copy input data
    for i in 0..length {
        values[i] = input_array.get_index(i as u32);
    }
    
    // Set the first result to the first value
    result_array.set_index(0, values[0]);
    
    // Calculate the rest of the exponential moving averages
    for i in 1..length {
        let ema = alpha * values[i] + (1.0 - alpha) * result_array.get_index((i - 1) as u32);
        result_array.set_index(i as u32, ema);
    }
    
    Ok(result_array.into())
}

/// Calculate the weighted moving average (WMA) of a numeric array
///
/// Takes a numeric array and a window size, and returns an array of weighted moving averages.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_weighted_moving_average_f64(input: &JsValue, window_size: usize) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Validate window size
    if window_size == 0 {
        return Err(JsValue::from_str("Window size must be greater than 0"));
    }

    if window_size > length {
        return Err(JsValue::from_str("Window size cannot be larger than the array length"));
    }

    // Calculate the result length
    let result_length = length - window_size + 1;
    
    // Create a new typed array for the results
    let result_array = Float64Array::new_with_length(result_length as u32);
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let values = bump.alloc_slice_fill_copy(length, 0.0);
    
    // Copy input data
    for i in 0..length {
        values[i] = input_array.get_index(i as u32);
    }
    
    // Calculate the denominator (sum of weights)
    let denominator = (window_size * (window_size + 1)) / 2;
    
    // Calculate weighted moving averages
    for i in 0..result_length {
        let mut weighted_sum = 0.0;
        for j in 0..window_size {
            weighted_sum += values[i + j] * (j + 1) as f64;
        }
        result_array.set_index(i as u32, weighted_sum / denominator as f64);
    }
    
    Ok(result_array.into())
}

/// Detect outliers in a numeric array using the Z-score method
///
/// Takes a numeric array and a threshold, and returns an array of booleans indicating outliers.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_detect_outliers_f64(input: &JsValue, threshold: f64) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Validate threshold
    if threshold <= 0.0 {
        return Err(JsValue::from_str("Threshold must be greater than 0"));
    }

    // Early return for empty arrays
    if length == 0 {
        return Ok(js_sys::Array::new().into());
    }

    // Create a new array for the results
    let result_array = js_sys::Array::new_with_length(length as u32);
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let values = bump.alloc_slice_fill_copy(length, 0.0);
    
    // Copy input data
    for i in 0..length {
        values[i] = input_array.get_index(i as u32);
    }
    
    // Calculate mean
    let mut sum = 0.0;
    for i in 0..length {
        sum += values[i];
    }
    let mean = sum / length as f64;
    
    // Calculate standard deviation
    let mut sum_squared_diff = 0.0;
    for i in 0..length {
        let diff = values[i] - mean;
        sum_squared_diff += diff * diff;
    }
    let std_dev = (sum_squared_diff / length as f64).sqrt();
    
    // Detect outliers
    if std_dev == 0.0 {
        // If standard deviation is 0, no outliers
        for i in 0..length {
            result_array.set(i as u32, JsValue::from(false));
        }
    } else {
        // Calculate Z-scores and detect outliers
        for i in 0..length {
            let z_score = (values[i] - mean).abs() / std_dev;
            result_array.set(i as u32, JsValue::from(z_score > threshold));
        }
    }
    
    Ok(result_array.into())
}

/// Interpolate missing values in a numeric array
///
/// Takes a numeric array with NaN values and returns an array with interpolated values.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_interpolate_missing_f64(input: &JsValue) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Early return for empty arrays
    if length == 0 {
        return Ok(Float64Array::new_with_length(0).into());
    }

    // Create a new typed array for the results
    let result_array = Float64Array::new_with_length(length as u32);
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let values = bump.alloc_slice_fill_copy(length, 0.0);
    
    // Copy input data and find first non-NaN value
    let mut first_valid_index = None;
    for i in 0..length {
        let value = input_array.get_index(i as u32);
        values[i] = value;
        if !value.is_nan() && first_valid_index.is_none() {
            first_valid_index = Some(i);
        }
    }
    
    // If all values are NaN, return the original array
    if first_valid_index.is_none() {
        return Ok(input_array.into());
    }
    
    // Fill in leading NaN values with the first valid value
    let first_valid = first_valid_index.unwrap();
    for i in 0..first_valid {
        result_array.set_index(i as u32, values[first_valid]);
    }
    
    // Copy the first valid value
    result_array.set_index(first_valid as u32, values[first_valid]);
    
    // Interpolate middle values
    let mut last_valid_index = first_valid;
    let mut last_valid_value = values[first_valid];
    
    for i in (first_valid + 1)..length {
        if !values[i].is_nan() {
            // If we have a gap, interpolate
            if i > last_valid_index + 1 {
                let gap = i - last_valid_index;
                let step = (values[i] - last_valid_value) / gap as f64;
                
                for j in 1..gap {
                    result_array.set_index((last_valid_index + j) as u32, last_valid_value + step * j as f64);
                }
            }
            
            // Copy the current valid value
            result_array.set_index(i as u32, values[i]);
            last_valid_index = i;
            last_valid_value = values[i];
        } else if i == length - 1 {
            // Fill in trailing NaN values with the last valid value
            result_array.set_index(i as u32, last_valid_value);
        }
    }
    
    Ok(result_array.into())
}

/// Calculate the autocorrelation of a numeric array
///
/// Takes a numeric array and a lag, and returns the autocorrelation.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn numeric_autocorrelation_f64(input: &JsValue, lag: usize) -> f64 {
    // Convert input to typed array for better performance
    let input_array = Float64Array::new(input);
    let length = input_array.length() as usize;

    // Early return for invalid inputs
    if length <= lag {
        return f64::NAN;
    }

    // Allocate memory for the input data
    let bump = Bump::new();
    let values = bump.alloc_slice_fill_copy(length, 0.0);
    
    // Copy input data
    for i in 0..length {
        values[i] = input_array.get_index(i as u32);
    }
    
    // Calculate mean
    let mut sum = 0.0;
    for i in 0..length {
        sum += values[i];
    }
    let mean = sum / length as f64;
    
    // Calculate autocorrelation
    let mut numerator = 0.0;
    let mut denominator = 0.0;
    
    for i in 0..(length - lag) {
        let x_t = values[i] - mean;
        let x_t_plus_lag = values[i + lag] - mean;
        numerator += x_t * x_t_plus_lag;
    }
    
    for i in 0..length {
        let x_t = values[i] - mean;
        denominator += x_t * x_t;
    }
    
    if denominator == 0.0 {
        return 0.0;
    }
    
    numerator / denominator
}
