
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
  dailyBestScore: {
    type: Number,
    default: 0
  },
  weeklyBestScore: {
    type: Number,
    default: 0
  },
  bestScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });



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

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
const GameSession = mongoose.model('GameSession', gameSessionSchema);

module.exports = { UserProfile, GameSession };
