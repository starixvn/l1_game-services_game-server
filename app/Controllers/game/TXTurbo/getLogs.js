var TXTurboPhien = require("../../../Models/TXTurbo/TXTurbo_phien");
var TXTurbo_User = require("../../../Models/TXTurbo/TXTurbo_user");
const logger = require('./../../../web/logger');

module.exports = function (client) {
    var data = JSON.parse(JSON.stringify(client.redT.taixiu_turbo));

    data.taixiu.red_me_tai = 0;
    data.taixiu.red_me_xiu = 0;

    var active1 = new Promise((resolve, reject) => {
        TXTurboPhien.find({}, {}, { sort: { _id: -1 }, limit: 125 }, function (err, post) {
            if (post) {
                Promise.all(
                    post.map(function (obj) {
                        return { dice: [obj.dice1, obj.dice2, obj.dice3], phien: obj.id };
                    })
                ).then(function (arrayOfResults) {
                    resolve(arrayOfResults);
                });
            }
        });
    });

    var active2 = new Promise((resolve, reject) => {
        TXTurbo_User.findOne(
            { uid: client.UID },
            "tLineWinRed tLineLostRed tLineWinXu tLineLostXu cLineWinRed cLineLostRed cLineWinXu cLineLostXu tLineWinRedH tLineLostRedH tLineWinXuH tLineLostXuH cLineWinRedH cLineLostRedH cLineWinXuH cLineLostXuH",
            function (err, data) {
                try {
                    if (data) {
                        data = data._doc;
                        delete data._id;
                    } else {
                        TXTurbo_User.create({ 'uid': client.UID });
                    }
                }
                catch (ex) {
                    logger.logError(ex);
                }
                resolve(data);
            }
        );
    });

    var active3 = Promise.all(
        client.redT.taixiuTurboAdmin.list.map(function (game) {
            try {
                if (client && client.profile && client.profile.name) {
                    if (game.name == client.profile.name) {
                        if (game.taixiu) {
                            if (game.red) {
                                if (game.select) {
                                    data.taixiu.red_me_tai += game.bet;
                                } else {
                                    data.taixiu.red_me_xiu += game.bet;
                                }
                            }
                        }
                    }
                }
            }
            catch (ex) {
                logger.logError(ex);
            }
        })
    );

    Promise.all([active1, active2, active3]).then(values => {
        data.logs = values[0];
        data.du_day = values[1];
        client.red({ taixiu_turbo: data });
    });
};