import * as fs from 'fs/promises';
import * as path from 'path';

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'ready' | 'in-progress' | 'review' | 'completed' | 'failed';
  priority: 'P0' | 'P1' | 'P2';
  agent: 'cursor' | 'codex' | 'chatgpt' | 'unassigned';
  created: string;
  lastUpdated: string;
  overview: string;
  goal: string;
  acceptanceCriteria: string[];
  definitionOfReady: string[];
  definitionOfDone: string[];
  filesAffected: string[];
  implementationNotes: string;
  reviewFeedback: string;
  feedbackResolved: boolean; // NEW: Track if Codex feedback has been addressed
  errorContext: string;
  gitContext: {
    branch: string;
    commit: string;
    pr: string;
  };
  classification?: 'functional' | 'non_functional'; // NEW: Task classification
  approach?: string; // NEW: Implementation approach
}

export class TaskManager {
  private tasksDir: string;

  constructor(tasksDir: string = '.mcp/tasks') {
    this.tasksDir = path.resolve(tasksDir);
  }

  async createTask(title: string, priority: 'P0' | 'P1' | 'P2' = 'P1'): Promise<string> {
    const taskId = this.generateTaskId();
    const now = new Date().toISOString();
    
    const task: Task = {
      id: taskId,
      title,
      status: 'pending',
      priority,
      agent: 'unassigned',
      created: now,
      lastUpdated: now,
      overview: '',
      goal: '',
      acceptanceCriteria: [],
      definitionOfReady: [],
      definitionOfDone: [],
      filesAffected: [],
      implementationNotes: '',
      reviewFeedback: '',
      feedbackResolved: true, // Default to true (no feedback to resolve)
      errorContext: '',
      gitContext: {
        branch: '',
        commit: '',
        pr: ''
      },
      classification: undefined,
      approach: undefined
    };

    await this.saveTask(task);
    return taskId;
  }

  async getTask(taskId: string): Promise<Task | null> {
    try {
      const taskPath = await this.findTaskFile(taskId);
      if (!taskPath) return null;
      
      const content = await fs.readFile(taskPath, 'utf-8');
      return this.parseTaskFile(content);
    } catch (error) {
      console.error(`Error reading task ${taskId}:`, error);
      return null;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const updatedTask = {
      ...task,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    await this.saveTask(updatedTask);
  }

  async moveTask(taskId: string, newStatus: Task['status']): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    // Remove from current directory
    const currentPath = await this.findTaskFile(taskId);
    if (currentPath) {
      await fs.unlink(currentPath);
    }

    // Update task status and save to new directory
    const updatedTask = {
      ...task,
      status: newStatus,
      lastUpdated: new Date().toISOString()
    };
    
    await this.saveTask(updatedTask);
  }

  async listTasks(status?: Task['status']): Promise<Task[]> {
    const tasks: Task[] = [];
    const statusDirs = status ? [status] : ['pending', 'ready', 'in-progress', 'review', 'feedback', 'completed', 'failed'];

    for (const statusDir of statusDirs) {
      const dirPath = path.join(this.tasksDir, statusDir);
      try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (file.endsWith('.md')) {
            const taskId = file.replace('.md', '');
            const task = await this.getTask(taskId);
            if (task) tasks.push(task);
          }
        }
      } catch (error) {
        // Directory might not exist yet
        continue;
      }
    }

    return tasks.sort((a, b) => {
      // Sort by priority (P0 > P1 > P2) then by creation date
      const priorityOrder = { P0: 0, P1: 1, P2: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.created).getTime() - new Date(b.created).getTime();
    });
  }

  async getNextTaskForAgent(agent: 'cursor' | 'codex' | 'chatgpt'): Promise<Task | null> {
    const tasks = await this.listTasks('ready');
    
    // Filter by agent capability (simplified for MVP)
    const availableTasks = tasks.filter(task => {
      if (agent === 'cursor') {
        return task.priority === 'P0' || task.priority === 'P1';
      } else if (agent === 'codex') {
        return task.priority === 'P0' || task.priority === 'P2';
      } else if (agent === 'chatgpt') {
        return true; // ChatGPT can handle any task
      }
      return false;
    });

    return availableTasks[0] || null;
  }

  private async saveTask(task: Task): Promise<void> {
    const statusDir = path.join(this.tasksDir, task.status);
    await fs.mkdir(statusDir, { recursive: true });
    
    const filePath = path.join(statusDir, `${task.id}.md`);
    const content = this.formatTaskFile(task);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  private async findTaskFile(taskId: string): Promise<string | null> {
    const statusDirs = ['pending', 'ready', 'in-progress', 'review', 'feedback', 'completed', 'failed'];
    
    for (const statusDir of statusDirs) {
      const filePath = path.join(this.tasksDir, statusDir, `${taskId}.md`);
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        continue;
      }
    }
    
    return null;
  }

  private generateTaskId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `task-${timestamp}-${random}`;
  }

  private formatTaskFile(task: Task): string {
    return `# Task: ${task.id} - ${task.title}

## Status: ${task.status}

## Priority: ${task.priority}

## Agent: ${task.agent}

## Classification: ${task.classification || '[Classification to be determined]'}

## Approach: ${task.approach || '[Approach to be determined]'}

## Created: ${task.created}
## Last Updated: ${task.lastUpdated}

## Overview
${task.overview || '[Overview to be defined]'}

## Goal
${task.goal || '[Goal to be defined]'}

## Acceptance Criteria
${task.acceptanceCriteria.map(criteria => `- [ ] ${criteria}`).join('\n') || '- [ ] [Criteria to be defined]'}

## Definition of Ready
${task.definitionOfReady.map(item => `- [ ] ${item}`).join('\n') || '- [ ] [DoR to be defined]'}

## Definition of Done
${task.definitionOfDone.map(item => `- [ ] ${item}`).join('\n') || '- [ ] [DoD to be defined]'}

## Files Affected
${task.filesAffected.map(file => `- ${file}`).join('\n') || '- [Files to be identified]'}

## Implementation Notes
${task.implementationNotes || '[Implementation notes will be added here]'}

## Review Feedback
${task.reviewFeedback || '[Review feedback will be added here]'}

## Feedback Resolution Status
${task.feedbackResolved ? '✅ Resolved' : '⚠️ Action Required'}

## Error Context
${task.errorContext || '[Error context will be added here]'}

## Git Context
- Branch: ${task.gitContext.branch || '[Branch to be set]'}
- Commit: ${task.gitContext.commit || '[Commit to be set]'}
- PR: ${task.gitContext.pr || '[PR to be set]'}
`;
  }

  private parseTaskFile(content: string): Task {
    const lines = content.split('\n');
    const task: Partial<Task> = {
      acceptanceCriteria: [],
      definitionOfReady: [],
      definitionOfDone: [],
      filesAffected: [],
      gitContext: { branch: '', commit: '', pr: '' }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('# Task:')) {
        const match = line.match(/# Task: (.+) - (.+)/);
        if (match) {
          task.id = match[1];
          task.title = match[2];
        }
      } else if (line.startsWith('## Status:')) {
        task.status = line.replace('## Status:', '').trim() as Task['status'];
      } else if (line.startsWith('## Priority:')) {
        task.priority = line.replace('## Priority:', '').trim() as Task['priority'];
      } else if (line.startsWith('## Agent:')) {
        task.agent = line.replace('## Agent:', '').trim() as Task['agent'];
      } else if (line.startsWith('## Classification:')) {
        const classification = line.replace('## Classification:', '').trim();
        if (classification !== '[Classification to be determined]') {
          task.classification = classification as 'functional' | 'non_functional';
        }
      } else if (line.startsWith('## Approach:')) {
        const approach = line.replace('## Approach:', '').trim();
        if (approach !== '[Approach to be determined]') {
          task.approach = approach;
        }
      } else if (line.startsWith('## Created:')) {
        task.created = line.replace('## Created:', '').trim();
      } else if (line.startsWith('## Last Updated:')) {
        task.lastUpdated = line.replace('## Last Updated:', '').trim();
      } else if (line.startsWith('## Overview')) {
        task.overview = this.extractSectionContent(lines, i);
      } else if (line.startsWith('## Goal')) {
        task.goal = this.extractSectionContent(lines, i);
      } else if (line.startsWith('## Implementation Notes')) {
        task.implementationNotes = this.extractSectionContent(lines, i);
      } else if (line.startsWith('## Review Feedback')) {
        task.reviewFeedback = this.extractSectionContent(lines, i);
        // Check if feedback has been resolved
        task.feedbackResolved = !this.hasActionableFeedback(task.reviewFeedback);
      } else if (line.startsWith('## Feedback Resolution Status')) {
        const nextLine = lines[i + 1];
        task.feedbackResolved = nextLine && nextLine.includes('✅ Resolved');
      } else if (line.startsWith('## Error Context')) {
        task.errorContext = this.extractSectionContent(lines, i);
      } else if (line.startsWith('- Branch:')) {
        task.gitContext!.branch = line.replace('- Branch:', '').trim();
      } else if (line.startsWith('- Commit:')) {
        task.gitContext!.commit = line.replace('- Commit:', '').trim();
      } else if (line.startsWith('- PR:')) {
        task.gitContext!.pr = line.replace('- PR:', '').trim();
      }
    }

    return task as Task;
  }

  private extractSectionContent(lines: string[], startIndex: number): string {
    const content: string[] = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ')) break;
      content.push(line);
    }
    return content.join('\n').trim();
  }

  /**
   * Get all tasks by status
   */
  async getTasksByStatus(status: string): Promise<Task[]> {
    const statusDir = path.join(this.tasksDir, status);
    try {
      const files = await fs.readdir(statusDir);
      const tasks: Task[] = [];
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const taskId = file.replace('.md', '');
          const task = await this.getTask(taskId);
          if (task) {
            tasks.push(task);
          }
        }
      }
      
      return tasks;
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if review feedback contains actionable items
   */
  private hasActionableFeedback(reviewFeedback: string): boolean {
    if (!reviewFeedback || reviewFeedback.trim() === '') {
      return false;
    }
    
    const actionableKeywords = [
      'consider', 'recommend', 'suggest', 'improve', 'fix', 'address',
      'warning', 'issue', 'problem', 'concern', 'better', 'enhance'
    ];
    
    const feedbackLower = reviewFeedback.toLowerCase();
    return actionableKeywords.some(keyword => feedbackLower.includes(keyword));
  }
}
