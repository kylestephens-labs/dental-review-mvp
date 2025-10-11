import { describe, it, expect, beforeEach } from 'vitest';
import { AgentManager } from '../core/agentManager';

describe('AgentManager', () => {
  let agentManager: AgentManager;

  beforeEach(() => {
    agentManager = new AgentManager();
  });

  it('should initialize with default agents', () => {
    const agents = agentManager.getAgentStatuses();
    
    expect(agents).toHaveLength(3);
    expect(agents.map(a => a.name)).toContain('cursor');
    expect(agents.map(a => a.name)).toContain('codex');
    expect(agents.map(a => a.name)).toContain('chatgpt');
  });

  it('should get agent by name', () => {
    const cursor = agentManager.getAgent('cursor');
    
    expect(cursor).toBeDefined();
    expect(cursor?.name).toBe('cursor');
    expect(cursor?.capabilities).toContain('backend');
    expect(cursor?.capabilities).toContain('frontend');
  });

  it('should update agent status', () => {
    agentManager.updateAgentStatus('cursor', { status: 'busy' });
    
    const cursor = agentManager.getAgent('cursor');
    expect(cursor?.status).toBe('busy');
  });

  it('should assign task to available agent', () => {
    const result = agentManager.assignTaskToAgent('cursor', 'task-1');
    
    expect(result).toBe(true);
    
    const cursor = agentManager.getAgent('cursor');
    expect(cursor?.current_tasks).toContain('task-1');
    expect(cursor?.status).toBe('busy');
  });

  it('should not assign task to busy agent', () => {
    // First assignment should succeed
    agentManager.assignTaskToAgent('cursor', 'task-1');
    
    // Second assignment should fail (agent is busy)
    const result = agentManager.assignTaskToAgent('cursor', 'task-2');
    
    expect(result).toBe(false);
  });

  it('should complete task and update metrics', () => {
    agentManager.assignTaskToAgent('cursor', 'task-1');
    agentManager.completeTask('cursor', 'task-1', 30);
    
    const cursor = agentManager.getAgent('cursor');
    expect(cursor?.current_tasks).not.toContain('task-1');
    expect(cursor?.status).toBe('available');
    expect(cursor?.performance_metrics.tasks_completed).toBe(1);
  });
});
