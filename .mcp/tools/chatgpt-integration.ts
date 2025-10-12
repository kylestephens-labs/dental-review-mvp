import * as fs from 'fs/promises';
import * as path from 'path';
import { TaskManager, Task } from './task-manager.js';

export class ChatGPTIntegration {
  private taskManager: TaskManager;
  private projectContextFiles: string[];

  constructor(tasksDir: string = '.mcp/tasks') {
    this.taskManager = new TaskManager(path.resolve(tasksDir));
    this.projectContextFiles = [
      'docs/dentist_project/architecture.md',
      'docs/dentist_project/business_plan',
      'docs/dentist_project/MVP',
      'docs/dentist_project/tasks.md'
    ];
  }

  /**
   * Automatically fill out task details using ChatGPT integration
   * This simulates ChatGPT reading project context and filling out task details
   */
  async fillOutTaskDetails(taskId: string): Promise<void> {
    console.log(`🤖 ChatGPT Integration: Analyzing task ${taskId}...`);
    
    try {
      // Get the task
      const task = await this.taskManager.getTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Read project context files
      const projectContext = await this.readProjectContext();
      
      // Analyze task and generate details
      const taskDetails = await this.generateTaskDetails(task, projectContext);
      
      // Update the task with generated details
      await this.taskManager.updateTask(taskId, taskDetails);
      
      console.log(`✅ ChatGPT Integration: Task ${taskId} details filled out successfully`);
      
    } catch (error) {
      console.error(`❌ ChatGPT Integration failed for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Read all project context files
   */
  private async readProjectContext(): Promise<string> {
    console.log(`📚 Reading project context files...`);
    
    let context = '';
    
    for (const filePath of this.projectContextFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        context += `\n\n=== ${filePath} ===\n${content}`;
        console.log(`✅ Read: ${filePath}`);
      } catch (error) {
        console.log(`⚠️  Could not read ${filePath}: ${error.message}`);
        // Continue with other files even if one fails
      }
    }
    
    return context;
  }

  /**
   * Generate task details based on task title and project context
   * This simulates ChatGPT's analysis and response
   */
  private async generateTaskDetails(task: Task, projectContext: string): Promise<Partial<Task>> {
    console.log(`🧠 ChatGPT Analysis: Generating details for "${task.title}"...`);
    
    // Extract key information from project context
    const contextSummary = this.extractContextSummary(projectContext);
    
    // Generate task details based on the task title and context
    const details = this.analyzeTaskAndGenerateDetails(task.title, contextSummary);
    
    return details;
  }

  /**
   * Extract key information from project context
   */
  private extractContextSummary(context: string): any {
    // Extract key architectural patterns, business goals, and technical requirements
    const summary = {
      architecture: this.extractArchitectureInfo(context),
      businessGoals: this.extractBusinessGoals(context),
      technicalRequirements: this.extractTechnicalRequirements(context),
      mvpFeatures: this.extractMVPFeatures(context),
      tasksContext: this.extractTasksContext(context)
    };
    
    return summary;
  }

  /**
   * Extract tasks.md content for parsing specific task requirements
   */
  private extractTasksContext(context: string): string {
    // Look for tasks.md section in the context
    const tasksMatch = context.match(/=== docs\/dentist_project\/tasks\.md ===\n([\s\S]*?)(?=\n===|\n\n===|$)/);
    return tasksMatch ? tasksMatch[1] : '';
  }

  /**
   * Extract architecture information
   */
  private extractArchitectureInfo(context: string): string[] {
    const patterns = [];
    
    if (context.includes('React') || context.includes('Vite')) {
      patterns.push('React + Vite frontend');
    }
    if (context.includes('Supabase')) {
      patterns.push('Supabase backend');
    }
    if (context.includes('Stripe')) {
      patterns.push('Stripe payment processing');
    }
    if (context.includes('Twilio')) {
      patterns.push('Twilio SMS/communication');
    }
    if (context.includes('AWS SES')) {
      patterns.push('AWS SES email service');
    }
    if (context.includes('Google')) {
      patterns.push('Google services integration');
    }
    
    return patterns;
  }

  /**
   * Extract business goals
   */
  private extractBusinessGoals(context: string): string[] {
    const goals = [];
    
    if (context.includes('dental') || context.includes('dentist')) {
      goals.push('Dental practice management');
    }
    if (context.includes('booking') || context.includes('appointment')) {
      goals.push('Appointment booking system');
    }
    if (context.includes('lead') || context.includes('intake')) {
      goals.push('Lead intake and management');
    }
    if (context.includes('payment') || context.includes('billing')) {
      goals.push('Payment processing');
    }
    
    return goals;
  }

  /**
   * Extract technical requirements
   */
  private extractTechnicalRequirements(context: string): string[] {
    const requirements = [];
    
    if (context.includes('environment') || context.includes('.env')) {
      requirements.push('Environment variable management');
    }
    if (context.includes('validation') || context.includes('check')) {
      requirements.push('Input validation');
    }
    if (context.includes('error') || context.includes('fail')) {
      requirements.push('Error handling');
    }
    if (context.includes('test') || context.includes('TDD')) {
      requirements.push('Test-driven development');
    }
    
    return requirements;
  }

  /**
   * Extract MVP features
   */
  private extractMVPFeatures(context: string): string[] {
    const features = [];
    
    if (context.includes('landing page')) {
      features.push('Landing page');
    }
    if (context.includes('contact form')) {
      features.push('Contact form');
    }
    if (context.includes('booking')) {
      features.push('Booking system');
    }
    if (context.includes('payment')) {
      features.push('Payment integration');
    }
    
    return features;
  }

  /**
   * Parse specific task requirements from project context (tasks.md)
   */
  private parseTaskRequirementsFromContext(taskTitle: string, contextSummary: any): any {
    // Look for the specific task in the context
    const tasksContext = contextSummary.tasksContext || '';
    
    // Extract task number and description from title
    const taskMatch = taskTitle.match(/(\d+)\.?\s*(.+)/);
    if (!taskMatch) return null;
    
    const taskNumber = taskMatch[1];
    const taskDescription = taskMatch[2].toLowerCase();
    
    console.log(`🔍 Parsing task ${taskNumber}: "${taskDescription}"`);
    console.log(`📄 Tasks context length: ${tasksContext.length}`);
    
    // Look for the specific task in tasks.md content
    // Handle both tab-separated and newline-separated formats
    const taskPattern = new RegExp(`${taskNumber}\\.\\s*([^\\n]+)[\\s\\n]+Start: ([^\\n]+)[\\s\\n]+End: ([^\\n]+)`, 'i');
    const match = tasksContext.match(taskPattern);
    
    if (!match) {
      console.log(`❌ No match found for task ${taskNumber}`);
      console.log(`🔍 Pattern: ${taskPattern}`);
      // Try a more flexible pattern
      const flexiblePattern = new RegExp(`${taskNumber}\\.\\s*([^\\n]+).*?Start: ([^\\n]+).*?End: ([^\\n]+)`, 'is');
      const flexibleMatch = tasksContext.match(flexiblePattern);
      if (flexibleMatch) {
        console.log(`✅ Flexible pattern matched`);
        const [, fullDescription, startRequirement, endRequirement] = flexibleMatch;
        return this.generateTaskDetailsFromRequirements(fullDescription, startRequirement, endRequirement);
      }
      return null;
    }
    
    console.log(`✅ Pattern matched for task ${taskNumber}`);
    const [, fullDescription, startRequirement, endRequirement] = match;
    
    console.log(`📝 Full description: "${fullDescription}"`);
    console.log(`🚀 Start requirement: "${startRequirement}"`);
    console.log(`🏁 End requirement: "${endRequirement}"`);
    
    const result = this.generateTaskDetailsFromRequirements(fullDescription, startRequirement, endRequirement);
    console.log(`📋 Generated details:`, JSON.stringify(result, null, 2));
    
    return result;
  }

  /**
   * Generate task details from Start/End requirements
   */
  private generateTaskDetailsFromRequirements(fullDescription: string, startRequirement: string, endRequirement: string): any {
    // Generate task details based on Start/End requirements
    const overview = fullDescription.trim();
    const goal = `Implement ${fullDescription.trim()} as specified in tasks.md`;
    
    // Parse Start requirement for files affected
    const filesAffected = [];
    if (startRequirement.includes('/')) {
      const filePath = startRequirement.trim();
      filesAffected.push(filePath);
    }
    
    // Parse End requirement for acceptance criteria
    const acceptanceCriteria = [];
    const endParts = endRequirement.split(';');
    
    for (const part of endParts) {
      const trimmed = part.trim();
      if (trimmed) {
        acceptanceCriteria.push(trimmed);
      }
    }
    
    // Add common acceptance criteria
    acceptanceCriteria.push('Implementation follows architecture specifications');
    acceptanceCriteria.push('Code is tested and working');
    acceptanceCriteria.push('Documentation updated if needed');
    
    const definitionOfReady = [
      'Task requirements are clear from docs/dentist_project/tasks.md',
      'Architecture context is understood',
      'Start and End requirements are parsed',
      'Implementation approach is determined'
    ];
    
    const definitionOfDone = [
      'All Start/End requirements from tasks.md are met',
      'Implementation follows project architecture',
      'Code compiles and passes tests',
      'Files are created/modified as specified',
      'Documentation updated if needed'
    ];
    
    return {
      overview,
      goal,
      acceptanceCriteria,
      definitionOfReady,
      definitionOfDone,
      filesAffected
    };
  }

  /**
   * Analyze task and generate specific details based on project context
   */
  private analyzeTaskAndGenerateDetails(taskTitle: string, contextSummary: any): Partial<Task> {
    const title = taskTitle.toLowerCase();
    
    // Generate Overview
    let overview = '';
    let goal = '';
    let acceptanceCriteria: string[] = [];
    let definitionOfReady: string[] = [];
    let definitionOfDone: string[] = [];
    let filesAffected: string[] = [];
    
    // Parse task requirements from project context
    const taskRequirements = this.parseTaskRequirementsFromContext(taskTitle, contextSummary);
    
    // If we have parsed requirements, use them
    if (taskRequirements) {
      overview = taskRequirements.overview;
      goal = taskRequirements.goal;
      acceptanceCriteria = taskRequirements.acceptanceCriteria;
      definitionOfReady = taskRequirements.definitionOfReady;
      definitionOfDone = taskRequirements.definitionOfDone;
      filesAffected = taskRequirements.filesAffected;
    } else if (title.includes('env') || title.includes('environment')) {
      overview = 'Set up environment variable management system with validation and fail-fast boot checks';
      goal = 'Create a robust environment variable system that ensures all required API keys and configuration are present before the application starts';
      
      acceptanceCriteria = [
        'Create .env.example file with all required environment variables',
        'Implement environment validation script that checks for all required variables',
        'Boot script fails fast with clear error messages if any required variables are missing',
        'npm run env:check command passes locally with all variables present',
        'All API integrations (Stripe, Twilio, SES, Places, GCal, Graph, DB, HMAC) have their required variables defined'
      ];
      
      definitionOfReady = [
        'Project architecture is understood',
        'All required API services are identified',
        'Environment variable naming conventions are established',
        'Validation requirements are clear'
      ];
      
      definitionOfDone = [
        '.env.example file created with all required variables',
        'Environment validation script implemented',
        'Boot script fails fast on missing variables',
        'npm run env:check command works locally',
        'All tests pass',
        'Documentation updated'
      ];
      
      filesAffected = [
        '.env.example',
        'src/env-check.ts',
        'package.json (scripts)',
        'src/__tests__/env-validation.test.ts'
      ];
    }
    
    // Add implementation notes
    const implementationNotes = `Task Analysis:
- Architecture: ${contextSummary.architecture.join(', ')}
- Business Goals: ${contextSummary.businessGoals.join(', ')}
- Technical Requirements: ${contextSummary.technicalRequirements.join(', ')}
- MVP Features: ${contextSummary.mvpFeatures.join(', ')}

This task is critical for the dental MVP as it ensures all external service integrations are properly configured before deployment.`;

    return {
      overview,
      goal,
      acceptanceCriteria,
      definitionOfReady,
      definitionOfDone,
      filesAffected,
      implementationNotes
    };
  }
}

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const taskId = process.argv[2];
  if (!taskId) {
    console.error('Usage: chatgpt-integration.ts <task-id>');
    process.exit(1);
  }
  
  const integration = new ChatGPTIntegration();
  integration.fillOutTaskDetails(taskId).then(() => {
    console.log('✅ ChatGPT integration completed');
  }).catch(error => {
    console.error('❌ ChatGPT integration failed:', error);
    process.exit(1);
  });
}
