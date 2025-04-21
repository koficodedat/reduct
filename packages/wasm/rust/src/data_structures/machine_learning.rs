use wasm_bindgen::prelude::*;
use js_sys::{Array, Float64Array, Object, Reflect};
use bumpalo::Bump;

#[cfg(feature = "simd")]
use wide::{f64x4, CmpLt};

/// Linear regression implementation
///
/// Takes x and y arrays and returns the slope and intercept.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn linear_regression_f64(x: &JsValue, y: &JsValue) -> Result<JsValue, JsValue> {
    // Convert inputs to typed arrays for better performance
    let x_array = Float64Array::new(x);
    let y_array = Float64Array::new(y);
    let length = std::cmp::min(x_array.length(), y_array.length()) as usize;

    // Early return for insufficient data
    if length < 2 {
        return Err(JsValue::from_str("At least 2 data points are required for linear regression"));
    }

    // Allocate memory for the input data
    let bump = Bump::new();
    let x_values = bump.alloc_slice_fill_copy(length, 0.0);
    let y_values = bump.alloc_slice_fill_copy(length, 0.0);
    
    // Copy input data
    for i in 0..length {
        x_values[i] = x_array.get_index(i as u32);
        y_values[i] = y_array.get_index(i as u32);
    }
    
    // Calculate means
    let mut sum_x = 0.0;
    let mut sum_y = 0.0;
    
    #[cfg(feature = "simd")]
    {
        let simd_length = length - (length % 4);
        let mut sum_x_vec = f64x4::splat(0.0);
        let mut sum_y_vec = f64x4::splat(0.0);
        
        // Process in chunks of 4 elements
        for i in (0..simd_length).step_by(4) {
            let x_vec = f64x4::from([x_values[i], x_values[i+1], x_values[i+2], x_values[i+3]]);
            let y_vec = f64x4::from([y_values[i], y_values[i+1], y_values[i+2], y_values[i+3]]);
            
            sum_x_vec = sum_x_vec + x_vec;
            sum_y_vec = sum_y_vec + y_vec;
        }
        
        sum_x = sum_x_vec.reduce_add();
        sum_y = sum_y_vec.reduce_add();
        
        // Process remaining elements
        for i in simd_length..length {
            sum_x += x_values[i];
            sum_y += y_values[i];
        }
    }
    
    #[cfg(not(feature = "simd"))]
    {
        for i in 0..length {
            sum_x += x_values[i];
            sum_y += y_values[i];
        }
    }
    
    let mean_x = sum_x / length as f64;
    let mean_y = sum_y / length as f64;
    
    // Calculate slope and intercept
    let mut numerator = 0.0;
    let mut denominator = 0.0;
    
    #[cfg(feature = "simd")]
    {
        let simd_length = length - (length % 4);
        let mean_x_vec = f64x4::splat(mean_x);
        let mean_y_vec = f64x4::splat(mean_y);
        let mut numerator_vec = f64x4::splat(0.0);
        let mut denominator_vec = f64x4::splat(0.0);
        
        // Process in chunks of 4 elements
        for i in (0..simd_length).step_by(4) {
            let x_vec = f64x4::from([x_values[i], x_values[i+1], x_values[i+2], x_values[i+3]]);
            let y_vec = f64x4::from([y_values[i], y_values[i+1], y_values[i+2], y_values[i+3]]);
            
            let x_diff = x_vec - mean_x_vec;
            let y_diff = y_vec - mean_y_vec;
            
            numerator_vec = numerator_vec + (x_diff * y_diff);
            denominator_vec = denominator_vec + (x_diff * x_diff);
        }
        
        numerator = numerator_vec.reduce_add();
        denominator = denominator_vec.reduce_add();
        
        // Process remaining elements
        for i in simd_length..length {
            let x_diff = x_values[i] - mean_x;
            let y_diff = y_values[i] - mean_y;
            
            numerator += x_diff * y_diff;
            denominator += x_diff * x_diff;
        }
    }
    
    #[cfg(not(feature = "simd"))]
    {
        for i in 0..length {
            let x_diff = x_values[i] - mean_x;
            let y_diff = y_values[i] - mean_y;
            
            numerator += x_diff * y_diff;
            denominator += x_diff * x_diff;
        }
    }
    
    // Check for division by zero
    if denominator == 0.0 {
        return Err(JsValue::from_str("Division by zero in linear regression"));
    }
    
    let slope = numerator / denominator;
    let intercept = mean_y - slope * mean_x;
    
    // Calculate R-squared
    let mut ss_total = 0.0;
    let mut ss_residual = 0.0;
    
    for i in 0..length {
        let y_pred = slope * x_values[i] + intercept;
        let y_diff = y_values[i] - mean_y;
        let residual = y_values[i] - y_pred;
        
        ss_total += y_diff * y_diff;
        ss_residual += residual * residual;
    }
    
    let r_squared = if ss_total == 0.0 { 0.0 } else { 1.0 - (ss_residual / ss_total) };
    
    // Create a result object
    let result = Object::new();
    Reflect::set(&result, &JsValue::from_str("slope"), &JsValue::from_f64(slope))?;
    Reflect::set(&result, &JsValue::from_str("intercept"), &JsValue::from_f64(intercept))?;
    Reflect::set(&result, &JsValue::from_str("r_squared"), &JsValue::from_f64(r_squared))?;
    
    Ok(result.into())
}

/// Predict values using linear regression
///
/// Takes x array, slope, and intercept, and returns predicted y values.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn linear_regression_predict_f64(x: &JsValue, slope: f64, intercept: f64) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let x_array = Float64Array::new(x);
    let length = x_array.length() as usize;

    // Create a new typed array for the results
    let result_array = Float64Array::new_with_length(length as u32);
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let x_values = bump.alloc_slice_fill_copy(length, 0.0);
    
    // Copy input data
    for i in 0..length {
        x_values[i] = x_array.get_index(i as u32);
    }
    
    // Calculate predictions
    #[cfg(feature = "simd")]
    {
        let simd_length = length - (length % 4);
        let slope_vec = f64x4::splat(slope);
        let intercept_vec = f64x4::splat(intercept);
        
        // Process in chunks of 4 elements
        for i in (0..simd_length).step_by(4) {
            let x_vec = f64x4::from([x_values[i], x_values[i+1], x_values[i+2], x_values[i+3]]);
            let y_pred = x_vec * slope_vec + intercept_vec;
            
            // Store results
            result_array.set_index(i as u32, y_pred.extract(0));
            result_array.set_index((i+1) as u32, y_pred.extract(1));
            result_array.set_index((i+2) as u32, y_pred.extract(2));
            result_array.set_index((i+3) as u32, y_pred.extract(3));
        }
        
        // Process remaining elements
        for i in simd_length..length {
            let y_pred = x_values[i] * slope + intercept;
            result_array.set_index(i as u32, y_pred);
        }
    }
    
    #[cfg(not(feature = "simd"))]
    {
        for i in 0..length {
            let y_pred = x_values[i] * slope + intercept;
            result_array.set_index(i as u32, y_pred);
        }
    }
    
    Ok(result_array.into())
}

/// K-means clustering implementation
///
/// Takes data points and k, and returns cluster assignments and centroids.
/// This is much faster than using JavaScript, especially for large datasets.
#[wasm_bindgen]
pub fn kmeans_clustering_f64(data: &JsValue, k: usize, max_iterations: usize) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let data_array = Float64Array::new(data);
    let num_points = data_array.length() as usize / 2; // Assuming 2D points (x, y)
    
    // Validate inputs
    if num_points < k {
        return Err(JsValue::from_str("Number of points must be greater than or equal to k"));
    }
    
    if k == 0 {
        return Err(JsValue::from_str("k must be greater than 0"));
    }
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let points = bump.alloc_slice_fill_copy(num_points * 2, 0.0);
    
    // Copy input data
    for i in 0..(num_points * 2) {
        points[i] = data_array.get_index(i as u32);
    }
    
    // Initialize centroids using k-means++ initialization
    let mut centroids = Vec::with_capacity(k * 2);
    
    // Choose the first centroid randomly
    let first_index = (js_sys::Math::random() * num_points as f64) as usize;
    centroids.push(points[first_index * 2]);
    centroids.push(points[first_index * 2 + 1]);
    
    // Choose the remaining centroids
    for _ in 1..k {
        let mut distances = Vec::with_capacity(num_points);
        
        // Calculate the distance from each point to the nearest centroid
        for i in 0..num_points {
            let mut min_dist = f64::MAX;
            
            for j in 0..(centroids.len() / 2) {
                let dx = points[i * 2] - centroids[j * 2];
                let dy = points[i * 2 + 1] - centroids[j * 2 + 1];
                let dist = dx * dx + dy * dy;
                
                if dist < min_dist {
                    min_dist = dist;
                }
            }
            
            distances.push(min_dist);
        }
        
        // Choose the next centroid with probability proportional to distance squared
        let mut sum_distances = 0.0;
        for dist in &distances {
            sum_distances += dist;
        }
        
        let mut target = js_sys::Math::random() * sum_distances;
        let mut next_index = 0;
        
        for (i, dist) in distances.iter().enumerate() {
            target -= dist;
            if target <= 0.0 {
                next_index = i;
                break;
            }
        }
        
        centroids.push(points[next_index * 2]);
        centroids.push(points[next_index * 2 + 1]);
    }
    
    // Allocate memory for cluster assignments
    let mut assignments = vec![0; num_points];
    
    // Run k-means algorithm
    let mut converged = false;
    let mut iteration = 0;
    
    while !converged && iteration < max_iterations {
        // Assign points to clusters
        let mut changed = false;
        
        for i in 0..num_points {
            let mut min_dist = f64::MAX;
            let mut min_cluster = 0;
            
            for j in 0..k {
                let dx = points[i * 2] - centroids[j * 2];
                let dy = points[i * 2 + 1] - centroids[j * 2 + 1];
                let dist = dx * dx + dy * dy;
                
                if dist < min_dist {
                    min_dist = dist;
                    min_cluster = j;
                }
            }
            
            if assignments[i] != min_cluster {
                assignments[i] = min_cluster;
                changed = true;
            }
        }
        
        // Check for convergence
        if !changed {
            converged = true;
            break;
        }
        
        // Update centroids
        let mut new_centroids = vec![0.0; k * 2];
        let mut counts = vec![0; k];
        
        for i in 0..num_points {
            let cluster = assignments[i];
            new_centroids[cluster * 2] += points[i * 2];
            new_centroids[cluster * 2 + 1] += points[i * 2 + 1];
            counts[cluster] += 1;
        }
        
        for j in 0..k {
            if counts[j] > 0 {
                new_centroids[j * 2] /= counts[j] as f64;
                new_centroids[j * 2 + 1] /= counts[j] as f64;
            } else {
                // If a cluster is empty, reinitialize its centroid
                let random_index = (js_sys::Math::random() * num_points as f64) as usize;
                new_centroids[j * 2] = points[random_index * 2];
                new_centroids[j * 2 + 1] = points[random_index * 2 + 1];
            }
        }
        
        // Update centroids
        centroids = new_centroids;
        
        iteration += 1;
    }
    
    // Create result object
    let result = Object::new();
    
    // Create assignments array
    let assignments_array = Array::new_with_length(num_points as u32);
    for (i, &cluster) in assignments.iter().enumerate() {
        assignments_array.set(i as u32, JsValue::from_f64(cluster as f64));
    }
    
    // Create centroids array
    let centroids_array = Float64Array::new_with_length((k * 2) as u32);
    for (i, &value) in centroids.iter().enumerate() {
        centroids_array.set_index(i as u32, value);
    }
    
    // Set result properties
    Reflect::set(&result, &JsValue::from_str("assignments"), &assignments_array)?;
    Reflect::set(&result, &JsValue::from_str("centroids"), &centroids_array)?;
    Reflect::set(&result, &JsValue::from_str("iterations"), &JsValue::from_f64(iteration as f64))?;
    Reflect::set(&result, &JsValue::from_str("converged"), &JsValue::from_bool(converged))?;
    
    Ok(result.into())
}

/// Principal Component Analysis (PCA) implementation
///
/// Takes data points and returns principal components and explained variance.
/// This is much faster than using JavaScript, especially for large datasets.
#[wasm_bindgen]
pub fn pca_f64(data: &JsValue, num_components: usize) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let data_array = Float64Array::new(data);
    let num_points = data_array.length() as usize / 2; // Assuming 2D points (x, y)
    
    // Validate inputs
    if num_points == 0 {
        return Err(JsValue::from_str("Data must not be empty"));
    }
    
    if num_components == 0 || num_components > 2 {
        return Err(JsValue::from_str("Number of components must be 1 or 2 for 2D data"));
    }
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let points = bump.alloc_slice_fill_copy(num_points * 2, 0.0);
    
    // Copy input data
    for i in 0..(num_points * 2) {
        points[i] = data_array.get_index(i as u32);
    }
    
    // Calculate means
    let mut mean_x = 0.0;
    let mut mean_y = 0.0;
    
    for i in 0..num_points {
        mean_x += points[i * 2];
        mean_y += points[i * 2 + 1];
    }
    
    mean_x /= num_points as f64;
    mean_y /= num_points as f64;
    
    // Center the data
    for i in 0..num_points {
        points[i * 2] -= mean_x;
        points[i * 2 + 1] -= mean_y;
    }
    
    // Calculate covariance matrix
    let mut cov_xx = 0.0;
    let mut cov_xy = 0.0;
    let mut cov_yy = 0.0;
    
    for i in 0..num_points {
        let x = points[i * 2];
        let y = points[i * 2 + 1];
        
        cov_xx += x * x;
        cov_xy += x * y;
        cov_yy += y * y;
    }
    
    cov_xx /= num_points as f64;
    cov_xy /= num_points as f64;
    cov_yy /= num_points as f64;
    
    // Calculate eigenvalues and eigenvectors
    let trace = cov_xx + cov_yy;
    let determinant = cov_xx * cov_yy - cov_xy * cov_xy;
    
    let discriminant = trace * trace - 4.0 * determinant;
    
    if discriminant < 0.0 {
        return Err(JsValue::from_str("Negative discriminant in PCA"));
    }
    
    let eigenvalue1 = (trace + discriminant.sqrt()) / 2.0;
    let eigenvalue2 = (trace - discriminant.sqrt()) / 2.0;
    
    // Sort eigenvalues and eigenvectors
    let (lambda1, lambda2) = if eigenvalue1 >= eigenvalue2 {
        (eigenvalue1, eigenvalue2)
    } else {
        (eigenvalue2, eigenvalue1)
    };
    
    // Calculate eigenvectors
    let mut eigenvector1 = [0.0, 0.0];
    let mut eigenvector2 = [0.0, 0.0];
    
    if cov_xy != 0.0 {
        eigenvector1[0] = lambda1 - cov_yy;
        eigenvector1[1] = cov_xy;
        
        eigenvector2[0] = lambda2 - cov_yy;
        eigenvector2[1] = cov_xy;
    } else {
        // Special case: covariance matrix is diagonal
        if cov_xx >= cov_yy {
            eigenvector1[0] = 1.0;
            eigenvector1[1] = 0.0;
            
            eigenvector2[0] = 0.0;
            eigenvector2[1] = 1.0;
        } else {
            eigenvector1[0] = 0.0;
            eigenvector1[1] = 1.0;
            
            eigenvector2[0] = 1.0;
            eigenvector2[1] = 0.0;
        }
    }
    
    // Normalize eigenvectors
    let norm1 = (eigenvector1[0] * eigenvector1[0] + eigenvector1[1] * eigenvector1[1]).sqrt();
    eigenvector1[0] /= norm1;
    eigenvector1[1] /= norm1;
    
    let norm2 = (eigenvector2[0] * eigenvector2[0] + eigenvector2[1] * eigenvector2[1]).sqrt();
    eigenvector2[0] /= norm2;
    eigenvector2[1] /= norm2;
    
    // Calculate explained variance
    let total_variance = lambda1 + lambda2;
    let explained_variance1 = lambda1 / total_variance;
    let explained_variance2 = lambda2 / total_variance;
    
    // Project data onto principal components
    let mut projected = vec![0.0; num_points * num_components];
    
    for i in 0..num_points {
        let x = points[i * 2];
        let y = points[i * 2 + 1];
        
        projected[i * num_components] = x * eigenvector1[0] + y * eigenvector1[1];
        
        if num_components > 1 {
            projected[i * num_components + 1] = x * eigenvector2[0] + y * eigenvector2[1];
        }
    }
    
    // Create result object
    let result = Object::new();
    
    // Create components array
    let components_array = Float64Array::new_with_length((num_components * 2) as u32);
    components_array.set_index(0, eigenvector1[0]);
    components_array.set_index(1, eigenvector1[1]);
    
    if num_components > 1 {
        components_array.set_index(2, eigenvector2[0]);
        components_array.set_index(3, eigenvector2[1]);
    }
    
    // Create projected data array
    let projected_array = Float64Array::new_with_length((num_points * num_components) as u32);
    for (i, &value) in projected.iter().enumerate() {
        projected_array.set_index(i as u32, value);
    }
    
    // Create explained variance array
    let explained_variance_array = Float64Array::new_with_length(num_components as u32);
    explained_variance_array.set_index(0, explained_variance1);
    
    if num_components > 1 {
        explained_variance_array.set_index(1, explained_variance2);
    }
    
    // Set result properties
    Reflect::set(&result, &JsValue::from_str("components"), &components_array)?;
    Reflect::set(&result, &JsValue::from_str("projected"), &projected_array)?;
    Reflect::set(&result, &JsValue::from_str("explained_variance"), &explained_variance_array)?;
    Reflect::set(&result, &JsValue::from_str("mean_x"), &JsValue::from_f64(mean_x))?;
    Reflect::set(&result, &JsValue::from_str("mean_y"), &JsValue::from_f64(mean_y))?;
    
    Ok(result.into())
}
