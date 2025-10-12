# Dental Review Engine Backend

Backend API for the Dental Review Engine MVP - a system that automatically sends review requests to dental practice patients.

## Features

- **Stripe Webhook Integration**: Secure webhook endpoint for handling checkout completion events
- **Practice Management**: Create and manage dental practice records
- **Settings Management**: Store practice-specific configuration
- **Event Logging**: Comprehensive event tracking for analytics and debugging
- **Database Integration**: PostgreSQL with proper migrations and models

## API Endpoints

### Webhooks
- `POST /webhooks/stripe` - Stripe checkout completion webhook
- `GET /healthz` - Health check endpoint

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Environment variables configured (see `.env.example`)

### Setup
```bash
npm install
npm run typecheck
npm test
```

### Environment Variables
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- Other required variables as listed in `.env.example`

### Database
Run the migrations in the `scripts/migrations/` directory to set up the database schema.

## Testing
```bash
npm test          # Run all tests
npm run test:watch # Run tests in watch mode
```

## Architecture

The backend follows a clean architecture pattern:
- `api/` - HTTP endpoints and request handlers
- `models/` - Database models and data access
- `utils/` - Utility functions and shared code
- `config/` - Configuration and database setup

## Security

- Stripe webhook signature verification
- Input validation and sanitization
- Proper error handling and logging
- Database connection security
