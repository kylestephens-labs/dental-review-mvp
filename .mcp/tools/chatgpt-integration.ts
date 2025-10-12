import * as fs from 'fs/promises';
import * as path from 'path';
import OpenAI from 'openai';
import { TaskManager, Task } from './task-manager.js';

export class ChatGPTIntegration {
  private taskManager: TaskManager;
  private openai: OpenAI | null;
  private projectContextFiles: string[];

  constructor(tasksDir: string = '.mcp/tasks') {
    this.taskManager = new TaskManager(path.resolve(tasksDir));
    
    // Initialize OpenAI only if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      this.openai = null;
    }
    
    this.projectContextFiles = [
      'docs/dentist_project/architecture.md',
      'docs/dentist_project/business_plan',
      'docs/dentist_project/MVP',
      'docs/dentist_project/tasks.md'
    ];
  }

  /**
   * Automatically fill out task details using real ChatGPT API
   */
  async fillOutTaskDetails(taskId: string): Promise<void> {
    console.log(`🤖 ChatGPT Integration: Analyzing task ${taskId}...`);
    
    try {
      // Get the task
      const task = await this.taskManager.getTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Check if OpenAI API key is available
      if (!this.openai) {
        console.log(`⚠️  OpenAI API key not found - using fallback task details`);
        console.log(`💡 Set OPENAI_API_KEY environment variable to enable ChatGPT integration`);
        
        // Use fallback task details
        const taskDetails = this.generateFallbackTaskDetails(task);
        await this.taskManager.updateTask(taskId, taskDetails);
        console.log(`✅ Fallback task details applied for task ${taskId}`);
        return;
      }

      // Read project context files
      const projectContext = await this.readProjectContext();
      
      // Generate task details using ChatGPT
      const taskDetails = await this.generateTaskDetailsWithChatGPT(task, projectContext);
      
      // Update the task with generated details
      await this.taskManager.updateTask(taskId, taskDetails);
      
      console.log(`✅ ChatGPT Integration: Task ${taskId} details filled out successfully`);
      
    } catch (error) {
      console.error(`❌ ChatGPT Integration failed for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Read all project context files with token optimization
   */
  private async readProjectContext(): Promise<string> {
    console.log(`📚 Reading project context files...`);
    
    let context = '';
    
    for (const filePath of this.projectContextFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        // Truncate large files to stay under token limits
        const truncatedContent = this.truncateContent(content, 2000);
        context += `\n\n=== ${filePath} ===\n${truncatedContent}`;
        console.log(`✅ Read: ${filePath} (${truncatedContent.length} chars)`);
      } catch (error) {
        console.log(`⚠️  Could not read ${filePath}: ${error.message}`);
        // Continue with other files even if one fails
      }
    }
    
    return context;
  }

  /**
   * Truncate content to stay under token limits
   */
  private truncateContent(content: string, maxChars: number): string {
    if (content.length <= maxChars) {
      return content;
    }
    
    // Truncate and add ellipsis
    return content.substring(0, maxChars - 100) + '\n\n... [Content truncated for token limits] ...';
  }

  /**
   * Generate task details using real ChatGPT API
   */
  private async generateTaskDetailsWithChatGPT(task: Task, projectContext: string): Promise<Partial<Task>> {
    console.log(`🧠 ChatGPT Analysis: Generating details for "${task.title}"...`);
    
    const prompt = `You are a senior software engineer analyzing a task for a dental practice management MVP.

PROJECT CONTEXT:
${projectContext}

TASK TO ANALYZE:
Title: "${task.title}"
Priority: ${task.priority}

Please analyze this task and generate comprehensive task details in the following JSON format:

{
  "overview": "Brief description of what this task accomplishes",
  "goal": "Clear statement of what we want to achieve",
  "acceptanceCriteria": [
    "Specific, testable criteria 1",
    "Specific, testable criteria 2",
    "Specific, testable criteria 3"
  ],
  "definitionOfReady": [
    "Prerequisite 1",
    "Prerequisite 2",
    "Prerequisite 3"
  ],
  "definitionOfDone": [
    "Completion criteria 1",
    "Completion criteria 2",
    "Completion criteria 3"
  ],
  "filesAffected": [
    "path/to/file1.ts",
    "path/to/file2.ts"
  ],
  "implementationNotes": "Technical notes about implementation approach, architecture considerations, and any special requirements"
}

IMPORTANT GUIDELINES:
1. Make acceptance criteria specific and testable
2. Consider the dental practice management context
3. Follow the project architecture (React + Vite frontend, Supabase backend, Stripe payments, etc.)
4. Include proper error handling and validation requirements
5. Consider ADA compliance for user-facing features
6. Think about SMS character limits for communication features
7. Ensure all criteria are measurable and verifiable

Return ONLY the JSON object, no additional text.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a senior software engineer with expertise in dental practice management systems, React/TypeScript development, and test-driven development. You provide precise, actionable task specifications."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, structured output
        max_tokens: 1500 // Reduced to stay under token limits
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from ChatGPT');
      }

      // Parse the JSON response
      const taskDetails = JSON.parse(content);
      
      // Validate that we got the expected structure
      if (!taskDetails.overview || !taskDetails.goal || !Array.isArray(taskDetails.acceptanceCriteria)) {
        throw new Error('Invalid response structure from ChatGPT');
      }

      console.log(`✅ ChatGPT generated task details successfully`);
      return taskDetails;

    } catch (error) {
      console.error(`❌ ChatGPT API call failed:`, error);
      
      // Fallback to basic task details if ChatGPT fails
      console.log(`🔄 Falling back to basic task details...`);
      return this.generateFallbackTaskDetails(task);
    }
  }

  /**
   * Generate fallback task details if ChatGPT fails
   */
  public generateFallbackTaskDetails(task: Task): Partial<Task> {
    return {
      overview: task.title,
      goal: `Implement ${task.title} as specified in tasks.md`,
      acceptanceCriteria: [
        'Implementation follows architecture specifications',
        'Code is tested and working',
        'Documentation updated if needed'
      ],
      definitionOfReady: [
        'Task requirements are clear from docs/dentist_project/tasks.md',
        'Architecture context is understood',
        'Start and End requirements are parsed',
        'Implementation approach is determined'
      ],
      definitionOfDone: [
        'All Start/End requirements from tasks.md are met',
        'Implementation follows project architecture',
        'Code compiles and passes tests',
        'Files are created/modified as specified',
        'Documentation updated if needed'
      ],
      filesAffected: [],
      implementationNotes: `Task Analysis:
- Architecture: React + Vite frontend, AWS RDS (PostgreSQL) for core business data, Supabase for lead generation, Stripe payment processing, Twilio SMS/communication, AWS SES email, Google services integration
- Business Goals: Dental practice management, Appointment booking system, Lead intake and management, Payment processing
- Technical Requirements: Environment variable management, Input validation, Error handling, Test-driven development
- MVP Features: Booking system

This task is critical for the dental MVP as it ensures all external service integrations are properly configured before deployment.`
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