/**
 * Login Component
 * 
 * A comprehensive authentication component that handles user login with proper
 * validation, error handling, and state management. Implements server API
 * authentication for secure user sessions.
 * 
 * Features:
 * - Server API integration for authentication
 * - Proper error handling and loading states
 * - Role-based redirection
 * - Return path preservation for post-login redirection
 * 
 * @author Senior Full-Stack Engineer
 * @version 2.0.0
 */

import React, { useEffect, useState } from "react";
import { FaEnvelope, FaExclamationCircle, FaLock, FaSpinner } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  // State management with proper initialization
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Hooks initialization
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract role from location state or default to user
  const role = location.state?.role || "user";
  const from = location.state?.from || "/";

  /**
   * Effect hook to check for existing authentication
   * Redirects authenticated users to appropriate dashboard
   */
  useEffect(() => {
    if (isAuthenticated) {
      const userRole = localStorage.getItem("userRole");
      navigate(userRole === "admin" ? "/admin/dashboard" : "/user/dashboard");
    }
  }, [isAuthenticated, navigate]);

  /**
   * Handles form submission and authentication
   * Implements server API authentication
   * 
   * @param {Event} e - The form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    
    // Reset previous errors
    setError("");
    setLoading(true);
    
    try {
      // Call the login function from AuthContext which uses the server API
      const userData = await login(email, password, role);
      
      console.log("User logged in:", userData);
      
      // Navigate to appropriate dashboard or requested page
      const redirectPath = from !== "/" ? from : (userData.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
      navigate(redirectPath);
      
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center p-6 min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="p-8 w-full max-w-md bg-white rounded-xl shadow-lg transition duration-300 transform hover:scale-105">
        {/* Header */}
        <h2 className="mb-6 text-3xl font-bold text-center text-gray-800">
          {role === "admin" ? "Admin Login" : "User Login"}
        </h2>

        {/* Error display with animation */}
        {error && (
          <div className="p-4 mb-6 bg-red-50 rounded border-l-4 border-red-500 animate-pulse" role="alert">
            <div className="flex items-center">
              <FaExclamationCircle className="mr-2 text-red-500" aria-hidden="true" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email field */}
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <FaEnvelope className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="email"
                type="email"
                className="px-4 py-2 pl-10 w-full rounded-md border shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email Address"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <FaLock className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="password"
                type="password"
                className="px-4 py-2 pl-10 w-full rounded-md border shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Submit button with loading state */}
          <button
            type="submit"
            className={`w-full py-2 rounded-md shadow-md transition duration-200 text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
            }`}
            disabled={loading}
            aria-label="Login Button"
          >
            {loading ? (
              <span className="flex justify-center items-center">
                <FaSpinner className="mr-2 animate-spin" aria-hidden="true" />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Additional Links */}
        <div className="mt-6 space-y-2 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link 
              to="/signup" 
              state={{ role }} 
              className="font-medium text-blue-600 hover:underline"
            >
              Sign up here
            </Link>
          </p>
          <p className="text-sm">
            <Link 
              to="/forgot-password" 
              className="text-blue-600 hover:underline"
            >
              Forgot your password?
            </Link>
          </p>
        </div>

        {/* Demo credentials for testing */}
        <div className="p-4 mt-6 bg-gray-50 rounded-lg">
          <h4 className="mb-2 text-sm font-medium text-gray-700">Demo Credentials:</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Admin:</strong> admin@example.com / password123</p>
            <p><strong>User:</strong> user@example.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
