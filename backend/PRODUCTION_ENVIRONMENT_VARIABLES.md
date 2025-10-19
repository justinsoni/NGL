# Production Environment Variables

This document lists all the environment variables needed for production deployment of the Football League Hub backend.

## Required Environment Variables

### Core Application
```env
NODE_ENV=production
PORT=5000
BASE_URL=https://your-backend-domain.com
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
FIREBASE_CLIENT_EMAIL=your-firebase-client-email@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-firebase-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-firebase-client-email%40project.iam.gserviceaccount.com
```

### Frontend URL (for CORS and Email Links)
```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Email Services
```env
# Brevo (Primary Email Service)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@your-domain.com

# Gmail SMTP (Fallback)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### AI Services
```env
GEMINI_API_KEY=your-gemini-api-key
```

### Rate Limiting (Optional)
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Environment Variable Descriptions

### Core Application
- **NODE_ENV**: Set to `production` for production deployment
- **PORT**: Port number for the server (Render will set this automatically)
- **BASE_URL**: The base URL of your deployed backend (e.g., `https://your-app.onrender.com`)

### Frontend URL
- **FRONTEND_URL**: Frontend URL for email links and CORS configuration

### Email Configuration
- **BREVO_API_KEY**: API key from Brevo (formerly Sendinblue) for transactional emails
- **BREVO_SENDER_EMAIL**: Email address to send emails from (must be verified in Brevo)
- **EMAIL_USER**: Gmail address for fallback SMTP
- **EMAIL_PASSWORD**: Gmail app password for fallback SMTP

### Firebase Setup
All Firebase environment variables are required for authentication. Get these from your Firebase project's service account.

## Deployment Notes

### Render.com Setup
1. Set all environment variables in the Render dashboard
2. Ensure `NODE_ENV=production`
3. Render will automatically set `PORT`
4. Set `BASE_URL` to your Render app URL

### CORS Configuration
The backend automatically allows:
- Local development URLs (localhost:3000, localhost:5173, etc.)
- URL specified in `FRONTEND_URL`

### Email Service Priority
1. **Brevo** (Primary): Used if `BREVO_API_KEY` is configured
2. **Gmail SMTP** (Fallback): Used if Brevo fails or is not configured
3. **Console Logging**: If no email service is configured, credentials are logged to console

## Security Notes

- Never commit environment variables to version control
- Use strong, unique passwords for all services
- Regularly rotate API keys and passwords
- Ensure Firebase service account has minimal required permissions
- Use HTTPS URLs for production frontend URL

## Testing Environment Variables

You can test your email configuration by checking the console logs when the server starts. The email service will log its configuration status.

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure `FRONTEND_URL` includes your frontend domain
2. **Email Not Sending**: Check Brevo API key and sender email verification
3. **Firebase Auth Errors**: Verify all Firebase environment variables are correct
4. **Database Connection**: Ensure MongoDB URI is correct and accessible

### Debug Mode
Set `NODE_ENV=development` to enable detailed logging and disable rate limiting for debugging.
