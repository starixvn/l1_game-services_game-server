const KenoProVietPhien = require("./../models/KenoProViet_phien");
const Constants = require("./../constants");

const runGame = require("./run-game");

module.exports = function (inIO) {
  const io = inIO;

  io.kenoProViet = {
    roundId: 1,
    remainingTime: 0,
    ingame: {},
    totalBets: { ...Constants.resetTotalBets },
    disabled: false,
  };

  KenoProVietPhien.findOne({}, "id", { sort: { _id: -1 } }).then((lastRound) => {
    if (!!lastRound) {
      io.kenoProViet.roundId = lastRound.id + 1;
    }
  });

  runGame(io);
};
