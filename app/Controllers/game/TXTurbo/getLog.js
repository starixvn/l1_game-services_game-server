var TXTurboPhien = require("../../../Models/TXTurbo/TXTurbo_phien");
var TXTurboCuoc = require("../../../Models/TXTurbo/TXTurbo_cuoc");

module.exports = function (client, data) {
    if (!!data && !!data.page) {
        var page = data.page >> 0;
        var kmess = 9;
        if (page > 0) {
            TXTurboCuoc.countDocuments({ uid: client.UID, thanhtoan: true }).exec(function (
                err,
                total
            ) {
                var getCuoc = TXTurboCuoc.find(
                    { uid: client.UID, thanhtoan: true },
                    {},
                    { sort: { _id: -1 }, skip: (page - 1) * kmess, limit: kmess },
                    function (error, result) {
                        if (result.length) {
                            Promise.all(
                                result.map(function (obj) {
                                    obj = obj._doc;
                                    var getPhien = TXTurboPhien.findOne({ id: obj.phien }).exec();
                                    return Promise.all([getPhien]).then(values => {
                                        Object.assign(obj, values[0]._doc);
                                        delete obj.__v;
                                        delete obj._id;
                                        delete obj.thanhtoan;
                                        delete obj.id;
                                        delete obj.uid;
                                        return obj;
                                    });
                                })
                            ).then(function (arrayOfResults) {
                                client.red({
                                    taixiu_turbo: {
                                        get_log: {
                                            data: arrayOfResults,
                                            page: page,
                                            kmess: kmess,
                                            total: total
                                        }
                                    }
                                });
                            });
                        } else {
                            client.red({
                                taixiu_turbo: {
                                    get_log: { data: [], page: page, kmess: kmess, total: 0 }
                                }
                            });
                        }
                    }
                );
            });
        }
    }
};