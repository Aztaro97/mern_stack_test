/**
 * Signup Component
 * 
 * A comprehensive user registration component with validation, error handling,
 * and server API integration. Supports creating both admin and regular
 * user accounts with proper backend authentication.
 * 
 * Features:
 * - Form validation with clear error feedback
 * - Password strength and matching validation
 * - Role-based account creation
 * - Server API integration
 * - Automatic login after successful registration
 * 
 * @author Senior Full-Stack Engineer
 * @version 2.0.0
 */

import React, { useEffect, useState } from "react";
import { FaEnvelope, FaExclamationCircle, FaLock, FaSpinner, FaUser } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Signup = () => {
  // Form state with proper initialization
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "gray"
  });
  
  // Hooks initialization
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract role from location state or default to user
  const role = location.state?.role || "user";

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
   * Handles form input changes and updates state
   * 
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Check password strength when password field changes
    if (name === 'password') {
      evaluatePasswordStrength(value);
    }
  };

  /**
   * Evaluates password strength and updates UI feedback
   * 
   * @param {string} password - Password to evaluate
   */
  const evaluatePasswordStrength = (password) => {
    // Simple password strength evaluation
    let score = 0;
    let message = "";
    let color = "gray";
    
    if (!password) {
      setPasswordStrength({ score: 0, message: "", color: "gray" });
      return;
    }
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Determine message and color based on score
    if (score < 2) {
      message = "Weak";
      color = "red";
    } else if (score < 4) {
      message = "Moderate";
      color = "yellow";
    } else {
      message = "Strong";
      color = "green";
    }
    
    setPasswordStrength({ score, message, color });
  };

  /**
   * Handles form submission and user registration
   * Implements server API registration
   * 
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError("");
    
    // Validate form inputs
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return;
    }
    
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Validate password strength
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      // Call the signup function from AuthContext which uses the server API
      const userData = await signup(
        formData.fullName,
        formData.email,
        formData.password,
        role
      );
      
      console.log("User registered:", userData);
      
      // Navigate to appropriate dashboard
      navigate(userData.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
      
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center p-6 min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="p-8 w-full max-w-md bg-white rounded-xl shadow-lg transition duration-300 transform hover:scale-105">
        {/* Header */}
        <h2 className="mb-6 text-3xl font-bold text-center text-gray-800">
          {role === "admin" ? "Admin Registration" : "User Registration"}
        </h2>

        {/* Error display */}
        {error && (
          <div className="p-4 mb-6 bg-red-50 rounded border-l-4 border-red-500 animate-pulse" role="alert">
            <div className="flex items-center">
              <FaExclamationCircle className="mr-2 text-red-500" aria-hidden="true" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* Signup form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name field */}
          <div>
            <label htmlFor="fullName" className="block mb-1 text-sm font-medium text-gray-700">Full Name</label>
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <FaUser className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="px-4 py-2 pl-10 w-full rounded-md border shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
                aria-label="Full Name"
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <FaEnvelope className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                className="px-4 py-2 pl-10 w-full rounded-md border shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                className="px-4 py-2 pl-10 w-full rounded-md border shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                aria-label="Password"
                autoComplete="new-password"
              />
            </div>
            {/* Password strength indicator */}
            {passwordStrength.message && (
              <div className="mt-1">
                <p className={`text-xs text-${passwordStrength.color}-600`}>
                  Password strength: {passwordStrength.message}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password field */}
          <div>
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <FaLock className="text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="px-4 py-2 pl-10 w-full rounded-md border shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                aria-label="Confirm Password"
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className={`w-full py-2 rounded-md shadow-md transition duration-200 text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
            }`}
            disabled={loading}
            aria-label="Sign Up Button"
          >
            {loading ? (
              <span className="flex justify-center items-center">
                <FaSpinner className="mr-2 animate-spin" aria-hidden="true" />
                Creating account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* Additional Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link 
              to="/login" 
              state={{ role }} 
              className="font-medium text-blue-600 hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
