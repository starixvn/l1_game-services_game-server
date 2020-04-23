var MiniDragonTiger_phien = require("../../../Models/MiniDragonTiger/MiniDragonTiger_phien");
var MiniDragonTiger_user = require("../../../Models/MiniDragonTiger/MiniDragonTiger_user");
const logger = require('./../../../web/logger');

module.exports = function (client) {
    var data = JSON.parse(JSON.stringify(client.redT.miniDragonTiger));

    data.me = {
        dragon: 0,
        tiger: 0,
        draw: 0
    }

    var active1 = new Promise((resolve, reject) => {
        MiniDragonTiger_phien.find({}, {}, { sort: { _id: -1 }, limit: 30 }, function (err, post) {
            if (post) {
                Promise.all(
                    post.map(function (obj) {
                        return { result: [post.dragon, post.tiger], round: obj.id };
                    })
                ).then(function (arrayOfResults) {
                    resolve(arrayOfResults);
                });
            }
        });
    });

    var active2 = Promise.all(
        Object.keys(client.redT.miniDragonTiger.ingame).map(function (key) {
            try {
                if (client && client.profile && client.profile.name) {
                    if (key == client.profile.name) {
                        let userBet = client.redT.miniDragonTiger.ingame[key];
                        Object.keys(userBet).forEach((box) => {
                            data.me[box] = userBet[box];
                        });
                    }
                }
            } catch (ex) {
                logger.logError(ex);
            }
        })
    );

    var active3 = new Promise((resolve, reject) => {
        MiniDragonTiger_user.findOne({ uid: client.UID }, function (err, data) {
            try {
                if (data) {
                    data = data._doc;
                    delete data._id;
                } else {
                    MiniDragonTiger_user.create({ 'uid': client.UID });
                }
            }
            catch (ex) {
                logger.logError(ex);
            }
            resolve(data);
        })
    });

    Promise.all([active1, active2, active3]).then(values => {
        data.logs = values[0];
        client.red({ mini: { dragon_tiger: data } });
    });
};