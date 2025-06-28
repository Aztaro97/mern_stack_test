const jwt = require('jsonwebtoken');
require('dotenv').config();

// General Authentication Middleware
const protect = (req, res, next) => {
    const authHeader = req.header("Authorization");
    
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    // Extract token from "Bearer TOKEN" format
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7, authHeader.length) 
        : authHeader;

    if (!token) {
        return res.status(401).json({ message: "Invalid token format" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Admin Authorization Middleware
const adminOnly = (req, res, next) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
    next();
};

module.exports = { protect, adminOnly };