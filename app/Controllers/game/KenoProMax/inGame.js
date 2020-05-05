
let KenoProMaxPhien = require('../../../Models/KenoProMax/KenoProMax_phien');
let KenoProMaxCuoc = require('../../../Models/KenoProMax/KenoProMax_cuoc');
let UserInfo = require('../../../Models/UserInfo');
const logger = require('../../../web/logger');

module.exports = function (client) {
    let kenoProMax = client.redT.kenoProMax;
    if (kenoProMax.clients[client.UID] === client) {
        let phien = kenoProMax.phien;
        // Lấy thông tin phòng
        let data = {};
        data.time = kenoProMax.time;
        data.data = kenoProMax.data;

        var getLogs = new Promise((resolve, reject) => {
            KenoProMaxPhien.find({}, 'id red1 red2 red3 red4', { sort: { '_id': -1 }, limit: 48 }, function (err, logs) {
                if (err) {
                    logger.logError(err);
                }

                if (logs) {
                    Promise.all(logs.map(function (log) {
                        return { round: log.id, dots: [log.red1, log.red2, log.red3, log.red4] };
                    })).then(function (result) {
                        resolve(result);
                    }).catch(function (err) {
                        logger.logError(err);
                    });
                }
            });
        });

        var getBets = new Promise((resolve, reject) => {
            KenoProMaxCuoc.find({ phien: phien }, 'bet type', { sort: { '_id': -1 } }, function (err, phiens) {
                if (err) {
                    logger.logError(err);
                }

                if (phiens) {
                    Promise.all(phiens.map(function (phien) {
                        phien = phien._doc;
                        delete phien._id;
                        return phien;
                    })).then(function (result) {
                        resolve(result);
                    }).catch(function (err) {
                        logger.logError(err);
                    });
                }
            });
        });

        var getUserInfo = new Promise((resolve, reject) => {
            UserInfo.findOne({ id: client.UID }, 'red avatarId', function (err, user) {
                if (err) {
                    logger.logError(err);
                }

                Promise.all([user]).then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    logger.logError(err);
                });
            });
        })

        Promise.all([getLogs, getBets, getUserInfo]).then(values => {
            data.logs = values[0];
            data.cuoc = values[1];
            data.me = {};
            if (kenoProMax.ingame[client.profile.name]) {
                data.me = kenoProMax.ingame[client.profile.name]
            }
            let user = values[2][0];
            let player = { id: client.UID, name: client.profile.name, red: user.red, avatarId: user.avatarId };
            data.players = { ...kenoProMax.players };
            delete data.players[client.UID];

            if (!kenoProMax.players[player.id]) {
                kenoProMax.players[player.id] = player;
            }

            client.red({ kenoProMax: { ingame: data } });

            Object.values(kenoProMax.clients).forEach(function (users) {
                if (client !== users) {
                    users.red({ kenoProMax: { ingame: { player: player } } });
                }
            });

            values = null;
            data = null;
            client = null;
            kenoProMax = null;
        }).catch(function (err) {
            logger.logError(err);
        });
    } else {
        // trở lại màn hình trang chủ
        client.red({ toGame: 'MainGame' });
        client = null;
        kenoProMax = null;
    }
};
