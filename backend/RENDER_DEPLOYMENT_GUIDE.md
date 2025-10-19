# Render Deployment Configuration

## Render Service Settings

### Build Command
```bash
npm install
```

### Start Command
```bash
npm start
```

### Node.js Version
- **Specified in package.json**: `"node": "18.x"`
- **Render will automatically use Node.js 18.x**

## Environment Variables Required

Make sure to set these environment variables in your Render dashboard:

### Core Application
```env
NODE_ENV=production
PORT=5000
BASE_URL=https://your-app-name.onrender.com
```

### Database
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

### Firebase Configuration
```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-firebase-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-firebase-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
```

### Frontend URL
```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Email Services (Optional)
```env
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@your-domain.com
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### AI Services (Optional)
```env
GEMINI_API_KEY=your-gemini-api-key
```

## Important Notes

1. **Build Command**: Use `npm install` (not `npm run dev`)
2. **Start Command**: Use `npm start` (not `npm run dev`)
3. **Node.js Version**: Automatically set to 18.x via package.json engines field
4. **Environment**: Set `NODE_ENV=production` for production deployment
5. **CORS**: Update `FRONTEND_URL` to your actual frontend domain

## Troubleshooting

### Common Issues:
1. **Permission Denied Error**: Make sure you're using `npm start` not `npm run dev`
2. **CORS Errors**: Ensure `FRONTEND_URL` is set to your frontend domain
3. **Database Connection**: Verify MongoDB URI is correct and accessible
4. **Firebase Auth**: Check all Firebase environment variables are properly set

### Debug Steps:
1. Check Render logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB Atlas allows connections from Render's IP ranges
4. Test Firebase credentials locally first

