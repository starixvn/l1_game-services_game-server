var MiniSediePhien = require("./models/MiniSedie_phien");
var MiniSedieUser = require("./models/MiniSedie_user");
const logger = require('./../../../web/logger');

module.exports = (client) => {
    let data = { me: { dragon: 0, tiger: 0, tie: 0 } };

    var active1 = new Promise((resolve, reject) => {
        MiniSediePhien.find({}, {}, { sort: { _id: -1 }, limit: 100 }, function (err, post) {
            if (post) {
                Promise.all(
                    post.map(function (obj) {
                        return { result: [obj.red1, obj.red2, obj.red3, obj.red4], round: obj.id };
                    })
                ).then(function (arrayOfResults) {
                    resolve(arrayOfResults);
                });
            }
        });
    });

    var active2 = Promise.all(
        Object.keys(client.redT.miniSedie.ingame).map(function (key) {
            try {
                if (client && client.profile && client.profile.name) {
                    if (key == client.profile.name) {
                        let userBet = client.redT.miniSedie.ingame[key];
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
        MiniSedieUser.findOne({ uid: client.UID }, function (err, data) {
            try {
                if (data) {
                    data = data._doc;
                    delete data._id;
                } else {
                    MiniSedieUser.create({ 'uid': client.UID });
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
        client.red({ miniSedie: data });
    });
};