
const mongoose = require('mongoose');

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true
  },
  username: String,
  firstName: String,
  lastName: String,
  phoneNumber: Number,
  createdAt: {
    type: Date,
    default: () => new Date().toUTCString()
  },
  updatedAt: {
    type: Date,
    default: () => new Date().toUTCString()
  },
  bestScore: {
    type: Number,
    default: 0
  }
});

// Game Session Schema
const gameSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  startTime: {
    type: Date,
    default: () => new Date().toUTCString()
  },
  endTime: Date
});

// Create models
const UserProfile = mongoose.model('UserProfile', userProfileSchema);
const GameSession = mongoose.model('GameSession', gameSessionSchema);

module.exports = { UserProfile, GameSession };
