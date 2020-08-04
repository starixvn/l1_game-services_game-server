const play = require("./play");
const getLogs = require("./get-logs");
const getHistory = require("./get-history");

module.exports = function (player, payload) {
  if (payload.view) {
    player.gameEvent.viewLuckyWheel = !!payload.view;
  }

  if (!!payload.play) {
    play(player, payload);
  }

  if (!!payload.getLogs) {
    getLogs(player);
  }

  if (!!payload.getHistory) {
    getHistory(player, payload.getHistory);
  }
};
