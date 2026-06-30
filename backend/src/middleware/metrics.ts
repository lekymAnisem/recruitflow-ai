import { NextFunction, Request, Response } from 'express';
import client from 'prom-client';

const register = new client.Registry();

register.setDefaultLabels({
  app: 'recruitflow-backend',
});

client.collectDefaultMetrics({ register });

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds.',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests.',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestsInFlight = new client.Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed.',
  labelNames: ['method'],
});

register.registerMetric(httpRequestDurationSeconds);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestsInFlight);

function normalizePath(path: string): string {
  return path
    .replace(/[0-9a-fA-F]{24}/g, ':objectId')
    .replace(/[0-9a-fA-F-]{36}/g, ':uuid')
    .replace(/\b\d+\b/g, ':id');
}

function getRouteLabel(req: Request): string {
  if (req.route?.path) {
    return `${req.baseUrl}${String(req.route.path)}`;
  }

  return normalizePath(req.path);
}

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const method = req.method;
  const endTimer = httpRequestDurationSeconds.startTimer();

  httpRequestsInFlight.inc({ method });

  res.on('finish', () => {
    const labels = {
      method,
      route: getRouteLabel(req),
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    endTimer(labels);
    httpRequestsInFlight.dec({ method });
  });

  next();
}

export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
