# Security & Compliance Guide

## Purpose
Protect data across the dental landing template project and satisfy regulatory requirements (GDPR, CCPA) through comprehensive security controls and compliance monitoring.

## Scope
- PII/PHI handling in intake forms
- Supabase data protection
- n8n workflow security
- Vercel deployment security
- Input validation and sanitization
- Audit logging and compliance tracking

## Guardrails

### Data Protection
- **PII minimization** - Only collect essential data (name, phone/email, appointment type)
- **No PHI collection** - Avoid medical history to stay out of HIPAA risk
- **Data encryption** - All data encrypted in transit and at rest
- **Access controls** - Row-level security (RLS) enabled in Supabase

### Secret Management
- **Secrets managed** via Vercel environment variables
- **Never store secrets** in code or configuration files
- **Secret rotation** automated where possible
- **Access logging** for all secret retrievals

### Input Validation
- **Schema validation** required on all form inputs
- **Sanitization** performed on all user inputs
- **SQL injection** prevention via parameterized queries
- **XSS protection** via output encoding

## Data Collection Guidelines

### Intake Form Requirements
```typescript
// Only collect essential data
interface IntakeFormData {
  name: string;           // Required
  phone?: string;         // At least one contact method required
  email?: string;         // At least one contact method required
  appointmentType: string; // Required
  preferredDate?: string; // Optional
  preferredTime?: string; // Optional
  notes?: string;         // Optional
  consent: boolean;       // Required for communication
}
```

### Data Validation
```typescript
// functions/validation/form-validation.ts
export const intakeFormSchema = z.object({
  name: z.string().min(1).max(100).refine(isValidName, 'Invalid name format'),
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/).optional(),
  email: z.string().email().optional(),
  appointmentType: z.string().min(1).max(100),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  notes: z.string().max(500).optional(),
  consent: z.boolean().refine(val => val === true, 'Consent required')
}).refine(data => data.phone || data.email, {
  message: "Either phone or email is required",
  path: ["phone", "email"]
});

function isValidName(name: string): boolean {
  // Only allow letters, spaces, hyphens, and apostrophes
  return /^[a-zA-Z\s\-']+$/.test(name);
}
```

## Supabase Security Configuration

### Row Level Security (RLS)
```sql
-- Enable RLS on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow inserts from authenticated users
CREATE POLICY "Allow authenticated inserts" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Policy: Restrict access to lead data
CREATE POLICY "Restrict lead access" ON leads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

### Data Encryption
```typescript
// lib/encryption.ts
export class DataEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY = process.env.ENCRYPTION_KEY;

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ALGORITHM, this.KEY);
    cipher.setAAD(Buffer.from('dental-landing', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.ALGORITHM, this.KEY);
    decipher.setAAD(Buffer.from('dental-landing', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## n8n Workflow Security

### Webhook Security
```typescript
// supabase/functions/submit-lead/index.ts
export default async function handler(req: Request) {
  // Verify webhook signature
  const signature = req.headers.get('x-webhook-signature');
  const payload = await req.text();
  
  if (!verifyWebhookSignature(payload, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Validate and sanitize input
  const formData = await req.json();
  const validatedData = intakeFormSchema.parse(formData);
  
  // Process lead...
}

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Rate Limiting
```typescript
// lib/rate-limiter.ts
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  async checkLimit(ip: string, limit: number = 5, window: number = 3600000): Promise<boolean> {
    const now = Date.now();
    const attempts = this.attempts.get(ip) || [];
    
    // Remove old attempts
    const recentAttempts = attempts.filter(time => now - time < window);
    
    if (recentAttempts.length >= limit) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(ip, recentAttempts);
    
    return true;
  }
}
```

## Vercel Security Configuration

### Environment Variables
```bash
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WEBHOOK_SECRET=your_webhook_secret
ENCRYPTION_KEY=your_encryption_key
```

### Security Headers
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ];
  }
};
```

## Compliance Monitoring

### GDPR Compliance
```typescript
// lib/compliance.ts
export class ComplianceMonitor {
  async checkGDPRCompliance(): Promise<ComplianceStatus> {
    const checks = [
      await this.checkDataMinimization(),
      await this.checkConsentManagement(),
      await this.checkRightToErasure(),
      await this.checkDataPortability()
    ];
    
    const violations = checks.filter(check => !check.compliant);
    
    return {
      compliant: violations.length === 0,
      violations: violations.map(v => v.description),
      lastChecked: new Date()
    };
  }
  
  private async checkDataMinimization(): Promise<ComplianceCheck> {
    // Check if we're collecting only necessary data
    const dataFields = ['name', 'phone', 'email', 'appointmentType', 'preferredDate', 'preferredTime', 'notes', 'consent'];
    const necessaryFields = ['name', 'phone', 'email', 'appointmentType', 'consent'];
    
    const unnecessaryFields = dataFields.filter(field => !necessaryFields.includes(field));
    
    return {
      compliant: unnecessaryFields.length === 0,
      description: `Unnecessary data fields: ${unnecessaryFields.join(', ')}`
    };
  }
}
```

### Audit Logging
```typescript
// lib/audit-logger.ts
export class AuditLogger {
  async log(event: AuditEvent): Promise<void> {
    const auditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      event: event.action,
      resource: event.resource,
      user: event.user,
      ip: event.ip,
      details: event.details
    };
    
    // Log to Supabase
    await supabase.from('audit_logs').insert(auditEntry);
    
    // Log to console for development
    console.log('Audit:', auditEntry);
  }
}
```

## Implementation Checklist

### Security Checklist
- [ ] **RLS enabled** on all Supabase tables
- [ ] **Input validation** implemented on all forms
- [ ] **Rate limiting** configured for API endpoints
- [ ] **Webhook signatures** verified
- [ ] **Environment variables** secured
- [ ] **HTTPS enforced** for all connections

### Compliance Checklist
- [ ] **Data minimization** implemented
- [ ] **Consent management** system in place
- [ ] **Right to erasure** endpoint available
- [ ] **Data portability** feature implemented
- [ ] **Privacy policy** published
- [ ] **Cookie consent** implemented

### Monitoring Checklist
- [ ] **Audit logging** implemented
- [ ] **Error monitoring** configured
- [ ] **Security alerts** setup
- [ ] **Compliance monitoring** active
- [ ] **Regular security reviews** scheduled

## Emergency Procedures

### Data Breach Response
1. **Immediate**: Disable affected systems
2. **Assess**: Determine scope of breach
3. **Contain**: Stop further data exposure
4. **Notify**: Inform relevant authorities and users
5. **Recover**: Restore systems with enhanced security
6. **Review**: Conduct post-incident analysis

### Security Incident Response
1. **Detect**: Monitor for security events
2. **Analyze**: Determine severity and impact
3. **Contain**: Isolate affected systems
4. **Eradicate**: Remove threats
5. **Recover**: Restore normal operations
6. **Learn**: Update security measures

## Best Practices

1. **Security by Design**: Build security into every component
2. **Principle of Least Privilege**: Grant minimum necessary access
3. **Defense in Depth**: Multiple layers of security
4. **Regular Updates**: Keep dependencies current
5. **Continuous Monitoring**: Monitor for security events
6. **Incident Response**: Have plans for security incidents
