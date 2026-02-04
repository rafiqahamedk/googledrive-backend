# 🚀 Google Drive Clone

A complete Google Drive clone application with React frontend, Node.js backend, AWS S3 storage, and MongoDB Atlas database.

## ✨ Features

### 🔐 Authentication System
- User registration with email verification
- Secure login with JWT tokens
- Password reset functionality
- Two-step activation workflow
- Account activation required for login

### 📁 File & Folder Management
- Drag & drop file upload to AWS S3
- Create, rename, delete folders
- Nested folder structure with breadcrumb navigation
- File download with secure signed URLs
- Owner-only access to files and folders
- Real-time storage usage tracking
- **⭐ Starred items** - Mark files and folders as favorites
- **🗑️ Trash system** - Soft delete with restore functionality
- **🔍 Search functionality** - Find files and folders by name
- **📋 Copy & Move** - Full copy/move functionality with interactive modals
- **🗂️ Folder Information** - Detailed folder statistics and properties
- **💀 Permanent Delete** - Permanently remove items from trash

### 🎨 Modern UI/UX
- Google Drive-inspired responsive design
- Grid and list view modes
- Context menus for file operations
- Toast notifications for user feedback
- Loading states and progress indicators
- Mobile-friendly interface
- **Visual star indicators** on files and folders
- **Professional empty states** with helpful guidance
- **Gradient buttons** and modern design elements

## 🛠 Tech Stack

**Frontend:**
- React 18 with modern hooks
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- React Hot Toast for notifications
- React Dropzone for file uploads

**Backend:**
- Node.js with Express.js
- MongoDB Atlas for database
- AWS S3 for file storage (private bucket)
- JWT for authentication
- Nodemailer for email services
- Bcrypt for password encryption

## 📋 Prerequisites

- Node.js 16+ installed
- Git installed
- MongoDB Atlas account
- AWS account with S3 access
- Gmail account for email services

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/rafiqahamedk/googledrive-backend.git
cd googledrive-backend
```

### 2. Backend Setup

```bash
cd googledrive-backend
npm install
```

Create `.env` file in `googledrive-backend/` directory (copy from `.env.example`):

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas - Replace with your connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/googledrive?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-at-least-32-characters-long
JWT_EXPIRE=7d

# AWS S3 - Replace with your AWS credentials
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

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### 3. Frontend Setup

```bash
cd ../googledrive-frontend
npm install
```

Create `.env` file in `googledrive-frontend/` directory (copy from `.env.example`):

```env
REACT_APP_API_URL=http://localhost:5000/api
PORT=3001
```

### 4. Gmail SMTP Setup

To enable email verification:

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account → Security → 2-Step Verification → App passwords
3. Generate password for "Mail"
4. Copy the 16-character password (no spaces)
5. Update `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM` in backend `.env`

### 5. AWS S3 Setup

1. Create an S3 bucket with private access
2. Create an IAM user with S3 permissions
3. Generate access keys for the IAM user
4. Update AWS credentials in backend `.env`

### 6. Start the Application

**Option 1: Manual Start**

Terminal 1 - Backend:
```bash
cd googledrive-backend
npm start
```

Terminal 2 - Frontend:
```bash
cd googledrive-frontend
npm start
```

**Option 2: Using the startup script**

Mac/Linux:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### 7. Access the Application

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

## 🧪 Testing the Application

1. **Registration Flow:**
   - Go to http://localhost:3001
   - Click "Create a new account"
   - Fill in registration form
   - Check email for activation link (currently auto-activated for testing)
   - Login with credentials

2. **File Operations:**
   - Upload files via drag & drop or button
   - Create folders with "New Folder" button
   - Navigate through folder structure
   - Download files by clicking on them
   - Use context menus for operations
   - **Star items** by right-clicking → "Add to starred"
   - **View starred items** in the Starred section
   - **Delete items** (they go to trash)
   - **Restore or permanently delete** from trash

## 📁 Project Structure

```
google-drive-clone/
├── googledrive-backend/           # Node.js API Server
│   ├── config/                   # AWS S3 & Email configuration
│   ├── middleware/               # Authentication middleware
│   ├── models/                   # MongoDB models (User, File, Folder)
│   ├── routes/                   # API routes (auth, files, folders)
│   ├── .env.example              # Environment variables template
│   ├── server.js                 # Main server file
│   └── package.json              # Backend dependencies
├── googledrive-frontend/          # React Application
│   ├── public/                   # Static files
│   ├── src/
│   │   ├── components/           # React components
│   │   │   └── Dashboard/        # Dashboard-specific components
│   │   ├── contexts/             # React contexts (Auth)
│   │   ├── pages/                # Page components
│   │   ├── services/             # API service functions
│   │   ├── App.js                # Main app component
│   │   └── index.js              # App entry point
│   ├── .env.example              # Frontend environment variables template
│   └── package.json              # Frontend dependencies
├── start-dev.sh                  # Unix startup script
├── .gitignore                    # Git ignore file
└── README.md                     # This file
```

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

### Backend Deployment (Railway/Heroku)

1. **Railway (Recommended):**
   - Connect GitHub repository to Railway
   - Set environment variables in Railway dashboard
   - Deploy automatically on push

2. **Heroku:**
   ```bash
   heroku create googledrive-backend-yourname
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   # ... set all environment variables
   git push heroku main
   ```

### Frontend Deployment (Netlify/Vercel)

1. **Netlify:**
   - Build: `npm run build`
   - Deploy `build` folder to Netlify
   - Set `REACT_APP_API_URL` environment variable

2. **Vercel:**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Backend won't start:**
   ```bash
   # Check if port 5000 is in use
   netstat -an | findstr :5000  # Windows
   lsof -i :5000               # Mac/Linux
   ```

2. **MongoDB connection error:**
   - Verify connection string in `.env`
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

3. **AWS S3 errors:**
   - Verify AWS credentials
   - Check if S3 bucket exists and is accessible
   - Ensure bucket is in correct region

4. **Email not sending:**
   - Verify Gmail app password is correct
   - Check if 2FA is enabled on Gmail
   - Update email credentials in `.env`

5. **CORS errors:**
   - Ensure `FRONTEND_URL` matches your frontend URL
   - Check if both servers are running

## 🔒 Security Features

- Password encryption with bcrypt (12 rounds)
- JWT token-based authentication
- Private S3 bucket with signed URLs
- CORS protection
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- Helmet security headers
- Environment variable protection

## 📊 Performance Features

- File upload progress tracking
- Lazy loading for large file lists
- Optimized bundle size with code splitting
- Responsive images and layouts
- Efficient database queries with indexing
- Caching strategies for better performance

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

This project is open source and available under the MIT License.

## 🎯 Success Checklist

- [ ] Backend starts without errors on port 5000
- [ ] Frontend starts without errors on port 3001
- [ ] Health check endpoint returns OK
- [ ] User registration works
- [ ] Email verification works (if configured)
- [ ] Login/logout works
- [ ] File upload works
- [ ] Folder creation works
- [ ] File download works
- [ ] Starred functionality works
- [ ] Trash and restore works
- [ ] Copy and move functionality works
- [ ] Search functionality works
- [ ] Responsive design works on mobile

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review error messages in terminal/console
3. Verify all environment variables are set correctly
4. Ensure all services (MongoDB, AWS S3, Gmail) are properly configured

---

**🎉 Congratulations!** You now have a fully functional Google Drive clone with all modern features! 🚀