const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      // Check if required Firebase environment variables are present
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
        console.warn('⚠️  Firebase environment variables not configured. Firebase features will be disabled.');
        console.warn('   To enable Firebase, set the following environment variables:');
        console.warn('   - FIREBASE_PROJECT_ID');
        console.warn('   - FIREBASE_PRIVATE_KEY');
        console.warn('   - FIREBASE_CLIENT_EMAIL');
        console.warn('   - And other Firebase config variables');
        return;
      }

      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      console.log('🔥 Firebase Admin SDK initialized successfully for project:', process.env.FIREBASE_PROJECT_ID);
    }
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    console.warn('⚠️  Firebase initialization failed. Some features may not work properly.');
    // Don't throw error to prevent server crash
  }
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error.message);
    throw new Error('Invalid or expired token');
  }
};

// Get user by UID
const getUserByUid = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Get user error:', error.message);
    throw new Error('User not found');
  }
};

// Create custom token
const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('Create custom token error:', error.message);
    throw new Error('Failed to create custom token');
  }
};

// Set custom user claims
const setCustomUserClaims = async (uid, customClaims) => {
  try {
    await admin.auth().setCustomUserClaims(uid, customClaims);
    console.log('✅ Custom claims set for user:', uid);
    return true;
  } catch (error) {
    console.error('Set custom claims error:', error.message);
    throw new Error('Failed to set custom claims');
  }
};

module.exports = {
  initializeFirebase,
  verifyIdToken,
  getUserByUid,
  createCustomToken,
  setCustomUserClaims,
  admin
};
