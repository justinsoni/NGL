# 🔥 **Complete Admin Setup Test Guide**

## ✅ **Step-by-Step Testing Process**

### **Prerequisites:**
1. ✅ Backend server running on `http://localhost:5000`
2. ✅ Frontend server running on `http://localhost:5173`
3. ✅ MongoDB connected and running
4. ✅ Firebase project configured

### **Step 1: Test Backend Health**
```bash
curl http://localhost:5000/api/health
# Expected: {"success":true,"message":"Server is running"}
```

### **Step 2: Test Admin Account Creation**

1. **Open Browser**: Go to `http://localhost:5173/#/login`

2. **Switch to Firebase Auth**: Click "Firebase Auth" button

3. **Create Admin Account**: 
   - Look for yellow "Create Admin Account" button
   - Click it to create: `admin@ngl.com` / `admin123`
   - Should see: "Admin account created! You can now login."

4. **Verify in Firebase Console**:
   - Go to Firebase Console → Authentication → Users
   - Should see `admin@ngl.com` user

5. **Verify in MongoDB**:
   ```javascript
   // In MongoDB Compass or shell
   db.users.findOne({email: "admin@ngl.com"})
   // Expected: User document with role: "admin"
   ```

### **Step 3: Test Admin Login**

1. **Login as Admin**:
   - Email: `admin@ngl.com`
   - Password: `admin123`
   - Should redirect to `/admin` dashboard

2. **Verify Admin Dashboard**:
   - Should see admin controls
   - Should be able to manage users
   - Should be able to manage matches

### **Step 4: Test Role-Based Access**

1. **Admin Routes**:
   - `/admin` - Should be accessible
   - `/club-manager` - Should be accessible (admin can access manager routes)
   - `/coach` - Should be accessible (admin can access coach routes)

2. **API Endpoints**:
   ```bash
   # Test admin-only endpoints
   curl -H "Authorization: Bearer <admin-token>" \
        http://localhost:5000/api/auth/users
   # Expected: List of all users
   ```

### **Step 5: Test Error Handling**

1. **Duplicate Account Creation**:
   - Try creating admin account again
   - Should see: "Admin account already exists! You can login."

2. **Invalid Login**:
   - Try wrong password
   - Should see: "Invalid email or password. Please check your credentials."

3. **Non-Existent Account**:
   - Try logging in with non-existent email
   - Should see: "Invalid email or password. Please check your credentials."

## 🔧 **Troubleshooting Common Issues**

### **Issue 1: "Failed to create admin account"**
**Solution:**
1. Check Firebase configuration in `frontend/config/firebase.ts`
2. Check backend Firebase admin SDK in `backend/config/firebase.js`
3. Verify MongoDB connection in `backend/.env`

### **Issue 2: "User profile not found"**
**Solution:**
1. Check if user exists in MongoDB
2. Verify Firebase UID linking
3. Check backend registration endpoint

### **Issue 3: "Access denied"**
**Solution:**
1. Check user role in MongoDB
2. Verify custom claims in Firebase
3. Check middleware role validation

### **Issue 4: "Token has expired"**
**Solution:**
1. Refresh the page
2. Login again
3. Check Firebase token expiration

## 📊 **Expected Database State**

### **Firebase Authentication:**
```json
{
  "uid": "firebase-uid-123",
  "email": "admin@ngl.com",
  "displayName": "Admin User",
  "emailVerified": true,
  "customClaims": {
    "role": "admin",
    "club": null,
    "dbUserId": "mongodb-user-id-456"
  }
}
```

### **MongoDB Users Collection:**
```json
{
  "_id": "mongodb-user-id-456",
  "firebaseUid": "firebase-uid-123",
  "name": "Admin User",
  "email": "admin@ngl.com",
  "role": "admin",
  "authMethod": "email",
  "isActive": true,
  "isEmailVerified": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": "2024-01-01T00:00:00Z"
}
```

## 🎯 **Success Criteria**

✅ **Admin account created in Firebase**  
✅ **Admin profile created in MongoDB**  
✅ **Custom claims set in Firebase**  
✅ **Admin can login successfully**  
✅ **Admin redirected to /admin dashboard**  
✅ **Admin can access admin-only features**  
✅ **Role-based access control working**  
✅ **Error handling working properly**  

## 🚀 **Next Steps After Admin Setup**

1. **Create Manager Accounts**: Add manager creation to admin dashboard
2. **Create Coach Accounts**: Add coach creation to manager dashboard
3. **Test User Registration**: Test regular user registration
4. **Test Google Sign-in**: Test Google authentication for users
5. **Test Password Reset**: Test password reset functionality

## 📞 **Support**

If you encounter any issues:
1. Check browser console for frontend errors
2. Check backend logs for server errors
3. Verify Firebase and MongoDB connections
4. Test API endpoints directly with curl/Postman 