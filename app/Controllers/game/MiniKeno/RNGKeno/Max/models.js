const mongoose = require("mongoose");

const RoundSchema = require("./../Base/schemas/RNGKeno_phien");
const BetSchema = require("./../Base/schemas/RNGKeno_one");
const BetLogSchema = require("./../Base/schemas/RNGKeno_cuoc");

const RNGKenoMax_phien = mongoose.model("RNGKenoMax_phien", RoundSchema);
const RNGKenoMax_one = mongoose.model("RNGKenoMax_one", BetSchema);
const RNGKenoMax_cuoc = mongoose.model("RNGKenoMax_cuoc", BetLogSchema);

module.exports = {
  RNGKenoMax_phien,
  RNGKenoMax_one,
  RNGKenoMax_cuoc,
};
