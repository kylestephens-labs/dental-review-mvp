import { describe, it, expect, beforeEach } from 'vitest';
import { TaskManager, Task } from '../core/taskManager';

describe('TaskManager', () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
  });

  it('should assign a task successfully', async () => {
    const task: Task = {
      id: 'test-task-1',
      type: 'P1',
      priority: 1,
      status: 'pending',
      assigned_agent: null,
      dependencies: [],
      created_at: '',
      assigned_at: null,
      completed_at: null,
      metadata: {
        goal: 'Test task',
        acceptance_criteria: ['Complete test'],
        estimated_duration: 30,
        risk_level: 'standard',
      },
    };

    const assignedAgent = await taskManager.assignTask(task);
    
    expect(assignedAgent).toBe('cursor');
    
    const storedTask = taskManager.getTask('test-task-1');
    expect(storedTask).toBeDefined();
    expect(storedTask?.status).toBe('assigned');
    expect(storedTask?.assigned_agent).toBe('cursor');
  });

  it('should handle task assignment with priority override', async () => {
    const task: Task = {
      id: 'test-task-2',
      type: 'P2',
      priority: 2,
      status: 'pending',
      assigned_agent: null,
      dependencies: [],
      created_at: '',
      assigned_at: null,
      completed_at: null,
      metadata: {
        goal: 'Test task with priority override',
        acceptance_criteria: ['Complete test'],
        estimated_duration: 15,
        risk_level: 'standard',
      },
    };

    const assignedAgent = await taskManager.assignTask(task, 0);
    
    expect(assignedAgent).toBe('cursor');
    
    const storedTask = taskManager.getTask('test-task-2');
    expect(storedTask?.priority).toBe(0);
  });

  it('should throw error for invalid task', async () => {
    const invalidTask = {
      id: 'test-task-3',
      // Missing required fields
    } as Task;

    await expect(taskManager.assignTask(invalidTask)).rejects.toThrow('Invalid task: missing required fields');
  });

  it('should resolve conflicts', async () => {
    const result = await taskManager.resolveConflict('conflict-1', 'reassign');
    expect(result).toBe(true);
  });

  it('should get all tasks', () => {
    const tasks = taskManager.getAllTasks();
    expect(Array.isArray(tasks)).toBe(true);
  });

  it('should get task queue', () => {
    const queue = taskManager.getTaskQueue();
    expect(Array.isArray(queue)).toBe(true);
  });
});
