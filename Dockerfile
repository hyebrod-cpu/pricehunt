# Build frontend
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Production image with Playwright (matches version in package.json)
FROM mcr.microsoft.com/playwright:v1.44.1-jammy

# Set environment variable so playwright knows where to look or runs smoothly
ENV NODE_ENV=production

WORKDIR /app

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Setup backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
# Install browsers explicitly just in case
RUN npx playwright install chromium --with-deps

COPY backend/ ./

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
