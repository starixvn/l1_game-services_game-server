var cloneDeep = require("lodash.clonedeep");

const KenoProMaxPhien = require("./../../Models/KenoProMax/KenoProMax_phien");
const Constants = require("./constants");
const runGame = require("./runGame");

module.exports = function (inIO) {
  let io = inIO;

  io.kenoProMax = {
    roundId: 1,
    remainingTime: 0,
    ingame: {},
    totalBets: { ...Constants.resetTotalBets },
    chips: cloneDeep(Constants.resetChips),
    realPlayers: {},
    winningPlayers: {},
    players: {},
    disabled: false,
    settlementResultFromAdmin: {
      roundId: 0,
      result: [],
    },
  };

  KenoProMaxPhien.findOne({}, "id", { sort: { _id: -1 } }).then((lastRound) => {
    if (!!lastRound) {
      io.kenoProMax.roundId = lastRound.id + 1;
    }
  });

  runGame(io);
};
