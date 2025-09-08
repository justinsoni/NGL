const Player = require('../models/Player');
const User = require('../models/User');
const Club = require('../models/Club');
const mongoose = require('mongoose');

const registerPlayer = async (req, res) => {
  console.log('Player registration request body:', req.body);
  try {
    // Normalize email
    const email = (req.body.email || '').toLowerCase().trim();

    // Guard: email required
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check duplicates across Player and User collections
    const [existingPlayer, existingUser] = await Promise.all([
      Player.findOne({ email }),
      User.findOne({ email })
    ]);

    if (existingPlayer || existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please use a different email.'
      });
    }

    // Resolve preferred club to a valid ObjectId
    const submittedClubId = req.body.clubId;
    const submittedClubName = req.body.clubName || req.body.preferredClub || req.body.club;

    if (!submittedClubId && !submittedClubName) {
      return res.status(400).json({ success: false, message: 'Preferred club is required' });
    }

    let resolvedClubId = null;
    if (submittedClubId && mongoose.Types.ObjectId.isValid(submittedClubId)) {
      const clubExists = await Club.exists({ _id: submittedClubId });
      if (!clubExists) {
        return res.status(400).json({ success: false, message: 'Selected club does not exist' });
      }
      resolvedClubId = submittedClubId;
    } else if (submittedClubName) {
      const clubDoc = await Club.findOne({ name: submittedClubName.trim() }).select('_id');
      if (!clubDoc) {
        return res.status(400).json({ success: false, message: 'Selected club not found' });
      }
      resolvedClubId = clubDoc._id;
    } else {
      return res.status(400).json({ success: false, message: 'Preferred club is invalid' });
    }

    // Ensure we store normalized email and resolved club id
    req.body.email = email;
    req.body.clubId = resolvedClubId;
    const player = await Player.create(req.body);

    await player.populate('clubId', 'name city');

    res.status(201).json({
      success: true,
      message: 'Player registration submitted successfully',
      data: player
    });
  } catch (error) {
    console.error('Player registration error:', error);
    // Handle duplicate key error from Mongo unique index
    if (error && error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please use a different email.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to register player'
    });
  }
};

const getPendingPlayers = async (req, res) => {
  try {
    const { clubId, clubName } = req.query;
    const filter = { status: 'pending' };

    // Resolve club by id or name
    if (clubId && mongoose.Types.ObjectId.isValid(clubId)) {
      filter.clubId = clubId;
    } else if (clubName) {
      const club = await Club.findOne({ name: clubName.trim() }).select('_id');
      if (club) {
        filter.clubId = club._id;
      }
    }
    
    const players = await Player.find(filter).populate('clubId', 'name city');
    res.json({
      success: true,
      data: players
    });
  } catch (error) {
    console.error('Error fetching pending players:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending players'
    });
  }
};

const approvePlayer = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const player = await Player.findByIdAndUpdate(
      registrationId,
      { status: 'approved', isVerified: true },
      { new: true }
    );
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
    res.json({ success: true, message: 'Player approved', data: player });
  } catch (error) {
    console.error('Error approving player:', error);
    res.status(500).json({ success: false, message: 'Failed to approve player' });
  }
};

const rejectPlayer = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason } = req.body;
    const player = await Player.findByIdAndUpdate(
      registrationId,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
    res.json({ success: true, message: 'Player rejected', data: player });
  } catch (error) {
    console.error('Error rejecting player:', error);
    res.status(500).json({ success: false, message: 'Failed to reject player' });
  }
};

const getApprovedPlayers = async (req, res) => {
  console.log('Fetching approved players with query:', req.query);  
  try {
    const { clubId, clubName } = req.query;
    const filter = { status: 'approved' };
    if (clubId && mongoose.Types.ObjectId.isValid(clubId)) {
      filter.clubId = clubId;
    } else if (clubName) {
      const club = await Club.findOne({ name: clubName.trim() }).select('_id');
      if (club) {
        filter.clubId = club._id;
      }
    }
    const players = await Player.find(filter).populate('clubId', 'name city');
    console.log('Approved players fetched:', players);
    res.json({
      success: true,
      data: players
    });
  } catch (error) {
    console.error('Error fetching approved players:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approved players'
    });
  }
};

module.exports = {
  registerPlayer,
  getPendingPlayers,
  approvePlayer,
  rejectPlayer,
  getApprovedPlayers
};