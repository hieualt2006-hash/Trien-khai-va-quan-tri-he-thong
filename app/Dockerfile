# ========================================================
# HARDENED DOCKERFILE FOR NEWS PORTAL (NODE.JS)
# Meets criteria: Non-root user, minimal base image, healthcheck
# ========================================================

FROM node:20-alpine AS base

# Install dumb-init to properly handle PID 1 signals
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package definitions first for layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Create necessary directories and set ownership to non-root 'node' user
RUN mkdir -p /app/logs /app/public/uploads && \
    chown -R node:node /app

# HARDENING: Switch from root to unprivileged 'node' user
USER node

# Expose web service port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production \
    PORT=3000

# HEALTHCHECK for container orchestrator
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application using dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
