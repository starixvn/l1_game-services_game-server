const getTime = require("./get-time");
const placeBet = require("./place-bet");
const getLogs = require("./get-logs");
const getHistory = require("./get-history");
const getRounds = require("./get-rounds").getRounds;
const getPlayerBets = require("./get-player-bets");

module.exports = function (player, payload) {
  if (payload.view) {
    player.gameEvent.viewKenoProViet = !!payload.view;
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

  if (!!payload.getRounds) {
    getRounds(player);
  }

  if (!!payload.getPlayerBets) {
    getPlayerBets(player, payload.roundId);
  }
};
