const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-auto-increment-reworked").MongooseAutoIncrementID;

const RoundSchema = require("./../Base/schemas/Keno_phien").clone();
const BetSchema = require("./../Base/schemas/Keno_one");
const BetLogSchema = require("./../Base/schemas/Keno_cuoc");

RoundSchema.plugin(AutoIncrement.plugin, { modelName: "KenoMini_phien", field: "id" });

const KenoMini_phien = mongoose.model("KenoMini_phien", RoundSchema);
const KenoMini_one = mongoose.model("KenoMini_one", BetSchema);
const KenoMini_cuoc = mongoose.model("KenoMini_cuoc", BetLogSchema);

module.exports = {
  KenoMini_phien,
  KenoMini_one,
  KenoMini_cuoc,
};
