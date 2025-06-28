/**
 * UserLogPage Component
 * 
 * Admin interface for viewing and managing user activity logs.
 * Provides comprehensive logging information including login/logout times,
 * JWT tokens, IP addresses, and user details with filtering capabilities.
 * 
 * Features:
 * - View user activity logs with pagination
 * - Filter by action, role, email, date range
 * - Display login/logout times and session duration
 * - Show JWT token IDs and IP addresses
 * - Bulk delete operations
 * - Activity statistics dashboard
 * - Real-time updates
 * 
 * @author Senior Full-Stack Engineer
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
	FaCalendarAlt,
	FaChartBar,
	FaClock,
	FaExclamationTriangle,
	FaGlobe,
	FaKey,
	// FaRefresh,
	FaSignInAlt,
	FaSignOutAlt,
	FaSpinner,
	FaTrash,
	FaUsers
} from 'react-icons/fa';
import { MdOutlineRefresh } from "react-icons/md";
import { toast } from 'react-toastify';
import Sidebar from '../../components/admin/Sidebar';
import { userLogAPI } from '../../utils/api';

const UserLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20
  });
  
  const [filters, setFilters] = useState({
    action: '',
    role: '',
    email: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Load logs from server
  const loadLogs = useCallback(async (newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await userLogAPI.getLogs(newFilters);
      
      if (response.success) {
        setLogs(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to load user logs');
      }
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err.message || 'Failed to load user logs');
      toast.error('Failed to load user logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await userLogAPI.getStats({
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [filters.startDate, filters.endDate]);

  // Load data on component mount
  useEffect(() => {
    loadLogs();
    loadStats();
  }, [loadLogs, loadStats]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
      page: 1 // Reset to first page when filtering
    };
    setFilters(newFilters);
    loadLogs(newFilters);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadLogs(newFilters);
  };

  // Handle log selection
  const handleLogSelection = (logId, isSelected) => {
    if (isSelected) {
      setSelectedLogs([...selectedLogs, logId]);
    } else {
      setSelectedLogs(selectedLogs.filter(id => id !== logId));
    }
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedLogs(logs.map(log => log._id));
    } else {
      setSelectedLogs([]);
    }
  };

  // Handle delete single log
  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this log entry?')) {
      return;
    }

    try {
      const response = await userLogAPI.deleteLog(logId);
      
      if (response.success) {
        toast.success('Log deleted successfully');
        loadLogs();
        loadStats();
      } else {
        throw new Error(response.message || 'Failed to delete log');
      }
    } catch (err) {
      console.error('Error deleting log:', err);
      toast.error(err.message || 'Failed to delete log');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedLogs.length === 0) {
      toast.warning('Please select logs to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedLogs.length} log entries?`)) {
      return;
    }

    try {
      const response = await userLogAPI.deleteLogs(selectedLogs);
      
      if (response.success) {
        toast.success(`${response.deletedCount} logs deleted successfully`);
        setSelectedLogs([]);
        loadLogs();
        loadStats();
      } else {
        throw new Error(response.message || 'Failed to delete logs');
      }
    } catch (err) {
      console.error('Error deleting logs:', err);
      toast.error(err.message || 'Failed to delete logs');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Format session duration
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get action badge color
  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'login': return 'bg-green-100 text-green-800';
      case 'logout': return 'bg-blue-100 text-blue-800';
      case 'failed_login': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800';
  };

  // Refresh data
  const handleRefresh = () => {
    loadLogs();
    loadStats();
    toast.success('Data refreshed');
  };

  return (
	<div className='flex min-h-screen bg-gray-100'>
	 {/* Sidebar */}
	 <Sidebar />

	<div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Activity Logs</h1>
          <p className="text-gray-600">Monitor user login/logout activities and session information</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <MdOutlineRefresh className="mr-2" />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <FaChartBar className="mr-3 text-2xl text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLogs || 0}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <FaSignInAlt className="mr-3 text-2xl text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Logins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLogins || 0}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <FaSignOutAlt className="mr-3 text-2xl text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Logouts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLogouts || 0}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <FaClock className="mr-3 text-2xl text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(Math.round(stats.averageSessionDuration || 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          {/* Action Filter */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="failed_login">Failed Login</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Role</label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Email Filter */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input
              type="text"
              value={filters.email}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              placeholder="Search by email"
              className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                const clearedFilters = {
                  action: '',
                  role: '',
                  email: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  limit: 20,
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                };
                setFilters(clearedFilters);
                loadLogs(clearedFilters);
              }}
              className="px-3 py-2 w-full text-white bg-gray-500 rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedLogs.length > 0 && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex justify-between items-center">
            <span className="text-yellow-800">
              {selectedLogs.length} log(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              <FaTrash className="mr-2" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Activity Logs</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="mr-3 text-2xl text-blue-500 animate-spin" />
            <span>Loading logs...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12 text-red-500">
            <FaExclamationTriangle className="mr-2" />
            <span>{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <FaUsers className="mx-auto mb-4 text-4xl" />
            <p>No activity logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLogs.length === logs.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Login Time
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Logout Time
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Session Duration
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      JWT Token ID
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLogs.includes(log._id)}
                          onChange={(e) => handleLogSelection(log._id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                            <div className="text-sm text-gray-500">{log.email}</div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(log.role)}`}>
                              {log.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-1 text-gray-400" />
                          {formatDate(log.loginTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-1 text-gray-400" />
                          {formatDate(log.logoutTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaClock className="mr-1 text-gray-400" />
                          {formatDuration(log.sessionDuration)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaGlobe className="mr-1 text-gray-400" />
                          {log.ipAddress || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaKey className="mr-1 text-gray-400" />
                          <span className="font-mono text-xs">
                            {log.jwtTokenId ? log.jwtTokenId.slice(0, 8) + '...' : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteLog(log._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete log"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center px-6 py-4 border-t">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
	</div>
    
  );
};

export default UserLogPage;