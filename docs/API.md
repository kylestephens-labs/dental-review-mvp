# API Documentation

## 🎯 **Overview**

REST API for the dental practice management system.

## 🚀 **Base URL**

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## 📋 **Endpoints**

### **Health Check**
```http
GET /api/healthz
```

**Response:**
```json
{
  "status": "ok",
  "sha": "abc123"
}
```

### **Stripe Webhook**
```http
POST /api/webhooks/stripe
```

**Headers:**
```
stripe-signature: t=1234567890,v1=signature
content-type: application/json
```

**Body:**
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_1234567890",
      "customer": "cus_1234567890",
      "amount_total": 24900
    }
  }
}
```

### **Onboarding**
```http
GET /api/onboard/:token
```

**Parameters:**
- `token`: HMAC token for verification

**Response:**
```json
{
  "valid": true,
  "practice": {
    "id": "practice_123",
    "name": "Dental Practice"
  }
}
```

## 🔧 **Authentication**

### **Magic Links**
- HMAC tokens for one-time access
- 7-day expiration
- Single-use only

### **Session Management**
- JWT tokens for authenticated sessions
- Refresh token rotation
- Secure cookie storage

## 📊 **Error Handling**

### **Standard Error Response**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### **Error Codes**
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Authentication required
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

## 🚀 **Rate Limiting**

- **General**: 100 requests per minute
- **Webhooks**: 1000 requests per minute
- **Authentication**: 10 requests per minute

## 📋 **Webhooks**

### **Stripe Events**
- `checkout.session.completed`: New subscription
- `customer.subscription.updated`: Subscription changes
- `invoice.payment_succeeded`: Payment received

### **Twilio Events**
- `message.sent`: SMS sent
- `message.delivered`: SMS delivered
- `message.failed`: SMS failed

## 🎯 **SDK Examples**

### **JavaScript**
```javascript
// Health check
const response = await fetch('/api/healthz');
const data = await response.json();

// Stripe webhook
const response = await fetch('/api/webhooks/stripe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Stripe-Signature': signature
  },
  body: JSON.stringify(event)
});
```
