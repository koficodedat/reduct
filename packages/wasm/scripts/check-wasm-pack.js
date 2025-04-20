#!/usr/bin/env node

/**
 * This script checks if wasm-pack is installed and installs it if needed.
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');
const os = require('os');

// Check if wasm-pack is installed
function isWasmPackInstalled() {
  try {
    execSync('wasm-pack --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Install wasm-pack
function installWasmPack() {
  console.log('Installing wasm-pack...');
  
  try {
    // Check if Rust is installed
    execSync('rustc --version', { stdio: 'ignore' });
    
    // Install wasm-pack using cargo
    execSync('cargo install wasm-pack', { stdio: 'inherit' });
    
    console.log('wasm-pack installed successfully!');
  } catch (error) {
    console.error('Failed to install wasm-pack:', error.message);
    console.error('Please install Rust and wasm-pack manually:');
    console.error('1. Install Rust: https://www.rust-lang.org/tools/install');
    console.error('2. Install wasm-pack: https://rustwasm.github.io/wasm-pack/installer/');
    process.exit(1);
  }
}

// Main function
function main() {
  console.log('Checking if wasm-pack is installed...');
  
  if (isWasmPackInstalled()) {
    console.log('wasm-pack is already installed.');
  } else {
    console.log('wasm-pack is not installed.');
    installWasmPack();
  }
}

// Run the main function
main();
