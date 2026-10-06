import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Enable default metrics collection (Node.js CPU, memory, event loop lag, etc.)
client.collectDefaultMetrics({
  prefix: 'linkforge_',
});

// Custom Metrics:
// 1. Total HTTP Requests counter
export const httpRequestCounter = new client.Counter({
  name: 'linkforge_http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});

// 2. HTTP Request Duration Histogram (in seconds)
export const httpRequestDurationHistogram = new client.Histogram({
  name: 'linkforge_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  // Buckets optimized for sub-millisecond to multi-second redirects:
  // 1ms, 2ms, 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s
  buckets: [0.001, 0.002, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
});

// 3. Cache Hits vs Misses Counter
export const cacheCounter = new client.Counter({
  name: 'linkforge_cache_lookups_total',
  help: 'Total number of Redis cache lookups partitioned by hit or miss',
  labelNames: ['type'], // 'hit' | 'miss'
});

export const recordCacheHit = (type: 'hit' | 'miss') => {
  cacheCounter.inc({ type });
};

// Express Middleware to measure request duration and count
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Avoid tracking /metrics calls to avoid skewing data
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    // Normalize route to avoid high cardinality (e.g. use /:shortCode instead of raw /xyz123)
    const route = req.route?.path || req.baseUrl || req.path || 'unknown';
    const statusCode = res.statusCode.toString();

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    httpRequestDurationHistogram.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      durationInSeconds
    );
  });

  next();
};

export const register = client.register;
