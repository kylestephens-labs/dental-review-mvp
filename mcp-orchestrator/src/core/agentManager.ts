import { logger } from './logger';

export interface AgentStatus {
  name: 'cursor' | 'codex' | 'chatgpt';
  status: 'available' | 'busy' | 'error' | 'offline';
  current_tasks: string[];
  capabilities: string[];
  last_heartbeat: string;
  performance_metrics: {
    tasks_completed: number;
    average_completion_time: number; // minutes
    error_rate: number;
  };
}

export class AgentManager {
  private agents: Map<string, AgentStatus> = new Map();

  constructor() {
    // Initialize with static agent configuration for MVP
    this.initializeAgents();
  }

  private initializeAgents(): void {
    const agents: AgentStatus[] = [
      {
        name: 'cursor',
        status: 'available',
        current_tasks: [],
        capabilities: ['backend', 'frontend', 'review', 'testing'],
        last_heartbeat: new Date().toISOString(),
        performance_metrics: {
          tasks_completed: 0,
          average_completion_time: 0,
          error_rate: 0,
        },
      },
      {
        name: 'codex',
        status: 'available',
        current_tasks: [],
        capabilities: ['backend', 'frontend', 'review'],
        last_heartbeat: new Date().toISOString(),
        performance_metrics: {
          tasks_completed: 0,
          average_completion_time: 0,
          error_rate: 0,
        },
      },
      {
        name: 'chatgpt',
        status: 'available',
        current_tasks: [],
        capabilities: ['review', 'planning', 'documentation'],
        last_heartbeat: new Date().toISOString(),
        performance_metrics: {
          tasks_completed: 0,
          average_completion_time: 0,
          error_rate: 0,
        },
      },
    ];

    agents.forEach(agent => {
      this.agents.set(agent.name, agent);
    });

    logger.info('Agents initialized', { agentCount: agents.length });
  }

  getAgentStatuses(): AgentStatus[] {
    return Array.from(this.agents.values());
  }

  getAgent(name: string): AgentStatus | undefined {
    return this.agents.get(name);
  }

  updateAgentStatus(name: string, status: Partial<AgentStatus>): void {
    const agent = this.agents.get(name);
    if (agent) {
      Object.assign(agent, status);
      agent.last_heartbeat = new Date().toISOString();
      this.agents.set(name, agent);
      
      logger.info('Agent status updated', { name, status: agent.status });
    }
  }

  assignTaskToAgent(agentName: string, taskId: string): boolean {
    const agent = this.agents.get(agentName);
    if (agent && agent.status === 'available') {
      agent.current_tasks.push(taskId);
      agent.status = 'busy';
      this.agents.set(agentName, agent);
      
      logger.info('Task assigned to agent', { agentName, taskId });
      return true;
    }
    return false;
  }

  completeTask(agentName: string, taskId: string, completionTime: number): void {
    const agent = this.agents.get(agentName);
    if (agent) {
      agent.current_tasks = agent.current_tasks.filter(id => id !== taskId);
      agent.status = agent.current_tasks.length > 0 ? 'busy' : 'available';
      
      // Update performance metrics
      agent.performance_metrics.tasks_completed++;
      agent.performance_metrics.average_completion_time = 
        (agent.performance_metrics.average_completion_time + completionTime) / 2;
      
      this.agents.set(agentName, agent);
      
      logger.info('Task completed by agent', { 
        agentName, 
        taskId, 
        completionTime,
        tasksCompleted: agent.performance_metrics.tasks_completed 
      });
    }
  }
}
