const inGame = require("./inGame");
const outGame = require("./outGame");
const placeBet = require("./placeBet").kenoProMaxPlaceBet;

module.exports = (realPlayer, data) => {
  if (!!data.ingame) {
    inGame(realPlayer);
  }

  if (!!data.outgame) {
    outGame(realPlayer);
  }

  if (!!data.cuoc) {
    placeBet(realPlayer, data.cuoc);
  }
};
