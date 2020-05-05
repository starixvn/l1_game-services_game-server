let mongoose = require("mongoose");
let AutoIncrement = require("mongoose-auto-increment-reworked")
  .MongooseAutoIncrementID;

let Schema = new mongoose.Schema({
  result: { type: [Number], required: true },
  time: { type: Date, default: new Date() },
});

Schema.plugin(AutoIncrement.plugin, {
  modelName: "KenoProMax_phien",
  field: "id",
});

module.exports = mongoose.model("KenoProMax_phien", Schema);
