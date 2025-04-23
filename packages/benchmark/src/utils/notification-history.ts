/**
 * Notification history tracking
 */
import * as fs from 'fs';
import * as path from 'path';

import { RegressionDetectionResult } from './regression-detection';

/**
 * Notification history entry
 */
export interface NotificationHistoryEntry {
  /**
   * Timestamp of the notification
   */
  timestamp: string;
  
  /**
   * Regression detection result
   */
  result: RegressionDetectionResult;
  
  /**
   * Notification channels used
   */
  channels: string[];
  
  /**
   * Whether the notification was successful
   */
  success: boolean;
  
  /**
   * Error message if the notification failed
   */
  error?: string;
}

/**
 * Notification history options
 */
export interface NotificationHistoryOptions {
  /**
   * Directory to store notification history
   */
  historyDir?: string;
  
  /**
   * Maximum number of history entries to keep
   */
  maxEntries?: number;
}

/**
 * Default notification history options
 */
const DEFAULT_OPTIONS: Required<NotificationHistoryOptions> = {
  historyDir: path.join(process.cwd(), 'packages/benchmark/notification-history'),
  maxEntries: 100,
};

/**
 * Add notification to history
 * @param entry Notification history entry
 * @param options Notification history options
 */
export function addToHistory(entry: Omit<NotificationHistoryEntry, 'timestamp'>, options: NotificationHistoryOptions = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create history directory if it doesn't exist
  if (!fs.existsSync(opts.historyDir)) {
    fs.mkdirSync(opts.historyDir, { recursive: true });
  }
  
  // Add timestamp to entry
  const timestamp = new Date().toISOString();
  const fullEntry: NotificationHistoryEntry = {
    ...entry,
    timestamp,
  };
  
  // Save entry to file
  const filename = `notification-${timestamp.replace(/:/g, '-')}.json`;
  const filepath = path.join(opts.historyDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(fullEntry, null, 2));
  
  // Clean up old entries if needed
  cleanupHistory(opts);
}

/**
 * Get notification history
 * @param options Notification history options
 * @returns Notification history entries
 */
export function getHistory(options: NotificationHistoryOptions = {}): NotificationHistoryEntry[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create history directory if it doesn't exist
  if (!fs.existsSync(opts.historyDir)) {
    fs.mkdirSync(opts.historyDir, { recursive: true });
    return [];
  }
  
  // Get all history files
  const files = fs.readdirSync(opts.historyDir)
    .filter(file => file.startsWith('notification-') && file.endsWith('.json'))
    .map(file => path.join(opts.historyDir, file));
  
  // Sort files by timestamp (newest first)
  files.sort((a, b) => {
    const timestampA = path.basename(a, '.json').split('-').slice(1).join('-');
    const timestampB = path.basename(b, '.json').split('-').slice(1).join('-');
    return timestampB.localeCompare(timestampA);
  });
  
  // Limit to max entries
  const filesToProcess = files.slice(0, opts.maxEntries);
  
  // Parse history entries
  const entries: NotificationHistoryEntry[] = [];
  
  for (const file of filesToProcess) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const entry = JSON.parse(content);
      entries.push(entry);
    } catch (error) {
      console.error(`Error parsing notification history file ${file}:`, error);
    }
  }
  
  return entries;
}

/**
 * Clean up old notification history entries
 * @param options Notification history options
 */
function cleanupHistory(options: Required<NotificationHistoryOptions>): void {
  // Get all history files
  const files = fs.readdirSync(options.historyDir)
    .filter(file => file.startsWith('notification-') && file.endsWith('.json'))
    .map(file => path.join(options.historyDir, file));
  
  // Sort files by timestamp (newest first)
  files.sort((a, b) => {
    const timestampA = path.basename(a, '.json').split('-').slice(1).join('-');
    const timestampB = path.basename(b, '.json').split('-').slice(1).join('-');
    return timestampB.localeCompare(timestampA);
  });
  
  // Remove old files
  if (files.length > options.maxEntries) {
    const filesToRemove = files.slice(options.maxEntries);
    
    for (const file of filesToRemove) {
      try {
        fs.unlinkSync(file);
      } catch (error) {
        console.error(`Error removing old notification history file ${file}:`, error);
      }
    }
  }
}
