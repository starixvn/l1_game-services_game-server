const RoulettePhien = require("./Models/Roulette_phien");
const Constants = require("./constants");
const runGame = require("./run-game");

module.exports = (io) => {
  io.roulette = {
    roundId: 1,
    remainingTime: Constants.roundDuration,
    delayStartTime: 0,
    ingame: {},
    totalBets: {},
    realPlayers: {},
    winningPlayers: {},
    players: {},
    disabled: false,
    settlementResultFromAdmin: {
      roundId: 0,
      result: 0,
    },
  };

  RoulettePhien.findOne({}, "id", { sort: { _id: -1 } })
    .lean()
    .then((lastRound) => {
      if (lastRound) {
        io.roulette.roundId = lastRound.id + 1;
      }
    });

  runGame(io);
};
