/**
 * Error Monitoring Wrapper (Sentry abstraction).
 * Dynamically hooks Sentry if SENTRY_DSN is configured in environment,
 * otherwise falls back to logging standard error trace blocks.
 */

import * as SentryClient from '@sentry/nextjs';

let _initialized = false;

function initSentry() {
  if (_initialized) return;
  const dsn = process.env.SENTRY_DSN;
  
  if (dsn) {
    try {
      SentryClient.init({
        dsn,
        tracesSampleRate: 0.1,
        debug: false,
      });
      _initialized = true;
      console.log('[Sentry] Initialized successfully.');
    } catch (err) {
      console.error('[Sentry] Init failed:', err);
    }
  }
}

/** Log exception to Sentry (or fallback console) */
export function captureException(error: any, context?: Record<string, any>) {
  initSentry();
  
  if (process.env.SENTRY_DSN && _initialized) {
    SentryClient.captureException(error, { extra: context });
  } else {
    console.error('[CaptureException]', error);
    if (context) {
      console.error('[Context]', JSON.stringify(context, null, 2));
    }
  }
}

/** Log informational message to Sentry breadcrumbs or tags */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  initSentry();
  
  if (process.env.SENTRY_DSN && _initialized) {
    SentryClient.captureMessage(message, level);
  } else {
    console.log(`[CaptureMessage] [${level.toUpperCase()}] ${message}`);
  }
}
