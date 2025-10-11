import { logger } from './logger';

export interface Task {
  id: string;
  type: 'P0' | 'P1' | 'P2';
  priority: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  assigned_agent: 'cursor' | 'codex' | 'chatgpt' | null;
  dependencies: string[];
  created_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  metadata: {
    goal: string;
    acceptance_criteria: string[];
    estimated_duration: number; // minutes
    risk_level: 'critical' | 'standard' | 'experimental';
  };
}

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private taskQueue: Task[] = [];

  async assignTask(task: Task, priorityOverride?: number): Promise<string> {
    try {
      // Validate task
      if (!task.id || !task.type || !task.metadata) {
        throw new Error('Invalid task: missing required fields');
      }

      // Apply priority override if provided
      if (priorityOverride !== undefined) {
        task.priority = priorityOverride;
      }

      // Set initial status and timestamps
      task.status = 'pending';
      task.created_at = new Date().toISOString();
      task.assigned_at = null;
      task.completed_at = null;

      // Store task
      this.tasks.set(task.id, task);
      this.taskQueue.push(task);

      // Sort queue by priority (P0 > P1 > P2)
      this.taskQueue.sort((a, b) => {
        const priorityOrder = { P0: 0, P1: 1, P2: 2 };
        return priorityOrder[a.type] - priorityOrder[b.type];
      });

      // For MVP, assign to cursor (simplified assignment logic)
      const assignedAgent = 'cursor';
      task.assigned_agent = assignedAgent;
      task.status = 'assigned';
      task.assigned_at = new Date().toISOString();

      logger.info('Task assigned', {
        taskId: task.id,
        agent: assignedAgent,
        priority: task.priority,
      });

      return assignedAgent;
    } catch (error) {
      logger.error('Task assignment failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async resolveConflict(conflictId: string, resolution: string): Promise<boolean> {
    try {
      logger.info('Resolving conflict', { conflictId, resolution });
      
      // Simplified conflict resolution for MVP
      // In a real implementation, this would handle various conflict types
      return true;
    } catch (error) {
      logger.error('Conflict resolution failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTaskQueue(): Task[] {
    return [...this.taskQueue];
  }
}
