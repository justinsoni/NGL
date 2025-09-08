const User = require('../models/User');
const { validationResult } = require('express-validator');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const EmailService = require('../utils/emailService');
const crypto = require('crypto');

// Generate a secure random password
const generatePassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// @desc    Create coach account (Club Manager only)
// @route   POST /api/auth/create-coach
// @access  Private (Club Manager only)
const createCoach = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      clubId,
      dateOfBirth,
      nationality,
      bio,
      coachingLicense,
      licenseExpiryDate,
      specializations,
      languages,
      yearsOfExperience,
      position,
      contractStartDate,
      contractEndDate,
      salary,
      previousClubs,
      trophies,
      documents
    } = req.body;
    
    const managerUser = req.user; // Set by auth middleware

    // Validate required fields
    if (!name || !email || !phone || !clubId) {
      return res.status(400).json({
        success: false,
        message: 'Coach name, email, phone, and club ID are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Generate a secure password for the coach
    const temporaryPassword = generatePassword();

    let firebaseUser = null;

    try {
      // Create Firebase user
      const auth = getAuth();
      firebaseUser = await auth.createUser({
        email: email.toLowerCase(),
        password: temporaryPassword,
        displayName: name,
        emailVerified: false
      });

      console.log('✅ Firebase user created:', firebaseUser.uid);

      // Create MongoDB user record
      const coachData = {
        firebaseUid: firebaseUser.uid,
        name,
        email: email.toLowerCase(),
        role: 'coach',
        club: clubId,
        isActive: true,
        authMethod: 'email',
        profile: {
          phone,
          dateOfBirth,
          nationality,
          bio,
          coachingLicense,
          licenseExpiryDate,
          specializations,
          languages,
          yearsOfExperience,
          position,
          contractStartDate,
          contractEndDate,
          salary,
          previousClubs: previousClubs || [],
          trophies: trophies || [],
          documents: documents || []
        },
        createdBy: managerUser.id,
        createdAt: new Date()
      };

      const coach = await User.create(coachData);
      console.log('✅ MongoDB coach record created:', coach._id);

      // Send welcome email with login credentials
      try {
        const emailService = new EmailService();
        await emailService.sendCoachWelcomeEmail(
          email,
          name,
          temporaryPassword,
          clubId
        );
        console.log('✅ Welcome email sent to coach');
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError.message);
        // Don't fail the entire operation if email fails
      }

      // Return success response (don't include password in response)
      const responseData = {
        id: coach._id,
        firebaseUid: coach.firebaseUid,
        name: coach.name,
        email: coach.email,
        role: coach.role,
        club: coach.club,
        profile: coach.profile,
        createdAt: coach.createdAt
      };

      res.status(201).json({
        success: true,
        message: 'Coach account created successfully. Login credentials have been sent to their email.',
        data: { coach: responseData }
      });

    } catch (mongoError) {
      console.error('❌ MongoDB coach creation failed:', mongoError.message);

      // If MongoDB creation fails but Firebase user was created, clean up Firebase user
      if (firebaseUser) {
        try {
          const auth = getAuth();
          await auth.deleteUser(firebaseUser.uid);
          console.log('🧹 Cleaned up Firebase user after MongoDB failure');
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup Firebase user:', cleanupError.message);
        }
      }

      // Provide specific error messages for validation errors
      if (mongoError.name === 'ValidationError') {
        const validationErrors = Object.values(mongoError.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: `Validation failed: ${validationErrors.join(', ')}`
        });
      }

      throw mongoError;
    }

  } catch (error) {
    console.error('❌ Create coach error:', error);
    
    // Provide specific error messages for common issues
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format'
      });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        success: false,
        message: 'Password is too weak'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create coach account. Please try again.'
    });
  }
};

module.exports = {
  createCoach
};
