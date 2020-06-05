const Constants = require("./../constants");

const runGame = require("./run-game");

module.exports = (io, definition, roundRepository, singleBetRepository, sumBetRepository) => {
  const gameName = definition.name;

  io[gameName] = {
    roundId: 1,
    remainingTime: 0,
    ingame: {},
    totalBets: { ...Constants.resetTotalBets },
    disabled: false,
    settlementResultFromAdmin: {},
  };

  roundRepository.findOne({}, "id", { sort: { _id: -1 } }).then((lastRound) => {
    if (lastRound) {
      io[gameName].roundId = lastRound.id + 1;
    }
  });

  runGame(io, definition, roundRepository, singleBetRepository, sumBetRepository);
};
