import { Request, Response } from 'express';

export async function GET(req: Request, res: Response) {
  try {
    // Basic health check
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      sha: process.env.GIT_SHA || 'unknown',
      environment: process.env.NODE_ENV || 'development'
    };

    return res.status(200).json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({ 
      status: 'error', 
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}
