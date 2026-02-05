# 🚀 Railway Deployment Fix Instructions

## 🚨 Problem
Railway can't determine which folder to deploy because it sees both `googledrive-backend/` and `googledrive-frontend/` in the root.

## ✅ Solution Options (Try in Order)

### **Option 1: Set Root Directory in Railway Dashboard**

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your project
3. Go to **Settings** tab
4. Find **"Root Directory"** or **"Source"** setting
5. Set it to: `googledrive-backend`
6. Click **Save**
7. Go to **Deployments** and click **"Redeploy"**

### **Option 2: Use Railway CLI (If Option 1 doesn't work)**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Set the root directory
railway up --service backend --source googledrive-backend
```

### **Option 3: Manual Repository Restructure**

If Railway still can't detect the backend, we need to move backend files to root:

1. **Create a new branch for safety:**
   ```bash
   git checkout -b railway-deploy-fix
   ```

2. **Move backend files to root:**
   ```bash
   # Move all backend files to root
   mv googledrive-backend/* .
   mv googledrive-backend/.* . 2>/dev/null || true
   
   # Remove empty backend folder
   rmdir googledrive-backend
   
   # Remove frontend folder (it's in separate repo now)
   rm -rf googledrive-frontend
   ```

3. **Update .gitignore to ignore frontend:**
   ```bash
   echo "googledrive-frontend/" >> .gitignore
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Restructure: Move backend to root for Railway deployment"
   git push origin railway-deploy-fix
   ```

5. **Merge to main:**
   ```bash
   git checkout main
   git merge railway-deploy-fix
   git push origin main
   ```

## 🔧 Required Environment Variables for Railway

Set these in Railway Dashboard → Your Project → Variables:

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/googledrive?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-at-least-32-characters-long
JWT_EXPIRE=7d
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## 🧪 Test After Deployment

1. **Health Check:** `https://your-app.railway.app/api/health`
   - Should return: `{"success": true, "message": "Server is healthy"}`

2. **API Test:** `https://your-app.railway.app/api/auth/register`
   - Should accept POST requests

## 🐛 If Still Failing

### Check Railway Logs:
1. Go to Railway Dashboard → Your Project
2. Click on **Deployments**
3. Click on the latest deployment
4. Check **Build Logs** and **Deploy Logs**

### Common Issues:
- **Missing Environment Variables:** Ensure all variables are set
- **MongoDB Connection:** Add `0.0.0.0/0` to MongoDB Atlas IP whitelist
- **Port Issues:** Railway automatically sets `PORT` environment variable

## 🎯 Expected Success

After successful deployment:
- ✅ Railway detects Node.js project
- ✅ Build completes successfully
- ✅ Health check endpoint responds
- ✅ API is accessible at Railway URL
- ✅ Ready to connect with Vercel frontend

---

**Try Option 1 first - it's the simplest solution!** 🚀