
var MiniSedieCuoc = require('./models/MiniSedie_cuoc');
var MiniSediePhien = require('./models/MiniSedie_phien');
const logger = require('../../../web/logger');

module.exports = function (client, data) {
    if (!!data && !!data.page) {
        var page = data.page >> 0; // trang
        if (page < 1) {
            client.red({ notice: { text: 'DỮ LIỆU KHÔNG ĐÚNG...', title: 'THẤT BẠI' } });
        } else {
            var kmess = 8;
            MiniSedieCuoc.countDocuments({ uid: client.UID, red: true, thanhtoan: true }).exec(function (err, total) {
                if (err) {
                    logger.logError(err);
                    return;
                }
                MiniSedieCuoc.find({ uid: client.UID, red: true, thanhtoan: true }, {},
                    { sort: { '_id': -1 }, skip: (page - 1) * kmess, limit: kmess },
                    function (err, result) {
                        if (err) {
                            logger.logError(err);
                            return;
                        }
                        if (result.length) {
                            Promise.all(result.map(function (obj) {
                                obj = obj._doc;
                                var getPhien = MiniSediePhien.findOne({ id: obj.phien }).exec();
                                return Promise.all([getPhien])
                                    .then(values => {
                                        obj.kq = [values[0].red1, values[0].red2, values[0].red3, values[0].red4];
                                        delete obj.__v;
                                        delete obj._id;
                                        delete obj.thanhtoan;
                                        delete obj.uid;
                                        delete obj.red;
                                        return obj;
                                    })
                                    .catch(promiseErr => logger.logError(promiseErr));
                            })).then(function (arrayOfResults) {
                                client.red({ miniSedie: { viewlogs: { data: arrayOfResults, page: page, kmess: kmess, total: total } } });
                            }).catch(promiseErr => logger.logError(promiseErr));
                        } else {
                            client.red({ miniSedie: { viewlogs: { data: [], page: page, kmess: kmess, total: 0 } } });
                        }
                    });
            })
        }
    }
};
