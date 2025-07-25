FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install Node.js for backend services
RUN apk add --no-cache nodejs npm

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create backend directory
WORKDIR /app/backend
COPY backend/ ./
COPY package*.json ./
RUN npm ci --only=production

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80 3001

CMD ["/start.sh"]