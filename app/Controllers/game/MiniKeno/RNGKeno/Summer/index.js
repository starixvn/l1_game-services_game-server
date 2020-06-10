const baseIndex = require("./../Base/index");

const definition = require("./definition");

module.exports = (player, payload) => baseIndex(definition, player, payload);
