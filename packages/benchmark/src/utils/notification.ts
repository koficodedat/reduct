/**
 * Utilities for sending notifications about performance regressions
 */
import axios from 'axios';

import { applyFilters, NotificationFilter } from './notification-filters';
import { addToHistory } from './notification-history';
import { templates, TemplateContext } from './notification-templates';
import { RegressionDetectionResult, hasRegressions } from './regression-detection';


/**
 * Notification options
 */
export interface NotificationOptions {
  /**
   * Regression detection result
   */
  regressionResult: RegressionDetectionResult;

  /**
   * Notification channels to use
   */
  channels?: NotificationChannel[];

  /**
   * Slack webhook URL
   */
  slackWebhookUrl?: string;

  /**
   * GitHub repository owner
   */
  githubOwner?: string;

  /**
   * GitHub repository name
   */
  githubRepo?: string;

  /**
   * GitHub token
   */
  githubToken?: string;

  /**
   * Email recipients
   */
  emailRecipients?: string[];

  /**
   * Email sender
   */
  emailSender?: string;

  /**
   * Email subject
   */
  emailSubject?: string;

  /**
   * Notification threshold (percentage)
   */
  notificationThreshold?: number;

  /**
   * Whether to include improvements in notifications
   */
  includeImprovements?: boolean;

  /**
   * Whether to include new benchmarks in notifications
   */
  includeNewBenchmarks?: boolean;

  /**
   * Whether to include missing benchmarks in notifications
   */
  includeMissingBenchmarks?: boolean;

  /**
   * Filters to apply to the regression result
   */
  filters?: Array<{ filter: NotificationFilter; options?: any }>;

  /**
   * Additional template context data
   */
  templateContext?: Record<string, any>;

  /**
   * Whether to track notification history
   */
  trackHistory?: boolean;

  /**
   * Directory to store notification history
   */
  historyDir?: string;
}

/**
 * Notification channel
 */
export enum NotificationChannel {
  /**
   * Console output
   */
  CONSOLE = 'console',

  /**
   * Slack webhook
   */
  SLACK = 'slack',

  /**
   * GitHub issue
   */
  GITHUB_ISSUE = 'github-issue',

  /**
   * Email
   */
  EMAIL = 'email',
}

/**
 * Default notification options
 */
const DEFAULT_OPTIONS: Partial<NotificationOptions> = {
  channels: [NotificationChannel.CONSOLE],
  notificationThreshold: 10,
  includeImprovements: true,
  includeNewBenchmarks: false,
  includeMissingBenchmarks: false,
  filters: [],
  templateContext: {},
  trackHistory: true,
};

/**
 * Send notifications about performance regressions
 * @param options Notification options
 * @returns Promise that resolves when all notifications have been sent
 */
export async function sendNotifications(options: NotificationOptions): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Apply filters to regression result
  let filteredResult = opts.regressionResult;

  if (opts.filters && opts.filters.length > 0) {
    filteredResult = applyFilters(filteredResult, opts.filters);
  }

  // Check if there are any regressions
  if (!hasRegressions(filteredResult) && !opts.includeImprovements) {
    console.log('No regressions to notify about.');
    return;
  }

  // Create template context
  const templateContext: TemplateContext = {
    result: filteredResult,
    includeImprovements: opts.includeImprovements || false,
    includeNewBenchmarks: opts.includeNewBenchmarks || false,
    includeMissingBenchmarks: opts.includeMissingBenchmarks || false,
    ...opts.templateContext,
  };

  // Send notifications to each channel
  const results: Record<string, { success: boolean; error?: string }> = {};

  for (const channel of opts.channels || []) {
    try {
      switch (channel) {
        case NotificationChannel.CONSOLE:
          await sendConsoleNotification(templateContext);
          results[channel] = { success: true };
          break;
        case NotificationChannel.SLACK:
          if (opts.slackWebhookUrl) {
            await sendSlackNotification(templateContext, opts.slackWebhookUrl);
            results[channel] = { success: true };
          } else {
            console.warn('Slack webhook URL not provided. Skipping Slack notification.');
            results[channel] = { success: false, error: 'Slack webhook URL not provided' };
          }
          break;
        case NotificationChannel.GITHUB_ISSUE:
          if (opts.githubOwner && opts.githubRepo && opts.githubToken) {
            await sendGitHubIssueNotification(templateContext, {
              owner: opts.githubOwner,
              repo: opts.githubRepo,
              token: opts.githubToken,
            });
            results[channel] = { success: true };
          } else {
            console.warn('GitHub owner, repo, or token not provided. Skipping GitHub issue notification.');
            results[channel] = { success: false, error: 'GitHub owner, repo, or token not provided' };
          }
          break;
        case NotificationChannel.EMAIL:
          if (opts.emailRecipients && opts.emailRecipients.length > 0 && opts.emailSender) {
            await sendEmailNotification(templateContext, {
              recipients: opts.emailRecipients,
              sender: opts.emailSender,
              subject: opts.emailSubject,
            });
            results[channel] = { success: true };
          } else {
            console.warn('Email recipients or sender not provided. Skipping email notification.');
            results[channel] = { success: false, error: 'Email recipients or sender not provided' };
          }
          break;
      }
    } catch (error) {
      console.error(`Error sending ${channel} notification:`, error);
      results[channel] = { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Track notification history
  if (opts.trackHistory) {
    addToHistory({
      result: filteredResult,
      channels: opts.channels || [],
      success: Object.values(results).every(result => result.success),
      error: Object.values(results).find(result => !result.success)?.error,
    }, {
      historyDir: opts.historyDir,
    });
  }
}

/**
 * Send console notification
 * @param context Template context
 */
async function sendConsoleNotification(context: TemplateContext): Promise<void> {
  const output = templates.console(context);
  console.log(output);
}

/**
 * Send Slack notification
 * @param context Template context
 * @param webhookUrl Slack webhook URL
 */
async function sendSlackNotification(context: TemplateContext, webhookUrl: string): Promise<void> {
  const slackMessage = templates.slack(context);

  // Send Slack message
  await axios.post(webhookUrl, slackMessage);

  console.log('Slack notification sent.');
}

/**
 * Send GitHub issue notification
 * @param context Template context
 * @param options GitHub options
 */
async function sendGitHubIssueNotification(
  context: TemplateContext,
  options: { owner: string; repo: string; token: string }
): Promise<void> {
  const { owner, repo, token } = options;
  const { title, body, labels } = templates.githubIssue(context);

  // Create GitHub issue
  const response = await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      title,
      body,
      labels,
    },
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  console.log(`GitHub issue created: ${response.data.html_url}`);
}

/**
 * Send email notification
 * @param context Template context
 * @param options Email options
 */
async function sendEmailNotification(
  context: TemplateContext,
  options: { recipients: string[]; sender: string; subject?: string }
): Promise<void> {
  const { recipients, sender, subject } = options;
  const { subject: templateSubject, body } = templates.email(context);

  // In a real implementation, we would use a library like nodemailer to send the email
  // For now, we'll just log the email content
  console.log('Email notification:');
  console.log(`From: ${sender}`);
  console.log(`To: ${recipients.join(', ')}`);
  console.log(`Subject: ${subject || templateSubject}`);
  console.log('Body:');
  console.log(body);
}
