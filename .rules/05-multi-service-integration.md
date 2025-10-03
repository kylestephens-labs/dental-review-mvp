# Multi-Service Integration Guide

## Purpose
Normalize patterns across Supabase, n8n, Vercel, and other services for consistent, reliable integrations in the dental landing template project.

## Scope
- Supabase database integration
- n8n workflow automation
- Vercel deployment and hosting
- Form submission handling
- Lead processing workflows
- Error handling and retry logic

## Service Integration Patterns

### Supabase Integration
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export class SupabaseClient {
  private supabase: SupabaseClient;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  async submitLead(leadData: LeadData): Promise<LeadSubmissionResult> {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .insert([{
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          appointment_type: leadData.appointmentType,
          preferred_date: leadData.preferredDate,
          preferred_time: leadData.preferredTime,
          notes: leadData.notes,
          consent: leadData.consent,
          site_id: leadData.siteId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return {
        success: true,
        leadId: data.id,
        message: 'Lead submitted successfully'
      };
    } catch (error) {
      console.error('Lead submission failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to submit lead'
      };
    }
  }
  
  async getSiteConfig(siteId: string): Promise<SiteConfig> {
    const { data, error } = await this.supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch site config: ${error.message}`);
    }
    
    return data;
  }
}
```

### n8n Workflow Integration
```typescript
// lib/n8n-workflows.ts
export class N8NWorkflowClient {
  private webhookUrl: string;
  private apiKey: string;
  
  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL!;
    this.apiKey = process.env.N8N_API_KEY!;
  }
  
  async triggerLeadWorkflow(leadData: LeadData): Promise<WorkflowResult> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Webhook-Signature': this.generateSignature(leadData)
        },
        body: JSON.stringify({
          lead: leadData,
          timestamp: new Date().toISOString(),
          source: 'dental-landing-form'
        })
      });
      
      if (!response.ok) {
        throw new Error(`n8n workflow failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        success: true,
        workflowId: result.workflowId,
        message: 'Workflow triggered successfully'
      };
    } catch (error) {
      console.error('n8n workflow failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to trigger workflow'
      };
    }
  }
  
  private generateSignature(data: any): string {
    const payload = JSON.stringify(data);
    return crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');
  }
}
```

### Vercel Integration
```typescript
// lib/vercel.ts
export class VercelClient {
  private apiToken: string;
  private teamId: string;
  
  constructor() {
    this.apiToken = process.env.VERCEL_TOKEN!;
    this.teamId = process.env.VERCEL_TEAM_ID!;
  }
  
  async deploySite(siteConfig: SiteConfig): Promise<DeploymentResult> {
    try {
      const response = await fetch(`https://api.vercel.com/v13/deployments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: siteConfig.domain,
          gitSource: {
            type: 'github',
            repo: 'dental-landing-template',
            ref: 'main'
          },
          env: {
            NEXT_PUBLIC_SITE_NAME: siteConfig.name,
            NEXT_PUBLIC_SITE_PHONE: siteConfig.phone,
            NEXT_PUBLIC_SITE_EMAIL: siteConfig.email,
            NEXT_PUBLIC_SITE_ADDRESS: siteConfig.address,
            NEXT_PUBLIC_SITE_HOURS: siteConfig.hours,
            NEXT_PUBLIC_SITE_ID: siteConfig.id
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Vercel deployment failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        success: true,
        deploymentId: result.id,
        url: result.url,
        message: 'Site deployed successfully'
      };
    } catch (error) {
      console.error('Vercel deployment failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to deploy site'
      };
    }
  }
}
```

## Unified Error Handling

### Error Types
```typescript
// lib/error-handler.ts
export interface ServiceError {
  service: string;
  code: string;
  message: string;
  retryable: boolean;
  retryAfter?: number;
  originalError?: any;
}

export class ServiceErrorHandler {
  private retryStrategies: Map<string, RetryStrategy> = new Map();
  
  constructor() {
    this.retryStrategies.set('supabase', new ExponentialBackoffStrategy(3, 1000));
    this.retryStrategies.set('n8n', new ExponentialBackoffStrategy(3, 2000));
    this.retryStrategies.set('vercel', new LinearBackoffStrategy(5, 500));
  }
  
  async handleError(error: any, service: string): Promise<ServiceError> {
    const normalizedError = this.normalizeError(error, service);
    
    if (normalizedError.retryable) {
      const strategy = this.retryStrategies.get(service);
      if (strategy) {
        await strategy.wait();
      }
    }
    
    return normalizedError;
  }
  
  private normalizeError(error: any, service: string): ServiceError {
    if (error.status === 429) {
      return {
        service,
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded',
        retryable: true,
        retryAfter: error.headers?.['retry-after'] || 60
      };
    }
    
    if (error.status >= 500) {
      return {
        service,
        code: 'SERVER_ERROR',
        message: 'Server error occurred',
        retryable: true
      };
    }
    
    return {
      service,
      code: 'CLIENT_ERROR',
      message: error.message || 'Unknown error',
      retryable: false,
      originalError: error
    };
  }
}
```

### Retry Strategies
```typescript
// lib/retry-strategies.ts
export interface RetryStrategy {
  wait(): Promise<void>;
  shouldRetry(attempt: number): boolean;
}

export class ExponentialBackoffStrategy implements RetryStrategy {
  private attempt: number = 0;
  
  constructor(
    private maxAttempts: number,
    private baseDelay: number,
    private maxDelay: number = 30000
  ) {}
  
  async wait(): Promise<void> {
    const delay = Math.min(this.baseDelay * Math.pow(2, this.attempt), this.maxDelay);
    await new Promise(resolve => setTimeout(resolve, delay));
    this.attempt++;
  }
  
  shouldRetry(attempt: number): boolean {
    return attempt < this.maxAttempts;
  }
}

export class LinearBackoffStrategy implements RetryStrategy {
  constructor(
    private maxAttempts: number,
    private delay: number
  ) {}
  
  async wait(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
  }
  
  shouldRetry(attempt: number): boolean {
    return attempt < this.maxAttempts;
  }
}
```

## Lead Processing Workflow

### Complete Lead Processing
```typescript
// lib/lead-processor.ts
export class LeadProcessor {
  private supabase: SupabaseClient;
  private n8n: N8NWorkflowClient;
  private vercel: VercelClient;
  private errorHandler: ServiceErrorHandler;
  
  constructor() {
    this.supabase = new SupabaseClient();
    this.n8n = new N8NWorkflowClient();
    this.vercel = new VercelClient();
    this.errorHandler = new ServiceErrorHandler();
  }
  
  async processLead(leadData: LeadData): Promise<ProcessingResult> {
    try {
      // Step 1: Validate and sanitize data
      const validatedData = this.validateLeadData(leadData);
      
      // Step 2: Store in Supabase
      const supabaseResult = await this.supabase.submitLead(validatedData);
      if (!supabaseResult.success) {
        throw new Error(`Supabase error: ${supabaseResult.error}`);
      }
      
      // Step 3: Trigger n8n workflow
      const workflowResult = await this.n8n.triggerLeadWorkflow(validatedData);
      if (!workflowResult.success) {
        console.warn(`n8n workflow failed: ${workflowResult.error}`);
        // Continue processing even if workflow fails
      }
      
      // Step 4: Send confirmation (if needed)
      await this.sendConfirmation(validatedData);
      
      return {
        success: true,
        leadId: supabaseResult.leadId,
        workflowId: workflowResult.workflowId,
        message: 'Lead processed successfully'
      };
      
    } catch (error) {
      console.error('Lead processing failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to process lead'
      };
    }
  }
  
  private validateLeadData(data: LeadData): LeadData {
    // Validate required fields
    if (!data.name || !data.appointmentType || !data.consent) {
      throw new Error('Missing required fields');
    }
    
    // Validate contact information
    if (!data.phone && !data.email) {
      throw new Error('Either phone or email is required');
    }
    
    // Sanitize inputs
    return {
      ...data,
      name: this.sanitizeString(data.name),
      phone: data.phone ? this.sanitizePhone(data.phone) : undefined,
      email: data.email ? this.sanitizeEmail(data.email) : undefined,
      notes: data.notes ? this.sanitizeString(data.notes) : undefined
    };
  }
  
  private sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
  
  private sanitizePhone(phone: string): string {
    return phone.replace(/[^\d\s\-\+\(\)]/g, '');
  }
  
  private sanitizeEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    return email.toLowerCase().trim();
  }
}
```

## Monitoring and Metrics

### Service Health Monitoring
```typescript
// lib/service-monitor.ts
export class ServiceMonitor {
  async checkServiceHealth(): Promise<ServiceHealthStatus> {
    const checks = await Promise.allSettled([
      this.checkSupabaseHealth(),
      this.checkN8NHealth(),
      this.checkVercelHealth()
    ]);
    
    return {
      supabase: checks[0].status === 'fulfilled' ? checks[0].value : false,
      n8n: checks[1].status === 'fulfilled' ? checks[1].value : false,
      vercel: checks[2].status === 'fulfilled' ? checks[2].value : false,
      overall: checks.every(check => check.status === 'fulfilled')
    };
  }
  
  private async checkSupabaseHealth(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('sites').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
  
  private async checkN8NHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.N8N_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
  
  private async checkVercelHealth(): Promise<boolean> {
    try {
      const response = await fetch('https://api.vercel.com/v1/health');
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

## Implementation Checklist

### Integration Checklist
- [ ] **Supabase client** implemented with error handling
- [ ] **n8n webhook** configured with signature verification
- [ ] **Vercel deployment** automated via API
- [ ] **Error handling** unified across all services
- [ ] **Retry logic** implemented with backoff strategies
- [ ] **Monitoring** setup for all services

### Security Checklist
- [ ] **API keys** stored securely in environment variables
- [ ] **Webhook signatures** verified for all incoming requests
- [ ] **Rate limiting** implemented for all external calls
- [ ] **Input validation** performed on all data
- [ ] **Error messages** sanitized to prevent information leakage

### Performance Checklist
- [ ] **Connection pooling** configured for database
- [ ] **Caching** implemented where appropriate
- [ ] **Timeout settings** configured for all services
- [ ] **Circuit breakers** implemented for external calls
- [ ] **Monitoring** setup for performance metrics

## Best Practices

1. **Consistent Error Handling**: Use unified error types across all services
2. **Retry Logic**: Implement appropriate retry strategies for each service
3. **Monitoring**: Monitor all service interactions for failures
4. **Security**: Validate all inputs and verify webhook signatures
5. **Performance**: Use connection pooling and caching where appropriate
6. **Documentation**: Document all service integrations and their configurations
