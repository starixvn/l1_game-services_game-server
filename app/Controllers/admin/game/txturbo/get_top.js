const TXTurbo_User = require('../../../../Models/TXTurbo/TXTurbo_user');
const logger = require('../../../../web/logger');

module.exports = function (client, data) {
    try {
        if (!!data && !!data.page && !!data.sort) {
            var red = !!data.red;
            var page = data.page >> 0;
            var sort = data.sort >> 0;
            var kmess = 10;

            if (page > 0) {
                // Project
                var project = { name: 1 };
                project.uid = '$uid';
                if (red) { // Red
                    project.profitTX = { $subtract: ['$tWinRed', '$tLostRed'] };
                    project.profitCL = { $subtract: ['$cWinRed', '$cLostRed'] };
                    project.tWin = '$tWinRed';
                    project.tLost = '$tLostRed';
                    project.cWin = '$cWinRed';
                    project.cLost = '$cLostRed';
                }

                // sort
                var sort = {};
                if (data.sort == '1') {
                    sort.tWin = 1;
                } else if (data.sort == '2') {
                    sort.tWin = -1;
                } else if (data.sort == '3') {
                    sort.tLost = -1;
                } else if (data.sort == '4') {
                    sort.tLost = 1;
                } else if (data.sort == '5') {
                    sort.profitTX = -1;
                } else if (data.sort == '6') {
                    sort.profitTX = 1;
                }

                var filter = [
                    {
                        '$lookup': {
                            'from': 'userinfos',
                            'localField': 'uid',
                            'foreignField': 'id',
                            'as': 'users'
                        }
                    }, {
                        '$replaceRoot': {
                            'newRoot': {
                                '$mergeObjects': [
                                    {
                                        '$arrayElemAt': [
                                            '$users', 0
                                        ]
                                    }, '$$ROOT'
                                ]
                            }
                        }
                    }, {
                        '$match': {
                            'type': false,
                            'currency': {
                                '$regex': new RegExp('^(?!uus?.).*$', 'i')
                            }
                        }
                    }
                ];
                // count total
                TXTurbo_User.aggregate([...filter, { $count: 'total' }]).exec(function (err, countFind) {
                    if (err) {
                        logger.logError(err);
                    }
                    TXTurbo_User.aggregate([...filter, { $project: project }, { $sort: sort }, { $skip: (page - 1) * kmess }, { $limit: kmess }]).exec(function (err, result) {
                        if (err) {
                            logger.logError(err);
                        }

                        if (result.length) {
                            Promise.all(result.map(function (obj) {
                                return new Promise(function (resolve, reject) {
                                    try {
                                        delete obj._id;
                                        delete obj.uid;
                                        resolve(obj);
                                    } catch (err) {
                                        logger.logError(err);
                                    }
                                })
                            })).then(function (data) {
                                client.red({ taixiu_turbo: { dashboard: { get_users: { data: data, page: page, kmess: kmess, total: countFind[0].total } } } });
                            });
                        } else {
                            client.red({ taixiu_turbo: { dashboard: { get_users: { data: [], page: 1, kmess: 10, total: 0 } } } });
                        }
                    });
                });
            }
        }
    } catch (err) {
        logger.logError(err);
    }
};