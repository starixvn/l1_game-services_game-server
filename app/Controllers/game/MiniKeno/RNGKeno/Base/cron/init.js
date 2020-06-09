const Constants = require("./../constants");

const runGame = require("./run-game");

module.exports = (io, definition) => {
  const gameName = definition.name;

  io[gameName] = {
    roundId: 1,
    remainingTime: 0,
    ingame: {},
    totalBets: { ...Constants.resetTotalBets },
    disabled: false,
    settlementResultFromAdmin: {},
  };

  definition.roundRepository
    .findOne({}, "id", { sort: { _id: -1 } })
    .lean()
    .then((lastRound) => {
      if (lastRound) {
        io[gameName].roundId = lastRound.id + 1;
      }
    });

  runGame(io, definition);
};
