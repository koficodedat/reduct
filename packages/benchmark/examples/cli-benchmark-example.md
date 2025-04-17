# CLI Benchmark Examples

This document provides examples of how to use the new benchmark command in the CLI.

## Listing Available Benchmark Types

```bash
reduct-benchmark benchmark list
```

This will display all available benchmark types grouped by category.

## Listing Operations for a Benchmark Type

```bash
reduct-benchmark benchmark operations list
```

This will display all available operations for the list benchmark type.

## Listing Special Cases for a Benchmark Type

```bash
reduct-benchmark benchmark special-cases sorting
```

This will display all available special cases for the sorting benchmark type.

## Running a Benchmark

```bash
reduct-benchmark benchmark list --operations get,map,filter
```

This will run benchmarks for the list data structure with the specified operations.

## Running a Benchmark with Specific Implementations

```bash
reduct-benchmark benchmark list --operations get,map --implementations reduct-list,native-array
```

This will run benchmarks for the list data structure with the specified operations and implementations.

## Running a Benchmark with a Special Case

```bash
reduct-benchmark benchmark sorting --operations quick-sort,merge-sort --special-case reversed
```

This will run benchmarks for sorting algorithms with the specified operations using the reversed special case.

## Running a Benchmark with Custom Input Sizes

```bash
reduct-benchmark benchmark list --operations get,map --sizes 100,1000,10000
```

This will run benchmarks for the list data structure with the specified operations and input sizes.

## Running a Benchmark with Custom Iterations

```bash
reduct-benchmark benchmark list --operations get,map --iterations 1000
```

This will run benchmarks for the list data structure with the specified operations and number of iterations.

## Saving Benchmark Results to a File

```bash
reduct-benchmark benchmark list --operations get,map --output-file list-benchmark.md
```

This will run benchmarks for the list data structure with the specified operations and save the results to a file.

## Using Different Output Formats

```bash
reduct-benchmark benchmark list --operations get,map --output html
```

This will run benchmarks for the list data structure with the specified operations and output the results in HTML format.

## Comparing Different Data Structures

```bash
reduct-benchmark adapter-compare reduct-list,reduct-map --operations get,set --size 1000
```

This will compare the performance of different data structures for the specified operations.

## Running a Complete Benchmark Suite

```bash
reduct-benchmark benchmark list
```

This will run all benchmarks for the list data structure with default settings.

## Running a Scalability Test

```bash
reduct-benchmark scalability list get --max-size 100000 --steps 5
```

This will measure how the performance of the get operation on lists scales with input size.
