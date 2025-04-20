# WebAssembly Source Files

This directory contains the WebAssembly source files for the Reduct library.

## Structure

- `data-structures/`: WebAssembly implementations for data structures
  - `list.rs`: List operations in Rust
  - `map.rs`: Map operations in Rust
  - `set.rs`: Set operations in Rust
- `algorithms/`: WebAssembly implementations for algorithms
  - `sorting.rs`: Sorting algorithms in Rust
  - `searching.rs`: Searching algorithms in Rust
- `math/`: WebAssembly implementations for math operations
  - `vector.rs`: Vector operations in Rust
  - `matrix.rs`: Matrix operations in Rust

## Building

To build the WebAssembly modules, you need to have Rust and wasm-pack installed.

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack

# Build the WebAssembly modules
cd wasm
wasm-pack build
```

## Usage

The WebAssembly modules are loaded by the JavaScript code in the `src/` directory. See the `src/core/loader.ts` file for details on how the modules are loaded and used.

## Development

When developing new WebAssembly modules, follow these guidelines:

1. Create a new Rust file in the appropriate directory
2. Implement the required functions
3. Export the functions using the `#[wasm_bindgen]` attribute
4. Build the module using wasm-pack
5. Create a JavaScript wrapper in the `src/accelerators/` directory

## Example

```rust
// wasm/data-structures/list.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn vector_map(ptr: *const u8, len: usize, fn_ptr: &js_sys::Function) -> *mut u8 {
    // Implementation
}
```
