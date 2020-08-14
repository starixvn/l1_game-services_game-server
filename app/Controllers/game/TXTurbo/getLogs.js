const TXTurboPhien = require("../../../Models/TXTurbo/TXTurbo_phien");
const logger = require("./../../../web/logger");

module.exports = function (client) {
  const data = JSON.parse(JSON.stringify(client.redT.taixiu_turbo));

  data.taixiu.red_me_tai = 0;
  data.taixiu.red_me_xiu = 0;

  const active1 = new Promise((resolve, reject) => {
    TXTurboPhien.find({}, {}, { sort: { _id: -1 }, limit: 125 }, function (err, post) {
      if (post) {
        Promise.all(
          post.map(function (obj) {
            return { dice: [obj.dice1, obj.dice2, obj.dice3], phien: obj.id };
          })
        ).then(function (arrayOfResults) {
          resolve(arrayOfResults);
        });
      }
    });
  });

  const active3 = Promise.all(
    client.redT.taixiuTurboAdmin.list.map(function (game) {
      try {
        if (client && client.profile && client.profile.name) {
          if (game.name == client.profile.name) {
            if (game.taixiu) {
              if (game.red) {
                if (game.select) {
                  data.taixiu.red_me_tai += game.bet;
                } else {
                  data.taixiu.red_me_xiu += game.bet;
                }
              }
            }
          }
        }
      } catch (ex) {
        logger.logError(ex);
      }
    })
  );

  Promise.all([active1, active3]).then((values) => {
    data.logs = values[0];
    client.red({ taixiu_turbo: data });
  });
};
