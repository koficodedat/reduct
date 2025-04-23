#!/usr/bin/env node
/**
 * CLI script to send notifications about performance regressions
 */
import * as path from 'path';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { sendNotifications, NotificationChannel } from '../utils/notification';
import { detectRegressions } from '../utils/regression-detection';


// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('results-dir', {
    alias: 'r',
    type: 'string',
    description: 'Directory containing benchmark results',
    default: path.join(process.cwd(), 'packages/benchmark/reports'),
  })
  .option('history-length', {
    alias: 'hl',
    type: 'number',
    description: 'Number of historical results to compare with',
    default: 5,
  })
  .option('regression-threshold', {
    alias: 't',
    type: 'number',
    description: 'Threshold for regression detection (percentage)',
    default: 10,
  })
  .option('improvement-threshold', {
    alias: 'i',
    type: 'number',
    description: 'Threshold for improvement detection (percentage)',
    default: 10,
  })
  .option('ignore-small-changes', {
    alias: 's',
    type: 'boolean',
    description: 'Whether to ignore small changes',
    default: true,
  })
  .option('small-change-threshold', {
    alias: 'c',
    type: 'number',
    description: 'Threshold for small changes (milliseconds)',
    default: 0.1,
  })
  .option('channels', {
    alias: 'ch',
    type: 'array',
    description: 'Notification channels to use',
    default: ['console'],
    choices: Object.values(NotificationChannel),
  })
  .option('slack-webhook-url', {
    type: 'string',
    description: 'Slack webhook URL',
  })
  .option('github-owner', {
    type: 'string',
    description: 'GitHub repository owner',
  })
  .option('github-repo', {
    type: 'string',
    description: 'GitHub repository name',
  })
  .option('github-token', {
    type: 'string',
    description: 'GitHub token',
  })
  .option('email-recipients', {
    type: 'array',
    description: 'Email recipients',
  })
  .option('email-sender', {
    type: 'string',
    description: 'Email sender',
  })
  .option('email-subject', {
    type: 'string',
    description: 'Email subject',
    default: 'Performance Regression Alert',
  })
  .option('notification-threshold', {
    type: 'number',
    description: 'Notification threshold (percentage)',
    default: 10,
  })
  .option('include-improvements', {
    type: 'boolean',
    description: 'Whether to include improvements in notifications',
    default: true,
  })
  .option('include-new-benchmarks', {
    type: 'boolean',
    description: 'Whether to include new benchmarks in notifications',
    default: false,
  })
  .option('include-missing-benchmarks', {
    type: 'boolean',
    description: 'Whether to include missing benchmarks in notifications',
    default: false,
  })
  .help()
  .alias('help', 'h')
  .parseSync();

// Detect regressions
console.log('Detecting performance regressions...');
console.log(`Results directory: ${argv.resultsDir}`);
console.log(`History length: ${argv.historyLength}`);
console.log(`Regression threshold: ${argv.regressionThreshold}%`);
console.log(`Improvement threshold: ${argv.improvementThreshold}%`);
console.log(`Ignore small changes: ${argv.ignoreSmallChanges}`);
console.log(`Small change threshold: ${argv.smallChangeThreshold}ms`);
console.log('');

const regressionResult = detectRegressions({
  resultsDir: argv.resultsDir,
  historyLength: argv.historyLength,
  regressionThreshold: argv.regressionThreshold,
  improvementThreshold: argv.improvementThreshold,
  ignoreSmallChanges: argv.ignoreSmallChanges,
  smallChangeThreshold: argv.smallChangeThreshold,
});

// Send notifications
console.log('Sending notifications...');
console.log(`Channels: ${argv.channels.join(', ')}`);
console.log(`Notification threshold: ${argv.notificationThreshold}%`);
console.log(`Include improvements: ${argv.includeImprovements}`);
console.log(`Include new benchmarks: ${argv.includeNewBenchmarks}`);
console.log(`Include missing benchmarks: ${argv.includeMissingBenchmarks}`);
console.log('');

sendNotifications({
  regressionResult,
  channels: argv.channels as NotificationChannel[],
  slackWebhookUrl: argv.slackWebhookUrl,
  githubOwner: argv.githubOwner,
  githubRepo: argv.githubRepo,
  githubToken: argv.githubToken,
  emailRecipients: argv.emailRecipients as string[],
  emailSender: argv.emailSender,
  emailSubject: argv.emailSubject,
  notificationThreshold: argv.notificationThreshold,
  includeImprovements: argv.includeImprovements,
  includeNewBenchmarks: argv.includeNewBenchmarks,
  includeMissingBenchmarks: argv.includeMissingBenchmarks,
}).catch(error => {
  console.error('Error sending notifications:', error);
  process.exit(1);
});
