const { verifyIdToken } = require('../config/firebase');
const User = require('../models/User');

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided or invalid format. Expected: Bearer <token>'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await verifyIdToken(idToken);
    
    // Find user in MongoDB using Firebase UID
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found. Please complete registration.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Attach user info to request object
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.'
    });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole}`
      });
    }

    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = requireRole('admin');

// Middleware to check if user can manage clubs
const requireClubManager = requireRole(['admin', 'clubManager']);

// Middleware to check if user can coach
const requireCoach = requireRole(['admin', 'clubManager', 'coach']);

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = req.user._id.toString() === req.params.userId || 
                  req.user.firebaseUid === req.params.firebaseUid;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  }

  next();
};

// Middleware to validate club access
const requireClubAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const userRole = req.user.role;
  const userClub = req.user.club;
  const requestedClub = req.params.club || req.body.club;

  // Admin can access all clubs
  if (userRole === 'admin') {
    return next();
  }

  // Club managers and coaches can only access their own club
  if ((userRole === 'clubManager' || userRole === 'coach') && userClub === requestedClub) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only access your assigned club.'
  });
};

module.exports = {
  verifyFirebaseToken,
  authenticateToken: verifyFirebaseToken, // Alias for backward compatibility
  requireRole,
  requireAdmin,
  requireClubManager,
  requireCoach,
  requireOwnershipOrAdmin,
  requireClubAccess
};
