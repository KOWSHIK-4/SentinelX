import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const requestId = uuidv4();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();

  const originalJson = res.json.bind(res);
  res.json = function (body: unknown): Response {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      (body as Record<string, unknown>).requestId = requestId;
    }
    return originalJson(body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const user = (req as Request & { user?: { email?: string } }).user?.email || 'anonymous';
    console.log(`[${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - ${user}`);
  });

  next();
}
