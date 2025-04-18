# Reduct Scripts

This directory contains utility scripts for the Reduct project.

## Phase Two Baseline Benchmarks

### `run-phase-two-baseline.sh`

This script runs comprehensive benchmarks for the current implementations of Immutable List and Functional Map across multiple input sizes. It's used to establish baseline performance metrics for the Phase Two optimization work.

#### Usage

```bash
./scripts/run-phase-two-baseline.sh
```

#### What it does

1. Builds the benchmark package
2. Compiles the phase-two-baseline.ts script
3. Runs benchmarks for both data structures across multiple input sizes (100, 1000, 10000, 100000)
4. Runs scalability tests to measure how performance scales with input size
5. Compares our implementations against native JavaScript implementations
6. Saves all results in the `packages/benchmark/reports/phase-two-baseline-{timestamp}` directory
7. Creates a summary document with links to all benchmark results

#### Output

The script generates a comprehensive set of benchmark results in the `packages/benchmark/reports/phase-two-baseline-{timestamp}` directory, including:

- Individual benchmarks for each data structure at each input size
- Comparisons with native JavaScript implementations
- Scalability tests showing how performance scales with input size
- A summary document with links to all benchmark results

These benchmark results serve as a baseline for measuring the improvements made during the Phase Two optimization work.

#### Known Limitations

- When comparing Map with Object using very large datasets (100,000+ elements), the benchmark may fail with a buffer overflow error. As a temporary workaround, the script automatically reduces the size for map-object comparisons to 10,000 elements for larger datasets.
- This limitation will be addressed in Phase Two with enhancements to the benchmark package to handle large datasets more efficiently through parallel/child process execution.
