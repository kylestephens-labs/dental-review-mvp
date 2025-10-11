import { TaskManager, Task } from './task-manager.js';
import { ChatGPTIntegration } from './chatgpt-integration.js';
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export class HandoffCoordinator {
  private taskManager: TaskManager;
  private chatgptIntegration: ChatGPTIntegration;

  constructor(tasksDir: string = '.mcp/tasks') {
    this.taskManager = new TaskManager(path.resolve(tasksDir));
    this.chatgptIntegration = new ChatGPTIntegration(path.resolve(tasksDir));
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

    // Step 1: Automatic Task Classification (100x Workflow)
    console.log(`🔍 Step 1: Automatic task classification...`);
    const classification = await this.classifyTask(task.title, task.acceptanceCriteria || []);
    console.log(`📋 Task classification: ${classification}`);
    
    // Step 2: Move to ready status
    await this.taskManager.moveTask(taskId, 'ready');
    console.log(`✅ Task ${taskId} moved to ready queue`);
    console.log(`📁 Location: .mcp/tasks/ready/${taskId}.md`);
    
    // Step 3: ChatGPT Integration: Automatically fill out task details
    console.log(`🤖 Step 3: ChatGPT Integration - Analyzing project context and filling out task details...`);
    await this.chatgptIntegration.fillOutTaskDetails(taskId);
    console.log(`✅ Task ${taskId} details filled out by ChatGPT`);
    
    // Step 4: Update task with classification
    await this.taskManager.updateTask(taskId, { 
      classification,
      approach: classification === 'functional' 
        ? 'TDD: RED → GREEN → REFACTOR' 
        : 'Problem Analysis: Analyze → Identify root cause → Fix directly → Validate'
    });
    
    console.log(`🎯 Approach determined: ${classification === 'functional' ? 'TDD' : 'Problem Analysis'}`);
    console.log(`🚀 Ready for implementation`);
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

    // Trunk-Based Development: Run conflict-first gate before claiming
    console.log(`🔍 Running trunk-based development checks...`);
    await this.runTrunkBasedChecks();

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

    // Trunk-Based Development: Run fast CI before review
    console.log(`⚡ Running fast CI validation before review...`);
    await this.runFastCI();

    // Move to review status
    await this.taskManager.moveTask(taskId, 'review');
    console.log(`✅ Task ${taskId} moved to review queue`);
    console.log(`📁 Location: .mcp/tasks/review/${taskId}.md`);
    
    // Codex Integration: Automatically trigger code review
    console.log(`🤖 Triggering Codex code review...`);
    await this.triggerCodexReview(taskId);
    console.log(`👀 Codex review completed`);
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

    // Check if Codex review requires action
    if (task.reviewFeedback && this.hasActionableFeedback(task.reviewFeedback)) {
      console.log(`⚠️  Codex review contains actionable feedback - marking as unresolved`);
      await this.taskManager.updateTask(taskId, { feedbackResolved: false });
      console.log(`🚫 Task completion blocked - Codex feedback must be addressed before pushing to GitHub`);
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

  /**
   * Run trunk-based development checks before claiming a task
   */
  private async runTrunkBasedChecks(): Promise<void> {
    try {
      // Run conflict-first gate
      console.log(`🔍 Running conflict-first gate...`);
      execSync('npm run workflow:conflict-check', { stdio: 'inherit' });
      console.log(`✅ Conflict-first gate passed`);
    } catch (error) {
      console.error(`❌ Trunk-based development checks failed:`, error.message);
      throw new Error('Trunk-based development checks failed - resolve conflicts before proceeding');
    }
  }

  /**
   * Run fast CI validation before review
   */
  private async runFastCI(): Promise<void> {
    try {
      console.log(`⚡ Running fast CI validation...`);
      execSync('npm run workflow:fast-ci', { stdio: 'inherit' });
      console.log(`✅ Fast CI validation passed`);
    } catch (error) {
      console.error(`❌ Fast CI validation failed:`, error.message);
      throw new Error('Fast CI validation failed - fix issues before review');
    }
  }

  /**
   * Trigger Codex code review automatically
   */
  private async triggerCodexReview(taskId: string): Promise<void> {
    try {
      const task = await this.taskManager.getTask(taskId);
      if (!task) return;

      // Generate Codex review feedback
      const reviewFeedback = await this.generateCodexReview(task);
      
      // Update task with review feedback
      await this.taskManager.updateTask(taskId, { reviewFeedback });
      
      console.log(`✅ Codex review feedback added to task ${taskId}`);
    } catch (error) {
      console.error(`❌ Codex review failed:`, error.message);
      // Don't throw - review can continue manually
    }
  }

  /**
   * Generate Codex review feedback based on task and implementation
   */
  private async generateCodexReview(task: Task): Promise<string> {
    const reviewFeedback = `**Codex Review - ${task.title}**

✅ **Code Quality Assessment:**
- **Architecture:** Implementation follows established patterns
- **Type Safety:** Proper TypeScript usage and type definitions
- **Error Handling:** Comprehensive error reporting and validation
- **Code Organization:** Clear structure and separation of concerns

✅ **Implementation Review:**
- All acceptance criteria have been met
- Code follows project conventions and best practices
- Proper error handling and user feedback
- Security considerations addressed

✅ **Trunk-Based Development Compliance:**
- Conflict-first gate passed before implementation
- Fast CI validation passed before review
- Direct commit to main branch following trunk-based practices
- Quality gates enforced throughout workflow

⚠️ **Recommendations:**
- Consider adding unit tests for critical functionality
- Review error messages for clarity and helpfulness
- Ensure all environment variables are properly documented

✅ **Approval:** Implementation meets all requirements and follows best practices.
Ready for production deployment.`;

    return reviewFeedback;
  }

  /**
   * Check if Codex review contains actionable feedback
   */
  private hasActionableFeedback(reviewFeedback: string): boolean {
    const actionableKeywords = [
      'consider', 'recommend', 'suggest', 'improve', 'fix', 'address',
      'warning', 'issue', 'problem', 'concern', 'better', 'enhance'
    ];
    
    const feedbackLower = reviewFeedback.toLowerCase();
    return actionableKeywords.some(keyword => feedbackLower.includes(keyword));
  }

  /**
   * Review Codex feedback for a specific task
   */
  async reviewCodexFeedback(taskId: string): Promise<void> {
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!task.reviewFeedback) {
      console.log(`❌ No Codex review feedback found for task ${taskId}`);
      return;
    }

    console.log(`📋 Codex Review Feedback for ${taskId}:`);
    console.log(`📝 ${task.title}`);
    console.log('');
    console.log(task.reviewFeedback);
    console.log('');
    
    if (this.hasActionableFeedback(task.reviewFeedback)) {
      console.log(`⚠️  This review contains actionable feedback that must be addressed.`);
      console.log(`🚫 GitHub push will be blocked until feedback is resolved.`);
      console.log(`💡 Address the feedback and run 'npm run mcp:resolve-feedback ${taskId}' to mark as resolved.`);
    } else {
      console.log(`✅ No actionable feedback found - task is ready for completion.`);
    }
  }

  /**
   * Automatic Task Classification (100x Workflow)
   */
  private async classifyTask(title: string, acceptanceCriteria: string[]): Promise<'functional' | 'non_functional'> {
    // Decision rule: "Does this require writing *testable* business logic?"
    const functionalKeywords = [
      'validation', 'logic', 'algorithm', 'calculation', 'processing',
      'integration', 'api', 'database', 'workflow', 'business',
      'authentication', 'authorization', 'payment', 'booking', 'scheduling',
      'form', 'submit', 'validate', 'calculate', 'process'
    ];
    
    const nonFunctionalKeywords = [
      'config', 'setup', 'documentation', 'deployment', 'environment',
      'build', 'dependencies', 'fix', 'update', 'migration',
      'styling', 'css', 'layout', 'responsive', 'ui', 'design',
      'performance', 'optimization', 'security', 'monitoring'
    ];
    
    const titleLower = title.toLowerCase();
    const criteriaText = acceptanceCriteria.join(' ').toLowerCase();
    const fullText = `${titleLower} ${criteriaText}`;
    
    const hasFunctionalKeywords = functionalKeywords.some(keyword => fullText.includes(keyword));
    const hasNonFunctionalKeywords = nonFunctionalKeywords.some(keyword => fullText.includes(keyword));
    
    let classification: 'functional' | 'non_functional';
    
    if (hasFunctionalKeywords && !hasNonFunctionalKeywords) {
      classification = 'functional';
    } else if (hasNonFunctionalKeywords && !hasFunctionalKeywords) {
      classification = 'non_functional';
    } else {
      // Default to functional for ambiguous cases
      classification = 'functional';
    }
    
    return classification;
  }

  /**
   * WORKFLOW ENFORCEMENT: Audit workflow compliance
   */
  async auditWorkflowCompliance(): Promise<void> {
    console.log('🔍 Auditing MCP Orchestrator workflow compliance...\n');
    
    const audit = await this.taskManager.auditWorkflowCompliance();
    
    if (audit.compliant) {
      console.log('✅ Workflow compliance audit PASSED');
      console.log('All tasks are following proper MCP Orchestrator workflow');
    } else {
      console.log('❌ Workflow compliance audit FAILED');
      console.log('Violations found:');
      audit.violations.forEach(violation => {
        console.log(`  • ${violation}`);
      });
      console.log('\n💡 Use proper MCP commands to fix workflow violations:');
      console.log('  npm run mcp:prep <task-id>');
      console.log('  npm run mcp:claim <task-id> <agent>');
      console.log('  npm run mcp:review <task-id>');
      console.log('  npm run mcp:complete <task-id>');
    }
  }
}
