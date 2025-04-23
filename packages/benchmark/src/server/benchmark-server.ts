/**
 * Server for collecting and aggregating benchmark results
 */

// Mock implementations for express and cors
type Express = {
  use: (middleware: any) => void;
  get: (path: string, handler: (req: any, res: any) => void) => void;
  post: (path: string, handler: (req: any, res: any) => void) => void;
  listen: (port: number, callback: () => void) => void;
};

type Response = {
  sendFile: (path: string) => void;
  json: (data: any) => void;
  status: (code: number) => { json: (data: any) => void };
};

type Request = {
  body: any;
  params: Record<string, string>;
};

const express = () => {
  const app: Express = {
    use: () => {},
    get: () => {},
    post: () => {},
    listen: () => {}
  };
  return app;
};

express.json = () => (_req: any, _res: any, next: any) => { next(); };
express.static = (_path: string) => (_req: any, _res: any, next: any) => { next(); };

const cors = () => (_req: any, _res: any, next: any) => { next(); };
import fs from 'fs';
import path from 'path';

import { BrowserBenchmarkResult } from '../browser/browser-benchmark-runner';

/**
 * Server configuration
 */
export interface BenchmarkServerConfig {
  /**
   * The port to listen on
   */
  port: number;

  /**
   * The directory to store benchmark results
   */
  resultsDir: string;
}

/**
 * Server for collecting and aggregating benchmark results
 */
export class BenchmarkServer {
  /**
   * The Express app
   */
  private app: Express;

  /**
   * The server configuration
   */
  private config: BenchmarkServerConfig;

  /**
   * Create a new benchmark server
   *
   * @param config The server configuration
   */
  constructor(config: BenchmarkServerConfig) {
    this.config = config;
    this.app = express();

    // Configure middleware
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.static(path.join(__dirname, '../browser')));

    // Create the results directory if it doesn't exist
    if (!fs.existsSync(this.config.resultsDir)) {
      fs.mkdirSync(this.config.resultsDir, { recursive: true });
    }

    // Configure routes
    this.configureRoutes();
  }

  /**
   * Configure the server routes
   */
  private configureRoutes(): void {
    // Serve the benchmark UI
    this.app.get('/', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../browser/index.html'));
    });

    // Serve the dashboard
    this.app.get('/dashboard', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, './dashboard.html'));
    });

    // API endpoint to receive benchmark results
    this.app.post('/api/benchmark-results', (req: Request, res: Response) => {
      try {
        const result = req.body as BrowserBenchmarkResult;

        // Validate the result
        if (!this.validateResult(result)) {
          return res.status(400).json({ error: 'Invalid benchmark result' });
        }

        // Save the result
        this.saveResult(result);

        // Return success
        res.json({ success: true });
      } catch (error) {
        console.error('Error processing benchmark result:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // API endpoint to get all benchmark results
    this.app.get('/api/benchmark-results', (_req: Request, res: Response) => {
      try {
        const results = this.getAllResults();
        res.json(results);
      } catch (error) {
        console.error('Error getting benchmark results:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // API endpoint to get aggregated benchmark results
    this.app.get('/api/benchmark-results/aggregated', (_req: Request, res: Response) => {
      try {
        const results = this.getAggregatedResults();
        res.json(results);
      } catch (error) {
        console.error('Error getting aggregated benchmark results:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // API endpoint to get benchmark results for a specific browser
    this.app.get('/api/benchmark-results/browser/:browser', (req: Request, res: Response) => {
      try {
        const browser = req.params.browser;
        const results = this.getResultsByBrowser(browser);
        res.json(results);
      } catch (error) {
        console.error('Error getting benchmark results by browser:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // API endpoint to get benchmark results for a specific operation
    this.app.get('/api/benchmark-results/operation/:operation', (req: Request, res: Response) => {
      try {
        const operation = req.params.operation;
        const results = this.getResultsByOperation(operation);
        res.json(results);
      } catch (error) {
        console.error('Error getting benchmark results by operation:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  /**
   * Validate a benchmark result
   *
   * @param result The benchmark result to validate
   * @returns Whether the result is valid
   */
  private validateResult(result: BrowserBenchmarkResult): boolean {
    // Check that all required fields are present
    return Boolean(
      result &&
      result.browserInfo &&
      result.operation &&
      result.inputSize &&
      result.sizeCategory &&
      result.dataTypeCategory &&
      result.tier &&
      result.executionTime &&
      result.iterations &&
      result.timestamp
    );
  }

  /**
   * Save a benchmark result
   *
   * @param result The benchmark result to save
   */
  private saveResult(result: BrowserBenchmarkResult): void {
    // Create a unique ID for the result
    const id = `${result.timestamp}-${Math.random().toString(36).substring(2, 15)}`;

    // Create the file path
    const filePath = path.join(this.config.resultsDir, `${id}.json`);

    // Save the result
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
  }

  /**
   * Get all benchmark results
   *
   * @returns All benchmark results
   */
  private getAllResults(): BrowserBenchmarkResult[] {
    // Get all result files
    const files = fs.readdirSync(this.config.resultsDir)
      .filter(file => file.endsWith('.json'));

    // Read and parse each file
    const results: BrowserBenchmarkResult[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(this.config.resultsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const result = JSON.parse(content) as BrowserBenchmarkResult;
        results.push(result);
      } catch (error) {
        console.error(`Error reading result file ${file}:`, error);
      }
    }

    return results;
  }

  /**
   * Get aggregated benchmark results
   *
   * @returns Aggregated benchmark results
   */
  private getAggregatedResults(): any {
    // Get all results
    const results = this.getAllResults();

    // Group results by browser, operation, size category, data type category, and tier
    const grouped: Record<string, BrowserBenchmarkResult[]> = {};

    for (const result of results) {
      const key = `${result.browserInfo.name}-${result.browserInfo.version}-${result.operation}-${result.sizeCategory}-${result.dataTypeCategory}-${result.inputSize}-${result.tier}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(result);
    }

    // Calculate average execution time for each group
    const aggregated: Record<string, any> = {};

    for (const [key, groupResults] of Object.entries(grouped)) {
      // Calculate average execution time
      const totalExecutionTime = groupResults.reduce((sum, result) => sum + result.executionTime, 0);
      const averageExecutionTime = totalExecutionTime / groupResults.length;

      // Get the first result for reference
      const reference = groupResults[0];

      // Create the aggregated result
      aggregated[key] = {
        browser: `${reference.browserInfo.name} ${reference.browserInfo.version}`,
        os: reference.browserInfo.os,
        deviceType: reference.browserInfo.deviceType,
        cpuArchitecture: reference.browserInfo.cpuArchitecture,
        cpuCores: reference.browserInfo.cpuCores,
        operation: reference.operation,
        inputSize: reference.inputSize,
        sizeCategory: reference.sizeCategory,
        dataTypeCategory: reference.dataTypeCategory,
        tier: reference.tier,
        averageExecutionTime,
        sampleCount: groupResults.length
      };
    }

    return Object.values(aggregated);
  }

  /**
   * Get benchmark results for a specific browser
   *
   * @param browser The browser name
   * @returns Benchmark results for the specified browser
   */
  private getResultsByBrowser(browser: string): BrowserBenchmarkResult[] {
    // Get all results
    const results = this.getAllResults();

    // Filter results by browser
    return results.filter(result =>
      result.browserInfo.name.toLowerCase() === browser.toLowerCase()
    );
  }

  /**
   * Get benchmark results for a specific operation
   *
   * @param operation The operation name
   * @returns Benchmark results for the specified operation
   */
  private getResultsByOperation(operation: string): BrowserBenchmarkResult[] {
    // Get all results
    const results = this.getAllResults();

    // Filter results by operation
    return results.filter(result =>
      result.operation.toLowerCase() === operation.toLowerCase()
    );
  }

  /**
   * Start the server
   */
  public start(): void {
    this.app.listen(this.config.port, () => {
      console.log(`Benchmark server listening on port ${this.config.port}`);
      console.log(`Open http://localhost:${this.config.port} in your browser to run benchmarks`);
    });
  }
}

/**
 * Start the benchmark server
 *
 * @param config The server configuration
 */
export function startBenchmarkServer(config: BenchmarkServerConfig): void {
  const server = new BenchmarkServer(config);
  server.start();
}

/**
 * Run the server from the command line
 */
if (require.main === module) {
  // Parse command line arguments
  const port = parseInt(process.env.PORT || '3000', 10);
  const resultsDir = process.env.RESULTS_DIR || path.join(process.cwd(), 'benchmark-results');

  // Start the server
  startBenchmarkServer({ port, resultsDir });
}
