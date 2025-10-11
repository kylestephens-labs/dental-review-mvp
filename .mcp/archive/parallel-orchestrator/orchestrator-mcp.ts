#!/usr/bin/env node

/**
 * MCP Tool for Dental Landing Template - Orchestrator Integration
 * 
 * This tool provides MCP functions to interact with the MCP Orchestrator
 * for task management and coordination.
 */

import { MCPOrchestratorClient, createDentalTask, TaskFactory } from '../orchestrator-client/dist/index.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration
const configPath = join(__dirname, '../config/orchestrator.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));

const client = new MCPOrchestratorClient({
  orchestratorUrl: config.orchestrator.url,
  projectId: config.project.project_id,
  apiKey: config.orchestrator.api_key,
  timeout: config.orchestrator.timeout,
});

/**
 * Submit a task to the orchestrator
 */
export async function submitTask(
  type: 'P0' | 'P1' | 'P2',
  goal: string,
  acceptanceCriteria: string[],
  estimatedDuration: number,
  options: {
    filesAffected?: string[];
    componentsAffected?: string[];
    integrationPoints?: string[];
    dependencies?: string[];
    riskLevel?: 'critical' | 'standard' | 'experimental';
  } = {}
): Promise<{ taskId: string; assignedAgent: string; estimatedCompletion: string }> {
  const task = createDentalTask(type, {
    goal,
    acceptance_criteria: acceptanceCriteria,
    estimated_duration: estimatedDuration,
    files_affected: options.filesAffected,
    components_affected: options.componentsAffected,
    integration_points: options.integrationPoints,
    dependencies: options.dependencies,
    risk_level: options.riskLevel || 'standard',
  });

  const result = await client.submitTask(task);
  
  return {
    taskId: task.id,
    assignedAgent: result.assigned_agent,
    estimatedCompletion: result.estimated_completion,
  };
}

/**
 * Get current agent statuses
 */
export async function getAgentStatuses(): Promise<Array<{
  name: string;
  status: string;
  currentTasks: string[];
  capabilities: string[];
}>> {
  const agents = await client.getAgentStatuses();
  return agents.map(agent => ({
    name: agent.name,
    status: agent.status,
    currentTasks: agent.current_tasks,
    capabilities: agent.capabilities,
  }));
}

/**
 * Get task status
 */
export async function getTaskStatus(taskId: string): Promise<{
  id: string;
  status: string;
  assignedAgent: string | null;
  progress?: string;
} | null> {
  const task = await client.getTaskStatus(taskId);
  if (!task) return null;

  return {
    id: task.id,
    status: task.status,
    assignedAgent: task.assigned_agent,
    progress: task.metadata?.goal,
  };
}

/**
 * Update task progress
 */
export async function updateTaskProgress(
  taskId: string,
  status: string,
  progress?: string
): Promise<void> {
  await client.updateTaskStatus(taskId, status, { progress });
}

/**
 * Create a critical P0 task
 */
export async function createCriticalTask(
  goal: string,
  acceptanceCriteria: string[],
  estimatedDuration: number,
  options?: {
    filesAffected?: string[];
    componentsAffected?: string[];
    integrationPoints?: string[];
    dependencies?: string[];
  }
): Promise<{ taskId: string; assignedAgent: string; estimatedCompletion: string }> {
  return submitTask('P0', goal, acceptanceCriteria, estimatedDuration, {
    ...options,
    riskLevel: 'critical',
  });
}

/**
 * Create a standard P1 task
 */
export async function createStandardTask(
  goal: string,
  acceptanceCriteria: string[],
  estimatedDuration: number,
  options?: {
    filesAffected?: string[];
    componentsAffected?: string[];
    integrationPoints?: string[];
    dependencies?: string[];
  }
): Promise<{ taskId: string; assignedAgent: string; estimatedCompletion: string }> {
  return submitTask('P1', goal, acceptanceCriteria, estimatedDuration, {
    ...options,
    riskLevel: 'standard',
  });
}

/**
 * Create an experimental P2 task
 */
export async function createExperimentalTask(
  goal: string,
  acceptanceCriteria: string[],
  estimatedDuration: number,
  options?: {
    filesAffected?: string[];
    componentsAffected?: string[];
    integrationPoints?: string[];
    dependencies?: string[];
  }
): Promise<{ taskId: string; assignedAgent: string; estimatedCompletion: string }> {
  return submitTask('P2', goal, acceptanceCriteria, estimatedDuration, {
    ...options,
    riskLevel: 'experimental',
  });
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  return client.healthCheck();
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'health':
      healthCheck().then(healthy => {
        console.log(healthy ? 'Orchestrator is healthy' : 'Orchestrator is down');
        process.exit(healthy ? 0 : 1);
      });
      break;
      
    case 'agents':
      getAgentStatuses().then(agents => {
        console.log('Agent Statuses:');
        agents.forEach(agent => {
          console.log(`- ${agent.name}: ${agent.status} (${agent.currentTasks.length} tasks)`);
        });
      });
      break;
      
    case 'submit':
      const [type, goal, ...criteria] = process.argv.slice(3);
      if (!type || !goal) {
        console.error('Usage: orchestrator-mcp.ts submit <P0|P1|P2> <goal> <criteria...>');
        process.exit(1);
      }
      
      submitTask(type as any, goal, criteria, 60).then(result => {
        console.log(`Task submitted: ${result.taskId}`);
        console.log(`Assigned to: ${result.assignedAgent}`);
        console.log(`Estimated completion: ${result.estimatedCompletion}`);
      });
      break;
      
    default:
      console.log('Available commands: health, agents, submit');
      process.exit(1);
  }
}
