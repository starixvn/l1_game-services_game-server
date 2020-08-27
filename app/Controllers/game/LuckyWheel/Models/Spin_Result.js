let mongoose = require("mongoose");
let AutoIncrement = require("mongoose-auto-increment-reworked").MongooseAutoIncrementID;

let schema = new mongoose.Schema({
  uid: { type: String, required: true },
  name: { type: String, required: true },
  result: { type: Number, required: true },
  memberId: { type: Number },
  siteId: { type: String },
  time: { type: Date, default: new Date() },
});

schema.plugin(AutoIncrement.plugin, {
  modelName: "Spin_result",
  field: "id",
});

module.exports = mongoose.model("Spin_result", schema);
