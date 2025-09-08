const User = require('../models/User');
const { setCustomUserClaims } = require('../config/firebase');

// @desc    Register new user profile
// @route   POST /api/auth/register
// @access  Public (but requires Firebase authentication)
const registerUser = async (req, res) => {
  try {
    const { firebaseUid, name, email, role = 'registeredUser', club, authMethod = 'email' } = req.body;

    // Validate required fields
    if (!firebaseUid || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID, name, and email are required'
      });
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'clubManager', 'coach', 'registeredUser', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: admin, manager, clubManager, coach, registeredUser, user'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ firebaseUid }, { email: email.toLowerCase() }] 
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this Firebase UID or email'
      });
    }

    // Create new user profile
    const userData = {
      firebaseUid,
      name,
      email: email.toLowerCase(),
      role,
      authMethod,
      isEmailVerified: true, // Assuming Firebase handles email verification
      isActive: true
    };

    // Add club if provided and role requires it
    if (club && (role === 'manager' || role === 'coach')) {
      userData.club = club;
    }

    const user = new User(userData);
    await user.save();

    // Set custom claims in Firebase for role-based access
    try {
      await setCustomUserClaims(firebaseUid, {
        role: user.role,
        club: user.club || null,
        dbUserId: user._id.toString()
      });
    } catch (claimsError) {
      console.error('Failed to set custom claims:', claimsError.message);
      // Continue without failing the registration
    }

    // Return user profile without sensitive data
    const userResponse = {
      id: user._id,
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
      role: user.role,
      club: user.club,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User profile created successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Registration error:', error.message);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email or Firebase UID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = req.user; // Set by auth middleware

    // Return user profile with additional computed fields
    const userProfile = {
      id: user._id,
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
      role: user.role,
      club: user.club,
      profile: user.profile,
      programRegistrations: user.programRegistrations,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      displayName: user.displayName
    };

    res.status(200).json({
      success: true,
      data: { user: userProfile }
    });

  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;

    // Check if role update is attempted
    if (updates.role && updates.role !== user.role) {
      // Only admins can change roles
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can change user roles'
        });
      }
    }

    // Prevent users from changing their own admin status
    if (updates.role && user.role === 'admin' && updates.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove admin role from yourself'
      });
    }

    // Handle nested profile updates
    if (updates.profile) {
      user.profile = { ...user.profile, ...updates.profile };
      delete updates.profile;
    }

    // Apply other updates
    Object.keys(updates).forEach(key => {
      if (key !== 'firebaseUid' && key !== '_id' && key !== 'createdAt') {
        user[key] = updates[key];
      }
    });

    await user.save();

    // Update Firebase custom claims if role or club changed
    if (updates.role || updates.club) {
      try {
        await setCustomUserClaims(user.firebaseUid, {
          role: user.role,
          club: user.club || null,
          dbUserId: user._id.toString()
        });
      } catch (claimsError) {
        console.error('Failed to update custom claims:', claimsError.message);
        // Continue without failing the update
      }
    }

    // Return updated profile
    const updatedProfile = {
      id: user._id,
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
      role: user.role,
      club: user.club,
      profile: user.profile,
      isActive: user.isActive,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedProfile }
    });

  } catch (error) {
    console.error('Update profile error:', error.message);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', search, role, club } = req.query;

    // Build query
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (club) query.club = club;

    // Execute query with pagination
    const users = await User.find(query)
      .select('-__v')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/auth/users/:userId/role
// @access  Private (Admin only)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, club } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent removing admin role from the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the last admin user'
        });
      }
    }

    user.role = role;
    if (club) user.club = club;

    await user.save();

    // Update Firebase custom claims
    try {
      await setCustomUserClaims(user.firebaseUid, {
        role: user.role,
        club: user.club || null,
        dbUserId: user._id.toString()
      });
    } catch (claimsError) {
      console.error('Failed to update custom claims:', claimsError.message);
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: { user: { id: user._id, role: user.role, club: user.club } }
    });

  } catch (error) {
    console.error('Update user role error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check if user signed up with Google
const checkAuthMethod = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        // Find user in database
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found',
                isGoogleUser: null, // null indicates unknown - frontend should check Firebase
                userNotFound: true
            });
        }

        // Check if user signed up with Google
        const isGoogleUser = user.authMethod === 'google';

        return res.status(200).json({
            success: true,
            isGoogleUser,
            message: isGoogleUser ? 'User signed up with Google' : 'User signed up with email/password'
        });

    } catch (error) {
        console.error('Error checking auth method:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            isGoogleUser: false
        });
    }
};

// Check if user exists by email
const checkUserExists = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        // Find user in database
        const user = await User.findOne({ email: email.toLowerCase() });

        return res.status(200).json({
            success: true,
            exists: !!user,
            message: user ? 'User exists' : 'User not found'
        });

    } catch (error) {
        console.error('Error checking user existence:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            exists: false
        });
    }
};

module.exports = {
  registerUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
  checkAuthMethod,
  checkUserExists
};
