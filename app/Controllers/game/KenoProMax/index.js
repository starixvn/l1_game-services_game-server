const inGame = require("./inGame");
const outGame = require("./outGame");
const placeBet = require("./placeBet");
const history = require("./history");

module.exports = (realPlayer, data) => {
  if (!!data.ingame) {
    inGame(realPlayer);
  }

  if (!!data.outgame) {
    outGame(realPlayer);
  }

  if (!!data.bet) {
    placeBet(realPlayer, data.bet);
  }

  if (!!data.viewlogs) {
    history(realPlayer, data.viewlogs);
  }
};
