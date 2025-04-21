use wasm_bindgen::prelude::*;
use js_sys::{Uint8Array};
use flate2::Compression;
use flate2::write::{GzEncoder, GzDecoder, DeflateEncoder, DeflateDecoder, ZlibEncoder, ZlibDecoder};
use std::io::Write;

/// Compression algorithm enum
#[wasm_bindgen]
pub enum CompressionAlgorithm {
    Gzip,
    Deflate,
    Zlib,
}

/// Compression level enum
#[wasm_bindgen]
pub enum CompressionLevel {
    None,
    Fast,
    Default,
    Best,
}

/// Convert CompressionLevel to flate2::Compression
fn to_compression_level(level: CompressionLevel) -> Compression {
    match level {
        CompressionLevel::None => Compression::none(),
        CompressionLevel::Fast => Compression::fast(),
        CompressionLevel::Default => Compression::default(),
        CompressionLevel::Best => Compression::best(),
    }
}

/// Compress text using the specified algorithm
///
/// Takes a text string, compression algorithm, and compression level, and returns compressed bytes.
#[wasm_bindgen]
pub fn compress_text(text: &str, algorithm: CompressionAlgorithm, level: CompressionLevel) -> Result<JsValue, JsValue> {
    // Get the compression level
    let compression = to_compression_level(level);
    
    // Compress the text
    let mut compressed = Vec::new();
    
    match algorithm {
        CompressionAlgorithm::Gzip => {
            let mut encoder = GzEncoder::new(&mut compressed, compression);
            if let Err(err) = encoder.write_all(text.as_bytes()) {
                return Err(JsValue::from_str(&format!("Failed to compress text: {}", err)));
            }
            if let Err(err) = encoder.finish() {
                return Err(JsValue::from_str(&format!("Failed to finish compression: {}", err)));
            }
        },
        CompressionAlgorithm::Deflate => {
            let mut encoder = DeflateEncoder::new(&mut compressed, compression);
            if let Err(err) = encoder.write_all(text.as_bytes()) {
                return Err(JsValue::from_str(&format!("Failed to compress text: {}", err)));
            }
            if let Err(err) = encoder.finish() {
                return Err(JsValue::from_str(&format!("Failed to finish compression: {}", err)));
            }
        },
        CompressionAlgorithm::Zlib => {
            let mut encoder = ZlibEncoder::new(&mut compressed, compression);
            if let Err(err) = encoder.write_all(text.as_bytes()) {
                return Err(JsValue::from_str(&format!("Failed to compress text: {}", err)));
            }
            if let Err(err) = encoder.finish() {
                return Err(JsValue::from_str(&format!("Failed to finish compression: {}", err)));
            }
        },
    }
    
    // Create a Uint8Array for the result
    let result = Uint8Array::new_with_length(compressed.len() as u32);
    
    // Copy the compressed bytes to the result
    for (i, &byte) in compressed.iter().enumerate() {
        result.set_index(i as u32, byte);
    }
    
    Ok(result.into())
}

/// Decompress bytes using the specified algorithm
///
/// Takes compressed bytes and compression algorithm, and returns the decompressed text.
#[wasm_bindgen]
pub fn decompress_bytes(bytes: &JsValue, algorithm: CompressionAlgorithm) -> Result<String, JsValue> {
    // Convert input to Uint8Array
    let bytes_array = Uint8Array::new(bytes);
    let length = bytes_array.length() as usize;
    
    // Copy bytes to a Rust vector
    let mut bytes_vec = vec![0u8; length];
    for i in 0..length {
        bytes_vec[i] = bytes_array.get_index(i as u32);
    }
    
    // Decompress the bytes
    let mut decompressed = Vec::new();
    
    match algorithm {
        CompressionAlgorithm::Gzip => {
            let mut decoder = GzDecoder::new(&mut decompressed);
            if let Err(err) = decoder.write_all(&bytes_vec) {
                return Err(JsValue::from_str(&format!("Failed to decompress bytes: {}", err)));
            }
            if let Err(err) = decoder.finish() {
                return Err(JsValue::from_str(&format!("Failed to finish decompression: {}", err)));
            }
        },
        CompressionAlgorithm::Deflate => {
            let mut decoder = DeflateDecoder::new(&mut decompressed);
            if let Err(err) = decoder.write_all(&bytes_vec) {
                return Err(JsValue::from_str(&format!("Failed to decompress bytes: {}", err)));
            }
            if let Err(err) = decoder.finish() {
                return Err(JsValue::from_str(&format!("Failed to finish decompression: {}", err)));
            }
        },
        CompressionAlgorithm::Zlib => {
            let mut decoder = ZlibDecoder::new(&mut decompressed);
            if let Err(err) = decoder.write_all(&bytes_vec) {
                return Err(JsValue::from_str(&format!("Failed to decompress bytes: {}", err)));
            }
            if let Err(err) = decoder.finish() {
                return Err(JsValue::from_str(&format!("Failed to finish decompression: {}", err)));
            }
        },
    }
    
    // Convert the decompressed bytes to a string
    match String::from_utf8(decompressed) {
        Ok(text) => Ok(text),
        Err(err) => Err(JsValue::from_str(&format!("Failed to convert decompressed bytes to string: {}", err))),
    }
}

/// Calculate the compression ratio
///
/// Takes original size and compressed size, and returns the compression ratio.
#[wasm_bindgen]
pub fn compression_ratio(original_size: usize, compressed_size: usize) -> f64 {
    if original_size == 0 {
        return 0.0;
    }
    
    1.0 - (compressed_size as f64 / original_size as f64)
}

/// Run-length encoding (RLE) compression
///
/// Takes a text string and returns RLE-compressed bytes.
#[wasm_bindgen]
pub fn rle_compress(text: &str) -> Result<JsValue, JsValue> {
    if text.is_empty() {
        return Ok(Uint8Array::new_with_length(0).into());
    }
    
    let bytes = text.as_bytes();
    let mut compressed = Vec::new();
    
    let mut current_char = bytes[0];
    let mut count = 1;
    
    for &byte in bytes.iter().skip(1) {
        if byte == current_char && count < 255 {
            count += 1;
        } else {
            compressed.push(count);
            compressed.push(current_char);
            current_char = byte;
            count = 1;
        }
    }
    
    // Add the last character
    compressed.push(count);
    compressed.push(current_char);
    
    // Create a Uint8Array for the result
    let result = Uint8Array::new_with_length(compressed.len() as u32);
    
    // Copy the compressed bytes to the result
    for (i, &byte) in compressed.iter().enumerate() {
        result.set_index(i as u32, byte);
    }
    
    Ok(result.into())
}

/// Run-length encoding (RLE) decompression
///
/// Takes RLE-compressed bytes and returns the decompressed text.
#[wasm_bindgen]
pub fn rle_decompress(bytes: &JsValue) -> Result<String, JsValue> {
    // Convert input to Uint8Array
    let bytes_array = Uint8Array::new(bytes);
    let length = bytes_array.length() as usize;
    
    if length == 0 {
        return Ok(String::new());
    }
    
    if length % 2 != 0 {
        return Err(JsValue::from_str("Invalid RLE-compressed data"));
    }
    
    // Copy bytes to a Rust vector
    let mut bytes_vec = vec![0u8; length];
    for i in 0..length {
        bytes_vec[i] = bytes_array.get_index(i as u32);
    }
    
    // Decompress the bytes
    let mut decompressed = Vec::new();
    
    for i in (0..length).step_by(2) {
        let count = bytes_vec[i];
        let byte = bytes_vec[i + 1];
        
        for _ in 0..count {
            decompressed.push(byte);
        }
    }
    
    // Convert the decompressed bytes to a string
    match String::from_utf8(decompressed) {
        Ok(text) => Ok(text),
        Err(err) => Err(JsValue::from_str(&format!("Failed to convert decompressed bytes to string: {}", err))),
    }
}

/// Huffman encoding compression
///
/// Takes a text string and returns Huffman-encoded bytes.
#[wasm_bindgen]
pub fn huffman_compress(text: &str) -> Result<JsValue, JsValue> {
    if text.is_empty() {
        return Ok(Uint8Array::new_with_length(0).into());
    }
    
    // Count character frequencies
    let mut frequencies = std::collections::HashMap::new();
    for &byte in text.as_bytes() {
        *frequencies.entry(byte).or_insert(0) += 1;
    }
    
    // Build Huffman tree
    let mut heap = std::collections::BinaryHeap::new();
    for (&byte, &freq) in &frequencies {
        heap.push(std::cmp::Reverse(HuffmanNode::new_leaf(byte, freq)));
    }
    
    while heap.len() > 1 {
        let left = heap.pop().unwrap().0;
        let right = heap.pop().unwrap().0;
        
        let parent = HuffmanNode::new_internal(left.freq + right.freq, left, right);
        heap.push(std::cmp::Reverse(parent));
    }
    
    let root = heap.pop().unwrap().0;
    
    // Build Huffman codes
    let mut codes = std::collections::HashMap::new();
    build_codes(&root, Vec::new(), &mut codes);
    
    // Encode the text
    let mut encoded_bits = Vec::new();
    for &byte in text.as_bytes() {
        let code = codes.get(&byte).unwrap();
        encoded_bits.extend_from_slice(code);
    }
    
    // Pack bits into bytes
    let mut encoded_bytes = Vec::new();
    for chunk in encoded_bits.chunks(8) {
        let mut byte = 0u8;
        for (i, &bit) in chunk.iter().enumerate() {
            if bit {
                byte |= 1 << (7 - i);
            }
        }
        encoded_bytes.push(byte);
    }
    
    // Create header with character frequencies
    let mut header = Vec::new();
    header.push(frequencies.len() as u8);
    
    for (&byte, &freq) in &frequencies {
        header.push(byte);
        header.extend_from_slice(&freq.to_be_bytes());
    }
    
    // Combine header and encoded bytes
    let mut compressed = Vec::new();
    compressed.extend_from_slice(&header);
    compressed.extend_from_slice(&encoded_bytes);
    
    // Create a Uint8Array for the result
    let result = Uint8Array::new_with_length(compressed.len() as u32);
    
    // Copy the compressed bytes to the result
    for (i, &byte) in compressed.iter().enumerate() {
        result.set_index(i as u32, byte);
    }
    
    Ok(result.into())
}

/// Huffman encoding decompression
///
/// Takes Huffman-encoded bytes and returns the decompressed text.
#[wasm_bindgen]
pub fn huffman_decompress(bytes: &JsValue) -> Result<String, JsValue> {
    // Convert input to Uint8Array
    let bytes_array = Uint8Array::new(bytes);
    let length = bytes_array.length() as usize;
    
    if length == 0 {
        return Ok(String::new());
    }
    
    // Copy bytes to a Rust vector
    let mut bytes_vec = vec![0u8; length];
    for i in 0..length {
        bytes_vec[i] = bytes_array.get_index(i as u32);
    }
    
    // Parse header
    let num_chars = bytes_vec[0] as usize;
    let mut frequencies = std::collections::HashMap::new();
    
    let mut i = 1;
    for _ in 0..num_chars {
        let byte = bytes_vec[i];
        i += 1;
        
        let freq = u32::from_be_bytes([
            bytes_vec[i],
            bytes_vec[i + 1],
            bytes_vec[i + 2],
            bytes_vec[i + 3],
        ]);
        i += 4;
        
        frequencies.insert(byte, freq);
    }
    
    // Rebuild Huffman tree
    let mut heap = std::collections::BinaryHeap::new();
    for (&byte, &freq) in &frequencies {
        heap.push(std::cmp::Reverse(HuffmanNode::new_leaf(byte, freq)));
    }
    
    while heap.len() > 1 {
        let left = heap.pop().unwrap().0;
        let right = heap.pop().unwrap().0;
        
        let parent = HuffmanNode::new_internal(left.freq + right.freq, left, right);
        heap.push(std::cmp::Reverse(parent));
    }
    
    let root = heap.pop().unwrap().0;
    
    // Decode the text
    let mut decoded = Vec::new();
    let mut node = &root;
    
    for j in i..length {
        let byte = bytes_vec[j];
        
        for bit_idx in 0..8 {
            let bit = (byte >> (7 - bit_idx)) & 1 == 1;
            
            if bit {
                node = node.right.as_ref().unwrap();
            } else {
                node = node.left.as_ref().unwrap();
            }
            
            if node.is_leaf() {
                decoded.push(node.byte.unwrap());
                node = &root;
            }
        }
    }
    
    // Convert the decoded bytes to a string
    match String::from_utf8(decoded) {
        Ok(text) => Ok(text),
        Err(err) => Err(JsValue::from_str(&format!("Failed to convert decoded bytes to string: {}", err))),
    }
}

/// Huffman tree node
#[derive(Clone)]
struct HuffmanNode {
    freq: u32,
    byte: Option<u8>,
    left: Option<Box<HuffmanNode>>,
    right: Option<Box<HuffmanNode>>,
}

impl HuffmanNode {
    fn new_leaf(byte: u8, freq: u32) -> Self {
        HuffmanNode {
            freq,
            byte: Some(byte),
            left: None,
            right: None,
        }
    }
    
    fn new_internal(freq: u32, left: HuffmanNode, right: HuffmanNode) -> Self {
        HuffmanNode {
            freq,
            byte: None,
            left: Some(Box::new(left)),
            right: Some(Box::new(right)),
        }
    }
    
    fn is_leaf(&self) -> bool {
        self.left.is_none() && self.right.is_none()
    }
}

impl PartialEq for HuffmanNode {
    fn eq(&self, other: &Self) -> bool {
        self.freq == other.freq
    }
}

impl Eq for HuffmanNode {}

impl PartialOrd for HuffmanNode {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        other.freq.partial_cmp(&self.freq)
    }
}

impl Ord for HuffmanNode {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        other.freq.cmp(&self.freq)
    }
}

/// Build Huffman codes
fn build_codes(node: &HuffmanNode, code: Vec<bool>, codes: &mut std::collections::HashMap<u8, Vec<bool>>) {
    if let Some(byte) = node.byte {
        codes.insert(byte, code);
    } else {
        let mut left_code = code.clone();
        left_code.push(false);
        build_codes(node.left.as_ref().unwrap(), left_code, codes);
        
        let mut right_code = code;
        right_code.push(true);
        build_codes(node.right.as_ref().unwrap(), right_code, codes);
    }
}
