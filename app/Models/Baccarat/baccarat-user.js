const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // ID Người chơi
  win: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  play: { type: Number, default: 0 }
});

module.exports = mongoose.model("baccarat_user", Schema);
