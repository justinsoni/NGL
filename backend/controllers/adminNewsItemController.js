const NewsItem = require('../models/NewsItem');
const { validationResult } = require('express-validator');

// @desc    Create new news item
// @route   POST /api/news
// @access  Private (Admin and Club Manager)
const createNewsItem = async (req, res) => {
  try {
    // Add author and club information from the authenticated user
    const newsData = {
      ...req.body,
      author: req.user.name || req.user.email,
      club: req.user.club || null
    };

    const newsItem = await NewsItem.create(newsData);

    res.status(201).json({
      success: true,
      message: 'News item created successfully',
      data: newsItem
    });
  } catch (error) {
    console.error('Create news item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create news item'
    });
  }
};


const updateNewsItem = async (req, res) => {
  try {
    // Add author and club information from the authenticated user
    const updateData = {
      ...req.body,
      author: req.user.name || req.user.email,
      club: req.user.club || null
    };

    const newsItem = await NewsItem.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!newsItem) {
      return res.status(404).json({
        success: false,
        message: 'News item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'News item updated successfully',
      data: newsItem
    });
  } catch (error) {
    console.error('Update news item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update news item'
    });
  }
};

const deleteNewsItem = async (req, res) => {
  try {
    const newsItem = await NewsItem.findByIdAndDelete(req.params.id);

    if (!newsItem) {
      return res.status(404).json({
        success: false,
        message: 'News item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'News item deleted successfully',
      data: newsItem
    });
  } catch (error) {
    console.error('Delete news item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete news item'
    });
  }
};

// @desc    Get all news items sorted by creation date
// @route   GET /api/news
// @access  Public or Private (set as needed)
const getAllNewsItems = async (req, res) => {
  try {
    // Support filtering by type and category
    const { type, category, club } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (club) filter.club = club;
    
    const newsItems = await NewsItem.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: newsItems
    });
  } catch (error) {
    console.error('Fetch news items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news items'
    });
  }
};


const getNewsItemById = async (req, res) => {
  try {
    const newsItem = await NewsItem.findById(req.params.id);

    if (!newsItem) {
      return res.status(404).json({
        success: false,
        message: 'News item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: newsItem
    });
  } catch (error) {
    console.error('Fetch news items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news items'
    });
  }
};


module.exports = {
  createNewsItem,
  getAllNewsItems,
  getNewsItemById,
  updateNewsItem,
  deleteNewsItem,
};