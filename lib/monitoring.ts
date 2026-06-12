/**
 * Structured logging for internal and server-side monitoring.
 * In production this sends to console; extend to Sentry or a log sink.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  module: string;
  data?: Record<string, unknown>;
}

export function log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    module,
    message,
    timestamp: new Date().toISOString(),
    ...(data ? { data } : {}),
  };

  const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${module}]`;

  switch (level) {
    case 'error':
      console.error(prefix, message, data || '');
      break;
    case 'warn':
      console.warn(prefix, message, data || '');
      break;
    case 'debug':
      console.debug(prefix, message, data || '');
      break;
    default:
      console.log(prefix, message, data || '');
  }

  return entry;
}

export const logger = {
  info: (module: string, msg: string, data?: Record<string, unknown>) => log('info', module, msg, data),
  warn: (module: string, msg: string, data?: Record<string, unknown>) => log('warn', module, msg, data),
  error: (module: string, msg: string, data?: Record<string, unknown>) => log('error', module, msg, data),
  debug: (module: string, msg: string, data?: Record<string, unknown>) => log('debug', module, msg, data),
};

/**
 * Simple analytics event tracking.
 * Stores events in-memory for the session; extend to PostHog/Plausible later.
 */

const events: Array<{
  name: string;
  properties: Record<string, unknown>;
  timestamp: string;
}> = [];

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  const event = {
    name,
    properties: properties || {},
    timestamp: new Date().toISOString(),
  };
  events.push(event);

  // Also log to console in dev
  if (process.env.NODE_ENV === 'development') {
    logger.debug('analytics', `Event: ${name}`, properties);
  }

  // Flush if buffer gets large
  if (events.length > 100) {
    flushEvents();
  }
}

export function flushEvents() {
  if (events.length === 0) return;
  const batch = events.splice(0, events.length);
  // In production, send to analytics service
  logger.info('analytics', `Flushing ${batch.length} events`);
}

/**
 * Source freshness tracker.
 * Records last success/error per source in a global map.
 */

const sourceStatus = new Map<string, {
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  errorCount: number;
  consecutiveErrors: number;
  isActive: boolean;
}>();

export function recordSourceSuccess(sourceName: string) {
  sourceStatus.set(sourceName, {
    lastSuccessAt: new Date().toISOString(),
    lastErrorAt: null,
    errorCount: 0,
    consecutiveErrors: 0,
    isActive: true,
  });
}

export function recordSourceError(sourceName: string) {
  const current = sourceStatus.get(sourceName);
  const consecutive = (current?.consecutiveErrors || 0) + 1;
  sourceStatus.set(sourceName, {
    lastSuccessAt: current?.lastSuccessAt || null,
    lastErrorAt: new Date().toISOString(),
    errorCount: (current?.errorCount || 0) + 1,
    consecutiveErrors: consecutive,
    isActive: consecutive < 5, // auto-disable after 5 consecutive errors
  });
}

export function getSourceStatus(sourceName: string) {
  return sourceStatus.get(sourceName) || {
    lastSuccessAt: null,
    lastErrorAt: null,
    errorCount: 0,
    consecutiveErrors: 0,
    isActive: true,
  };
}

export function getAllSourceStatuses() {
  return Array.from(sourceStatus.entries()).map(([name, status]) => ({
    name,
    ...status,
  }));
}
