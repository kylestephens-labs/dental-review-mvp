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
  codexReviewCycles?: number; // NEW: Track Codex review cycles (max 1)
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
      approach: undefined,
      codexReviewCycles: 0
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

    console.log(`🔍 Updating task ${taskId} with:`, JSON.stringify(updates, null, 2));

    const updatedTask = {
      ...task,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    console.log(`📝 Updated task:`, JSON.stringify(updatedTask, null, 2));

    await this.saveTask(updatedTask);
  }

  async moveTask(taskId: string, newStatus: Task['status']): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    // WORKFLOW ENFORCEMENT: Validate state transition
    if (!this.validateStateTransition(task.status, newStatus, task)) {
      if (task.status === 'review' && newStatus === 'in-progress' && (task.codexReviewCycles || 0) >= 1) {
        throw new Error(`Task ${taskId} has already had 1 Codex review cycle. Maximum review cycles exceeded.`);
      }
      throw new Error(`Invalid state transition: ${task.status} → ${newStatus}. Use proper MCP commands for workflow compliance.`);
    }

    // Remove from current directory
    const currentPath = await this.findTaskFile(taskId);
    if (currentPath) {
      await fs.unlink(currentPath);
    }

    // Update task status and increment review cycle if going back to in-progress from review
    const updatedTask = {
      ...task,
      status: newStatus,
      lastUpdated: new Date().toISOString(),
      codexReviewCycles: (task.status === 'review' && newStatus === 'in-progress') 
        ? (task.codexReviewCycles || 0) + 1 
        : task.codexReviewCycles || 0
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

## Codex Review Cycles: ${task.codexReviewCycles || 0}/1

## Created: ${task.created}
## Last Updated: ${task.lastUpdated}

## Overview
${task.overview || '[Overview to be defined]'}

## Goal
${task.goal || '[Goal to be defined]'}

## Acceptance Criteria
${task.acceptanceCriteria && task.acceptanceCriteria.length > 0 ? task.acceptanceCriteria.map(criteria => `- [ ] ${criteria}`).join('\n') : '- [ ] [Criteria to be defined]'}

## Definition of Ready
${task.definitionOfReady && task.definitionOfReady.length > 0 ? task.definitionOfReady.map(item => `- [ ] ${item}`).join('\n') : '- [ ] [DoR to be defined]'}

## Definition of Done
${task.definitionOfDone && task.definitionOfDone.length > 0 ? task.definitionOfDone.map(item => `- [ ] ${item}`).join('\n') : '- [ ] [DoD to be defined]'}

## Files Affected
${task.filesAffected && task.filesAffected.length > 0 ? task.filesAffected.map(file => `- ${file}`).join('\n') : '- [Files to be identified]'}

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
      } else if (line.startsWith('## Codex Review Cycles:')) {
        const cyclesMatch = line.match(/## Codex Review Cycles: (\d+)\/1/);
        if (cyclesMatch) {
          task.codexReviewCycles = parseInt(cyclesMatch[1]);
        }
      } else if (line.startsWith('## Created:')) {
        task.created = line.replace('## Created:', '').trim();
      } else if (line.startsWith('## Last Updated:')) {
        task.lastUpdated = line.replace('## Last Updated:', '').trim();
      } else if (line.startsWith('## Overview')) {
        task.overview = this.extractSectionContent(lines, i);
      } else if (line.startsWith('## Goal')) {
        task.goal = this.extractSectionContent(lines, i);
      } else if (line.startsWith('## Acceptance Criteria')) {
        task.acceptanceCriteria = this.extractArrayContent(lines, i);
      } else if (line.startsWith('## Definition of Ready')) {
        task.definitionOfReady = this.extractArrayContent(lines, i);
      } else if (line.startsWith('## Definition of Done')) {
        task.definitionOfDone = this.extractArrayContent(lines, i);
      } else if (line.startsWith('## Files Affected')) {
        task.filesAffected = this.extractArrayContent(lines, i);
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

  private extractArrayContent(lines: string[], startIndex: number): string[] {
    const items: string[] = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ')) break;
      
      // Handle both "- [ ] item" and "- item" formats
      if (line.startsWith('- [ ] ')) {
        const item = line.replace('- [ ] ', '').trim();
        if (item && !item.includes('[Criteria to be defined]') && !item.includes('[DoR to be defined]') && !item.includes('[DoD to be defined]') && !item.includes('[Files to be identified]')) {
          items.push(item);
        }
      } else if (line.startsWith('- ') && !line.startsWith('- [ ]')) {
        const item = line.replace('- ', '').trim();
        if (item && !item.includes('[Files to be identified]')) {
          items.push(item);
        }
      }
    }
    return items;
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

  /**
   * WORKFLOW ENFORCEMENT: Validate state transitions
   */
  validateStateTransition(currentStatus: Task['status'], newStatus: Task['status'], task?: Task): boolean {
    const validTransitions: Record<Task['status'], Task['status'][]> = {
      'pending': ['ready'],
      'ready': ['in-progress'],
      'in-progress': ['review', 'failed', 'completed'], // Can complete directly after Codex approval
      'review': ['in-progress', 'completed'], // Can go back to in-progress for fixes, or complete if approved
      'completed': [], // Terminal state
      'failed': ['ready'] // Can retry from ready
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    const basicTransitionValid = allowedTransitions.includes(newStatus);
    
    // Additional validation for Codex review cycles
    if (currentStatus === 'review' && newStatus === 'in-progress' && task) {
      const reviewCycles = task.codexReviewCycles || 0;
      if (reviewCycles >= 1) {
        return false; // Block if already had 1 review cycle
      }
    }
    
    return basicTransitionValid;
  }

  /**
   * WORKFLOW ENFORCEMENT: Validate task file integrity
   */
  async validateTaskIntegrity(taskId: string): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Check if task exists in exactly one location
      const locations = await this.findTaskLocations(taskId);
      
      if (locations.length === 0) {
        issues.push(`Task ${taskId} not found in any directory`);
      } else if (locations.length > 1) {
        issues.push(`Task ${taskId} found in multiple locations: ${locations.join(', ')}`);
      } else {
        // Check if file content matches directory location
        const task = await this.getTask(taskId);
        if (task && task.status !== path.basename(path.dirname(locations[0]))) {
          issues.push(`Task status '${task.status}' doesn't match directory '${path.basename(path.dirname(locations[0]))}'`);
        }
      }
      
      return { valid: issues.length === 0, issues };
    } catch (error) {
      issues.push(`Validation error: ${error.message}`);
      return { valid: false, issues };
    }
  }

  /**
   * WORKFLOW ENFORCEMENT: Find all locations where a task file exists
   */
  private async findTaskLocations(taskId: string): Promise<string[]> {
    const locations: string[] = [];
    const statusDirs = ['pending', 'ready', 'in-progress', 'review', 'completed', 'failed'];
    
    for (const statusDir of statusDirs) {
      const filePath = path.join(this.tasksDir, statusDir, `${taskId}.md`);
      try {
        await fs.access(filePath);
        locations.push(filePath);
      } catch {
        // File doesn't exist in this directory
      }
    }
    
    return locations;
  }

  /**
   * WORKFLOW ENFORCEMENT: Audit workflow compliance
   */
  async auditWorkflowCompliance(): Promise<{ compliant: boolean; violations: string[] }> {
    const violations: string[] = [];
    
    try {
      const allTasks = await this.listTasks();
      
      for (const task of allTasks) {
        const integrity = await this.validateTaskIntegrity(task.id);
        if (!integrity.valid) {
          violations.push(`Task ${task.id}: ${integrity.issues.join(', ')}`);
        }
      }
      
      return { compliant: violations.length === 0, violations };
    } catch (error) {
      violations.push(`Audit error: ${error.message}`);
      return { compliant: false, violations };
    }
  }
}
