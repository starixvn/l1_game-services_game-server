const MiniBaccaratSession = require('../../Models/MiniBaccarat/mini-baccarat-phien')
const startGame = require("./game-handler");

module.exports = (io) => {
    io.miniBaccarat = {
        phien: 1,
        time: 0,
        ingame: {},
        data: { player: {}, banker: {} }
    }

    MiniBaccaratSession.findOne({}, 'id', { sort: { '_id': -1 } })
        .then(last => {
            if (!!last) {
                io.miniBaccarat.phien = last.id + 1;
            }

            startGame(io);
        });
}