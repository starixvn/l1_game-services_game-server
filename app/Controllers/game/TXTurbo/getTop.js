var TXTurbo_User = require("../../../Models/TXTurbo/TXTurbo_user");
var UserInfo = require("../../../Models/UserInfo");

module.exports = async function (client, data) {
    if (!!data) {
        var taixiu = !!data.taixiu;
        var red = !!data.red;

        var project = { uid: "$uid" };

        if (taixiu) {
            if (red) {
                project.profit = { $subtract: ["$tWinRed", "$tLostRed"] };
            } else {
                project.profit = { $subtract: ["$tWinXu", "$tLostXu"] };
            }
        } else {
            if (red) {
                project.profit = { $subtract: ["$cWinRed", "$cLostRed"] };
            } else {
                project.profit = { $subtract: ["$cWinXu", "$cLostXu"] };
            }
        }

        TXTurbo_User.aggregate([
            { $project: project },
            { $match: { profit: { $gt: 0 } } },
            { $sort: { profit: -1 } },
            { $limit: 10 }
        ]).exec(function (err, result) {
            Promise.all(
                result.map(function (obj) {
                    return new Promise(function (resolve, reject) {
                        UserInfo.findOne({ id: obj.uid }, "name", function (error, result2) {
                            resolve({ name: result2.name, bet: obj.profit });
                        });
                    });
                })
            ).then(function (data) {
                client.red({ taixiu_turbo: { get_top: data } });
            });
        });
    }
};