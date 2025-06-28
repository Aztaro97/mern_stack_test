/**
 * Main Application Component
 * 
 * Serves as the root component for the TaskFlow application, handling routing,
 * authentication protection, and layout structure. Implements authentication-first
 * approach where users must login before accessing any application content.
 * 
 * @author Senior Full-Stack Engineer
 * @version 1.0.0
 */

import React from "react";
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Layout Components
import Footer from "./components/common/Footer";
import Navbar from "./components/common/Navbar";

// Authentication Pages
import ForgotPassword from "./components/auth/ForgotPassword";
import Login from "./components/auth/Login";
import ResetPassword from "./components/auth/ResetPassword";
import Signup from "./components/auth/Signup";

// Admin Pages
import Dashboard from "./pages/AdminPages/Dashboard";
import ManageTasks from "./pages/AdminPages/ManageTasks";
import ManageUsers from "./pages/AdminPages/ManageUsers";
import Settings from "./pages/AdminPages/Settings";
import UserLogPage from "./pages/AdminPages/UserLogPage";
import Users from "./pages/AdminPages/Users";

// User Pages
import CalendarPage from "./pages/UserPages/CalendarPage";
import UserDashboard from "./pages/UserPages/Dashboard";
import NotificationsPage from "./pages/UserPages/NotificationsPage";
import ProfilePage from "./pages/UserPages/ProfilePage";
import UserPage from "./pages/UserPages/UserPage";

// Feature Components
import TaskFilter from "./components/tasks/TaskFilter";

// Context Providers
import AuthProvider from "./contexts/AuthContext";
import NotificationProvider from "./contexts/NotificationContext";

/**
 * Protected Route Component
 * 
 * Higher-order component that protects routes requiring authentication.
 * Redirects unauthenticated users to the login page with return path.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @param {string} [props.requiredRole] - Optional role required to access the route
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, hasRole } = useAuth();
  const location = useLocation();
  
  // Check if user is authenticated
  const isAuthenticated = !!user || !!localStorage.getItem("token");
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // If role is required, check if user has the role
  if (requiredRole) {
    const hasRequiredRole = hasRole(requiredRole);
    
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user's role
      const userRole = localStorage.getItem("userRole");
      const redirectPath = userRole === "admin" ? "/admin/dashboard" : "/user/dashboard";
      
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  // User is authenticated and has required role (if specified)
  return children;
};

/**
 * Public Route Component
 * 
 * Component that handles public routes and redirects authenticated users
 * to their appropriate dashboard.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when not authenticated
 */
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  // If user is authenticated, redirect to appropriate dashboard
  if (user) {
    const userRole = localStorage.getItem("userRole");
    const redirectPath = userRole === "admin" ? "/admin/dashboard" : "/user/dashboard";
    return <Navigate to={redirectPath} replace />;
  }
  
  // User is not authenticated, render the public route
  return children;
};

/**
 * Root Redirect Component
 * 
 * Handles the root route by redirecting users based on authentication status.
 */
const RootRedirect = () => {
  const { user } = useAuth();
  
  if (user) {
    // User is authenticated, redirect to appropriate dashboard
    const userRole = localStorage.getItem("userRole");
    const redirectPath = userRole === "admin" ? "/admin/dashboard" : "/user/dashboard";
    return <Navigate to={redirectPath} replace />;
  } else {
    // User is not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }
};

/**
 * Main App Component
 * 
 * Defines the application's routing structure with authentication-first approach.
 */
function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            
            <main className="flex-grow">
              <Routes>
                {/* Root Route - Redirect based on auth status */}
                <Route path="/" element={<RootRedirect />} />
                
                {/* Public Authentication Routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/signup" 
                  element={
                    <PublicRoute>
                      <Signup />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/forgot-password" 
                  element={
                    <PublicRoute>
                      <ForgotPassword />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/reset-password" 
                  element={
                    <PublicRoute>
                      <ResetPassword />
                    </PublicRoute>
                  } 
                />
                
                {/* Protected Admin Routes */}
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Users />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/manage-users" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <ManageUsers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/manage-tasks" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <ManageTasks />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/user-logs" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <UserLogPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/task-filter" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <TaskFilter />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Protected User Routes */}
                <Route 
                  path="/user/dashboard" 
                  element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/user/userpage" 
                  element={
                    <ProtectedRoute>
                      <UserPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/user/notifications" 
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/user/calendar" 
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/user/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/user/task-filter" 
                  element={
                    <ProtectedRoute>
                      <TaskFilter />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Fallback Route - Redirect to login for unauthenticated, dashboard for authenticated */}
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </main>
            
            <Footer />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
