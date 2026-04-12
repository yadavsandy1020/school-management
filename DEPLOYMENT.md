# Deployment Guide

This guide provides step-by-step instructions for deploying the School Management System to various platforms.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Docker Deployment](#docker-deployment)
3. [Render Deployment](#render-deployment)
4. [Railway Deployment](#railway-deployment)
5. [Vercel Deployment](#vercel-deployment)
6. [MongoDB Atlas Setup](#mongodb-atlas-setup)

## Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB 7+
- Git

### Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd school-management
```

2. Install backend dependencies:
```bash
cd backend
npm install
cp .env.example .env
```

3. Configure backend `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/school-management
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
SUPER_ADMIN_EMAIL=admin@schoolsaas.com
SUPER_ADMIN_PASSWORD=admin123456
FRONTEND_URL=http://localhost:5173
```

4. Seed the database:
```bash
npm run seed
```

5. Start backend:
```bash
npm run dev
```

6. Install frontend dependencies (new terminal):
```bash
cd frontend
npm install
cp .env.example .env
```

7. Configure frontend `.env`:
```env
VITE_API_URL=http://localhost:5000
```

8. Start frontend:
```bash
npm run dev
```

9. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

## Docker Deployment

### Prerequisites
- Docker
- Docker Compose

### Steps

1. Build and start all services:
```bash
docker-compose up -d
```

2. Check service status:
```bash
docker-compose ps
```

3. View logs:
```bash
docker-compose logs -f
```

4. Stop services:
```bash
docker-compose down
```

5. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:5000
- MongoDB: mongodb://localhost:27017

### Manual Docker Build

Build backend only:
```bash
docker build --target backend -t school-backend .
docker run -p 5000:5000 school-backend
```

Build frontend only:
```bash
docker build --target frontend -t school-frontend .
docker run -p 80:80 school-frontend
```

## Render Deployment

### Backend Deployment (Render)

1. Push code to GitHub

2. Create a new Web Service on Render:
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder as root directory

3. Configure build settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`

4. Add environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<generate-a-secure-random-string>
   JWT_EXPIRE=7d
   FRONTEND_URL=<your-vercel-url>
   ```

5. Deploy

6. Note the backend URL (e.g., https://school-backend.onrender.com)

### Frontend Deployment (Vercel)

See [Vercel Deployment](#vercel-deployment) section below.

## Railway Deployment

### Backend Deployment (Railway)

1. Push code to GitHub

2. Create a new project on Railway:
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. Configure service:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`

4. Add environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<generate-a-secure-random-string>
   JWT_EXPIRE=7d
   FRONTEND_URL=<your-vercel-url>
   ```

5. Deploy

6. Note the backend URL

### Frontend Deployment (Vercel)

See [Vercel Deployment](#vercel-deployment) section below.

## Vercel Deployment (Frontend)

### Steps

1. Push code to GitHub

2. Create a new project on Vercel:
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository

3. Configure project settings:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Add environment variables:
   ```
   VITE_API_URL=<your-backend-url>
   ```

5. Deploy

6. Note the frontend URL

7. Update backend `FRONTEND_URL` environment variable with the Vercel URL

## MongoDB Atlas Setup

### Free Tier Setup

1. Create account: https://www.mongodb.com/cloud/atlas

2. Create a free cluster:
   - Click "Build a Database"
   - Select "M0" (Free) cluster
   - Choose a region (preferably close to your backend deployment)
   - Name your cluster
   - Click "Create"

3. Create database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username and Password (save these!)
   - Read and write to any database

4. Whitelist IP addresses:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0) for development
   - Or add specific IPs for production

5. Get connection string:
   - Go to "Database" → "Connect"
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

6. Update environment variables:
   - Backend: `MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/school-management`

## Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas for production database
- [ ] Configure CORS to allow only your frontend domain
- [ ] Enable rate limiting
- [ ] Set up SSL/TLS (automatic on Render/Railway/Vercel)
- [ ] Configure backup strategy for MongoDB
- [ ] Set up monitoring and error tracking
- [ ] Test all features in staging environment
- [ ] Configure email service for notifications (optional)
- [ ] Set up payment gateway (Razorpay) if needed

## Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify all environment variables are set
- Check logs for error messages

### Frontend API calls failing
- Verify `VITE_API_URL` is correct
- Check CORS configuration
- Ensure backend is running and accessible

### MongoDB connection issues
- Verify IP whitelist in Atlas
- Check username and password
- Ensure cluster is running
- Check network connectivity

### Docker issues
- Ensure Docker and Docker Compose are installed
- Check for port conflicts
- Verify Docker daemon is running
- Check container logs: `docker-compose logs`

## Cost Estimate

### Free Tier Usage

**MongoDB Atlas (M0):**
- 512 MB storage
- Shared RAM
- Free forever

**Render (Free):**
- 512 MB RAM
- 0.1 CPU
- Sleeps after 15 min inactivity
- Free for hobby projects

**Railway (Free trial):**
- $5 free credit/month
- 500 MB RAM
- 0.5 vCPU

**Vercel (Hobby):**
- Unlimited bandwidth
- 100 GB-hours/month
- Free for personal projects

**Estimated Total Cost: $0/month** (using free tiers)

### Paid Tier (if needed)

**MongoDB Atlas (M10):**
- ~$57/month
- 2 GB storage
- Dedicated RAM

**Render (Starter):**
- ~$7/month
- 512 MB RAM
- No sleep

**Total: ~$64/month** for small production deployment

## Scaling Considerations

- Use MongoDB Atlas for automatic scaling
- Enable Redis for session management (future)
- Use CDN for static assets
- Implement caching strategies
- Consider load balancing for high traffic
- Monitor resource usage and upgrade plans as needed
