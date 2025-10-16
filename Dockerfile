# Dockerfile - Multi-stage build for Dental Practice Management MVP
# Stage 1: Build dependencies
FROM node:20.19.5-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build application
FROM node:20.19.5-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Production image
FROM node:20.19.5-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy production dependencies and built application
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check using our /healthz endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/healthz || exit 1

# Start the application
CMD ["npm", "start"]
