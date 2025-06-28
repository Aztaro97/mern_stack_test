/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Implements JWT-based authentication with secure storage and proper state management.
 * 
 * Features:
 * - User authentication state management
 * - Login/logout functionality
 * - Token persistence
 * - Role-based access control support
 * - Server API integration
 * 
 * @author Senior Full-Stack Engineer
 * @version 1.0.0
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../utils/api";

// Create the authentication context
const AuthContext = createContext();

/**
 * Custom hook to use the authentication context
 * @returns {Object} Authentication context values and methods
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * Authentication Provider Component
 * Manages authentication state and provides methods to login, logout, etc.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
const AuthProvider = ({ children }) => {
  /**
   * Initialize user state from localStorage if available
   * This ensures authentication persists across page refreshes
   */
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const userRole = localStorage.getItem("userRole");
    
    return token && email ? { email, role: userRole } : null;
  });
  
  const [loading, setLoading] = useState(true);

  /**
   * Effect to check token validity on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (token) {
          // In a real app, we would validate the token with the server
          // For now, we'll just check if it exists and set the user
          const email = localStorage.getItem("email");
          const userRole = localStorage.getItem("userRole");
          
          if (email) {
            setUser({ email, role: userRole });
          } else {
            // If email is missing but token exists, something is wrong
            // Clear authentication data
            handleLogout();
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  /**
   * Handles user login with server API
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} role - User's role (optional)
   * @returns {Promise<Object>} User data
   */
  const login = async (email, password, role) => {
    try {
      const data = await authAPI.login(email, password, role);

      // Store authentication data
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("email", email);

      // Update user state
      const userData = { email, role: data.role };
      setUser(userData);

      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  /**
   * Handles user signup with server API
   * @param {string} fullName - User's full name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} role - User's role
   * @returns {Promise<Object>} User data
   */
  const signup = async (fullName, email, password, role = 'user') => {
    try {
      const data = await authAPI.register(fullName, email, password, role);

      // Store authentication data
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("email", email);

      // Update user state
      const userData = { email, role };
      setUser(userData);

      return userData;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  /**
   * Handles user logout
   * Clears authentication data and resets state
   */
  const handleLogout = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    
    // Reset user state
    setUser(null);
    
    console.log("User logged out");
  };

  /**
   * Handles password reset request
   * @param {string} email - User's email
   * @returns {Promise<void>}
   */
  const resetPassword = async (email) => {
    try {
      await authAPI.forgotPassword(email);
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  /**
   * Checks if the current user has a specific role
   * @param {string} requiredRole - Role to check for
   * @returns {boolean} Whether user has the required role
   */
  const hasRole = (requiredRole) => {
    if (!user) return false;
    return user.role === requiredRole;
  };

  /**
   * Context value with authentication state and methods
   */
  const value = {
    user,
    loading,
    login,
    signup,
    logout: handleLogout,
    resetPassword,
    hasRole,
    isAdmin: () => hasRole("admin"),
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
