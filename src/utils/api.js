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
 * Generic data fetcher
 */
export const fetchData = async (url) => {
  const response = await fetch(url);
  return response.json();
};

/**
 * Task API calls (if needed)
 */
export const taskAPI = {
  fetchTasks: async () => {
    return apiRequest("/api/tasks");
  },

  createTask: async (task) => {
    return apiRequest("/api/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  },

  updateTask: async (id, updates) => {
    return apiRequest(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  deleteTask: async (id) => {
    return apiRequest(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  },
};

export default apiRequest;
