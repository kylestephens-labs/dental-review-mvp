# Session: 2025-10-09 - AWS Setup & n8n Deployment

## 🎯 Primary Goal
Set up a complete AWS infrastructure for n8n workflow automation, including App Runner, RDS PostgreSQL, ECR, and VPC connectivity.

## ✅ What Was Delivered

### **Infrastructure Components**
- [x] **AWS App Runner Service**: `n8n-prod-working` (RUNNING)
  - URL: `https://uncqyimekm.us-east-2.awsapprunner.com`
  - Configuration: 1 vCPU, 2GB memory
  - Image: n8n 1.61.0 (x86_64) from ECR

- [x] **Amazon RDS Database**: `n8n-database`
  - Engine: PostgreSQL 15.14
  - Database: `postgres` (created manually)
  - User: `n8nadmin` with full permissions
  - Access: Private via VPC connector

- [x] **Amazon ECR Repository**: `n8n`
  - Images: `n8n:latest-x86`, `n8n:1.61.0`
  - Purpose: Store n8n Docker images for App Runner

- [x] **VPC Connector**: `n8n-vpc-connector`
  - Status: ACTIVE
  - Subnets: `subnet-041fd766306521d94`, `subnet-058fa4e75ab32ae45`
  - Security Group: `sg-0ca13c80fa10269ae`

### **Configuration & Security**
- [x] **IAM User & Policies**: `serviceboost14` with comprehensive permissions
- [x] **Security Groups**: Configured for App Runner → RDS connectivity
- [x] **Environment Variables**: Complete n8n configuration with database SSL
- [x] **CloudWatch Logging**: Debug-level logging enabled
- [x] **Observability**: X-Ray tracing configured

### **Documentation & Backup**
- [x] **AWS Configuration Backup**: Complete infrastructure backup
- [x] **Setup Learnings**: Comprehensive troubleshooting guide
- [x] **Security Best Practices**: Template files and .gitignore

## 🔧 Key Decisions

- **App Runner over Lambda**: Chose App Runner for persistent n8n instance
- **Private RDS**: Used VPC connector for secure database access
- **n8n 1.61.0**: Upgraded from 1.0.0 for better error handling
- **2GB Memory**: Increased from 0.5GB to handle n8n startup requirements
- **SSL Database**: Enabled PostgreSQL SSL with relaxed validation
- **Debug Logging**: Used detailed logging to troubleshoot connection issues

## 🧠 Technical Learnings

### **Critical Issues Resolved**
1. **Silent Failures**: n8n 1.0.0 failed silently on database connection
2. **Architecture Mismatch**: ARM64 vs x86_64 Docker image compatibility
3. **Missing Database**: RDS created without default `postgres` database
4. **Memory Constraints**: n8n needs 2GB+ memory for proper startup
5. **VPC Connectivity**: Complex routing between App Runner and private RDS

### **Debugging Strategy**
- Test locally with identical environment variables
- Use debug logging to identify failure points
- Verify database connectivity from external sources
- Check network configuration step by step
- Use recent application versions for better error messages

## 📁 Files Created/Modified

### **AWS Configuration**
- `docs/aws-backup/` - Complete infrastructure backup
- `docs/learnings/aws-app-runner-n8n-setup.md` - Technical learnings

### **Scripts & Tools**
- `rotate-aws-keys.sh` - AWS key rotation script
- `test-new-aws-keys.sh` - Key testing script
- `final-verification.sh` - Post-rotation verification
- `delete-old-aws-keys.sh` - Key deletion helper

### **Environment Files**
- `n8n-core.env` - Database configuration
- `n8n-local.env` - Local testing configuration
- `docs/aws-backup/environment-variables-template.env` - Secure template

## 🚀 Next Steps

- [x] **Configure n8n workflows** for dental landing page
- [x] **Update dental site** to use new webhook URL
- [x] **Set up monitoring** and alerting
- [ ] **Reduce log verbosity** once stable
- [ ] **Implement custom domain** (optional)
- [ ] **Scale resources** if needed

## 🔗 Related Resources

- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [n8n Documentation](https://docs.n8n.io/)
- [PostgreSQL SSL Configuration](https://www.postgresql.org/docs/current/ssl-tcp.html)

## 💰 Cost Estimate
- **App Runner**: ~$25-30/month (1 vCPU, 2GB, always-on)
- **RDS PostgreSQL**: ~$15-20/month (db.t3.micro)
- **ECR**: ~$1-2/month (image storage)
- **CloudWatch**: ~$5-10/month (logs and monitoring)
- **Total**: ~$45-60/month

## 🎉 Success Metrics
- ✅ n8n starts successfully
- ✅ Database migrations complete
- ✅ Webhook endpoint responds (HTTP 200)
- ✅ Database queries execute properly
- ✅ Service remains stable
