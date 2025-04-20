/**
 * Benchmark comparing WebAssembly-accelerated HAMTPersistentVector with regular HAMTPersistentVector
 */
import { HAMTPersistentVector, WasmHAMTPersistentVector, isWebAssemblySupported } from '../src';

console.log('WebAssembly-Accelerated HAMTPersistentVector Benchmark');
console.log('===================================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create test data
const sizes = [10, 100, 1000, 10000, 100000, 1000000];
const results: Record<string, Record<string, Record<string, number>>> = {};

for (const size of sizes) {
  console.log(`\nBenchmarking with size: ${size}`);
  results[size.toString()] = {
    'HAMTPersistentVector': {},
    'WasmHAMTPersistentVector': {}
  };

  // Create test data
  const data = Array.from({ length: size }, () => Math.random() * 1000);

  // Create vectors
  console.log('Creating vectors...');
  console.time('HAMTPersistentVector creation');
  const hamtVector = HAMTPersistentVector.from(data);
  console.timeEnd('HAMTPersistentVector creation');

  console.time('WasmHAMTPersistentVector creation');
  const wasmVector = WasmHAMTPersistentVector.from(data);
  console.timeEnd('WasmHAMTPersistentVector creation');

  // Benchmark map operation
  console.log('\nBenchmarking map operation...');
  console.time('HAMTPersistentVector map');
  const hamtMapResult = hamtVector.map(x => x * 2);
  console.timeEnd('HAMTPersistentVector map');
  results[size.toString()]['HAMTPersistentVector']['map'] = hamtMapResult.size;

  console.time('WasmHAMTPersistentVector map');
  const wasmMapResult = wasmVector.map(x => x * 2);
  console.timeEnd('WasmHAMTPersistentVector map');
  results[size.toString()]['WasmHAMTPersistentVector']['map'] = wasmMapResult.size;

  // Benchmark filter operation
  console.log('\nBenchmarking filter operation...');
  console.time('HAMTPersistentVector filter');
  const hamtFilterResult = hamtVector.filter(x => x > 500);
  console.timeEnd('HAMTPersistentVector filter');
  results[size.toString()]['HAMTPersistentVector']['filter'] = hamtFilterResult.size;

  console.time('WasmHAMTPersistentVector filter');
  const wasmFilterResult = wasmVector.filter(x => x > 500);
  console.timeEnd('WasmHAMTPersistentVector filter');
  results[size.toString()]['WasmHAMTPersistentVector']['filter'] = wasmFilterResult.size;

  // Benchmark reduce operation
  console.log('\nBenchmarking reduce operation...');
  console.time('HAMTPersistentVector reduce');
  const hamtReduceResult = hamtVector.reduce((acc, x) => acc + x, 0);
  console.timeEnd('HAMTPersistentVector reduce');
  results[size.toString()]['HAMTPersistentVector']['reduce'] = hamtReduceResult;

  console.time('WasmHAMTPersistentVector reduce');
  const wasmReduceResult = wasmVector.reduce((acc, x) => acc + x, 0);
  console.timeEnd('WasmHAMTPersistentVector reduce');
  results[size.toString()]['WasmHAMTPersistentVector']['reduce'] = wasmReduceResult;

  // Benchmark mapFilter operation
  console.log('\nBenchmarking mapFilter operation...');
  console.time('HAMTPersistentVector mapFilter');
  const hamtMapFilterResult = hamtVector.mapFilter(x => x * 2, x => x > 1000);
  console.timeEnd('HAMTPersistentVector mapFilter');
  results[size.toString()]['HAMTPersistentVector']['mapFilter'] = hamtMapFilterResult.size;

  console.time('WasmHAMTPersistentVector mapFilter');
  const wasmMapFilterResult = wasmVector.mapFilter(x => x * 2, x => x > 1000);
  console.timeEnd('WasmHAMTPersistentVector mapFilter');
  results[size.toString()]['WasmHAMTPersistentVector']['mapFilter'] = wasmMapFilterResult.size;

  // Benchmark filterMap operation
  console.log('\nBenchmarking filterMap operation...');
  console.time('HAMTPersistentVector filterMap');
  const hamtFilterMapResult = hamtVector.filterMap(x => x > 500, x => x * 2);
  console.timeEnd('HAMTPersistentVector filterMap');
  results[size.toString()]['HAMTPersistentVector']['filterMap'] = hamtFilterMapResult.size;

  console.time('WasmHAMTPersistentVector filterMap');
  const wasmFilterMapResult = wasmVector.filterMap(x => x > 500, x => x * 2);
  console.timeEnd('WasmHAMTPersistentVector filterMap');
  results[size.toString()]['WasmHAMTPersistentVector']['filterMap'] = wasmFilterMapResult.size;

  // Benchmark mapReduce operation
  console.log('\nBenchmarking mapReduce operation...');
  console.time('HAMTPersistentVector mapReduce');
  const hamtMapReduceResult = hamtVector.mapReduce(x => x * 2, (acc, x) => acc + x, 0);
  console.timeEnd('HAMTPersistentVector mapReduce');
  results[size.toString()]['HAMTPersistentVector']['mapReduce'] = hamtMapReduceResult;

  console.time('WasmHAMTPersistentVector mapReduce');
  const wasmMapReduceResult = wasmVector.mapReduce(x => x * 2, (acc, x) => acc + x, 0);
  console.timeEnd('WasmHAMTPersistentVector mapReduce');
  results[size.toString()]['WasmHAMTPersistentVector']['mapReduce'] = wasmMapReduceResult;

  // Benchmark filterReduce operation
  console.log('\nBenchmarking filterReduce operation...');
  console.time('HAMTPersistentVector filterReduce');
  const hamtFilterReduceResult = hamtVector.filterReduce(x => x > 500, (acc, x) => acc + x, 0);
  console.timeEnd('HAMTPersistentVector filterReduce');
  results[size.toString()]['HAMTPersistentVector']['filterReduce'] = hamtFilterReduceResult;

  console.time('WasmHAMTPersistentVector filterReduce');
  const wasmFilterReduceResult = wasmVector.filterReduce(x => x > 500, (acc, x) => acc + x, 0);
  console.timeEnd('WasmHAMTPersistentVector filterReduce');
  results[size.toString()]['WasmHAMTPersistentVector']['filterReduce'] = wasmFilterReduceResult;

  // Benchmark mapFilterReduce operation
  console.log('\nBenchmarking mapFilterReduce operation...');
  console.time('HAMTPersistentVector mapFilterReduce');
  const hamtMapFilterReduceResult = hamtVector.mapFilterReduce(
    x => x * 2,
    x => x > 1000,
    (acc, x) => acc + x,
    0
  );
  console.timeEnd('HAMTPersistentVector mapFilterReduce');
  results[size.toString()]['HAMTPersistentVector']['mapFilterReduce'] = hamtMapFilterReduceResult;

  console.time('WasmHAMTPersistentVector mapFilterReduce');
  const wasmMapFilterReduceResult = wasmVector.mapFilterReduce(
    x => x * 2,
    x => x > 1000,
    (acc, x) => acc + x,
    0
  );
  console.timeEnd('WasmHAMTPersistentVector mapFilterReduce');
  results[size.toString()]['WasmHAMTPersistentVector']['mapFilterReduce'] = wasmMapFilterReduceResult;

  // Benchmark specialized numeric operations
  if (typeof (wasmVector as any).sum === 'function') {
    console.log('\nBenchmarking specialized numeric operations...');
    
    // Sum
    console.time('HAMTPersistentVector sum (reduce)');
    const hamtSumResult = hamtVector.reduce((acc, x) => acc + x, 0);
    console.timeEnd('HAMTPersistentVector sum (reduce)');
    results[size.toString()]['HAMTPersistentVector']['sum'] = hamtSumResult;

    console.time('WasmHAMTPersistentVector sum');
    const wasmSumResult = (wasmVector as any).sum();
    console.timeEnd('WasmHAMTPersistentVector sum');
    results[size.toString()]['WasmHAMTPersistentVector']['sum'] = wasmSumResult;

    // Average
    console.time('HAMTPersistentVector average (reduce)');
    const hamtAvgResult = hamtVector.reduce((acc, x) => acc + x, 0) / hamtVector.size;
    console.timeEnd('HAMTPersistentVector average (reduce)');
    results[size.toString()]['HAMTPersistentVector']['average'] = hamtAvgResult;

    console.time('WasmHAMTPersistentVector average');
    const wasmAvgResult = (wasmVector as any).average();
    console.timeEnd('WasmHAMTPersistentVector average');
    results[size.toString()]['WasmHAMTPersistentVector']['average'] = wasmAvgResult;

    // Min
    console.time('HAMTPersistentVector min (reduce)');
    const hamtMinResult = hamtVector.reduce((acc, x) => Math.min(acc, x), Infinity);
    console.timeEnd('HAMTPersistentVector min (reduce)');
    results[size.toString()]['HAMTPersistentVector']['min'] = hamtMinResult;

    console.time('WasmHAMTPersistentVector min');
    const wasmMinResult = (wasmVector as any).min();
    console.timeEnd('WasmHAMTPersistentVector min');
    results[size.toString()]['WasmHAMTPersistentVector']['min'] = wasmMinResult;

    // Max
    console.time('HAMTPersistentVector max (reduce)');
    const hamtMaxResult = hamtVector.reduce((acc, x) => Math.max(acc, x), -Infinity);
    console.timeEnd('HAMTPersistentVector max (reduce)');
    results[size.toString()]['HAMTPersistentVector']['max'] = hamtMaxResult;

    console.time('WasmHAMTPersistentVector max');
    const wasmMaxResult = (wasmVector as any).max();
    console.timeEnd('WasmHAMTPersistentVector max');
    results[size.toString()]['WasmHAMTPersistentVector']['max'] = wasmMaxResult;

    // Median
    if (typeof (wasmVector as any).median === 'function') {
      console.time('HAMTPersistentVector median (manual)');
      const hamtSorted = [...hamtVector.toArray()].sort((a, b) => a - b);
      const hamtMedianResult = hamtSorted.length % 2 === 0
        ? (hamtSorted[hamtSorted.length / 2 - 1] + hamtSorted[hamtSorted.length / 2]) / 2
        : hamtSorted[Math.floor(hamtSorted.length / 2)];
      console.timeEnd('HAMTPersistentVector median (manual)');
      results[size.toString()]['HAMTPersistentVector']['median'] = hamtMedianResult;

      console.time('WasmHAMTPersistentVector median');
      const wasmMedianResult = (wasmVector as any).median();
      console.timeEnd('WasmHAMTPersistentVector median');
      results[size.toString()]['WasmHAMTPersistentVector']['median'] = wasmMedianResult;
    }

    // Standard Deviation
    if (typeof (wasmVector as any).standardDeviation === 'function') {
      console.time('HAMTPersistentVector standardDeviation (manual)');
      const hamtData = hamtVector.toArray();
      const hamtMean = hamtData.reduce((a, b) => a + b, 0) / hamtData.length;
      const hamtVariance = hamtData.reduce((a, b) => a + Math.pow(b - hamtMean, 2), 0) / hamtData.length;
      const hamtStdDevResult = Math.sqrt(hamtVariance);
      console.timeEnd('HAMTPersistentVector standardDeviation (manual)');
      results[size.toString()]['HAMTPersistentVector']['standardDeviation'] = hamtStdDevResult;

      console.time('WasmHAMTPersistentVector standardDeviation');
      const wasmStdDevResult = (wasmVector as any).standardDeviation();
      console.timeEnd('WasmHAMTPersistentVector standardDeviation');
      results[size.toString()]['WasmHAMTPersistentVector']['standardDeviation'] = wasmStdDevResult;
    }
  }
}

// Print summary
console.log('\n\nBenchmark Summary');
console.log('=================');

for (const size of sizes) {
  console.log(`\nSize: ${size}`);
  const sizeResults = results[size.toString()];
  
  for (const operation of Object.keys(sizeResults['HAMTPersistentVector'])) {
    const hamtResult = sizeResults['HAMTPersistentVector'][operation];
    const wasmResult = sizeResults['WasmHAMTPersistentVector'][operation];
    
    console.log(`${operation}:`);
    console.log(`  HAMTPersistentVector: ${hamtResult}`);
    console.log(`  WasmHAMTPersistentVector: ${wasmResult}`);
    
    // Check if results match
    if (typeof hamtResult === 'number' && typeof wasmResult === 'number') {
      const diff = Math.abs(hamtResult - wasmResult);
      const relDiff = hamtResult !== 0 ? diff / Math.abs(hamtResult) : diff;
      
      if (relDiff < 0.0001) {
        console.log('  Results match ✓');
      } else {
        console.log(`  Results differ! Relative difference: ${relDiff.toFixed(6)} ✗`);
      }
    }
  }
}

console.log('\nBenchmark completed.');
