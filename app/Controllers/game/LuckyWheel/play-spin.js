const UserSpin = require("./Models/Spin");
const UserInfo = require("../../../Models/UserInfo");
const GameConfigs = require("../../../Models/GameConfig/GameConfigs");
const SpinResult = require("./Models/Spin_Result");

let Chance = require("chance");
const chance = new Chance();

const Constants = require("./constants");
const Logger = require("../../../web/logger");
const getSpins = require("./get-spins");
const ConfigHelper = require("./../../../Helpers/ConfigHelper");

const spin = async (player) => {
  if (!player.session) {
    return;
  }

  const luckyWheelData = player.redT.luckyWheel;

  if (luckyWheelData.ingame[player.profile.name]) {
    luckyWheelData.ingame[player.profile.name].betQueue.push({ memberId: player.session.memberId, player });
  } else {
    const newData = {
      name: player.profile.name,
      betQueue: [{ memberId: player.session.memberId, player }],
    };

    luckyWheelData.ingame[player.profile.name] = newData;
  }
};

module.exports = (player) => spin(player).catch((err) => Logger.logError(err));
