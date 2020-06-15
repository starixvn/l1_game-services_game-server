const KenoProVietPhien = require("./../models/KenoProViet_phien");
const Constants = require("./../../constants");
const Logger = require("./../../../../../web/logger");

const runGame = require("./run-game");

module.exports = function (inIO) {
  const io = inIO;

  io.kenoProViet = {
    remainingTime: 0,
    ingame: {},
    totalBets: { ...Constants.defaultBetTracks },
    disabled: false,
  };

  KenoProVietPhien.findOne({}, "id time", { sort: { _id: -1 } })
    .lean()
    .then((lastRound) => {
      if (!!lastRound) {
        io.kenoProViet.roundId = lastRound.id;
        io.kenoProViet.roundStartTime = lastRound.time;
        
        runGame(io);
      } else {
        Logger.log("Could not found latest round of Vietlott", "critical");
      }
    });
};
