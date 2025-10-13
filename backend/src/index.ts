import express from 'express';
import { testConnections } from './config/database';
import { POST as stripeWebhook } from './api/webhooks/stripe';
import { GET as healthCheck } from './api/healthz';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.raw({ type: 'application/json' })); // For Stripe webhook signature verification
app.use(express.json());

// Health check endpoint
app.get('/healthz', healthCheck);

// Stripe webhook endpoint
app.post('/webhooks/stripe', stripeWebhook);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbStatus = await testConnections();
    console.log('Database status:', dbStatus);
    
    if (dbStatus.status === 'error') {
      console.error('Failed to connect to database:', dbStatus.error);
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/healthz`);
      console.log(`Stripe webhook: http://localhost:${PORT}/webhooks/stripe`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
