const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  gameId: { type: Number, required: true },
  gameName: { type: String, required: true },
  pool: { type: Number, required: true },
  initAmount: { type: Number, required: true },
  amount: { type: Number, default: 0 },
  winningRatio: { type: Number },
  winnerName: { type: String },
  winnerId: { type: Number },
  byBots: { type: Number, default: 0 },
  byMembers: { type: Number, default: 0 },
  createdAt: { type: Number, required: true },
  createdTime: { type: Date, required: true },
  hitAt: { type: Number },
  hitTime: { type: Date },
});

module.exports = mongoose.model("Jackpot", schema);
