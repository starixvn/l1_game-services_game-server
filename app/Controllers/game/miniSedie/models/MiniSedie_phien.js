let mongoose = require("mongoose");
let AutoIncrement = require("mongoose-auto-increment-reworked").MongooseAutoIncrementID;

let Schema = new mongoose.Schema({
  red1: { type: Boolean, required: true },
  red2: { type: Boolean, required: true },
  red3: { type: Boolean, required: true },
  red4: { type: Boolean, required: true },
  time: { type: Date, default: new Date() },
});

Schema.plugin(AutoIncrement.plugin, { modelName: "MiniSedie_phien", field: "id", });

module.exports = mongoose.model("MiniSedie_phien", Schema);
