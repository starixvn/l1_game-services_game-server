const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-auto-increment-reworked").MongooseAutoIncrementID;

const RoundSchema = require("./../Base/schemas/Keno_phien").clone();
const BetSchema = require("./../Base/schemas/Keno_one");
const BetLogSchema = require("./../Base/schemas/Keno_cuoc");

RoundSchema.plugin(AutoIncrement.plugin, { modelName: "KenoWinter_phien", field: "id" });

const KenoWinter_phien = mongoose.model("KenoWinter_phien", RoundSchema);
const KenoWinter_one = mongoose.model("KenoWinter_one", BetSchema);
const KenoWinter_cuoc = mongoose.model("KenoWinter_cuoc", BetLogSchema);

module.exports = {
  KenoWinter_phien,
  KenoWinter_one,
  KenoWinter_cuoc,
};
