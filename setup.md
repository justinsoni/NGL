# Football League Hub - Setup Guide

This guide will help you set up both the frontend and backend to work together.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Firebase project

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
# - MongoDB connection string
# - Firebase Admin SDK credentials
# - Server configuration
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install new dependencies
npm install firebase axios react-query react-hook-form react-hot-toast

# Copy environment file
cp .env.example .env

# Edit .env file with your Firebase configuration
```

### 3. Firebase Configuration

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication with Email/Password and Google

2. **Get Firebase Config**
   - Go to Project Settings > General
   - Add a web app
   - Copy the config object

3. **Generate Service Account Key**
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Download the JSON file

4. **Update Environment Files**
   
   **Backend (.env):**
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   # ... other Firebase fields from service account JSON
   ```

   **Frontend (.env):**
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   # ... other Firebase config fields
   ```

### 4. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Update backend/.env
MONGODB_URI=mongodb://localhost:27017/football-league-hub
```

**Option B: MongoDB Atlas**
```bash
# Create account at https://cloud.mongodb.com/
# Create cluster and get connection string
# Update backend/.env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/football-league-hub
```

### 5. Start the Applications

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server will start on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend will start on http://localhost:3000
```

## 🔧 Integration Features

### Authentication Flow
1. **Registration**: Users sign up with Firebase Auth
2. **Profile Creation**: Backend creates user profile in MongoDB
3. **Role Management**: Admin can assign roles (admin, clubManager, coach, registeredUser)
4. **Protected Routes**: Role-based access control

### API Integration
- **Automatic Token Handling**: Frontend automatically includes Firebase ID tokens
- **Error Handling**: Centralized error handling with toast notifications
- **Data Caching**: React Query for efficient data fetching and caching

### Available Routes

**Frontend Routes:**
- `/` - Home page (existing)
- `/auth` - Enhanced login/register with Firebase
- `/login` - Original login (legacy)
- `/admin` - Admin dashboard (role: admin)
- `/club-manager` - Club manager dashboard (role: clubManager)
- `/coach` - Coach dashboard (role: coach)
- `/player` - Player dashboard (role: player)

**Backend API Endpoints:**
- `POST /api/auth/register` - Register user profile
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/update-profile` - Update user profile
- `GET /api/auth/users` - Get all users (admin only)
- `PUT /api/auth/users/:id/role` - Update user role (admin only)
- `DELETE /api/auth/users/:id` - Deactivate user (admin only)

## 🧪 Testing the Integration

1. **Start both servers**
2. **Visit** `http://localhost:3000/auth`
3. **Register** a new account
4. **Check MongoDB** - User profile should be created
5. **Login** and test role-based access
6. **Admin features** - Create admin user in MongoDB manually:
   ```javascript
   db.users.insertOne({
     firebaseUid: "your-firebase-uid",
     name: "Admin User",
     email: "admin@example.com",
     role: "admin",
     isActive: true,
     createdAt: new Date()
   })
   ```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `FRONTEND_URL` in backend `.env`
   - Ensure frontend is running on correct port

2. **Firebase Auth Errors**
   - Verify Firebase config in frontend `.env`
   - Check Firebase project settings

3. **MongoDB Connection**
   - Verify connection string
   - Check network access (for Atlas)

4. **Token Verification Errors**
   - Ensure Firebase service account is correctly configured
   - Check private key formatting (newlines)

### Debug Mode
- Backend: Set `NODE_ENV=development` for detailed error messages
- Frontend: Check browser console for detailed logs

## 📁 Project Structure

```
football-league-hub/
├── backend/
│   ├── config/          # Database and Firebase config
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth and validation middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   └── server.js        # Main server file
├── frontend/
│   ├── config/          # Firebase config
│   ├── contexts/        # React contexts (Auth, Query)
│   ├── hooks/           # Custom hooks for API
│   ├── services/        # API and auth services
│   ├── pages/           # React pages/components
│   └── App.tsx          # Main app component
└── setup.md            # This file
```

## 🎯 Next Steps

1. **Test the enhanced authentication system**
2. **Create admin users for testing**
3. **Customize the UI to match your design**
4. **Add more API endpoints as needed**
5. **Deploy to production**

The integration provides a solid foundation for a modern, scalable football league management system with proper authentication, role-based access control, and real-time data synchronization.
