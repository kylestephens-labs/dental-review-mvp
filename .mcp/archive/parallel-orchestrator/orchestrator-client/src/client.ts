import axios, { AxiosInstance } from 'axios';
import { Task, AgentStatus, DentalTask, MCPClientConfig } from './types';

export class MCPOrchestratorClient {
  private client: AxiosInstance;
  private projectId: string;

  constructor(config: MCPClientConfig) {
    this.projectId = config.projectId;
    this.client = axios.create({
      baseURL: config.orchestratorUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
    });
  }

  /**
   * Submit a task to the orchestrator
   */
  async submitTask(task: DentalTask): Promise<{ assigned_agent: string; estimated_completion: string }> {
    try {
      const response = await this.client.post('/api/orchestrator/tasks', {
        task,
        project_id: this.projectId,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to submit task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current agent statuses
   */
  async getAgentStatuses(): Promise<AgentStatus[]> {
    try {
      const response = await this.client.get('/api/orchestrator/agents');
      return response.data.agents;
    } catch (error) {
      throw new Error(`Failed to get agent statuses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get task status by ID
   */
  async getTaskStatus(taskId: string): Promise<Task | null> {
    try {
      const response = await this.client.get(`/api/orchestrator/tasks/${taskId}`);
      return response.data.task;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to get task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update task status (for progress reporting)
   */
  async updateTaskStatus(taskId: string, status: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      await this.client.patch(`/api/orchestrator/tasks/${taskId}`, {
        status,
        metadata,
        project_id: this.projectId,
      });
    } catch (error) {
      throw new Error(`Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(conflictId: string, resolution: string): Promise<boolean> {
    try {
      const response = await this.client.post('/api/orchestrator/conflicts/resolve', {
        conflict_id: conflictId,
        resolution,
        project_id: this.projectId,
      });
      return response.data.resolution_applied;
    } catch (error) {
      throw new Error(`Failed to resolve conflict: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
