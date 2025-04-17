# Analysis Tools

The benchmark package includes advanced analysis tools for gaining deeper insights into benchmark results. These tools help you understand the statistical properties of your benchmarks and track performance over time.

## Statistical Analysis

Statistical analysis provides metrics like mean, median, standard deviation, and confidence intervals for benchmark results. This helps you understand the variability and reliability of your measurements.

### Using the CLI

```bash
# Analyze benchmark results from a JSON file
npx reduct-benchmark analyze results.json

# Specify output file
npx reduct-benchmark analyze results.json -o analysis.txt

# Customize analysis options
npx reduct-benchmark analyze results.json -p 6 -m zscore -t 2 -c 0.99
```

### Options

- `-o, --output <file>`: Output file for analysis results
- `-p, --precision <number>`: Number of decimal places for output (default: 4)
- `-m, --method <method>`: Method for outlier detection (iqr, zscore) (default: iqr)
- `-t, --threshold <number>`: Threshold for outlier detection (default: 1.5)
- `-c, --confidence <number>`: Confidence level for intervals (0-1) (default: 0.95)

### Using the API

```typescript
import { 
  analyzeBenchmarkResults, 
  formatStatisticalAnalysis 
} from '@reduct/benchmark';

// Analyze benchmark results
const analysis = analyzeBenchmarkResults(benchmarkResults, {
  outlierDetectionMethod: 'iqr',
  outlierThreshold: 1.5,
  confidenceLevel: 0.95
});

// Format the analysis
const formatted = formatStatisticalAnalysis(analysis);
console.log(formatted);
```

## Trend Analysis

Trend analysis tracks benchmark results over time, allowing you to visualize performance trends and detect regressions. This is useful for monitoring the impact of code changes on performance.

### Recording Benchmark Results

Before you can analyze trends, you need to record benchmark results:

```bash
# Record benchmark results from a JSON file
npx reduct-benchmark trend record results.json

# Specify history directory
npx reduct-benchmark trend record results.json -d ./my-history

# Limit the number of runs to keep
npx reduct-benchmark trend record results.json --max-runs 50
```

You can also record results directly when running benchmarks:

```bash
# Run a comparison and record the results
npx reduct-benchmark adapter-compare reduct-list native-array -r
```

### Analyzing Trends

```bash
# Analyze trends for a specific benchmark
npx reduct-benchmark trend comparison-get

# Generate HTML report
npx reduct-benchmark trend comparison-get -f html -o trends.html

# Filter by implementation
npx reduct-benchmark trend comparison-get -i reduct-list

# Include ASCII chart in text output
npx reduct-benchmark trend comparison-get -c
```

### Options

- `-d, --dir <directory>`: Directory containing benchmark history (default: .benchmark-history)
- `-o, --output <file>`: Output file for trend analysis
- `-f, --format <format>`: Output format (text, html) (default: text)
- `-i, --implementation <name>`: Filter by implementation name
- `-t, --threshold <number>`: Threshold for regression detection (0-1) (default: 0.1)
- `-b, --baseline <number>`: Number of runs to use for baseline (default: 3)
- `-c, --chart`: Include ASCII chart in text output

### Using the API

```typescript
import { 
  loadBenchmarkHistory, 
  detectRegressions, 
  formatTrendAnalysisResult,
  generateTrendHtml
} from '@reduct/benchmark';

// Load benchmark history
const history = loadBenchmarkHistory('.benchmark-history', 'comparison-get');

// Detect regressions
const trends = detectRegressions(history, {
  regressionThreshold: 0.1,
  baselineRuns: 3
});

// Format the results
for (const trend of trends) {
  console.log(formatTrendAnalysisResult(trend));
}

// Generate HTML report
const html = generateTrendHtml(trends);
```

## Example Workflow

Here's a typical workflow for using the analysis tools:

1. Run benchmarks and record results:
   ```bash
   npx reduct-benchmark adapter-compare reduct-list native-array -r
   ```

2. Analyze the statistical properties:
   ```bash
   npx reduct-benchmark analyze results.json
   ```

3. After making code changes, run the benchmarks again:
   ```bash
   npx reduct-benchmark adapter-compare reduct-list native-array -r
   ```

4. Analyze trends to detect regressions:
   ```bash
   npx reduct-benchmark trend comparison-get
   ```

5. Generate an HTML report for visualization:
   ```bash
   npx reduct-benchmark trend comparison-get -f html -o trends.html
   ```

This workflow helps you understand the performance characteristics of your code and track changes over time.
