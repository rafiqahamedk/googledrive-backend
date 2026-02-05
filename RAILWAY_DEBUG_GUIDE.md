# 🔍 Railway Deployment Debug Guide

## 🚨 Current Issue: Health Check Failing

The build is successful, but the health check at `/api/health` is failing. This means the app is not starting properly.

## 🔧 **CRITICAL: Check Environment Variables**

Go to Railway Dashboard → Your Project → Variables and ensure ALL these are set:

### **Required Environment Variables:**
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

## 🔍 **Debug Steps:**

### **Step 1: Check Railway Logs**
1. Go to Railway Dashboard → Your Project
2. Click on **Deployments**
3. Click on the latest deployment
4. Look for **Deploy Logs** - check for error messages

### **Step 2: Common Error Messages & Solutions**

#### **MongoDB Connection Error:**
```
MongoDB connection error: MongoNetworkError
```
**Solution:** 
- Check `MONGODB_URI` is correct
- Go to MongoDB Atlas → Network Access
- Add IP: `0.0.0.0/0` (allow all IPs)

#### **Missing Environment Variables:**
```
Cannot read property 'MONGODB_URI' of undefined
```
**Solution:** Ensure all environment variables are set in Railway

#### **AWS S3 Error:**
```
AWS S3 connection failed
```
**Solution:** Verify AWS credentials in Railway variables

#### **Port Binding Error:**
```
Error: listen EADDRINUSE
```
**Solution:** Railway automatically sets PORT - don't override it

### **Step 3: Test Health Check Manually**

After deployment, test the health check:
```bash
curl https://your-app.railway.app/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-02-05T...",
  "uptime": 123.456
}
```

## 🚀 **Quick Fix Commands**

### **Option 1: Redeploy with Logs**
1. Go to Railway Dashboard
2. Click **Redeploy**
3. Watch the **Deploy Logs** in real-time
4. Look for specific error messages

### **Option 2: Disable Health Check Temporarily**
1. Go to Railway Dashboard → Settings
2. Find **Health Check** settings
3. Disable health check temporarily
4. See if the app starts without health check

### **Option 3: Check Railway Service Logs**
1. Go to Railway Dashboard
2. Click on your service
3. Check **Logs** tab for runtime errors

## 🎯 **Most Likely Issues (in order):**

1. **Missing `MONGODB_URI`** - App can't connect to database
2. **MongoDB Atlas IP Whitelist** - Railway IP not allowed
3. **Missing other environment variables** - App crashes on startup
4. **AWS S3 credentials** - S3 connection fails
5. **Port binding** - App not listening on Railway's port

## 🔧 **Emergency Fix: Minimal Server**

If nothing works, let's create a minimal server to test:

Create a temporary `test-server.js`:
```javascript
const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Minimal server working' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});
```

Update `package.json` temporarily:
```json
{
  "scripts": {
    "start": "node test-server.js"
  }
}
```

## 📞 **Next Steps:**

1. **Check Railway logs** for specific error messages
2. **Verify all environment variables** are set
3. **Test MongoDB connection** from your local machine
4. **Add Railway IP to MongoDB Atlas** whitelist
5. **Try the minimal server** if main app fails

---

**The build is working - we just need to fix the startup issue!** 🚀

Most likely it's missing environment variables or MongoDB connection issues.