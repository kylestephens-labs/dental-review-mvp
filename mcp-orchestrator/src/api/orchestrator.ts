import { Router, Request, Response } from 'express';
import { logger } from '../core/logger';
import { TaskManager } from '../core/taskManager';
import { AgentManager } from '../core/agentManager';

const router = Router();
const taskManager = new TaskManager();
const agentManager = new AgentManager();

// Task assignment endpoint
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { task, priority_override } = req.body;
    
    logger.info('Task assignment requested', { 
      taskId: task?.id, 
      priority: priority_override || task?.priority 
    });

    const assignedAgent = await taskManager.assignTask(task, priority_override);
    const estimatedCompletion = new Date(Date.now() + (task.metadata?.estimated_duration || 30) * 60000);

    res.status(200).json({
      assigned_agent: assignedAgent,
      estimated_completion: estimatedCompletion.toISOString(),
    });
  } catch (error) {
    logger.error('Task assignment failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

// Agent status endpoint
router.get('/agents', (_req: Request, res: Response) => {
  try {
    const agents = agentManager.getAgentStatuses();
    res.status(200).json({ agents });
  } catch (error) {
    logger.error('Failed to get agent statuses', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to get agent statuses' });
  }
});

// Conflict resolution endpoint
router.post('/conflicts/resolve', async (req: Request, res: Response) => {
  try {
    const { conflict_id, resolution } = req.body;
    
    logger.info('Conflict resolution requested', { conflict_id, resolution });
    
    const resolutionApplied = await taskManager.resolveConflict(conflict_id, resolution);
    
    res.status(200).json({ resolution_applied: resolutionApplied });
  } catch (error) {
    logger.error('Conflict resolution failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

export { router as orchestratorRouter };
