import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_1234567890';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_1234567890';
process.env.NODE_ENV = 'test';
