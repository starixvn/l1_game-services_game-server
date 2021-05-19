// Reg game
let reg = require("./game/reg");

// RNG Mini Keno
const kenoMax = require("./game/MiniKeno/Max");
const kenoMax2 = require("./game/MiniKeno/Max2");
const kenoMini = require("./game/MiniKeno/Mini");
const kenoMini2 = require("./game/MiniKeno/Mini2");
const kenoEast = require("./game/MiniKeno/East");
const kenoWest = require("./game/MiniKeno/West");
const kenoSouth = require("./game/MiniKeno/South");
const kenoNorth = require("./game/MiniKeno/North");

module.exports = function (client, data) {
  if (!!data.reg) {
    reg(client, data.reg);
  }

  if (!!data.kenoMax) {
    kenoMax(client, data.kenoMax);
  }

  if (!!data.kenoMax2) {
    kenoMax2(client, data.kenoMax2);
  }

  if (!!data.kenoMini) {
    kenoMini(client, data.kenoMini);
  }

  if (!!data.kenoMini2) {
    kenoMini2(client, data.kenoMini2);
  }

  if (!!data.kenoEast) {
    kenoEast(client, data.kenoEast);
  }

  if (!!data.kenoWest) {
    kenoWest(client, data.kenoWest);
  }

  if (!!data.kenoSouth) {
    kenoSouth(client, data.kenoSouth);
  }

  if (!!data.kenoNorth) {
    kenoNorth(client, data.kenoNorth);
  }
};
