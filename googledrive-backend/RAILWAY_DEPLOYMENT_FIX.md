# 🚀 Railway Backend Deployment Fix

## ✅ Issues Fixed

1. ✅ Added health check endpoint at `/api/health`
2. ✅ Updated rate limiting for Railway (trustProxy: true)
3. ✅ Added railway.json configuration
4. ✅ Added Procfile for deployment
5. ✅ Improved error handling and logging

## 🔧 Railway Configuration Steps

### Step 1: Environment Variables
Set these in Railway Dashboard → Your Project → Variables:

**Required Variables:**
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

### Step 2: Deployment Settings
In Railway Dashboard → Your Project → Settings:

- **Build Command**: `npm ci`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **Port**: `$PORT` (Railway will set this automatically)

### Step 3: Domain Configuration
1. Go to Railway Dashboard → Your Project → Settings
2. Click "Generate Domain" or add custom domain
3. Copy the domain URL (e.g., `https://your-app.railway.app`)
4. Update `FRONTEND_URL` in Vercel to point to this Railway URL

## 🐛 Common Railway Issues & Solutions

### Issue 1: Build Succeeds but App Crashes
**Cause**: Missing environment variables
**Solution**: Ensure all required environment variables are set in Railway dashboard

### Issue 2: Port Binding Error
**Cause**: App not listening on Railway's assigned port
**Solution**: Use `process.env.PORT` (already implemented)

### Issue 3: Database Connection Fails
**Cause**: MongoDB Atlas IP whitelist
**Solution**: 
1. Go to MongoDB Atlas → Network Access
2. Add IP Address: `0.0.0.0/0` (allow all IPs)
3. Or add Railway's IP ranges

### Issue 4: S3 Connection Fails
**Cause**: Incorrect AWS credentials
**Solution**: Verify AWS credentials in Railway environment variables

## 🔍 Debugging Steps

### Check Logs
1. Go to Railway Dashboard → Your Project
2. Click on "Deployments"
3. Click on the latest deployment
4. Check "Build Logs" and "Deploy Logs"

### Test Health Check
After deployment, test: `https://your-app.railway.app/api/health`
Should return:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-02-05T...",
  "uptime": 123.456
}
```

## 🚀 Alternative: Deploy to Render

If Railway continues to fail, try Render.com:

1. Go to [Render.com](https://render.com)
2. Connect GitHub repository
3. Choose "Web Service"
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add all environment variables
6. Deploy

## 📋 Deployment Checklist

- [ ] All environment variables set in Railway
- [ ] MongoDB Atlas allows Railway IPs (0.0.0.0/0)
- [ ] AWS S3 credentials are correct
- [ ] Gmail app password is set
- [ ] Health check endpoint responds
- [ ] Frontend REACT_APP_API_URL points to Railway domain

## 🎯 Expected Result

After successful deployment:
- ✅ Railway build completes without errors
- ✅ App starts and listens on assigned port
- ✅ Health check endpoint returns 200 OK
- ✅ Database connection established
- ✅ S3 connection successful
- ✅ Ready to receive API calls from frontend

---

**Push these changes to GitHub and redeploy on Railway!** 🚀