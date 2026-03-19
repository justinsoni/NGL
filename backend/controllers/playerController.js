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

    // Resolve preferred club if provided, otherwise null (Free Agent/General Pool)
    const submittedClubId = req.body.clubId;
    const submittedClubName = req.body.clubName || req.body.preferredClub || req.body.club;

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
    }
    // If neither matching ID nor Name is provided, resolvedClubId remains null

    // Ensure we store normalized email and resolved club id
    req.body.email = email;
    req.body.clubId = resolvedClubId;
    const player = await Player.create({
      ...req.body,
      documentVerification: { status: 'pending' },
      isVerified: false
    });

    await player.populate('clubId', 'name city logo');

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

    const players = await Player.find(filter).populate('clubId', 'name city logo');

    // If checking for a specific club, strictly filter. 
    // If general view (no club params), show all including those with null clubId.
    let filtered = players;
    if (clubId || clubName) {
      filtered = players.filter(p => !!p.clubId);
    }

    res.json({
      success: true,
      data: filtered
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
      {
        status: 'approved',
        isVerified: true,
        documentVerification: {
          status: 'verified',
          method: 'manual',
          verifiedAt: new Date(),
          verifiedBy: req.user ? req.user._id : undefined
        },
        reviewedAt: new Date(),
        reviewedBy: req.user ? req.user._id : undefined
      },
      { new: true }
    );
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    // If player has no clubId and approver is a club manager, assign to their club
    if (!player.clubId && req.user && (req.user.role === 'clubManager' || req.user.role === 'coach') && req.user.club) {
      const club = await Club.findOne({ name: req.user.club }).select('_id');
      if (club) {
        player.clubId = club._id;
        await player.save();
      }
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
      {
        status: 'rejected',
        rejectionReason: reason,
        documentVerification: {
          status: 'rejected',
          method: 'manual',
          verifiedAt: new Date(),
          verifiedBy: req.user ? req.user._id : undefined,
          notes: reason
        },
        reviewedAt: new Date(),
        reviewedBy: req.user ? req.user._id : undefined
      },
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
    const players = await Player.find(filter).populate('clubId', 'name city logo');
    console.log('Approved players fetched:', players.length);
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

const updatePlayer = async (req, res) => {
  try {
    const { playerId } = req.params;
    const updates = { ...req.body };
    // Prevent status edits here; approvals flow controls it
    delete updates.status;
    delete updates.reviewedAt;
    delete updates.reviewedBy;
    // Prevent clubId reassignment via name without validation
    if (updates.clubName) delete updates.clubName;

    const player = await Player.findByIdAndUpdate(playerId, updates, { new: true });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
    res.json({ success: true, message: 'Player updated', data: player });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ success: false, message: 'Failed to update player' });
  }
};

// Document verification endpoints
const verifyDocuments = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { method = 'manual', notes, aiScore } = req.body || {};
    const updates = {
      documentVerification: {
        status: 'verified',
        method,
        verifiedAt: new Date(),
        verifiedBy: req.user ? req.user._id : undefined,
        notes,
        aiScore
      },
      isVerified: true
    };
    const player = await Player.findByIdAndUpdate(playerId, updates, { new: true });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
    res.json({ success: true, message: 'Documents verified', data: player });
  } catch (error) {
    console.error('Error verifying documents:', error);
    res.status(500).json({ success: false, message: 'Failed to verify documents' });
  }
};

const unverifyDocuments = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { reason } = req.body || {};
    const updates = {
      documentVerification: {
        status: 'rejected',
        method: 'manual',
        verifiedAt: new Date(),
        verifiedBy: req.user ? req.user._id : undefined,
        notes: reason || 'Unverified by manager'
      },
      isVerified: false
    };
    const player = await Player.findByIdAndUpdate(playerId, updates, { new: true });
    if (!player) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
    res.json({ success: true, message: 'Documents marked as rejected', data: player });
  } catch (error) {
    console.error('Error rejecting documents:', error);
    res.status(500).json({ success: false, message: 'Failed to update document verification' });
  }
};

const deletePlayer = async (req, res) => {
  try {
    const { playerId } = req.params;
    const deleted = await Player.findByIdAndDelete(playerId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
    res.json({ success: true, message: 'Player removed' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ success: false, message: 'Failed to delete player' });
  }
};

const recruitPlayer = async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Sanitize input to avoid conflicts during save
    const playerData = { ...req.body };
    delete playerData._id;
    delete playerData.__v;
    delete playerData.status;
    delete playerData.reviewedAt;
    delete playerData.reviewedBy;
    delete playerData.documentVerification;

    // Check for existing player prioritizing recruitable one (no club) if multiple exist
    let existingPlayer = await Player.findOne({ email, clubId: null });
    if (!existingPlayer) {
      existingPlayer = await Player.findOne({ email });
    }
    const existingUser = await User.findOne({ email });

    // If player exists but has no club, we can "recruit" them by updating their record
    if (existingPlayer && !existingPlayer.clubId) {
      const updatedPlayer = await Player.findByIdAndUpdate(
        existingPlayer._id,
        {
          ...playerData,
          email, // Keep normalized email
          status: 'approved',
          isVerified: true,
          documentVerification: {
            status: 'verified',
            method: 'manual',
            verifiedAt: new Date(),
            verifiedBy: req.user ? req.user._id : undefined,
            notes: 'Recruited directly (updated existing registrant)'
          }
        },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: 'Existing player record updated and added to your squad',
        data: updatedPlayer
      });
    }

    // Conflict Detection
    if (existingPlayer && existingPlayer.clubId) {
      // If the player is already in THIS manager's club, it's a success (or a no-op)
      if (existingPlayer.clubId.toString() === req.body.clubId?.toString()) {
        return res.status(200).json({
          success: true,
          message: 'This player is already in your club squad.',
          data: existingPlayer
        });
      }

      return res.status(409).json({
        success: false,
        message: 'A player with this email already belongs to another club. Multiple club memberships are not permitted.'
      });
    }

    // If we have a user record but no player record, that's fine—we can create the player profile.
    // However, if they are already a manager or admin, it might be a mistake, but we'll allow it 
    // for now or you could add a check here if needed.
    if (existingUser && !existingPlayer) {
      console.log(`User exists for ${email} but no player profile found. Creating one...`);
    }

    // Direct recruitment as a new record
    const player = await Player.create({
      ...playerData,
      email,
      status: 'approved',
      isVerified: true,
      documentVerification: {
        status: 'verified',
        method: 'manual',
        verifiedAt: new Date(),
        verifiedBy: req.user ? req.user._id : undefined,
        notes: 'Recruited directly by club manager'
      },
      reviewedAt: new Date(),
      reviewedBy: req.user ? req.user._id : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Player recruited successfully',
      data: player
    });
  } catch (error) {
    console.error('Direct recruitment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recruit player'
    });
  }
};

const recruitProspect = async (req, res) => {
  try {
    const { prospectId, clubId } = req.body;
    if (!prospectId || !clubId) {
      return res.status(400).json({ success: false, message: 'ID and Club ID required' });
    }

    // 1. Check if it's a real player registration (priority)
    const player = await Player.findById(prospectId);
    if (player) {
      if (player.clubId) {
        return res.status(400).json({ success: false, message: 'Player already has a club assigned' });
      }

      player.clubId = clubId;
      player.status = 'approved';
      player.isVerified = true;
      player.documentVerification = {
        status: 'verified',
        method: 'scouted',
        verifiedAt: new Date(),
        verifiedBy: req.user ? req.user._id : undefined,
        notes: 'Recruited from scouting pool (registrant)'
      };

      await player.save();
      return res.status(200).json({
        success: true,
        message: 'Player successfully added to your squad!',
        data: player
      });
    }

    // 2. Fallback: Check if it's a mock Prospect (for AI Advisor recommendations)
    const Prospect = require('../models/Prospect');
    const prospect = await Prospect.findById(prospectId);

    if (prospect) {
      // Check if real player with this email already exists
      const existingPlayer = await Player.findOne({ email: prospect.email });
      if (existingPlayer) {
        return res.status(409).json({ success: false, message: 'A player with this email is already registered' });
      }

      const pData = prospect.toObject();
      delete pData._id;
      delete pData.rejectedBy;
      delete pData.__v;
      delete pData.createdAt;
      delete pData.updatedAt;

      // Ensure required player fields are present (mock data might be incomplete)
      const newPlayer = await Player.create({
        ...pData,
        phone: pData.phone || '0000000000', // Default if missing in mock
        identityCardUrl: pData.identityCardUrl || 'https://via.placeholder.com/150',
        dob: pData.dob || new Date('2000-01-01'),
        clubId,
        status: 'approved',
        isVerified: true,
        documentVerification: {
          status: 'verified',
          method: 'scouted',
          verifiedAt: new Date(),
          verifiedBy: req.user ? req.user._id : undefined,
          notes: 'Scouted from mock prospect pool'
        }
      });
      return res.status(201).json({ success: true, message: 'Prospect successfully recruited!', data: newPlayer });
    }

    return res.status(404).json({ success: false, message: 'Candidate not found in registry' });
  } catch (error) {
    console.error('Recruitment process error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during recruitment',
      error: error.message
    });
  }
};

module.exports = {
  registerPlayer,
  getPendingPlayers,
  approvePlayer,
  rejectPlayer,
  getApprovedPlayers,
  updatePlayer,
  recruitPlayer,
  recruitProspect,
  deletePlayer,
  verifyDocuments,
  unverifyDocuments
};