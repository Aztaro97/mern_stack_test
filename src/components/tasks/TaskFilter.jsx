/**
 * TaskFilter Component
 * 
 * A comprehensive task filtering component that allows users to filter tasks
 * by completion status and search by title. Connects to the backend API
 * for real-time task management with proper authentication.
 * 
 * Features:
 * - Filter tasks by completion status (All/Complete/Incomplete)
 * - Search tasks by title with real-time results
 * - Server API integration with authentication
 * - Responsive design with mobile optimization
 * - Accessibility support with ARIA attributes
 * 
 * @author Senior Full-Stack Engineer
 * @version 2.0.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FaExclamationTriangle, FaFilter, FaSearch, FaSpinner, FaTasks } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { taskAPI } from '../../utils/api';

const TaskFilter = () => {
  // State management with proper initialization
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [counts, setCounts] = useState({
    all: 0,
    complete: 0,
    incomplete: 0
  });

  const { isAuthenticated } = useAuth();

  /**
   * Load tasks from server API
   */
  const loadTasks = useCallback(async (currentFilters = filters) => {
    if (!isAuthenticated) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await taskAPI.getTasks(currentFilters);
      
      if (response.success) {
        setTasks(response.data);
        setCounts(response.counts);
      } else {
        throw new Error(response.message || 'Failed to load tasks');
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err.message || 'Failed to load tasks. Please try again later.');
      setTasks([]);
      setCounts({ all: 0, complete: 0, incomplete: 0 });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters]);

  /**
   * Load tasks on component mount and when authentication status changes
   */
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  /**
   * Handle filter changes
   * 
   * @param {string} filterType - Type of filter to change
   * @param {string} value - New filter value
   */
  const handleFilterChange = async (filterType, value) => {
    const newFilters = {
      ...filters,
      [filterType]: value
    };
    
    setFilters(newFilters);
    
    // Reload tasks with new filters
    await loadTasks(newFilters);
  };

  /**
   * Handle task status toggle
   * 
   * @param {string} taskId - ID of the task to toggle
   */
  const handleToggleStatus = async (taskId) => {
    try {
      const response = await taskAPI.toggleTaskStatus(taskId);
      
      if (response.success) {
        // Reload tasks to reflect the change
        await loadTasks();
      } else {
        throw new Error(response.message || 'Failed to update task status');
      }
    } catch (err) {
      console.error('Error toggling task status:', err);
      setError(err.message || 'Failed to update task status');
    }
  };

  /**
   * Reset filters to default values
   */
  const resetFilters = async () => {
    const defaultFilters = { status: 'all', search: '' };
    setFilters(defaultFilters);
    await loadTasks(defaultFilters);
  };

  // Show authentication message if not logged in
  if (!isAuthenticated) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center py-8 text-gray-500">
          <FaTasks className="mx-auto text-4xl mb-4" />
          <p>Please log in to view and filter your tasks.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-center items-center py-8" aria-live="polite" role="status">
          <FaSpinner className="animate-spin text-blue-500 text-2xl" aria-hidden="true" />
          <span className="ml-2">Loading tasks...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-red-500 flex items-center py-8" aria-live="assertive" role="alert">
          <FaExclamationTriangle className="mr-2" aria-hidden="true" />
          <div>
            <p>{error}</p>
            <button
              onClick={() => loadTasks()}
              className="mt-2 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
        <FaTasks className="mr-2" aria-hidden="true" />
        Task Filter
      </h2>
      
      <div className="mb-6 space-y-4">
        {/* Search input */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Tasks
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="search"
              type="text"
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Search by title or description"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              aria-label="Search tasks"
            />
          </div>
        </div>
        
        {/* Status filter */}
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" aria-hidden="true" />
            </div>
            <select
              id="status-filter"
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              aria-label="Filter tasks by status"
            >
              <option value="all">All Tasks ({counts.all})</option>
              <option value="complete">Complete ({counts.complete})</option>
              <option value="incomplete">Incomplete ({counts.incomplete})</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Results count */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {tasks.length} of {counts.all} tasks
      </div>
      
      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No tasks match your filters</p>
          <button
            className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <li key={task._id} className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-2">
                    <button
                      onClick={() => handleToggleStatus(task._id)}
                      className={`mr-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.status === 'complete'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                      aria-label={`Mark task as ${task.status === 'complete' ? 'incomplete' : 'complete'}`}
                    >
                      {task.status === 'complete' && '✓'}
                    </button>
                    <h3 className={`text-lg font-medium ${task.status === 'complete' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                  </div>
                  <p className={`ml-8 text-sm ${task.status === 'complete' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {task.description}
                  </p>
                  <div className="ml-8 mt-2 flex flex-wrap gap-2">
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === 'complete' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {task.status === 'complete' ? 'Complete' : 'Incomplete'}
                    </span>
                    
                    {task.priority && (
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>
                
                {task.dueDate && (
                  <div className="ml-4 flex-shrink-0 text-sm text-gray-500">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskFilter;

