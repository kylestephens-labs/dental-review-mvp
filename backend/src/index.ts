import express from 'express';
import { testConnections } from './config/database.js';
import { POST as stripeWebhook } from './api/webhooks/stripe.js';
import { GET as healthCheck, HEAD as healthCheckHead } from './api/healthz.js';
import { GET as onboardGet } from './api/onboard/get.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Health check endpoint
app.get('/healthz', healthCheck);
app.head('/healthz', healthCheckHead);

// Stripe webhook endpoint - needs raw body for signature verification
// MUST be before express.json() middleware
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

// Global JSON middleware for all other routes
app.use(express.json());

// Onboarding endpoint
app.get('/onboard/:token', onboardGet);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function startServer() {
  // Start server immediately - don't wait for database
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/healthz`);
    console.log(`Stripe webhook: http://localhost:${PORT}/webhooks/stripe`);
  });

  // Test database connection asynchronously (non-blocking)
  testConnections().then(dbStatus => {
    console.log('Database status:', dbStatus);
    if (dbStatus.status === 'error') {
      console.warn('⚠️  Database unavailable - some features will be limited');
      console.warn('Database error:', dbStatus.error);
    } else {
      console.log('✅ Database connection successful');
    }
  }).catch(err => {
    console.warn('⚠️  Database connection test failed:', err);
    console.warn('Some features may not work properly');
  });
}

startServer();
