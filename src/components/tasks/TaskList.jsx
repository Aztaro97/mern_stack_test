/**
 * TaskList Component
 * 
 * A comprehensive task management component that displays tasks in a dropdown from the navbar.
 * Implements full CRUD functionality with server API integration and proper authentication.
 * 
 * Features:
 * - Server API integration for real-time task management
 * - Task creation, editing, completion toggle, and deletion
 * - Authentication-aware functionality
 * - Loading, error, and empty states with appropriate UI feedback
 * - Task creation modal integration
 * 
 * @author Senior Full-Stack Engineer
 * @version 2.0.0
 */

import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaCheck, FaEdit, FaExclamationTriangle, FaFlag, FaPlus, FaSpinner, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { taskAPI } from '../../utils/api';
import CreateTaskModal from '../user/CreateTaskModal';

const TaskList = () => {
  // State management with proper initialization
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const { isAuthenticated } = useAuth();

  /**
   * Load tasks from server API
   */
  const loadTasks = async () => {
    if (!isAuthenticated) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await taskAPI.getTasks();
      
      if (response.success) {
        setTasks(response.data);
      } else {
        throw new Error(response.message || 'Failed to load tasks');
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks. Please try again later.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load tasks on component mount and when authentication status changes
   */
  useEffect(() => {
    loadTasks();
  }, [isAuthenticated]);

  /**
   * Toggle task completion status
   * 
   * @param {string} taskId - ID of the task to update
   */
  const handleStatusChange = async (taskId) => {
    setActionLoading(prev => ({ ...prev, [taskId]: true }));
    
    try {
      const response = await taskAPI.toggleTaskStatus(taskId);
      
      if (response.success) {
        // Update local state optimistically
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task._id === taskId 
              ? { ...task, status: response.data.status }
              : task
          )
        );
      } else {
        throw new Error(response.message || 'Failed to update task status');
      }
    } catch (err) {
      console.error('Error toggling task status:', err);
      setError(err.message || 'Failed to update task status');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  /**
   * Delete a task
   * 
   * @param {string} taskId - ID of the task to delete
   */
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [`delete_${taskId}`]: true }));
    
    try {
      const response = await taskAPI.deleteTask(taskId);
      
      if (response.success) {
        // Remove task from local state
        setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
      } else {
        throw new Error(response.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_${taskId}`]: false }));
    }
  };

  /**
   * Initialize task editing mode
   * 
   * @param {Object} task - Task object to edit
   */
  const startEditing = (task) => {
    setEditingTask(task._id);
    setEditForm({
      title: task.title,
      description: task.description
    });
  };

  /**
   * Handle form input changes
   * 
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Save edited task
   * 
   * @param {string} taskId - ID of the task being edited
   */
  const saveTask = async (taskId) => {
    // Form validation
    if (!editForm.title.trim()) {
      setError('Task title cannot be empty');
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [`edit_${taskId}`]: true }));

    try {
      const response = await taskAPI.updateTask(taskId, {
        title: editForm.title.trim(),
        description: editForm.description.trim()
      });
      
      if (response.success) {
        // Update local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task._id === taskId 
              ? { ...task, ...response.data }
              : task
          )
        );
        
        // Exit editing mode
        setEditingTask(null);
        setEditForm({ title: '', description: '' });
      } else {
        throw new Error(response.message || 'Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
    } finally {
      setActionLoading(prev => ({ ...prev, [`edit_${taskId}`]: false }));
    }
  };

  /**
   * Cancel editing mode
   */
  const cancelEditing = () => {
    setEditingTask(null);
    setEditForm({ title: '', description: '' });
  };

  /**
   * Handle task creation success
   */
  const handleTaskCreated = () => {
    // Reload tasks to show the new task
    loadTasks();
  };

  /**
   * Format date for display
   * 
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = date - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays === -1) return 'Yesterday';
      if (diffDays > 1) return `In ${diffDays} days`;
      if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
      
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  /**
   * Get priority styling classes
   * 
   * @param {string} priority - Task priority
   * @returns {string} CSS classes for priority styling
   */
  const getPriorityClasses = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Show authentication message if not logged in
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Please log in to view your tasks</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center" aria-live="polite" role="status">
        <FaSpinner className="animate-spin text-blue-500 text-lg" aria-hidden="true" />
        <span className="ml-2 text-sm">Loading tasks...</span>
      </div>
    );
  }

  // Error state with retry option
  if (error && tasks.length === 0) {
    return (
      <div className="p-4 text-red-500" aria-live="assertive" role="alert">
        <div className="flex items-center mb-2">
          <FaExclamationTriangle className="mr-2" aria-hidden="true" />
          <span className="text-sm">{error}</span>
        </div>
        <button
          onClick={loadTasks}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with create button */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">My Tasks</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <FaPlus className="mr-1" size={12} />
          Add Task
        </button>
      </div>

      {/* Error message for actions */}
      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Task list */}
      <div className="max-h-96 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">No tasks found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
            >
              Create your first task
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <li key={task._id} className="p-4 hover:bg-gray-50">
                {editingTask === task._id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="title"
                      value={editForm.title}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Task title"
                    />
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Task description"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={cancelEditing}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                        disabled={actionLoading[`edit_${task._id}`]}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveTask(task._id)}
                        disabled={actionLoading[`edit_${task._id}`] || !editForm.title.trim()}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
                      >
                        {actionLoading[`edit_${task._id}`] ? (
                          <FaSpinner className="animate-spin mr-1" size={10} />
                        ) : (
                          <FaCheck className="mr-1" size={10} />
                        )}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <button
                          onClick={() => handleStatusChange(task._id)}
                          disabled={actionLoading[task._id]}
                          className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            task.status === 'complete'
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          } disabled:opacity-50`}
                          aria-label={`Mark task as ${task.status === 'complete' ? 'incomplete' : 'complete'}`}
                        >
                          {actionLoading[task._id] ? (
                            <FaSpinner className="animate-spin" size={8} />
                          ) : (
                            task.status === 'complete' && '✓'
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium ${
                            task.status === 'complete' ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </h4>
                          <p className={`text-xs mt-1 ${
                            task.status === 'complete' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {task.description}
                          </p>
                          
                          {/* Task metadata */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {task.priority && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityClasses(task.priority)}`}>
                                <FaFlag className="mr-1" size={8} />
                                {task.priority}
                              </span>
                            )}
                            
                            {task.dueDate && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 border border-blue-200">
                                <FaCalendarAlt className="mr-1" size={8} />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => startEditing(task)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          aria-label="Edit task"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          disabled={actionLoading[`delete_${task._id}`]}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          aria-label="Delete task"
                        >
                          {actionLoading[`delete_${task._id}`] ? (
                            <FaSpinner className="animate-spin" size={12} />
                          ) : (
                            <FaTrash size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};

export default TaskList;
