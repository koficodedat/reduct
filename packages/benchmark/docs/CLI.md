# CLI Documentation

The `@reduct/benchmark` package provides a powerful command-line interface (CLI) for running benchmarks, comparing implementations, and exporting results.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Commands](#commands)
  - [run](#run-command)
  - [compare](#compare-command)
  - [adapter-compare](#adapter-compare-command)
  - [scalability](#scalability-command)
  - [export](#export-command)
  - [template-export](#template-export-command)
- [Global Options](#global-options)
- [Examples](#examples)

## Installation

The CLI is included with the `@reduct/benchmark` package:

```bash
# Using npm
npm install @reduct/benchmark

# Using yarn
yarn add @reduct/benchmark

# Using pnpm
pnpm add @reduct/benchmark
```

## Basic Usage

The CLI can be invoked using `npx`:

```bash
npx reduct-benchmark [command] [options]
```

Or by adding a script to your `package.json`:

```json
{
  "scripts": {
    "benchmark": "reduct-benchmark"
  }
}
```

Then run:

```bash
npm run benchmark -- [command] [options]
```

## Commands

The CLI provides the following commands:

### `run` Command

Run benchmarks for a specific data structure or algorithm.

```bash
npx reduct-benchmark run <type> [options]
```

#### Arguments

- `type`: The type of data structure or algorithm to benchmark (list, map, stack, sorting, searching)

#### Options

- `-s, --size <number>`: Size of the data structure to test (default: 10000)
- `-i, --iterations <number>`: Number of iterations for each benchmark (default: 100)
- `--output <format>`: Output format (console, csv, md, html) (default: console)
- `-f, --output-file <file>`: Output file path
- `--chart-type <type>`: Chart type for HTML output (bar, line, pie) (default: bar)
- `--log-scale`: Use logarithmic scale for charts

#### Examples

```bash
# Run benchmarks for the List data structure
npx reduct-benchmark run list -s 10000

# Run benchmarks for sorting algorithms
npx reduct-benchmark run sorting -s 1000 --output html -f sorting-results.html

# Run benchmarks for Map with custom iterations
npx reduct-benchmark run map -s 5000 -i 50
```

### `compare` Command

Compare different implementations of a data structure or algorithm.

```bash
npx reduct-benchmark compare <type> <implementation> [options]
```

#### Arguments

- `type`: The type of data structure or algorithm to benchmark (list, map, stack, sorting, searching)
- `implementation`: The implementation to compare with (array, object, etc.)

#### Options

- `-s, --size <number>`: Size of the data structure to test (default: 10000)
- `-i, --iterations <number>`: Number of iterations for each benchmark (default: 100)
- `--output <format>`: Output format (console, csv, md, html) (default: console)
- `-f, --output-file <file>`: Output file path
- `--chart-type <type>`: Chart type for HTML output (bar, line, pie) (default: bar)
- `--log-scale`: Use logarithmic scale for charts

#### Examples

```bash
# Compare List with native Array
npx reduct-benchmark compare list array -s 10000

# Compare Map with native Map and Object
npx reduct-benchmark compare map object -s 5000 --output md -f map-comparison.md

# Compare Stack with native Array
npx reduct-benchmark compare stack array -s 1000 --output html -f stack-comparison.html
```

### `adapter-compare` Command

Compare different implementations using the operation adapter system.

```bash
npx reduct-benchmark adapter-compare <implementation1> <implementation2> [options]
```

#### Arguments

- `implementation1`: First implementation ID (e.g., reduct-list)
- `implementation2`: Second implementation ID (e.g., native-array)

#### Options

- `-s, --size <number>`: Size of the data structure to test (default: 10000)
- `-i, --iterations <number>`: Number of iterations for each benchmark (default: 100)
- `-o, --operations <list>`: Comma-separated list of operations to compare (default: all)
- `--output <format>`: Output format (console, csv, md, html) (default: console)
- `-f, --output-file <file>`: Output file path
- `--chart-type <type>`: Chart type for HTML output (bar, line, pie) (default: bar)
- `--log-scale`: Use logarithmic scale for charts

#### Examples

```bash
# Compare List with native Array using adapters
npx reduct-benchmark adapter-compare reduct-list native-array -s 10000

# Compare specific operations
npx reduct-benchmark adapter-compare reduct-list native-array -o get,map,filter -s 5000

# Compare Map implementations
npx reduct-benchmark adapter-compare reduct-map native-map -o get,set,has -s 1000
```

### `scalability` Command

Measure how performance scales with input size.

```bash
npx reduct-benchmark scalability <type> <operation> [options]
```

#### Arguments

- `type`: The type of data structure or algorithm to benchmark (list, map, stack, sorting, searching)
- `operation`: The operation to test (get, map, filter, etc.)

#### Options

- `-m, --max-size <number>`: Maximum size to test (default: 100000)
- `-s, --steps <number>`: Number of size steps (default: 5)
- `-i, --iterations <number>`: Number of iterations for each benchmark (default: 100)
- `--output <format>`: Output format (console, csv, md, html) (default: console)
- `-f, --output-file <file>`: Output file path
- `--chart-type <type>`: Chart type for HTML output (bar, line, pie) (default: line)
- `--log-scale`: Use logarithmic scale for charts

#### Examples

```bash
# Measure scalability of List.get operation
npx reduct-benchmark scalability list get -s 5 -m 100000

# Measure scalability of Map.has operation
npx reduct-benchmark scalability map has -s 10 -m 50000 --output html -f map-scalability.html

# Measure scalability of quicksort
npx reduct-benchmark scalability sorting quicksort -s 5 -m 10000
```

### `export` Command

Export benchmark results to different formats.

```bash
npx reduct-benchmark export <format> [options]
```

#### Arguments

- `format`: Output format (csv, md, html)

#### Options

- `-i, --input <file>`: Input file path (JSON)
- `-o, --output <file>`: Output file path
- `--chart-type <type>`: Chart type for HTML output (bar, line, pie) (default: bar)
- `--log-scale`: Use logarithmic scale for charts
- `--title <title>`: Title for the output
- `--description <description>`: Description for the output

#### Examples

```bash
# Export results to HTML
npx reduct-benchmark export html -i benchmark-results.json -o results.html

# Export results to CSV
npx reduct-benchmark export csv -i benchmark-results.json -o results.csv

# Export results to Markdown
npx reduct-benchmark export md -i benchmark-results.json -o results.md
```

### `template-export` Command

Export benchmark results using a custom template.

```bash
npx reduct-benchmark template-export <format> [options]
```

#### Arguments

- `format`: Output format (csv, md, html)

#### Options

- `-i, --input <file>`: Input file path (JSON)
- `-o, --output <file>`: Output file path
- `-t, --template <name>`: Template name
- `--chart-type <type>`: Chart type for HTML output (bar, line, pie) (default: bar)
- `--log-scale`: Use logarithmic scale for charts
- `--title <title>`: Title for the output
- `--description <description>`: Description for the output

#### Examples

```bash
# Export results using a custom template
npx reduct-benchmark template-export html -i benchmark-results.json -o results.html -t html-comparison

# Export results using a custom template with a title
npx reduct-benchmark template-export html -i benchmark-results.json -o results.html -t html-comparison --title "List Comparison"
```

## Global Options

The following options are available for all commands:

- `-h, --help`: Display help for command
- `-V, --version`: Display version number

## Examples

### Running a Simple Benchmark

```bash
npx reduct-benchmark run list -s 10000
```

This will run benchmarks for the List data structure with a size of 10,000 elements and display the results in the console.

### Comparing Implementations

```bash
npx reduct-benchmark compare list array -s 10000 --output html -f list-comparison.html
```

This will compare the List implementation with native JavaScript arrays, with a size of 10,000 elements, and export the results to an HTML file.

### Measuring Scalability

```bash
npx reduct-benchmark scalability list get -s 5 -m 100000 --output html -f list-scalability.html
```

This will measure how the performance of the List.get operation scales with input size, from 20,000 to 100,000 elements in 5 steps, and export the results to an HTML file.

### Using Operation Adapters

```bash
npx reduct-benchmark adapter-compare reduct-list native-array -o get,map,filter -s 10000
```

This will compare the Reduct List implementation with native JavaScript arrays using the operation adapter system, focusing on the get, map, and filter operations.

### Exporting Results

```bash
npx reduct-benchmark export html -i benchmark-results.json -o results.html --chart-type bar --log-scale
```

This will export the benchmark results from a JSON file to an HTML file with bar charts using a logarithmic scale.

### Using Custom Templates

```bash
npx reduct-benchmark template-export html -i benchmark-results.json -o results.html -t html-comparison --title "List Comparison"
```

This will export the benchmark results using a custom HTML template with a specified title.
