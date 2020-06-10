const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-auto-increment-reworked").MongooseAutoIncrementID;

const RoundSchema = require("./../Base/schemas/Keno_phien").clone();
const BetSchema = require("./../Base/schemas/Keno_one");
const BetLogSchema = require("./../Base/schemas/Keno_cuoc");

RoundSchema.plugin(AutoIncrement.plugin, { modelName: "KenoSummer_phien", field: "id" });

const KenoSummer_phien = mongoose.model("KenoSummer_phien", RoundSchema);
const KenoSummer_one = mongoose.model("KenoSummer_one", BetSchema);
const KenoSummer_cuoc = mongoose.model("KenoSummer_cuoc", BetLogSchema);

module.exports = {
  KenoSummer_phien,
  KenoSummer_one,
  KenoSummer_cuoc,
};
