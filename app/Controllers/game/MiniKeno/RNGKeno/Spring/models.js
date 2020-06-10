const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-auto-increment-reworked").MongooseAutoIncrementID;

const RoundSchema = require("./../Base/schemas/Keno_phien").clone();
const BetSchema = require("./../Base/schemas/Keno_one");
const BetLogSchema = require("./../Base/schemas/Keno_cuoc");

RoundSchema.plugin(AutoIncrement.plugin, { modelName: "KenoSpring_phien", field: "id" });

const KenoSpring_phien = mongoose.model("KenoSpring_phien", RoundSchema);
const KenoSpring_one = mongoose.model("KenoSpring_one", BetSchema);
const KenoSpring_cuoc = mongoose.model("KenoSpring_cuoc", BetLogSchema);

module.exports = {
  KenoSpring_phien,
  KenoSpring_one,
  KenoSpring_cuoc,
};
