# Stage 1: Build stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Stage 2: Runtime stage
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app ./

# Command to run the cron script
CMD ["npm", "run", "cron"]