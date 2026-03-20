const Media = require('../models/Media');

// @desc    Get all media
// @route   GET /api/media
// @access  Public
exports.getMedia = async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: media.length,
      data: media
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Create new media
// @route   POST /api/media
// @access  Private/Admin
exports.addMedia = async (req, res) => {
  try {
    const { title, youtubeUrl, thumbnailUrl, category } = req.body;

    if (!title || !youtubeUrl || !thumbnailUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const media = await Media.create({
      title,
      youtubeUrl,
      thumbnailUrl,
      category: category || 'Other'
    });

    res.status(201).json({
      success: true,
      data: media
    });
  } catch (error) {
    console.error('Error adding media:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update media
// @route   PUT /api/media/:id
// @access  Private/Admin
exports.updateMedia = async (req, res) => {
  try {
    const media = await Media.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    res.status(200).json({ success: true, data: media });
  } catch (error) {
    console.error('Error updating media:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete media
// @route   DELETE /api/media/:id
// @access  Private/Admin
exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.findByIdAndDelete(req.params.id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
