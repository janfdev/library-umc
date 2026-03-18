# Gunakan Node.js sebagai base image
FROM node:20-alpine AS base
WORKDIR /app

# Build argument untuk menentukan environment (default: development)
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy package.json & lockfile
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh source code
COPY . .

# Expose port 4000
EXPOSE 4000

# Build project jiga di environment production
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

# Conditional CMD based on environment
# Development: npm run dev (tsx watch)
# Production: start
CMD if [ "$NODE_ENV" = "production" ]; then \
      npm run start; \
    else \
      npm run dev; \
    fi
