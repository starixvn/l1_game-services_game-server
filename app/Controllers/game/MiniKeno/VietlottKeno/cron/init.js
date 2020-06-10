const KenoProVietPhien = require("./../models/KenoProViet_phien");
const Constants = require("./../constants");
const Logger = require("./../../../../../web/logger");

const runGame = require("./run-game");

module.exports = function (inIO) {
  const io = inIO;

  io.kenoProViet = {    
    remainingTime: 0,
    ingame: {},
    totalBets: { ...Constants.resetTotalBets },
    disabled: false,
  };

  KenoProVietPhien.findOne({}, "id", { sort: { _id: -1 } }).then((lastRound) => {
    if (!!lastRound) {
      io.kenoProViet.roundId = lastRound.id;

      runGame(io);
    }else{
      Logger.log("Could not found latest round of Vietlott", "critical");
    }
  });
};
