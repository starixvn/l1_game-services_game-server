const baseInit = require("./../Base/cron/init");

const definition = require("./definition");

module.exports = (io) => baseInit(io, definition);
