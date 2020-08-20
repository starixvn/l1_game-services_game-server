const inGame = require("./in-game");
const outGame = require("./out-game");
const { placeBet } = require("./place-bet");
const getHistory = require("./get-history");
const getStatistics = require("./get-statistics");

module.exports = (realPlayer, data) => {
  if (data.ingame) {
    inGame(realPlayer);
  }

  if (data.outgame) {
    outGame(realPlayer);
  }

  if (data.bet) {
    placeBet(realPlayer, data.bet);
  }

  if (data.getHistory) {
    getHistory(realPlayer, data.getHistory);
  }

  if (data.getStatistics) {
    getStatistics(realPlayer);
  }
};
