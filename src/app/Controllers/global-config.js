const GlobalConfig = require("../Models/GlobalConfig");

const checkSuperPlayers = async (playerName) => GlobalConfig.exists({ type: "super_players", "configs.names": playerName });

module.exports = {
  isSuperPlayers: checkSuperPlayers,
};
