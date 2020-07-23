const TaiXiu_User = require("../../../Models/TaiXiu_user");
const UserInfo = require("../../../Models/UserInfo");

module.exports = function (client) {
  const topWin = TaiXiu_User.aggregate([
    { $match: { tLineWinRedH: { $gt: 0 } } },
    {
      $project: {
        uid: "$uid",
        top: "$tLineWinRedH",
        last: "$last",
      },
    },
    { $sort: { top: -1, last: -1 } },
    { $limit: 20 },
  ]).exec();

  const topLost = TaiXiu_User.aggregate([
    { $match: { tLineLostRedH: { $gt: 0 } } },
    {
      $project: {
        uid: "$uid",
        top: "$tLineLostRedH",
        last: "$last",
      },
    },
    { $sort: { top: -1, last: -1 } },
    { $limit: 20 },
  ]).exec();

  Promise.all([topWin, topLost]).then((result) => {
    let win = new Promise(function (resolveH, rejectTH) {
      Promise.all(
        result[0].map(function (obj) {
          return new Promise(function (resolve, reject) {
            UserInfo.findOne({ id: obj.uid }, "name", function (error, user) {
              delete obj._id;
              delete obj.uid;
              if (!!user) {
                obj["name"] = user.name;
              }
              resolve(obj);
            });
          });
        })
      ).then((usersWin) => {
        resolveH(usersWin);
      });
    });

    let lost = new Promise(function (resolveTH, rejectTH) {
      Promise.all(
        result[1].map(function (obj) {
          return new Promise(function (resolve, reject) {
            UserInfo.findOne({ id: obj.uid }, "name", function (error, user) {
              delete obj._id;
              delete obj.uid;
              if (!!user) {
                obj["name"] = user.name;
              }
              resolve(obj);
            });
          });
        })
      ).then((usersLost) => {
        resolveTH(usersLost);
      });
    });
    Promise.all([win, lost]).then((resultH) => {
      win = resultH[0];
      client.red({ event: { taixiu: { topHT: { win: resultH[0], lost: resultH[1] } } } });
    });
  });
};
