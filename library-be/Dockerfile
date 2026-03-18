# Gunakan Node.js sebagai base image
FROM node:20-alpine AS base
WORKDIR /app

# Copy package.json & lockfile
COPY package*.json ./

# Install dependencies (akan install devDependencies juga karena kita belum set NODE_ENV=production)
RUN npm install

# Copy seluruh source code
COPY . .

# Expose port 4000
EXPOSE 4000

# Build project
RUN npm run build

# BARU SET NODE_ENV ke production agar saat running berjalan optimal
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Conditional CMD based on environment
# Development: npm run dev (tsx watch)
# Production: start
CMD if [ "$NODE_ENV" = "production" ]; then \
      npm run start; \
    else \
      npm run dev; \
    fi
