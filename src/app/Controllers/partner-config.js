const PartnerConfig = require("../Models/PartnerConfig");

const checkSuperPlayers = async (playerName, partnerId) =>
  PartnerConfig.exists({ type: "super_players", "configs.names": playerName, partnerId: partnerId });

module.exports = {
  isSuperPlayers: checkSuperPlayers,
};
