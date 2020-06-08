const getTime = require("./get-time");
const placeBet = require("./place-bet");
const getLogs = require("./get-logs");
const getHistory = require("./get-history");

module.exports = (player, payload) => {
  if (payload.view) {
    player.gameEvent.viewMiniSedie = !!payload.view;
  }

  if (!!payload.get_time) {
    getTime(player);
  }

  if (!!payload.bet) {
    placeBet(player, payload.bet);
  }

  if (!!payload.getLogs) {
    getLogs(player);
  }

  if (!!payload.getHistory) {
    getHistory(player, payload.getHistory);
  }
};
