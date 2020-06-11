let mongoose = require("mongoose");

let Schema = new mongoose.Schema({
  uid: { type: String, required: true },
  name: { type: String, required: true },
  phien: { type: Number, required: true },
  time: { type: Date, required: true },

  choice: { type: String, required: true },
  amount: { type: Number, required: true },

  memberId: { type: Number, required: true },
  siteId: { type: String, required: true },
});

module.exports = mongoose.model("KenoProViet_cuoc", Schema);
