const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-auto-increment-reworked").MongooseAutoIncrementID;

const RoundSchema = require("./../Base/schemas/Keno_phien").clone();
const BetSchema = require("./../Base/schemas/Keno_one");
const BetLogSchema = require("./../Base/schemas/Keno_cuoc");

RoundSchema.plugin(AutoIncrement.plugin, { modelName: "KenoAutumn_phien", field: "id" });

const KenoAutumn_phien = mongoose.model("KenoAutumn_phien", RoundSchema);
const KenoAutumn_one = mongoose.model("KenoAutumn_one", BetSchema);
const KenoAutumn_cuoc = mongoose.model("KenoAutumn_cuoc", BetLogSchema);

module.exports = {
  KenoAutumn_phien,
  KenoAutumn_one,
  KenoAutumn_cuoc,
};
