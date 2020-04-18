var TXTurbo_User = require("../../../Models/TXTurbo/TXTurbo_user");

const balanceApi = require('../../../apis/balanceApi');

module.exports = function (client) {
    var active1 = new Promise((resolve, reject) => {
        balanceApi.getBalance({ id: client.UID }, client, function (user) {
            if (!user) return reject("Cannot find member");
            resolve(user);
        });
    });
    var active2 = new Promise((resolve, reject) => {
        TXTurbo_User.findOne(
            { uid: client.UID },
            "tLineWinRed tLineLostRed tLineWinXu tLineLostXu cLineWinRed cLineLostRed cLineWinXu cLineLostXu tLineWinRedH tLineLostRedH tLineWinXuH tLineLostXuH cLineWinRedH cLineLostRedH cLineWinXuH cLineLostXuH",
            function (err, data) {
                if (err) return reject(err);
                resolve(data);
            }
        );
    });

    Promise.all([active1, active2]).then(values => {
        client.red({ user: values[0], taixiu_turbo: { du_day: values[1] } });
    });
};
