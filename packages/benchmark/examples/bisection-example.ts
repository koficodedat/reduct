/**
 * Example script to demonstrate the bisection tool
 */
import { formatBisectionResultMarkdown } from '../src/utils/bisection';
import * as fs from 'fs';
import * as path from 'path';

// Define the output file
const outputFile = path.join(process.cwd(), 'packages/benchmark/bisection-example-results.json');
const markdownFile = path.join(process.cwd(), 'packages/benchmark/bisection-example-results.md');

// Perform bisection
console.log('Performing bisection...');

// In a real scenario, you would call performBisection with actual commits
// For this example, we'll just simulate the result
const simulatedResult = {
  firstBadCommit: {
    hash: '1234567890abcdef1234567890abcdef12345678',
    author: 'John Doe',
    date: new Date().toISOString(),
    message: 'Fix performance issue',
  },
  iterations: 5,
  testedCommits: [
    { hash: '1234567890abcdef1234567890abcdef12345678', isGood: false },
    { hash: '2345678901abcdef2345678901abcdef23456789', isGood: true },
    { hash: '3456789012abcdef3456789012abcdef34567890', isGood: true },
    { hash: '4567890123abcdef4567890123abcdef45678901', isGood: false },
    { hash: '5678901234abcdef5678901234abcdef56789012', isGood: true },
  ],
  startTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
  endTime: new Date().toISOString(),
  duration: 1000 * 60 * 5, // 5 minutes
};

// Save the result
fs.writeFileSync(outputFile, JSON.stringify(simulatedResult, null, 2));
console.log(`Bisection results saved to: ${outputFile}`);

// Format the result as markdown
const markdown = formatBisectionResultMarkdown(simulatedResult);
fs.writeFileSync(markdownFile, markdown);
console.log(`Bisection results (Markdown) saved to: ${markdownFile}`);

// Print the markdown
console.log('\nBisection Result:');
console.log(markdown);
