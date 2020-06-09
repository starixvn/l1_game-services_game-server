const baseBetQueue = require("./../Base/process-bet-queue");

const definition = require("./definition");

module.exports = (io) => baseBetQueue(io, definition);
