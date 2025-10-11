import { v4 as uuidv4 } from 'uuid';
import { DentalTask, TaskType } from './types';

export interface TaskFactoryOptions {
  goal: string;
  acceptance_criteria: string[];
  estimated_duration: number; // minutes
  risk_level: 'critical' | 'standard' | 'experimental';
  files_affected?: string[];
  components_affected?: string[];
  integration_points?: string[];
  dependencies?: string[];
}

export class TaskFactory {
  /**
   * Create a dental-specific task
   */
  static createDentalTask(
    type: TaskType,
    options: TaskFactoryOptions
  ): DentalTask {
    const taskId = uuidv4();
    const now = new Date().toISOString();

    return {
      id: taskId,
      type,
      priority: this.getPriorityFromType(type),
      status: 'pending',
      assigned_agent: null,
      dependencies: options.dependencies || [],
      created_at: now,
      assigned_at: null,
      completed_at: null,
      metadata: {
        goal: options.goal,
        acceptance_criteria: options.acceptance_criteria,
        estimated_duration: options.estimated_duration,
        risk_level: options.risk_level,
        project: 'dental-landing-template',
        files_affected: options.files_affected || [],
        components_affected: options.components_affected || [],
        integration_points: options.integration_points || [],
      },
    };
  }

  /**
   * Create a P0 critical task
   */
  static createCriticalTask(options: Omit<TaskFactoryOptions, 'risk_level'>): DentalTask {
    return this.createDentalTask('P0', {
      ...options,
      risk_level: 'critical',
    });
  }

  /**
   * Create a P1 standard task
   */
  static createStandardTask(options: Omit<TaskFactoryOptions, 'risk_level'>): DentalTask {
    return this.createDentalTask('P1', {
      ...options,
      risk_level: 'standard',
    });
  }

  /**
   * Create a P2 experimental task
   */
  static createExperimentalTask(options: Omit<TaskFactoryOptions, 'risk_level'>): DentalTask {
    return this.createDentalTask('P2', {
      ...options,
      risk_level: 'experimental',
    });
  }

  private static getPriorityFromType(type: TaskType): number {
    switch (type) {
      case 'P0': return 0;
      case 'P1': return 1;
      case 'P2': return 2;
      default: return 1;
    }
  }
}

/**
 * Convenience function to create a dental task
 */
export function createDentalTask(
  type: TaskType,
  options: TaskFactoryOptions
): DentalTask {
  return TaskFactory.createDentalTask(type, options);
}
