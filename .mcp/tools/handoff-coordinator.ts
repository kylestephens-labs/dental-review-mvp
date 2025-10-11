import { TaskManager, Task } from './task-manager.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class HandoffCoordinator {
  private taskManager: TaskManager;

  constructor(tasksDir: string = '.mcp/tasks') {
    this.taskManager = new TaskManager(path.resolve(tasksDir));
  }

  async createTask(title: string, priority: 'P0' | 'P1' | 'P2' = 'P1'): Promise<string> {
    console.log(`Creating task: ${title} (${priority})`);
    const taskId = await this.taskManager.createTask(title, priority);
    console.log(`✅ Task created: ${taskId}`);
    console.log(`📁 Location: .mcp/tasks/pending/${taskId}.md`);
    return taskId;
  }

  async prepTask(taskId: string): Promise<void> {
    console.log(`Preparing task: ${taskId}`);
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== 'pending') {
      throw new Error(`Task ${taskId} is not in pending status`);
    }

    // Move to ready status
    await this.taskManager.moveTask(taskId, 'ready');
    console.log(`✅ Task ${taskId} moved to ready queue`);
    console.log(`📁 Location: .mcp/tasks/ready/${taskId}.md`);
    console.log(`🤖 Ready for ChatGPT to flesh out with DoR/DoD`);
  }

  async claimTask(taskId: string, agent: 'cursor' | 'codex' | 'chatgpt'): Promise<void> {
    console.log(`Claiming task: ${taskId} for ${agent}`);
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== 'ready') {
      throw new Error(`Task ${taskId} is not ready for claiming`);
    }

    // Update task with agent assignment and move to in-progress
    await this.taskManager.updateTask(taskId, { agent });
    await this.taskManager.moveTask(taskId, 'in-progress');
    
    console.log(`✅ Task ${taskId} claimed by ${agent}`);
    console.log(`📁 Location: .mcp/tasks/in-progress/${taskId}.md`);
    console.log(`🚀 Ready for implementation`);
  }

  async requestReview(taskId: string): Promise<void> {
    console.log(`Requesting review for task: ${taskId}`);
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== 'in-progress') {
      throw new Error(`Task ${taskId} is not in progress`);
    }

    // Move to review status
    await this.taskManager.moveTask(taskId, 'review');
    console.log(`✅ Task ${taskId} moved to review queue`);
    console.log(`📁 Location: .mcp/tasks/review/${taskId}.md`);
    console.log(`👀 Ready for Codex/ChatGPT review`);
  }

  async completeTask(taskId: string): Promise<void> {
    console.log(`Completing task: ${taskId}`);
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== 'review') {
      throw new Error(`Task ${taskId} is not in review status`);
    }

    // Move to completed status
    await this.taskManager.moveTask(taskId, 'completed');
    console.log(`✅ Task ${taskId} completed`);
    console.log(`📁 Location: .mcp/tasks/completed/${taskId}.md`);
    console.log(`🎉 Task successfully completed!`);
  }

  async failTask(taskId: string, errorContext: string): Promise<void> {
    console.log(`Failing task: ${taskId}`);
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Update with error context and move to failed
    await this.taskManager.updateTask(taskId, { errorContext });
    await this.taskManager.moveTask(taskId, 'failed');
    
    console.log(`❌ Task ${taskId} failed`);
    console.log(`📁 Location: .mcp/tasks/failed/${taskId}.md`);
    console.log(`🔍 Error context saved for debugging`);
  }

  async addFeedback(taskId: string, feedback: string): Promise<void> {
    console.log(`Adding feedback to task: ${taskId}`);
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Append feedback and move back to ready for rework
    const updatedFeedback = task.reviewFeedback 
      ? `${task.reviewFeedback}\n\n---\n\n${new Date().toISOString()}: ${feedback}`
      : `${new Date().toISOString()}: ${feedback}`;

    await this.taskManager.updateTask(taskId, { reviewFeedback: updatedFeedback });
    await this.taskManager.moveTask(taskId, 'ready');
    
    console.log(`✅ Feedback added to task ${taskId}`);
    console.log(`📁 Location: .mcp/tasks/ready/${taskId}.md`);
    console.log(`🔄 Task ready for rework with feedback`);
  }

  async getStatus(): Promise<void> {
    console.log('\n📊 MCP Orchestrator Status\n');
    
    const allTasks = await this.taskManager.listTasks();
    const statusCounts = {
      pending: 0,
      ready: 0,
      'in-progress': 0,
      review: 0,
      feedback: 0,
      completed: 0,
      failed: 0
    };

    allTasks.forEach(task => {
      statusCounts[task.status]++;
    });

    console.log('📈 Task Status Summary:');
    console.log(`  Pending: ${statusCounts.pending}`);
    console.log(`  Ready: ${statusCounts.ready}`);
    console.log(`  In Progress: ${statusCounts['in-progress']}`);
    console.log(`  Review: ${statusCounts.review}`);
    console.log(`  Feedback: ${statusCounts.feedback}`);
    console.log(`  Completed: ${statusCounts.completed}`);
    console.log(`  Failed: ${statusCounts.failed}`);
    console.log(`  Total: ${allTasks.length}`);

    if (statusCounts.ready > 0) {
      console.log('\n🚀 Ready Tasks:');
      const readyTasks = allTasks.filter(t => t.status === 'ready');
      readyTasks.forEach(task => {
        console.log(`  • ${task.id}: ${task.title} (${task.priority})`);
      });
    }

    if (statusCounts['in-progress'] > 0) {
      console.log('\n⚡ In Progress Tasks:');
      const inProgressTasks = allTasks.filter(t => t.status === 'in-progress');
      inProgressTasks.forEach(task => {
        console.log(`  • ${task.id}: ${task.title} (${task.agent})`);
      });
    }

    if (statusCounts.review > 0) {
      console.log('\n👀 Tasks Under Review:');
      const reviewTasks = allTasks.filter(t => t.status === 'review');
      reviewTasks.forEach(task => {
        console.log(`  • ${task.id}: ${task.title}`);
      });
    }

    if (statusCounts.failed > 0) {
      console.log('\n❌ Failed Tasks:');
      const failedTasks = allTasks.filter(t => t.status === 'failed');
      failedTasks.forEach(task => {
        console.log(`  • ${task.id}: ${task.title}`);
      });
    }
  }

  async getNextTask(agent: 'cursor' | 'codex' | 'chatgpt'): Promise<Task | null> {
    const nextTask = await this.taskManager.getNextTaskForAgent(agent);
    
    if (nextTask) {
      console.log(`🎯 Next task for ${agent}:`);
      console.log(`  • ${nextTask.id}: ${nextTask.title}`);
      console.log(`  • Priority: ${nextTask.priority}`);
      console.log(`  • Status: ${nextTask.status}`);
      console.log(`  • Location: .mcp/tasks/${nextTask.status}/${nextTask.id}.md`);
    } else {
      console.log(`😴 No tasks available for ${agent}`);
    }

    return nextTask;
  }

  async updateGitContext(taskId: string, branch: string, commit: string, pr?: string): Promise<void> {
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    await this.taskManager.updateTask(taskId, {
      gitContext: {
        branch,
        commit,
        pr: pr || ''
      }
    });

    console.log(`✅ Git context updated for task ${taskId}`);
    console.log(`  Branch: ${branch}`);
    console.log(`  Commit: ${commit}`);
    if (pr) console.log(`  PR: ${pr}`);
  }
}
