// API Configuration
const API_BASE_URL = "http://localhost:5050";

/**
 * Generic fetch wrapper with error handling
 */
const apiRequest = async (url, options = {}) => {
  try {
    const token = localStorage.getItem("token");
    
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

/**
 * Authentication API calls
 */
export const authAPI = {
  login: async (email, password, role) => {
    return apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
  },

  register: async (fullName, email, password, role) => {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password, role }),
    });
  },

  forgotPassword: async (email) => {
    return apiRequest("/api/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};

/**
 * Task API calls
 */
export const taskAPI = {
  // Get all tasks with optional filtering
  getTasks: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.status && filters.status !== 'all') {
      queryParams.append('status', filters.status);
    }
    
    if (filters.search && filters.search.trim()) {
      queryParams.append('search', filters.search.trim());
    }
    
    if (filters.priority) {
      queryParams.append('priority', filters.priority);
    }
    
    const queryString = queryParams.toString();
    const url = `/api/tasks${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(url);
  },

  // Get a specific task by ID
  getTask: async (id) => {
    return apiRequest(`/api/tasks/${id}`);
  },

  // Create a new task
  createTask: async (taskData) => {
    return apiRequest("/api/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
  },

  // Update a task
  updateTask: async (id, updateData) => {
    return apiRequest(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  },

  // Toggle task completion status
  toggleTaskStatus: async (id) => {
    return apiRequest(`/api/tasks/${id}/status`, {
      method: "PATCH",
    });
  },

  // Update task progress
  updateTaskProgress: async (id, progress) => {
    return apiRequest(`/api/tasks/${id}/progress`, {
      method: "PATCH",
      body: JSON.stringify({ progress }),
    });
  },

  // Delete a task
  deleteTask: async (id) => {
    return apiRequest(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  },

  // Get task statistics
  getTaskStats: async () => {
    return apiRequest("/api/tasks/stats/summary");
  },
};

/**
 * Generic data fetcher
 */
export const fetchData = async (url) => {
  const response = await fetch(url);
  return response.json();
};

export default apiRequest;
