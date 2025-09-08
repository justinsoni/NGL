# 🎯 **BREVO EMAIL INTEGRATION SETUP GUIDE**

## ✅ **Complete Brevo Email Service Configuration**

### **Overview**
This guide will help you set up **Brevo email service** for real email verification when creating managers through the admin dashboard. Brevo is the **primary email service** with Gmail as a fallback option.

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Create Brevo Account**

1. **Visit Brevo Website:**
   - Go to [Brevo (formerly Sendinblue)](https://www.brevo.com/)
   - Click **"Start for free"** or **"Sign up"**

2. **Complete Registration:**
   - Enter your email address
   - Create a password
   - Verify your email address
   - Complete the account setup

### **Step 2: Get API Key**

1. **Login to Brevo Dashboard:**
   - Go to [Brevo Dashboard](https://app.brevo.com/)
   - Login with your credentials

2. **Navigate to API Keys:**
   - Click on **"Settings"** in the left sidebar
   - Click on **"API Keys"**
   - Click **"Generate a new API key"**

3. **Create API Key:**
   - Name: `NGL Manager System`
   - Permissions: Select **"Transactional emails"**
   - Click **"Generate"**
   - **Copy the API key** (starts with `xkeysib-`)

### **Step 3: Configure Sender Email**

1. **Add Sender:**
   - Go to **Settings** → **Senders & IP**
   - Click **"Add a new sender"**
   - Enter: `justinsony2000@gmail.com`
   - Name: `NGL Administration Team`
   - Click **"Add"**

2. **Verify Sender Email:**
   - Check your email for verification link
   - Click the verification link
   - Status should show **"Verified"**

### **Step 4: Environment Configuration**

Create or update your `.env` file in the `backend` directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ngl_database

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url

# Email Configuration (Brevo - Primary)
BREVO_API_KEY=xkeysib-your-actual-api-key-here
BREVO_SENDER_EMAIL=justinsony2000@gmail.com

# Email Configuration (Gmail - Fallback)
EMAIL_USER=justinsony2000@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

### **Step 5: Install Dependencies**

```bash
cd backend
npm install @getbrevo/brevo
```

### **Step 6: Test Configuration**

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Check email service status:**
   - Look for: `✅ Brevo email service configured successfully`
   - If you see: `⚠️ Brevo API key not configured` - check your .env file

3. **Test Brevo email:**
   ```bash
   node test-brevo-email.js
   ```

### **Step 7: Test Manager Creation**

1. **Login as Admin:**
   - Go to `http://localhost:3000/login`
   - Use: `admin@ngl.com` / `admin`

2. **Create Manager:**
   - Go to **Admin Dashboard** → **User Management**
   - Fill in manager details:
     - **Manager Name:** `John Smith`
     - **Manager Email:** `jobinshaji111@gmail.com`
     - **Assign to Club:** `Arsenal`
   - Click **"Create Manager Account"**

3. **Verify Email:**
   - Check the manager's email for credentials
   - Email should be sent via Brevo
   - Professional HTML template with credentials

---

## 🎯 **Email Templates**

### **Manager Account Creation Email**
- ✅ **Professional HTML design**
- ✅ **Login credentials** (email + password)
- ✅ **Club assignment** details
- ✅ **Manager capabilities** list
- ✅ **Security notes** and instructions
- ✅ **Login URL** with button
- ✅ **Branded styling** with NGL colors

### **Coach Account Creation Email**
- ✅ **Professional HTML design**
- ✅ **Login credentials** (email + password)
- ✅ **Club assignment** details
- ✅ **Coach capabilities** list
- ✅ **Security notes** and instructions
- ✅ **Login URL** with button

---

## 🔧 **Technical Implementation**

### **Email Service Architecture**
```
Brevo (Primary) → Gmail (Fallback) → Log (No Service)
     ↓                ↓                    ↓
  API Key         App Password        Console Log
  Configured      Configured         No Email Sent
```

### **Key Features**
- ✅ **Automatic fallback** to Gmail if Brevo fails
- ✅ **Professional email templates**
- ✅ **Secure password generation**
- ✅ **Real-time email delivery**
- ✅ **Error handling** and logging
- ✅ **No impact on existing login system**

### **Files Modified**
1. **`backend/utils/emailService.js`** - Brevo integration
2. **`backend/controllers/managerController.js`** - Email response handling
3. **`backend/package.json`** - Brevo dependency
4. **`backend/test-brevo-email.js`** - Test script
5. **`backend/EMAIL_SETUP_GUIDE.md`** - Updated documentation

---

## 🚨 **Troubleshooting**

### **Brevo Email Not Sending**
1. **Check API Key:**
   - Verify `BREVO_API_KEY` in .env file
   - Ensure key starts with `xkeysib-`
   - Check if key has proper permissions

2. **Check Sender Email:**
   - Verify `BREVO_SENDER_EMAIL` is configured
   - Ensure sender email is verified in Brevo dashboard
   - Check sender status is "Verified"

3. **Check Account Status:**
   - Login to Brevo dashboard
   - Check account status and limits
   - Ensure account is active

### **Gmail Fallback Not Working**
1. **Check Gmail Configuration:**
   - Verify `EMAIL_USER` and `EMAIL_PASSWORD` in .env
   - Ensure 2FA is enabled on Gmail
   - Check app password is 16 characters

2. **Test Gmail Connection:**
   - Try sending test email via Gmail
   - Check for authentication errors
   - Verify SMTP settings

### **Common Errors**
- **"Brevo initialization failed"** - Check API key format
- **"Email service not configured"** - Add API key to .env
- **"Sender not verified"** - Verify sender email in Brevo
- **"Rate limit exceeded"** - Check Brevo account limits

---

## 🎉 **Success Indicators**

### **✅ Working Configuration**
- Console shows: `✅ Brevo email service configured successfully`
- Manager creation sends email via Brevo
- Professional HTML email received
- Email includes all credentials and instructions

### **✅ Test Results**
- `node test-brevo-email.js` returns success
- Email delivered to manager's inbox
- No errors in console logs
- Admin dashboard shows success message

---

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Test with the provided test script
4. Check Brevo dashboard for account status
5. Review console logs for error messages

**Brevo Integration Status: ✅ READY FOR PRODUCTION** 