# Football League Hub - Backend API

A comprehensive Node.js + Express backend for a football league hub application with Firebase Authentication and MongoDB integration.

## 🚀 Features

- **Firebase Authentication**: Secure user authentication with Firebase Admin SDK
- **MongoDB Integration**: User profiles and role management with Mongoose
- **Role-Based Access Control**: Admin, Club Manager, Coach, and Registered User roles
- **RESTful API**: Clean and well-documented API endpoints
- **Security**: Rate limiting, CORS, security headers, and input validation
- **Error Handling**: Comprehensive error handling and logging
- **Validation**: Request validation with express-validator

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Firebase project with Admin SDK credentials

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd football-league-hub/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   - MongoDB connection string
   - Firebase Admin SDK credentials
   - Server configuration

4. **Firebase Setup**
   - Create a Firebase project
   - Generate a service account key
   - Add the credentials to your `.env` file

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/football-league-hub

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📚 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user profile | Public |
| GET | `/api/auth/profile` | Get current user profile | Private |
| PUT | `/api/auth/update-profile` | Update user profile | Private |
| GET | `/api/auth/users` | Get all users (paginated) | Admin |
| GET | `/api/auth/users/:userId` | Get specific user | Admin/Owner |
| PUT | `/api/auth/users/:userId/role` | Update user role | Admin |
| DELETE | `/api/auth/users/:userId` | Deactivate user | Admin |

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/health` | Server health check | Public |

## 🔐 Authentication Flow

1. **Frontend Registration**: User signs up with Firebase Auth
2. **Profile Creation**: Frontend sends Firebase UID and user data to `/api/auth/register`
3. **Token Verification**: All protected routes verify Firebase ID tokens
4. **Role-Based Access**: Endpoints check user roles for authorization

## 📊 User Schema

```javascript
{
  firebaseUid: String (required, unique),
  name: String (required),
  email: String (required, unique),
  role: String (enum: ['admin', 'registeredUser', 'clubManager', 'coach']),
  club: String (optional),
  programRegistrations: Array,
  profile: {
    phone: String,
    dateOfBirth: Date,
    nationality: String,
    position: String,
    bio: String,
    avatar: String
  },
  isActive: Boolean,
  isEmailVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🛡️ Security Features

- **Firebase Token Verification**: All protected routes verify Firebase ID tokens
- **Rate Limiting**: Prevents abuse with configurable rate limits
- **CORS Protection**: Configurable CORS policy
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Express-validator for request validation
- **Role-Based Access Control**: Granular permissions based on user roles

## 🚦 Error Handling

The API returns consistent error responses:

```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [...], // Validation errors if applicable
  "error": "..." // Stack trace in development mode
}
```

## 📝 Usage Examples

### Register User
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "firebaseUid": "firebase-user-uid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "registeredUser",
  "club": "Manchester United"
}
```

### Get Profile
```javascript
GET /api/auth/profile
Authorization: Bearer <firebase-id-token>
```

### Update Profile
```javascript
PUT /api/auth/update-profile
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "name": "John Smith",
  "profile": {
    "phone": "+1234567890",
    "bio": "Football enthusiast"
  }
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js          # MongoDB connection
│   └── firebase.js          # Firebase Admin SDK setup
├── controllers/
│   └── authController.js    # Authentication controllers
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Request validation
│   └── security.js          # Security middleware
├── models/
│   └── User.js              # User model schema
├── routes/
│   └── auth.js              # Authentication routes
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── server.js                # Main server file
└── README.md                # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
