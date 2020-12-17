const mongoose = require("mongoose");

const jackpotSchema = new mongoose.Schema({
  game: { type: String, required: true },
  pool: { type: Number, required: true },
  initAmount: { type: Number, required: true },
  amount: { type: Number, default: 0 },
  winningRatio: { type: Number },
  winnerName: { type: String },
  winnerId: { type: Number },
  byBots: { type: Number, default: 0 },
  byMembers: { type: Number, default: 0 },
  createdAt: { type: Number, required: true },
  hitAt: { type: Number },
  createdTime: { type: Date, required: true },
  hitTime: { type: Date },
});

module.exports = mongoose.model("Jackpot", jackpotSchema);
