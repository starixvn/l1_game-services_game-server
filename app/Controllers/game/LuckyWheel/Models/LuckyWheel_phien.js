let mongoose = require("mongoose");

let schema = new mongoose.Schema({  
  uid: { type: String, required: true },
  name: { type: String, required: true },
  spinId: { type: String, required: true },
  result: { type: Number, required: true },
  memberId: { type: Number },
  siteId: { type: String },
  time: { type: Date, default: new Date() },
});

module.exports = mongoose.model("MoneyWheel_phien", schema);
