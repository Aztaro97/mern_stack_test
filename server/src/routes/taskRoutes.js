/* eslint-env node */
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Apply authentication middleware to all task routes
router.use(protect);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for the authenticated user with optional filtering
 * @access  Private
 * @query   status - Filter by completion status (complete, incomplete)
 * @query   search - Search by title or description
 * @query   priority - Filter by priority (low, medium, high)
 */
router.get('/', async (req, res) => {
  try {
    const { status, search, priority } = req.query;
    const userId = req.user.userId;

    // Build query object
    let query = { userId };

    // Add status filter
    if (status && ['complete', 'incomplete'].includes(status)) {
      query.status = status;
    }

    // Add priority filter
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      query.priority = priority;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    // Calculate counts for frontend filter component
    const allTasks = await Task.find({ userId });
    const counts = {
      all: allTasks.length,
      complete: allTasks.filter(task => task.status === 'complete').length,
      incomplete: allTasks.filter(task => task.status === 'incomplete').length
    };

    res.json({
      success: true,
      data: tasks,
      counts,
      total: tasks.length
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a specific task by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate, progress } = req.body;

    // Input validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    const task = new Task({
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      progress: progress || 0,
      userId: req.user.userId
    });

    const savedTask = await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: savedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, progress } = req.body;

    const task = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update fields if provided
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (progress !== undefined) task.progress = Math.min(Math.max(progress, 0), 100);

    const updatedTask = await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Toggle task completion status
 * @access  Private
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Toggle status
    task.status = task.status === 'complete' ? 'incomplete' : 'complete';
    const updatedTask = await task.save();

    res.json({
      success: true,
      message: `Task marked as ${task.status}`,
      data: updatedTask
    });
  } catch (error) {
    console.error('Toggle task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: task
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/tasks/stats/summary
 * @desc    Get task statistics for the user
 * @access  Private
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.userId;
    
         
     const stats = await Task.aggregate([
       { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'complete'] }, 1, 0] } },
          incomplete: { $sum: { $cond: [{ $eq: ['$status', 'incomplete'] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      completed: 0,
      incomplete: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task statistics',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/tasks/:id/progress
 * @desc    Update task progress
 * @access  Private
 */
router.patch('/:id/progress', async (req, res) => {
  try {
    const { progress } = req.body;

    // Validate progress value
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress must be between 0 and 100'
      });
    }

    const task = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update progress
    task.progress = Math.min(Math.max(progress, 0), 100);
    
    // If progress is 100%, mark as complete
    if (task.progress === 100) {
      task.status = 'complete';
    } else if (task.progress > 0 && task.status === 'complete') {
      // If progress is less than 100% but was complete, mark as incomplete
      task.status = 'incomplete';
    }

    const updatedTask = await task.save();

    res.json({
      success: true,
      message: `Progress updated to ${task.progress}%`,
      data: updatedTask
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error.message
    });
  }
});

module.exports = router; 