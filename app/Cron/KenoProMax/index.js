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
    chips: {
      big: { "1": 0, "5": 0, "10": 0, "50": 0, "100": 0, "200": 0, "500": 0 },
      small: { "1": 0, "5": 0, "10": 0, "50": 0, "100": 0, "200": 0, "500": 0 },
      odd: { "1": 0, "5": 0, "10": 0, "50": 0, "100": 0, "200": 0, "500": 0 },
      even: { "1": 0, "5": 0, "10": 0, "50": 0, "100": 0, "200": 0, "500": 0 },
      gold: { "1": 0, "5": 0, "10": 0, "50": 0, "100": 0, "200": 0, "500": 0 },
      wood: { "1": 0, "5": 0, "10": 0, "50": 0, "100": 0, "200": 0, "500": 0 },
      water: { "1": 0, "5": 0, "10": 0, "50": 0, "100": 0, "200": 0, "500": 0 },
      fire: { "1": 0, "5": 0, "10": 0, "50": 0, "100": 0, "200": 0, "500": 0 },
      earth: { "1": 0, "5": 0, "10": 0, "50": 0, "100": 0, "200": 0, "500": 0 },
    },
    realPlayers: {},
    winningPlayers: {},
    players: {},
    disabled: false,
  };

  KenoProMaxPhien.findOne({}, "id", { sort: { _id: -1 } }).then((lastRound) => {
    if (!!lastRound) {
      io.kenoProMax.roundId = lastRound.id + 1;
    }
  });

  runGame(io);
};
