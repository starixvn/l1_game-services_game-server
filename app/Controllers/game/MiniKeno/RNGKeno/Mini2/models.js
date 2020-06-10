const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-auto-increment-reworked").MongooseAutoIncrementID;

const RoundSchema = require("./../Base/schemas/Keno_phien").clone();
const BetSchema = require("./../Base/schemas/Keno_one");
const BetLogSchema = require("./../Base/schemas/Keno_cuoc");

RoundSchema.plugin(AutoIncrement.plugin, { modelName: "KenoMini2_phien", field: "id" });

const KenoMini2_phien = mongoose.model("KenoMini2_phien", RoundSchema);
const KenoMini2_one = mongoose.model("KenoMini2_one", BetSchema);
const KenoMini2_cuoc = mongoose.model("KenoMini2_cuoc", BetLogSchema);

module.exports = {
  KenoMini2_phien,
  KenoMini2_one,
  KenoMini2_cuoc,
};
