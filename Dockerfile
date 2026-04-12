# Multi-stage build for backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
RUN npm run build  # If you have a build step

# Production backend image
FROM node:18-alpine AS backend
WORKDIR /app/backend
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY backend/ ./
EXPOSE 5000
CMD ["node", "server.js"]

# Frontend builder
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production frontend image with nginx
FROM nginx:alpine AS frontend
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
