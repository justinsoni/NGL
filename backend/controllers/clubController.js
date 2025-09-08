const Club = require('../models/Club');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all clubs
// @route   GET /api/clubs
// @access  Public
const getClubs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, city } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { city: regex },
        { stadium: regex }
      ];
    }
    
    if (city) {
      query.city = new RegExp(city, 'i');
    }
    
    // Execute query with pagination
    const clubs = await Club.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Club.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: clubs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get clubs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clubs'
    });
  }
};

// @desc    Get single club
// @route   GET /api/clubs/:id
// @access  Public
const getClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: club
    });
  } catch (error) {
    console.error('Get club error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club'
    });
  }
};

// @desc    Create new club
// @route   POST /api/clubs
// @access  Private (Admin only)
const createClub = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Check if club name already exists
    const existingClub = await Club.findOne({ 
      name: new RegExp(`^${req.body.name}$`, 'i') 
    });
    
    if (existingClub) {
      return res.status(409).json({
        success: false,
        message: 'A club with this name already exists'
      });
    }
    
    // Create club
    const clubData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const club = await Club.create(clubData);
    
    // Populate the created club
    await club.populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      data: club
    });
  } catch (error) {
    console.error('Create club error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create club'
    });
  }
};

// @desc    Update club
// @route   PUT /api/clubs/:id
// @access  Private (Admin only)
const updateClub = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check if new name conflicts with existing club
    if (req.body.name && req.body.name !== club.name) {
      const existingClub = await Club.findOne({ 
        name: new RegExp(`^${req.body.name}$`, 'i'),
        _id: { $ne: req.params.id }
      });
      
      if (existingClub) {
        return res.status(409).json({
          success: false,
          message: 'A club with this name already exists'
        });
      }
    }
    
    // Update club
    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      message: 'Club updated successfully',
      data: updatedClub
    });
  } catch (error) {
    console.error('Update club error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update club'
    });
  }
};

// @desc    Delete club (hard delete)
// @route   DELETE /api/clubs/:id
// @access  Private (Admin only)
const deleteClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Hard delete - permanently remove from database
    await Club.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Club permanently deleted from database'
    });
  } catch (error) {
    console.error('Delete club error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete club'
    });
  }
};

// @desc    Get club statistics
// @route   GET /api/clubs/stats
// @access  Public
const getClubStats = async (req, res) => {
  try {
    const stats = await Club.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalClubs: { $sum: 1 },
          avgFounded: { $avg: '$founded' },
          totalHonours: {
            $sum: {
              $sum: '$honours.count'
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {}
      }
    });
  } catch (error) {
    console.error('Get club stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club statistics'
    });
  }
};

module.exports = {
  getClubs,
  getClub,
  createClub,
  updateClub,
  deleteClub,
  getClubStats
};
