const getTime = require("./get-time");
const placeBet = require("./place-bet");
const getLogs = require("./get-logs");
const viewLogs = require("./view-logs");

module.exports = function (realPlayer, data) {
  if (data.view) {
    realPlayer.gameEvent.viewMiniSedie = !!data.view;
  }

  if (!!data.get_time) {
    getTime(realPlayer);
  }

  if (!!data.bet) {
    placeBet(realPlayer, data.bet);
  }

  if (!!data.getLogs) {
    getLogs(realPlayer);
  }

  if (!!data.viewlogs) {
    viewLogs(realPlayer, data.viewlogs);
  }
};
