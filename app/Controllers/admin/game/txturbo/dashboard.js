
const TXTurbo_User = require('../../../../Models/TXTurbo/TXTurbo_user');
const UserInfo = require('../../../../Models/UserInfo');
const logger = require('../../../../web/logger');

module.exports = function (client, red) {
    red = !!red;
    var waitTX_Win = new Promise((a, b) => {
        TXTurbo_User.find({}, 'uid tLineWinRed tLineWinRedH', { sort: { 'tLineWinRedH': -1 }, limit: 50 }, function (err, data) {
            if (err) {
                logger.logError(err);
            }

            if (data) {
                Promise.all(data.map(function (obj) {
                    try {
                        obj = obj._doc;
                        var getUser = UserInfo.findOne({ id: obj.uid }, 'name').exec();
                        return Promise.all([getUser]).then(values => {
                            Object.assign(obj, values[0]._doc);
                            delete obj.__v;
                            delete obj._id;
                            delete obj.uid;
                            return obj;
                        });
                    } catch (err) {
                        logger.logError(err);
                    }
                })).then(function (arrayOfResults) {
                    a(arrayOfResults);
                });
            }
        });
    });
    var waitTX_Lost = new Promise((a, b) => { // Top 50 Dây Thua tài xỉu hiện tại
        TXTurbo_User.find({}, 'uid tLineLostRed tLineLostRedH', { sort: { 'tLineLostRedH': -1 }, limit: 50 }, function (err, data) {
            if (err) {
                logger.logError(err);
            }

            Promise.all(data.map(function (obj) {
                try {
                    obj = obj._doc;
                    var getUser = UserInfo.findOne({ id: obj.uid }, 'name').exec();
                    return Promise.all([getUser]).then(values => {
                        Object.assign(obj, values[0]._doc);
                        delete obj.__v;
                        delete obj._id;
                        delete obj.uid;
                        return obj;
                    });
                } catch (err) {
                    logger.logError(err);
                }
            })).then(function (arrayOfResults) {
                a(arrayOfResults);
            });
        });
    });
    Promise.all([waitTX_Win, waitTX_Lost]).then(values => {
        client.red({ taixiu_turbo: { dashboard: { dTXWin: values[0], dTXLost: values[1] } } });
    });
};