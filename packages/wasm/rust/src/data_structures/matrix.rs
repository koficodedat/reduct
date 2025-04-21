use wasm_bindgen::prelude::*;
use js_sys::{Float64Array};
use bumpalo::Bump;

#[cfg(feature = "simd")]
use wide::{f64x4};

/// Matrix multiplication implementation
///
/// Takes two matrices as flat arrays (row-major order) and returns the product.
/// This is much faster than using JavaScript, especially for large matrices.
#[wasm_bindgen]
pub fn matrix_multiply_f64(
    a: &JsValue,
    b: &JsValue,
    a_rows: usize,
    a_cols: usize,
    b_rows: usize,
    b_cols: usize
) -> Result<JsValue, JsValue> {
    // Validate input dimensions
    if a_cols != b_rows {
        return Err(JsValue::from_str(&format!(
            "Matrix dimensions incompatible for multiplication: ({}, {}) * ({}, {})",
            a_rows, a_cols, b_rows, b_cols
        )));
    }

    // Convert inputs to typed arrays for better performance
    let a_array = Float64Array::new(a);
    let b_array = Float64Array::new(b);

    // Create a new typed array for the result
    let result_array = Float64Array::new_with_length((a_rows * b_cols) as u32);
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let a_values = bump.alloc_slice_fill_copy(a_rows * a_cols, 0.0);
    let b_values = bump.alloc_slice_fill_copy(b_rows * b_cols, 0.0);
    
    // Copy input data
    for i in 0..a_rows * a_cols {
        a_values[i] = a_array.get_index(i as u32);
    }
    for i in 0..b_rows * b_cols {
        b_values[i] = b_array.get_index(i as u32);
    }
    
    // Perform matrix multiplication
    #[cfg(feature = "simd")]
    {
        // Use SIMD for better performance when possible
        matrix_multiply_simd(a_values, b_values, a_rows, a_cols, b_cols, &result_array);
    }
    
    #[cfg(not(feature = "simd"))]
    {
        // Fall back to scalar implementation
        matrix_multiply_scalar(a_values, b_values, a_rows, a_cols, b_cols, &result_array);
    }
    
    Ok(result_array.into())
}

/// Matrix multiplication using SIMD
///
/// This function uses SIMD instructions for better performance.
#[cfg(feature = "simd")]
fn matrix_multiply_simd(
    a: &[f64],
    b: &[f64],
    a_rows: usize,
    a_cols: usize,
    b_cols: usize,
    result: &Float64Array
) {
    // Process the matrix in blocks for better cache locality
    const BLOCK_SIZE: usize = 4;
    
    for i in 0..a_rows {
        for j in 0..b_cols {
            let mut sum = 0.0;
            
            // Process in chunks of 4 elements
            let simd_length = a_cols - (a_cols % BLOCK_SIZE);
            let mut sum_vec = f64x4::splat(0.0);
            
            for k in (0..simd_length).step_by(BLOCK_SIZE) {
                let a_vec = f64x4::from([
                    a[i * a_cols + k],
                    a[i * a_cols + k + 1],
                    a[i * a_cols + k + 2],
                    a[i * a_cols + k + 3],
                ]);
                
                let b_vec = f64x4::from([
                    b[k * b_cols + j],
                    b[(k + 1) * b_cols + j],
                    b[(k + 2) * b_cols + j],
                    b[(k + 3) * b_cols + j],
                ]);
                
                sum_vec = sum_vec + (a_vec * b_vec);
            }
            
            sum += sum_vec.reduce_add();
            
            // Process remaining elements
            for k in simd_length..a_cols {
                sum += a[i * a_cols + k] * b[k * b_cols + j];
            }
            
            result.set_index((i * b_cols + j) as u32, sum);
        }
    }
}

/// Matrix multiplication using scalar operations
///
/// This function is used when SIMD is not available.
#[cfg(not(feature = "simd"))]
fn matrix_multiply_scalar(
    a: &[f64],
    b: &[f64],
    a_rows: usize,
    a_cols: usize,
    b_cols: usize,
    result: &Float64Array
) {
    for i in 0..a_rows {
        for j in 0..b_cols {
            let mut sum = 0.0;
            for k in 0..a_cols {
                sum += a[i * a_cols + k] * b[k * b_cols + j];
            }
            result.set_index((i * b_cols + j) as u32, sum);
        }
    }
}
