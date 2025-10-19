# ENVIRONMENT VARIABLES CHECKLIST
# ===========================================
# FOOTBALL LEAGUE HUB - PRODUCTION READINESS
# ===========================================

## ❌ CURRENT STATUS: NO .env FILE FOUND
You currently don't have a .env file in your project. This means you're likely using hardcoded values or running without proper configuration.

## ✅ REQUIRED ENVIRONMENT VARIABLES FOR PRODUCTION

### 🔧 CORE APPLICATION (REQUIRED)
```env
NODE_ENV=production
PORT=5000
BASE_URL=https://your-backend-domain.com
```

### 🗄️ DATABASE (REQUIRED)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

### 🔐 FIREBASE AUTHENTICATION (REQUIRED)
```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-firebase-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-firebase-client-email@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-firebase-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-firebase-client-email%40project.iam.gserviceaccount.com
```

### 🌐 FRONTEND URLS (REQUIRED FOR PRODUCTION)
```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
PRODUCTION_FRONTEND_URLS=https://your-frontend-domain.vercel.app,https://www.your-domain.com
```

### 📧 EMAIL SERVICES (REQUIRED FOR USER MANAGEMENT)
```env
# Brevo (Primary)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@your-domain.com

# Gmail SMTP (Fallback)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### 🤖 AI SERVICES (REQUIRED FOR AI FEATURES)
```env
GEMINI_API_KEY=your-gemini-api-key
```

### ⚡ OPTIONAL CONFIGURATIONS
```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
JWT_SECRET=your-super-secret-jwt-key

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

## 🚨 IMMEDIATE ACTION REQUIRED

### 1. CREATE .env FILE
Create a `.env` file in your backend directory with the above variables.

### 2. GET YOUR CREDENTIALS
- **MongoDB**: Set up MongoDB Atlas account
- **Firebase**: Get service account credentials from Firebase Console
- **Brevo**: Sign up at https://app.brevo.com/ and get API key
- **Gmail**: Enable 2FA and create App Password
- **Gemini**: Get API key from https://makersuite.google.com/app/apikey

### 3. TEST LOCALLY
```bash
cd backend
npm start
```

### 4. DEPLOY TO RENDER
Set all environment variables in Render dashboard before deployment.

## 📋 CHECKLIST FOR PRODUCTION DEPLOYMENT

### Backend (Render.com)
- [ ] NODE_ENV=production
- [ ] MONGODB_URI (MongoDB Atlas)
- [ ] All Firebase variables
- [ ] FRONTEND_URL (your Vercel domain)
- [ ] PRODUCTION_FRONTEND_URLS
- [ ] BREVO_API_KEY
- [ ] BREVO_SENDER_EMAIL
- [ ] GEMINI_API_KEY

### Frontend (Vercel)
- [ ] VITE_API_BASE_URL (your Render backend URL)
- [ ] VITE_FIREBASE_API_KEY
- [ ] VITE_FIREBASE_AUTH_DOMAIN
- [ ] VITE_FIREBASE_PROJECT_ID
- [ ] VITE_FIREBASE_STORAGE_BUCKET
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
- [ ] VITE_FIREBASE_APP_ID

## 🔍 HOW TO GET YOUR CREDENTIALS

### MongoDB Atlas
1. Go to https://cloud.mongodb.com/
2. Create cluster
3. Get connection string
4. Replace `<password>` with your password

### Firebase Service Account
1. Go to Firebase Console > Project Settings
2. Service Accounts tab
3. Generate new private key
4. Copy all values from the JSON file

### Brevo API Key
1. Go to https://app.brevo.com/
2. Sign up/login
3. Go to SMTP & API
4. Generate API key

### Gmail App Password
1. Enable 2-Factor Authentication
2. Go to Google Account settings
3. Security > App passwords
4. Generate password for "Mail"

### Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy the key

## ⚠️ SECURITY NOTES
- Never commit .env files to git
- Use strong, unique passwords
- Rotate API keys regularly
- Use HTTPS URLs for production
- Test email functionality before going live
