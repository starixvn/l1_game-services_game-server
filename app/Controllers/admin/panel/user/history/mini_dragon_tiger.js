
let MiniDragonTiger_cuoc = require('../../../../../Models/MiniDragonTiger/MiniDragonTiger_cuoc');
let XocXoc_phien = require('../../../../../Models/MiniDragonTiger/MiniDragonTiger_phien');

module.exports = function (client, data) {
    if (!!data.page) {
        let page = data.page >> 0;
        if (page > 0) {
            let kmess = 8;
            MiniDragonTiger_cuoc.countDocuments({ uid: data.id, red: true, thanhtoan: true }).exec(function (err, total) {
                MiniDragonTiger_cuoc.find({ uid: data.id, red: true, thanhtoan: true }, {}, { sort: { '_id': -1 }, skip: (page - 1) * kmess, limit: kmess }, function (err, result) {
                    if (result.length) {
                        Promise.all(result.map(function (obj) {
                            obj = obj._doc;
                            return new Promise((ra, loi) => {
                                XocXoc_phien.findOne({ id: obj.phien }).exec(function (err, dataPhien) {
                                    if (dataPhien) {
                                        obj.kq = [dataPhien.dragon, dataPhien.tiger];
                                    }
                                    delete obj.__v;
                                    delete obj._id;
                                    delete obj.thanhtoan;
                                    delete obj.uid;
                                    delete obj.red;
                                    ra(obj);
                                });
                            }).then(values => {
                                return values;
                            });
                        })).then(function (arrayOfResults) {
                            client.red({ users: { mini_dragon_tiger: { data: arrayOfResults, page: page, kmess: kmess, total: total } } });
                        })
                    } else {
                        client.red({ user: { mini_dragon_tiger: { data: [], page: page, kmess: kmess, total: 0 } } });
                    }
                });
            })
        }
    }
};
