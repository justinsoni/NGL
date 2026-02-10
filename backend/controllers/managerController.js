const User = require('../models/User');
const EmailService = require('../utils/emailService');
const { setCustomUserClaims, admin } = require('../config/firebase');

// Initialize email service
const emailService = new EmailService();

// @desc    Create manager account (Admin only)
// @route   POST /api/auth/create-manager
// @access  Private (Admin only)
const createManager = async (req, res) => {
  try {
    const { managerName, managerEmail, clubName, clubId } = req.body;
    const adminUser = req.user; // Set by auth middleware

    // Validate required fields
    if (!managerName || !managerEmail || !clubName) {
      return res.status(400).json({
        success: false,
        message: 'Manager name, email, and club name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(managerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if manager email already exists
    const existingUser = await User.findOne({
      email: managerEmail.toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Check if club already has a manager
    const existingManager = await User.findOne({
      role: 'clubManager',
      club: clubName,
      isActive: true
    });

    if (existingManager) {
      return res.status(409).json({
        success: false,
        message: `${clubName} already has an active manager`
      });
    }

    // Create Firebase user with email and password
    let firebaseUid;
    let passwordResetLink = null;
    const password = EmailService.generateSecurePassword(); // Store password for potential fallback
    try {
      const firebaseUser = await admin.auth().createUser({
        email: managerEmail.toLowerCase(),
        password: password,
        displayName: managerName,
        emailVerified: true
      });
      firebaseUid = firebaseUser.uid;
      console.log('✅ Firebase user created successfully:', firebaseUid);

      // Generate password reset link for first-time setup
      passwordResetLink = await admin.auth().generatePasswordResetLink(managerEmail.toLowerCase());
    } catch (firebaseError) {
      console.error('❌ Firebase user creation failed:', firebaseError.message);

      firebaseUid = `manager_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('⚠️ Using placeholder Firebase UID:', firebaseUid);
    }

    // Create manager user in MongoDB
    const managerData = {
      firebaseUid,
      name: managerName,
      email: managerEmail.toLowerCase(),
      role: 'clubManager',
      club: clubName,
      authMethod: 'email',
      isEmailVerified: true,
      isActive: true,
      profile: {
        position: 'Manager'
      }
    };

    const manager = new User(managerData);
    await manager.save();

    // Set custom claims in Firebase
    try {
      await setCustomUserClaims(firebaseUid, {
        role: 'clubManager',
        club: clubName,
        dbUserId: manager._id.toString()
      });
    } catch (claimsError) {
      console.error('Failed to set custom claims:', claimsError.message);
      // Continue without failing the creation
    }

    // Send email with password reset link
    try {
      const emailResult = await emailService.sendManagerCredentials(
        managerEmail,
        managerName,
        passwordResetLink,
        clubName,
        adminUser.name || 'System Administrator'
      );

      // Return success response (without password)
      const managerResponse = {
        id: manager._id,
        firebaseUid: manager.firebaseUid,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        club: manager.club,
        isActive: manager.isActive,
        createdAt: manager.createdAt,
        canLoginWithFirebase: !manager.firebaseUid.startsWith('manager_') // True if real Firebase user was created
      };

      if (emailResult.success) {
        const emailProvider = emailResult.provider || 'email';
        res.status(201).json({
          success: true,
          message: `Manager account created successfully! Login credentials have been sent via ${emailProvider.toUpperCase()} email.`,
          data: {
            manager: managerResponse,
            emailSent: true,
            emailProvider: emailProvider
          }
        });
      } else {
        // Email service not configured or failed - include credentials in response
        res.status(201).json({
          success: true,
          message: 'Manager account created successfully, but email delivery failed. Please provide credentials manually.',
          data: {
            manager: managerResponse,
            emailSent: false,
            password: password, // Include password when email fails
            credentials: emailResult.credentials || {
              email: managerEmail,
              password: password,
              club: clubName
            }
          }
        });
      }

    } catch (emailError) {
      console.error('Email sending failed:', emailError);

      // Still return success but indicate email failed
      const managerResponse = {
        id: manager._id,
        firebaseUid: manager.firebaseUid,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        club: manager.club,
        isActive: manager.isActive,
        createdAt: manager.createdAt
      };

      res.status(201).json({
        success: true,
        message: 'Manager account created successfully, but email delivery failed. Please provide credentials manually.',
        data: {
          manager: managerResponse,
          emailSent: false,
          password: password, // Include password only if email failed
          credentials: {
            email: managerEmail,
            password: password,
            club: clubName
          }
        }
      });
    }

  } catch (error) {
    console.error('Create manager error:', error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create manager account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all managers
// @route   GET /api/auth/managers
// @access  Private (Admin only)
const getAllManagers = async (req, res) => {
  try {
    const managers = await User.find({
      role: 'clubManager',
      isActive: true
    })
      .select('-__v')
      .sort('-createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: { managers }
    });

  } catch (error) {
    console.error('Get managers error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve managers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get manager by ID
// @route   GET /api/auth/managers/:managerId
// @access  Private (Admin only)
const getManagerById = async (req, res) => {
  try {
    const { managerId } = req.params;

    const manager = await User.findOne({
      _id: managerId,
      role: 'clubManager',
      isActive: true
    })
      .select('-__v')
      .lean();

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { manager }
    });

  } catch (error) {
    console.error('Get manager error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve manager',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update manager
// @route   PUT /api/auth/managers/:managerId
// @access  Private (Admin only)
const updateManager = async (req, res) => {
  try {
    const { managerId } = req.params;
    const updates = req.body;

    const manager = await User.findOne({
      _id: managerId,
      role: 'clubManager',
      isActive: true
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    // Update allowed fields
    if (updates.name) manager.name = updates.name;
    if (updates.club) manager.club = updates.club;
    if (updates.isActive !== undefined) manager.isActive = updates.isActive;

    await manager.save();

    // Update Firebase custom claims if club changed
    if (updates.club) {
      try {
        await setCustomUserClaims(manager.firebaseUid, {
          role: manager.role,
          club: manager.club,
          dbUserId: manager._id.toString()
        });
      } catch (claimsError) {
        console.error('Failed to update custom claims:', claimsError.message);
      }
    }

    const managerResponse = {
      id: manager._id,
      firebaseUid: manager.firebaseUid,
      name: manager.name,
      email: manager.email,
      role: manager.role,
      club: manager.club,
      isActive: manager.isActive,
      updatedAt: manager.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Manager updated successfully',
      data: { manager: managerResponse }
    });

  } catch (error) {
    console.error('Update manager error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update manager',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Deactivate manager
// @route   DELETE /api/auth/managers/:managerId
// @access  Private (Admin only)
const deactivateManager = async (req, res) => {
  try {
    const { managerId } = req.params;

    const manager = await User.findOne({
      _id: managerId,
      role: 'clubManager',
      isActive: true
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    manager.isActive = false;
    await manager.save();

    res.status(200).json({
      success: true,
      message: 'Manager deactivated successfully',
      data: { managerId: manager._id }
    });

  } catch (error) {
    console.error('Deactivate manager error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate manager',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createManager,
  getAllManagers,
  getManagerById,
  updateManager,
  deactivateManager
};