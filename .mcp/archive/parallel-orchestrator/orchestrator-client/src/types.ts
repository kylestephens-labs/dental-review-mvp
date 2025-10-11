import { z } from 'zod';

// Task schemas matching the orchestrator
export const TaskTypeSchema = z.enum(['P0', 'P1', 'P2']);
export const TaskStatusSchema = z.enum(['pending', 'assigned', 'in_progress', 'completed', 'failed', 'blocked']);
export const AgentNameSchema = z.enum(['cursor', 'codex', 'chatgpt']);

export const TaskSchema = z.object({
  id: z.string(),
  type: TaskTypeSchema,
  priority: z.number(),
  status: TaskStatusSchema,
  assigned_agent: AgentNameSchema.nullable(),
  dependencies: z.array(z.string()),
  created_at: z.string(),
  assigned_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  metadata: z.object({
    goal: z.string(),
    acceptance_criteria: z.array(z.string()),
    estimated_duration: z.number(),
    risk_level: z.enum(['critical', 'standard', 'experimental']),
  }),
});

export const AgentStatusSchema = z.object({
  name: AgentNameSchema,
  status: z.enum(['available', 'busy', 'error', 'offline']),
  current_tasks: z.array(z.string()),
  capabilities: z.array(z.string()),
  last_heartbeat: z.string(),
  performance_metrics: z.object({
    tasks_completed: z.number(),
    average_completion_time: z.number(),
    error_rate: z.number(),
  }),
});

export type Task = z.infer<typeof TaskSchema>;
export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export type TaskType = z.infer<typeof TaskTypeSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type AgentName = z.infer<typeof AgentNameSchema>;

// Dental project specific task types
export interface DentalTask extends Omit<Task, 'metadata'> {
  metadata: Task['metadata'] & {
    project: 'dental-landing-template';
    files_affected?: string[];
    components_affected?: string[];
    integration_points?: string[];
  };
}

// MCP Client configuration
export interface MCPClientConfig {
  orchestratorUrl: string;
  projectId: string;
  apiKey?: string;
  timeout?: number;
}
