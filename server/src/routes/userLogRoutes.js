/* eslint-env node */
const express = require('express');
const router = express.Router();
const UserLog = require('../models/UserLog');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(adminOnly);

/**
 * @route   GET /api/admin/user-logs
 * @desc    Get all user logs with filtering and pagination
 * @access  Admin only
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20)
 * @query   action - Filter by action (login, logout, failed_login)
 * @query   role - Filter by user role (user, admin)
 * @query   email - Filter by user email
 * @query   startDate - Filter from date (ISO string)
 * @query   endDate - Filter to date (ISO string)
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      role,
      email,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    let query = {};

    // Add filters
    if (action) query.action = action;
    if (role) query.role = role;
    if (email) query.email = { $regex: email, $options: 'i' };

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [logs, totalCount] = await Promise.all([
      UserLog.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'fullName email role')
        .lean(),
      UserLog.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: logs,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        action,
        role,
        email,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Get user logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user logs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/user-logs/stats
 * @desc    Get user log statistics
 * @access  Admin only
 */
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const stats = await UserLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          totalLogins: { $sum: { $cond: [{ $eq: ['$action', 'login'] }, 1, 0] } },
          totalLogouts: { $sum: { $cond: [{ $eq: ['$action', 'logout'] }, 1, 0] } },
          failedLogins: { $sum: { $cond: [{ $eq: ['$action', 'failed_login'] }, 1, 0] } },
          adminLogs: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          userLogs: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } },
          averageSessionDuration: { 
            $avg: { 
              $cond: [
                { $and: [{ $ne: ['$sessionDuration', null] }, { $gt: ['$sessionDuration', 0] }] },
                '$sessionDuration',
                null
              ]
            }
          }
        }
      }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await UserLog.find({
      createdAt: { $gte: sevenDaysAgo },
      ...dateFilter
    }).countDocuments();

    const result = stats[0] || {
      totalLogs: 0,
      totalLogins: 0,
      totalLogouts: 0,
      failedLogins: 0,
      adminLogs: 0,
      userLogs: 0,
      averageSessionDuration: 0
    };

    result.recentActivity = recentActivity;

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get user log stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user log statistics',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/user-logs/:id
 * @desc    Delete a specific user log
 * @access  Admin only
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedLog = await UserLog.findByIdAndDelete(id);

    if (!deletedLog) {
      return res.status(404).json({
        success: false,
        message: 'User log not found'
      });
    }

    res.json({
      success: true,
      message: 'User log deleted successfully',
      data: deletedLog
    });
  } catch (error) {
    console.error('Delete user log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user log',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/user-logs
 * @desc    Delete multiple user logs
 * @access  Admin only
 */
router.delete('/', async (req, res) => {
  try {
    const { ids, filters } = req.body;

    let deleteQuery = {};

    if (ids && Array.isArray(ids) && ids.length > 0) {
      // Delete specific logs by IDs
      deleteQuery._id = { $in: ids };
    } else if (filters) {
      // Delete logs based on filters
      if (filters.action) deleteQuery.action = filters.action;
      if (filters.role) deleteQuery.role = filters.role;
      if (filters.email) deleteQuery.email = { $regex: filters.email, $options: 'i' };
      if (filters.startDate || filters.endDate) {
        deleteQuery.createdAt = {};
        if (filters.startDate) deleteQuery.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) deleteQuery.createdAt.$lte = new Date(filters.endDate);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either ids array or filters object is required'
      });
    }

    const result = await UserLog.deleteMany(deleteQuery);

    res.json({
      success: true,
      message: `${result.deletedCount} user logs deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete user logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user logs',
      error: error.message
    });
  }
});

module.exports = router; 