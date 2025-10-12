# Deployment & Operations

## 🎯 **Overview**

Deployment and operational procedures for the dental practice MVP.

## 🚀 **Deployment Process**

### **Vercel Deployment**
```bash
# Deploy to production
npm run deploy

# Deploy to preview
npm run deploy:preview

# Check deployment status
vercel ls
```

### **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Fill in production values
# Deploy
npm run deploy
```

## 📊 **Environment Configuration**

### **Production**
- **URL**: https://your-domain.com
- **Database**: AWS RDS PostgreSQL
- **Storage**: AWS S3
- **Monitoring**: Vercel Analytics

### **Staging**
- **URL**: https://staging.your-domain.com
- **Database**: AWS RDS PostgreSQL (staging)
- **Storage**: AWS S3 (staging bucket)

## 🔧 **Operational Procedures**

### **Health Monitoring**
```bash
# Check application health
curl https://your-domain.com/healthz

# Expected response
{"status":"ok","sha":"abc123"}
```

### **Database Operations**
```bash
# Run migrations
npm run db:migrate

# Seed data
npm run db:seed

# Backup database
npm run db:backup
```

### **Log Monitoring**
```bash
# View application logs
vercel logs

# View specific function logs
vercel logs --function=api
```

## 🚨 **Incident Response**

### **Common Issues**

#### **Application Down**
1. Check Vercel status page
2. Verify environment variables
3. Check recent deployments
4. Review error logs

#### **Database Issues**
1. Check RDS status
2. Verify connection strings
3. Check backup status
4. Contact AWS support if needed

#### **Payment Issues**
1. Check Stripe dashboard
2. Verify webhook configuration
3. Check API keys
4. Review transaction logs

### **Rollback Procedure**
```bash
# Rollback to previous deployment
vercel rollback

# Verify rollback
curl https://your-domain.com/healthz
```

## 📋 **Maintenance Tasks**

### **Daily**
- Check application health
- Monitor error rates
- Review performance metrics

### **Weekly**
- Update dependencies
- Review security alerts
- Check backup status

### **Monthly**
- Review costs
- Update documentation
- Security audit

## 🎯 **Performance Optimization**

### **Frontend**
- Code splitting
- Lazy loading
- Image optimization
- CDN caching

### **Backend**
- Database indexing
- Query optimization
- Caching strategies
- Connection pooling

## 🚀 **Scaling**

### **Automatic Scaling**
- Vercel handles traffic spikes
- Database auto-scaling
- CDN for static assets

### **Manual Scaling**
- Increase database resources
- Add more App Runner instances
- Optimize queries

## 📊 **Monitoring & Alerts**

### **Key Metrics**
- Response time
- Error rate
- Throughput
- Database performance

### **Alerts**
- High error rate (>5%)
- Slow response time (>2s)
- Database connection issues
- Payment processing failures
