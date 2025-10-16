import { Request, Response } from 'express';
import { getCommitSha } from '../utils/buildInfo.js';

export async function GET(req: Request, res: Response) {
  // Lightweight liveness probe - no dependencies, no error handling needed
  const health = {
    status: 'ok',
    sha: getCommitSha()
  };

  return res.status(200).json(health);
}

export async function HEAD(req: Request, res: Response) {
  // HEAD request behaves like GET but without body
  return res.sendStatus(200);
}
