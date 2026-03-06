# Gunakan Node.js sebagai base image
FROM node:20-alpine AS base
WORKDIR /app

# Build argument untuk menentukan environment (default: development)
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Copy package.json & lockfile
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Conditional CMD based on environment
# Development: npm run dev (tsx watch)
# Production: build then start
CMD if [ "$NODE_ENV" = "production" ]; then \
      npm run build && npm run start; \
    else \
      npm run dev; \
    fi
