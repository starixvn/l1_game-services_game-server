const cloneDeep = require("lodash.clonedeep");
const MiniSediePhien = require("../models/MiniSedie_phien");
const constants = require("../constants");
const runGame = require("./run-game");

module.exports = function (inIO) {
    let io = inIO;

    io.miniSedie = {
        roundId: 1,
        remainingTime: 0,
        ingame: {},
        totalBets: { ...constants.resetTotalBets },
        chips: cloneDeep(constants.resetChips),
        disabled: false,
    };

    MiniSediePhien.findOne({}, "id", { sort: { _id: -1 } }).then((lastRound) => {
        if (!!lastRound) {
            io.miniSedie.roundId = lastRound.id + 1;
        }
    });

    runGame(io);
};
