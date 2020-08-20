let mongoose = require("mongoose");

let Schema = new mongoose.Schema({
  memberId: { type: String, required: true }, 
  availSpins: { type: Number, default: 0 }, 
  usedSpins: { type: Number, default: 0 },
  enabled: {type: Boolean, default: true}
});

module.exports = mongoose.model("Spin", Schema);
