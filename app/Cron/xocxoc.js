let fs = require('fs');
let Helpers = require('../Helpers/Helpers');

let UserInfo = require('../Models/UserInfo');
let XocXoc_phien = require('../Models/XocXoc/XocXoc_phien');
let XocXoc_cuoc = require('../Models/XocXoc/XocXoc_cuoc');
let XocXoc_user = require('../Models/XocXoc/XocXoc_user');

let bot = require('./xocxoc/bot');
let botList = [];
let io = null;
let gameLoop = null;

let init = function (obj) {
    io = obj;
    let initRed = {
        chan: 0,
        le: 0,
        red3: 0,
        red4: 0,
        white3: 0,
        white4: 0
    };
    io.xocxoc = { ingame: [] };
    io.xocxoc.phien = 1;
    io.xocxoc.data = {};
    io.xocxoc.data.red = initRed;
    io.xocxoc.dataAdmin = {};
    io.xocxoc.dataAdmin.red = initRed;

    XocXoc_phien.findOne({}, 'id', { sort: { '_id': -1 } }, function (err, last) {
        if (!!last) {
            io.xocxoc.phien = last.id + 1;
        }

        playGame();
    });
};

let playGame = function () {
    io.game.xocxoc.time = 71;

    gameLoop = setInterval(function () {
        io.game.xocxoc.time--;
        if (io.game.xocxoc.time <= 60) {
            if (io.game.xocxoc.time < 0) {
                clearInterval(gameLoop);
                io.game.xocxoc.time = 0;

                fs.readFile('./data/xocxoc.json', 'utf8', (errjs, bcjs) => {
                    try {
                        bcjs = JSON.parse(bcjs);
                    } catch (error) { };
                });
            }
        }
    });
};

module.exports = init;

