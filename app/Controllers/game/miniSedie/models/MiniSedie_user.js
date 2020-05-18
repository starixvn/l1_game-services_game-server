const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  red: { type: Number, default: 0 },
  redLost: { type: Number, default: 0 },
  redPlay: { type: Number, default: 0 },
});

module.exports = mongoose.model("MiniSedie_user", Schema);
