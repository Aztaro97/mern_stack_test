/* eslint-env node */
const mongoose = require('mongoose');

const userLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  userName: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true
  },
  role: {
    type: String,
    required: [true, 'User role is required'],
    enum: ['user', 'admin']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['login', 'logout', 'token_refresh', 'failed_login']
  },
  loginTime: {
    type: Date,
    default: null
  },
  logoutTime: {
    type: Date,
    default: null
  },
  jwtTokenId: {
    type: String,
    required: false // JWT token identifier (jti claim)
  },
  ipAddress: {
    type: String,
    required: false,
    trim: true
  },
  userAgent: {
    type: String,
    required: false,
    trim: true
  },
  sessionDuration: {
    type: Number, // Duration in minutes
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'logged_out'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
userLogSchema.index({ userId: 1, createdAt: -1 });
userLogSchema.index({ email: 1, createdAt: -1 });
userLogSchema.index({ action: 1, createdAt: -1 });
userLogSchema.index({ ipAddress: 1, createdAt: -1 });

// Static method to create login log
userLogSchema.statics.createLoginLog = async function(userData, ipAddress, userAgent, jwtTokenId) {
  return await this.create({
    userId: userData.userId,
    userName: userData.fullName || userData.email.split('@')[0],
    email: userData.email,
    role: userData.role,
    action: 'login',
    loginTime: new Date(),
    jwtTokenId: jwtTokenId,
    ipAddress: ipAddress,
    userAgent: userAgent,
    status: 'active'
  });
};

// Static method to create logout log
userLogSchema.statics.createLogoutLog = async function(userId, jwtTokenId) {
  // Find the corresponding login log and update it
  const loginLog = await this.findOne({
    userId: userId,
    jwtTokenId: jwtTokenId,
    action: 'login',
    status: 'active'
  }).sort({ createdAt: -1 });

  if (loginLog) {
    const logoutTime = new Date();
    const sessionDuration = Math.round((logoutTime - loginLog.loginTime) / 60000); // minutes

    // Update the login log with logout information
    loginLog.logoutTime = logoutTime;
    loginLog.sessionDuration = sessionDuration;
    loginLog.status = 'logged_out';
    await loginLog.save();

    return loginLog;
  }

  return null;
};

// Static method to mark token as expired
userLogSchema.statics.markTokenExpired = async function(jwtTokenId) {
  return await this.updateMany(
    { jwtTokenId: jwtTokenId, status: 'active' },
    { status: 'expired' }
  );
};

module.exports = mongoose.model('UserLog', userLogSchema); 