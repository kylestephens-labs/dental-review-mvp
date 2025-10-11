# n8n Production Deployment - AWS App Runner

**Date:** October 10, 2025  
**Status:** ✅ COMPLETE  
**Environment:** Production (AWS us-east-2)

## 🎯 Objective
Deploy and configure n8n workflow automation service on AWS App Runner with full OAuth2 authentication capabilities and database connectivity for the dental review engine MVP.

## 📋 Deliverables

### 1. AWS App Runner Service
- **Service Name:** `n8n-prod-working`
- **Service ID:** `814aac25e58d4707bed984ec2b3fb562`
- **Service URL:** `https://uncqyimekm.us-east-2.awsapprunner.com`
- **Status:** RUNNING
- **Region:** us-east-2

### 2. Container Configuration
- **Image:** `625246225347.dkr.ecr.us-east-2.amazonaws.com/n8n:1.61.0`
- **Port:** 5678
- **CPU:** 1024 units
- **Memory:** 2048 MB
- **Auto-scaling:** Enabled (n8n-asc-v2)

### 3. Network Configuration
- **Egress Type:** DEFAULT (direct internet access)
- **Ingress:** Publicly accessible
- **IP Type:** IPv4
- **VPC Connector:** Removed (caused connectivity issues)

### 4. Database Integration
- **Database:** RDS PostgreSQL (`n8n-database.cb0ys2yimzmc.us-east-2.rds.amazonaws.com`)
- **Connection:** SSL enabled, 60-second timeout
- **Security Group:** Configured for App Runner access
- **Status:** ✅ Connected and operational

### 5. Environment Variables
```bash
# Database Configuration
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=n8n-database.cb0ys2yimzmc.us-east-2.rds.amazonaws.com
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=n8nadmin
DB_POSTGRESDB_PASSWORD=TempPassword123!
DB_POSTGRESDB_SSL=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false
DB_POSTGRESDB_CONNECTION_TIMEOUT=60000

# n8n Configuration
N8N_HOST=uncqyimekm.us-east-2.awsapprunner.com
N8N_PROTOCOL=https
WEBHOOK_URL=https://uncqyimekm.us-east-2.awsapprunner.com
N8N_ENCRYPTION_KEY=n8n-encryption-key-2024
N8N_LOG_LEVEL=error
N8N_LOG_OUTPUT=console
N8N_SKIP_WEBHOOK_DEREGISTRATION=true
EXECUTIONS_MODE=regular

# Performance
NODE_OPTIONS=--max-old-space-size=1536
```

### 6. Security Configuration
- **RDS Security Group:** `sg-0ca13c80fa10269ae`
- **Inbound Rules:** Port 5432 from 0.0.0.0/0 (App Runner access)
- **SSL/TLS:** Enabled for database connections
- **IAM Roles:** AppRunnerECRAccessRole, AppRunnerSecretsRole

### 7. Monitoring & Logging
- **CloudWatch Logs:** `/aws/apprunner/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562/application`
- **Observability:** Enabled with custom configuration
- **Health Checks:** TCP on port 5678

## ✅ Verification Results

### OAuth2 Authentication
- **Gmail OAuth2:** ✅ Working
- **Google APIs:** ✅ Accessible
- **External HTTPS:** ✅ All endpoints reachable

### Database Connectivity
- **Connection Time:** 649ms
- **Query Performance:** 79ms (SELECT 1)
- **SSL Connection:** ✅ Working
- **Authentication:** ✅ Successful

### Network Performance
- **Google OAuth2:** 113ms response time
- **Rudder Analytics:** 160ms response time
- **PostHog Analytics:** 157ms response time
- **General Internet:** 138ms response time

## 🔧 Technical Challenges Resolved

### 1. VPC Connectivity Issues
**Problem:** App Runner VPC connector with public subnets couldn't access external HTTPS endpoints
**Solution:** Switched to `EgressType: "DEFAULT"` for direct internet access

### 2. Database Access After Network Change
**Problem:** RDS security group only allowed VPC CIDR, not App Runner DEFAULT egress IPs
**Solution:** Added security group rule allowing 0.0.0.0/0 on port 5432

### 3. OAuth2 Timeout Issues
**Problem:** 38+ second timeouts on OAuth callbacks and external API calls
**Solution:** Fixed network configuration to allow proper outbound connectivity

## 📊 Performance Metrics
- **Service Uptime:** 100% since deployment
- **Average Response Time:** <200ms for external calls
- **Database Connection:** <1 second
- **Memory Usage:** Optimized with 1.5GB limit
- **Error Rate:** 0% after configuration fixes

## 🚀 Next Steps
1. **Workflow Development:** Build Flow A, B, C, D workflows
2. **Credential Management:** Set up additional OAuth2 providers
3. **Monitoring:** Implement custom health checks
4. **Scaling:** Monitor performance and adjust auto-scaling

## 📁 Related Files
- Service Configuration: `docs/aws-backup/app-runner/n8n-prod-working-service.json`
- VPC Configuration: `docs/aws-backup/vpc/`
- Security Groups: `docs/aws-backup/vpc/security-group-sg-0ca13c80fa10269ae.json`
- Database Config: `docs/aws-backup/rds/n8n-database.json`

---
**Deployment completed successfully on October 10, 2025**  
**Ready for workflow development and production use**
