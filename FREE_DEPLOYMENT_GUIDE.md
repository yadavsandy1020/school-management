# Free Deployment Guide - School Management System

This guide will help you deploy the complete School Management System to free hosting platforms.

## Prerequisites

- GitHub account
- MongoDB Atlas account (free tier)
- Render account (free tier)
- Vercel account (free tier)

---

## Step 1: Push Code to GitHub

1. Create a new repository on GitHub
2. Push your code to the repository:
```bash
cd /Users/sandy/school-management
git init
git add .
git commit -m "Initial commit - School Management System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/school-management.git
git push -u origin main
```

---

## Step 2: Set Up MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up / Log in
3. Click "Build a Database"
4. Choose "Free" tier (M0)
5. Select a region closest to you
6. Click "Create"
7. Set up database username and password (save these!)
8. Add IP address: `0.0.0.0/0` (allows access from anywhere)
9. Click "Finish and Close"
10. Click "Connect" → "Drivers"
11. Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`)
12. Replace `<password>` with your actual password

**Save this connection string - you'll need it later.**

---

## Step 3: Deploy Backend to Render (Free)

### Option A: Via Render Dashboard (Recommended)

1. Go to [Render](https://render.com)
2. Sign up / Log in
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:

**Build Settings:**
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

**Environment Variables:**
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_secret_at_least_32_chars
JWT_REFRESH_SECRET=your_secure_random_refresh_secret_at_least_32_chars
JWT_EXPIRE=7d
SUPER_ADMIN_EMAIL=admin@schoolsaas.com
SUPER_ADMIN_PASSWORD=admin123456
FRONTEND_URL=https://YOUR_FRONTEND_URL.vercel.app
```

6. Click "Deploy Web Service"
7. Wait for deployment to complete (2-3 minutes)
8. Copy the backend URL (e.g., `https://school-management-backend.onrender.com`)

### Option B: Via render.yaml

1. The `render.yaml` file is already created in the backend folder
2. When connecting your repo to Render, it will auto-detect the configuration

---

## Step 4: Seed Database on Render

After backend deployment, you need to seed the database:

1. Go to your Render backend service
2. Click "Shell" (in the left sidebar)
3. Run:
```bash
cd backend
npm run seed
```

This will create the Super Admin and demo school data.

---

## Step 5: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign up / Log in
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure the project:

**Framework Preset:** Vite

**Root Directory:** `frontend`

**Environment Variables:**
```
VITE_API_URL=https://YOUR_BACKEND_URL.onrender.com/api
```

6. Click "Deploy"
7. Wait for deployment to complete (1-2 minutes)
8. Copy the frontend URL (e.g., `https://school-management.vercel.app`)

---

## Step 6: Update Backend Environment Variables

1. Go back to Render
2. Open your backend service
3. Click "Environment" tab
4. Update `FRONTEND_URL` to your actual Vercel URL
5. Click "Save Changes"
6. Render will automatically redeploy

---

## Step 7: Test the Deployment

1. Open your Vercel frontend URL
2. Login with demo credentials:
   - Email: `schooladmin@demoschool.com`
   - Password: `admin123`
   - Tenant ID: `demo-school-123456`

3. Test key features:
   - Dashboard loads
   - Can view students
   - Can view teachers
   - Can mark attendance
   - Can view fees

---

## Step 8: Set Up Custom Domain (Optional)

### For Vercel (Frontend)
1. Go to your Vercel project
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `school.yourdomain.com`)
4. Follow DNS instructions provided

### For Render (Backend)
1. Go to your Render service
2. Click "Settings" → "Custom Domains"
3. Add your custom domain (e.g., `api.school.yourdomain.com`)
4. Follow DNS instructions provided

---

## Troubleshooting

### Backend Not Connecting to MongoDB
- Check MongoDB Atlas IP whitelist (should be `0.0.0.0/0`)
- Verify connection string is correct
- Check username and password

### Frontend Not Connecting to Backend
- Verify `VITE_API_URL` environment variable in Vercel
- Check CORS settings in backend (`FRONTEND_URL` in Render)
- Ensure backend is deployed and running

### 404 Errors
- Check if database is seeded (run seed command)
- Verify all routes are correctly configured
- Check backend logs in Render

### Slow Performance
- Free tiers have resource limits
- Consider upgrading to paid tiers for production
- Optimize database queries

---

## Cost Breakdown (All Free Tiers)

| Service | Tier | Cost |
|---------|------|------|
| MongoDB Atlas | M0 (Free) | $0/month |
| Render (Backend) | Free Web Service | $0/month |
| Vercel (Frontend) | Hobby (Free) | $0/month |
| **Total** | | **$0/month** |

---

## Free Tier Limitations

### MongoDB Atlas (M0)
- 512 MB storage
- Shared RAM
- Good for development/small production

### Render (Free)
- 512 MB RAM
- CPU limits
- Service spins down after 15 min inactivity (cold starts)
- Not for high-traffic production

### Vercel (Hobby)
- 100 GB bandwidth/month
- 6 GB build output
- Unlimited deployments
- Good for most use cases

---

## Upgrade Path (When Ready)

### MongoDB Atlas
- Upgrade to M2/M5 for more storage and performance

### Render
- Upgrade to Starter ($7/month) for better performance
- No cold starts

### Vercel
- Upgrade to Pro ($20/month) for more bandwidth and analytics

---

## Security Notes

1. **Never commit `.env` files to GitHub**
2. **Use strong secrets for JWT_SECRET and JWT_REFRESH_SECRET**
3. **Enable MongoDB Atlas IP restrictions in production**
4. **Use HTTPS (automatically provided by Render/Vercel)**
5. **Regularly update dependencies**

---

## Monitoring

### Render
- View logs in the Render dashboard
- Check metrics (CPU, memory, response time)
- Set up alerts (paid feature)

### Vercel
- View deployment logs
- Check analytics
- Monitor performance

### MongoDB Atlas
- View database metrics
- Monitor connection counts
- Check storage usage

---

## Backup Strategy

### MongoDB Atlas
- Automatic daily backups (paid feature)
- Export data regularly using mongodump (free option)

### Application Data
- Download database exports periodically
- Keep backup of configuration files

---

## Support

If you encounter issues:
1. Check logs in Render and Vercel
2. Review this guide
3. Check MongoDB Atlas status
4. Verify environment variables

---

## Next Steps After Deployment

1. Test all features thoroughly
2. Invite users to test
3. Gather feedback
4. Monitor performance
5. Plan for scaling when needed

---

## Quick Reference URLs

- Your Backend: `https://YOUR_BACKEND.onrender.com`
- Your Frontend: `https://YOUR_FRONTEND.vercel.app`
- MongoDB Atlas: `https://cloud.mongodb.com`
- Render Dashboard: `https://dashboard.render.com`
- Vercel Dashboard: `https://vercel.com/dashboard`
