let mongoose = require("mongoose");

let Schema = new mongoose.Schema({
  start: { type: Date },
  end: { type: Date },
  finish: { type: Boolean },
  isPartnerUm: { type: Boolean, default: false },
  partnerId: { type: String },
});

module.exports = mongoose.model("um_info", Schema, "um_info");
