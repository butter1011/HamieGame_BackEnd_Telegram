const mongoose = require("mongoose");

const userInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  GlobalBitcoins: {
    type: Number,
    default: 0,
  },
  ClickValueBitcoin: {
    type: Number,
    default: 1,
  },
  ClickSeconds: {
    type: Number,
    default: 0,
  },
  BitcoinsPS: {
    type: Number,
    default: 0,
  },
  BitcoinPointsMultiply: {
    type: Number,
    default: 1,
  },
  ProgressCost: {
    type: Number,
    default: 1.145,
  },
  GameProgress: {
    type: Number,
    default: 0,
  },
  B1Value: {
    type: Number,
    default: 0,
  },
  B1level: {
    type: Number,
    default: 0,
  },
  B1Cost: {
    type: Number,
    default: 18,
  },
  B1bitcoinBoostPS: {
    type: Number,
    default: 0.3,
  },
  B2Value: {
    type: Number,
    default: 0,
  },
  B2level: {
    type: Number,
    default: 0,
  },
  B2Cost: {
    type: Number,
    default: 120,
  },
  B2bitcoinBoostPS: {
    type: Number,
    default: 3,
  },
  B3Value: {
    type: Number,
    default: 0,
  },
  B3level: {
    type: Number,
    default: 0,
  },
  B3Cost: {
    type: Number,
    default: 1320,
  },
  B3bitcoinBoostPS: {
    type: Number,
    default: 24,
  },
  B4Value: {
    type: Number,
    default: 0,
  },
  B4level: {
    type: Number,
    default: 0,
  },
  B4Value: {
    type: Number,
    default: 0,
  },
  B4Cost: {
    type: Number,
    default: 14400,
  },
  B4bitcoinBoostPS: {
    type: Number,
    default: 141,
  },
  B5Value: {
    type: Number,
    default: 0,
  },
  B5level: {
    type: Number,
    default: 0,
  },
  B5Cost: {
    type: Number,
    default: 156000,
  },
  B5bitcoinBoostPS: {
    type: Number,
    default: 1100,
  },
  B2Avalaible: {
    type: Boolean,
    default: false,
  },
  B3Avalaible: {
    type: Boolean,
    default: false,
  },
  B4Avalaible: {
    type: Boolean,
    default: false,
  },
  B5Avalaible: {
    type: Boolean,
    default: false,
  },
  isEndgame: {
    type: Boolean,
    default: false,
  },
  isSave: {
    type: Boolean,
    default: false,
  },
  BTC2Sound: {
    type: Boolean,
    default: true,
  },
  BTC3Sound: {
    type: Boolean,
    default: true,
  },
  BTC4Sound: {
    type: Boolean,
    default: true,
  },
  BTC5Sound: {
    type: Boolean,
    default: true,
  },
  Combo: {
    type: Number,
    default: 1,
  },
  ComboCounter: {
    type: Number,
    default: 1,
  },
  Tutorial: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const UserInfo = mongoose.model("UserInfo", userInfoSchema);

module.exports = UserInfo;
