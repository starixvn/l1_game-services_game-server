const PartnerConfig = require("../Models/PartnerConfig");

const checkSuperPlayers = async (playerName, partnerId) =>
  PartnerConfig.exists({ type: "super_players", "value.names": playerName?.toLocaleLowerCase(), partnerId: partnerId });

module.exports = {
  isSuperPlayers: checkSuperPlayers,
};
