# Infrastructure & Deployment

## 🎯 **Overview**

AWS-based infrastructure for the dental practice MVP.

## 🏗️ **Architecture**

### **Core Services**
- **App Runner**: Application hosting
- **RDS PostgreSQL**: Database
- **SES**: Email service
- **S3**: File storage
- **CloudWatch**: Monitoring

### **External Services**
- **Stripe**: Payment processing
- **Twilio**: SMS service
- **Google Places**: Location services
- **Microsoft Graph**: Calendar integration

## 🚀 **Deployment**

### **Vercel (Primary)**
```bash
# Deploy to Vercel
npm run deploy

# Check deployment status
vercel ls
```

### **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Fill in required variables
# Deploy
npm run deploy
```

## 📊 **Monitoring**

### **Vercel Analytics**
- Performance metrics
- Error tracking
- User analytics

### **Health Checks**
```bash
# Check application health
curl https://your-domain.com/healthz

# Expected response
{"status":"ok","sha":"abc123"}
```

## 🔧 **Configuration**

### **Environment Variables**
See `.env.example` for complete list of required variables.

### **Database**
- **Type**: PostgreSQL
- **Hosting**: AWS RDS
- **Backups**: Automated daily

## 🚀 **Scaling**

### **Auto-scaling**
- App Runner handles traffic spikes
- Database scales with usage
- CDN for static assets

### **Performance**
- Edge caching
- Optimized builds
- Lazy loading

## 📋 **Maintenance**

### **Regular Tasks**
- Monitor performance
- Check error logs
- Update dependencies
- Review costs

### **Backups**
- Database: Daily automated
- Code: Git repository
- Files: S3 versioning
