const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-auto-increment-reworked").MongooseAutoIncrementID;

const schema = new mongoose.Schema({
  result: { type: Number, required: true },
  time: { type: Date, default: new Date() },
});

schema.plugin(AutoIncrement.plugin, { modelName: "Roulette_phien", field: "id" });

module.exports = mongoose.model("Roulette_phien", schema);
