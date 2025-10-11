import { Router, Request, Response } from 'express';
import { logger } from '../core/logger';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    sha: process.env.GIT_SHA || 'unknown',
  };

  logger.info('Health check requested', { ip: req.ip });
  res.status(200).json(healthCheck);
});

router.get('/ready', (_req: Request, res: Response) => {
  // Add readiness checks here (database, external services, etc.)
  res.status(200).json({ status: 'ready' });
});

router.get('/live', (_req: Request, res: Response) => {
  // Add liveness checks here
  res.status(200).json({ status: 'alive' });
});

export { router as healthRouter };
