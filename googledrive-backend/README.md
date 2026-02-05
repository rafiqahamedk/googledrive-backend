# 🚀 Google Drive Clone - Backend API

A complete Node.js backend API for the Google Drive clone application with Express.js, MongoDB Atlas, AWS S3 storage, and JWT authentication.

## ✨ Features

### 🔐 Authentication System
- User registration with email verification
- Secure login with JWT tokens
- Password reset functionality
- Two-step activation workflow
- Account activation required for login

### 📁 File & Folder Management API
- File upload to AWS S3 with progress tracking
- Create, rename, delete folders
- Nested folder structure with breadcrumb navigation
- File download with secure signed URLs
- Owner-only access to files and folders
- Real-time storage usage tracking
- **⭐ Starred items** - Mark files and folders as favorites
- **🗑️ Trash system** - Soft delete with restore functionality
- **🔍 Search functionality** - Find files and folders by name
- **📋 Copy & Move** - Full copy/move functionality
- **🗂️ Folder Information** - Detailed folder statistics
- **💀 Permanent Delete** - Permanently remove items from trash

### 🔒 Security Features
- Password encryption with bcrypt (12 rounds)
- JWT token-based authentication
- Private S3 bucket with signed URLs
- CORS protection
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- Helmet security headers
- Environment variable protection

## 🛠 Tech Stack

- **Node.js** with Express.js
- **MongoDB Atlas** for database
- **AWS S3** for file storage (private bucket)
- **JWT** for authentication
- **Nodemailer** for email services
- **Bcrypt** for password encryption
- **Multer** for file uploads
- **Express Validator** for input validation

## 📋 Prerequisites

- Node.js 16+ installed
- MongoDB Atlas account
- AWS account with S3 access
- Gmail account for email services

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/rafiqahamedk/googledrive-backend.git
cd googledrive-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env` file in the root directory (copy from `.env.example`):

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas - Replace with your connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/googledrive?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-at-least-32-characters-long
JWT_EXPIRE=7d

# AWS S3 Configuration - Replace with your AWS credentials
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Email Configuration (Gmail SMTP) - Replace with your credentials
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001
```

### 4. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

### 5. Test the API

- **Health Check:** http://localhost:5000/api/health
- **API Base URL:** http://localhost:5000/api

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/activate` - Activate account
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files` - Get user files
- `GET /api/files/starred` - Get starred files
- `GET /api/files/trash` - Get deleted files
- `GET /api/files/:id/download` - Download file
- `PUT /api/files/:id/star` - Toggle file starred status
- `PUT /api/files/:id/restore` - Restore file from trash
- `DELETE /api/files/:id` - Delete file (to trash)
- `DELETE /api/files/:id/permanent` - Permanently delete file
- `POST /api/files/:id/copy` - Copy file
- `PUT /api/files/:id/rename` - Rename file
- `PUT /api/files/:id/move` - Move file

### Folders
- `POST /api/folders` - Create folder
- `GET /api/folders` - Get user folders
- `GET /api/folders/starred` - Get starred folders
- `GET /api/folders/trash` - Get deleted folders
- `GET /api/folders/:id` - Get folder details
- `PUT /api/folders/:id/star` - Toggle folder starred status
- `PUT /api/folders/:id/restore` - Restore folder from trash
- `DELETE /api/folders/:id` - Delete folder (to trash)
- `DELETE /api/folders/:id/permanent` - Permanently delete folder
- `POST /api/folders/:id/copy` - Copy folder
- `PUT /api/folders/:id/rename` - Rename folder
- `PUT /api/folders/:id/move` - Move folder
- `GET /api/folders/breadcrumb/:id` - Get breadcrumb path

## 🚀 Deployment

### Railway (Recommended)

1. **Connect Repository:**
   - Go to [Railway.app](https://railway.app)
   - Connect this GitHub repository
   - Railway will auto-detect Node.js

2. **Set Environment Variables:**
   - Go to your project → Variables
   - Add all environment variables from `.env.example`
   - Set `NODE_ENV=production`

3. **Deploy:**
   - Railway will automatically deploy
   - Health check available at: `https://your-app.railway.app/api/health`

### Alternative: Render.com

1. **Create Web Service:**
   - Go to [Render.com](https://render.com)
   - Connect GitHub repository
   - Choose "Web Service"

2. **Configuration:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

3. **Environment Variables:**
   - Add all variables from `.env.example`

## 🧪 Testing the API

### Using curl:

```bash
# Health check
curl https://your-api-url.com/api/health

# Register user
curl -X POST https://your-api-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST https://your-api-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📁 Project Structure

```
googledrive-backend/
├── config/                   # Configuration files
│   ├── aws.js               # AWS S3 configuration
│   └── email.js             # Email configuration
├── middleware/              # Express middleware
│   └── auth.js              # Authentication middleware
├── models/                  # MongoDB models
│   ├── User.js              # User model
│   ├── File.js              # File model
│   └── Folder.js            # Folder model
├── routes/                  # API routes
│   ├── auth.js              # Authentication routes
│   ├── files.js             # File management routes
│   └── folders.js           # Folder management routes
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore file
├── package.json             # Dependencies and scripts
├── Procfile                 # Railway/Heroku deployment
├── railway.json             # Railway configuration
└── server.js                # Main server file
```

## 🐛 Troubleshooting

### Common Issues

1. **Server won't start:**
   ```bash
   # Check if port 5000 is in use
   netstat -an | findstr :5000  # Windows
   lsof -i :5000               # Mac/Linux
   ```

2. **MongoDB connection error:**
   - Verify connection string in `.env`
   - Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for Railway)
   - Ensure database user has proper permissions

3. **AWS S3 errors:**
   - Verify AWS credentials in `.env`
   - Check if S3 bucket exists and is accessible
   - Ensure bucket is in correct region

4. **Email not sending:**
   - Verify Gmail app password is correct
   - Check if 2FA is enabled on Gmail
   - Update email credentials in `.env`

## 📊 Performance Features

- Efficient database queries with indexing
- File upload progress tracking
- Optimized S3 operations
- Connection pooling
- Error handling and logging
- Rate limiting for security

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

This project is open source and available under the MIT License.

## 🔗 Related Repositories

- **Frontend:** [googledrive-frontend](https://github.com/rafiqahamedk/googledrive-frontend)

---

**🎉 Your Google Drive clone backend API is ready for production!** 🚀