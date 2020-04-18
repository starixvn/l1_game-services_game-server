var ChanLeTurboPhien = require("../../../Models/ChanLeTurbo/ChanLeTurbo_phien");
var ChanLeTurboCuoc = require("../../../Models/ChanLeTurbo/ChanLeTurbo_cuoc");
var ChanLeTurbo_User = require("../../../Models/ChanLeTurbo/ChanLeTurbo_user");
var ChanLeTurboCuocOne = require("../../../Models/ChanLeTurbo/ChanLeTurbo_one");
var UserInfo = require("../../../Models/UserInfo");

const balanceApi = require('./../../../apis/balanceApi');
const gameIds = require('./../../../../config/appConfigs').gameIds;
const betChoiceMapper = require('./../../../apis/betChoiceMapper');
const logger = require('./../../../web/logger');
const ConfigHelper = require('./../../../Helpers/ConfigHelper');

let configs = null;

function getLogs(client) {
  var data = JSON.parse(JSON.stringify(client.redT.clturbo));

  data.clturbo.red_me_chan = 0;
  data.clturbo.red_me_le = 0;

  var active1 = new Promise((resolve, reject) => {
    ChanLeTurboPhien.find({}, {}, { sort: { _id: -1 }, limit: 125 }, function (err, post) {
      if (err) {
        logger.logError(err);
        resolve([]);
        return;
      }

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

  var active2 = new Promise((resolve, reject) => {
    ChanLeTurbo_User.findOne(
      { uid: client.UID },
      "tLineWinRed tLineLostRed tLineWinXu tLineLostXu cLineWinRed cLineLostRed cLineWinXu cLineLostXu tLineWinRedH tLineLostRedH tLineWinXuH tLineLostXuH cLineWinRedH cLineLostRedH cLineWinXuH cLineLostXuH",
      function (err, data) {
        try {
          if (data) {
            data = data._doc;
            delete data._id;
          }
          else {
            ChanLeTurbo_User.create({ uid: client.UID });
          }
        }
        catch (ex) {
          logger.logError(ex);
        }
        resolve(data);
      }
    );
  });

  var active3 = Promise.all(
    client.redT.clturboAdmin.list.map(function (game) {
      try {
        if (client && client.profile && client.profile.name) {
          if (game.name == client.profile.name) {
            if (game.select) {
              data.clturbo.red_me_chan += game.bet;
            } else {
              data.clturbo.red_me_le += game.bet;
            }
          }
        }
      }
      catch (ex) {
        logger.logError(ex);
      }
    })
  );

  Promise.all([active1, active2, active3]).then(values => {
    data.logs = values[0];
    data.du_day = values[1];
    client.red({ clturbo: data });
  });
}

function getNew(client) {
  var active1 = new Promise((resolve, reject) => {
    balanceApi.getBalance({ id: client.UID }, client, function (user) {
      if (!user) return reject("Cannot find member");
      resolve(user);
    });
  });
  var active2 = new Promise((resolve, reject) => {
    ChanLeTurbo_User.findOne(
      { uid: client.UID },
      "tLineWinRed tLineLostRed tLineWinXu tLineLostXu cLineWinRed cLineLostRed cLineWinXu cLineLostXu tLineWinRedH tLineLostRedH tLineWinXuH tLineLostXuH cLineWinRedH cLineLostRedH cLineWinXuH cLineLostXuH",
      function (err, data) {
        if (err) return reject(err);
        resolve(data);
      }
    );
  });

  Promise.all([active1, active2]).then(values => {
    client.red({ user: values[0], clturbo: { du_day: values[1] } });
  });
}

var cuoc = function (client, data) {
  try {
    if (!!data && !!data.bet) {

      configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.CLTurbo);

      if (client.redT.ChanLeTurbo_time < 6 || client.redT.ChanLeTurbo_time > 50) {
        client.red({ clturbo: { err: "Vui lòng đặt cược ở phiên sau." } });
      } else {
        var bet = data.bet >> 0; // Số tiền
        var red = true;
        var select = !!data.select; // Cửa đặt (Tài:1, Xỉu:0)
        //console.log(bet);
        if (bet < configs.minbet) {
          client.red({ clturbo: { err: "Tiền cược tối thiểu là " + configs.minbet } });
        } else if (bet > configs.maxbet) {
          client.red({ clturbo: { err: "Tiền cược tối đa là " + configs.maxbet } });
        }
        else {
          var phien = client && client.redT ? client.redT.ChanLeTurbo_phien : 0;
          data.inSufficientBalance = { clturbo: { err: "Bạn hiện không có đủ tiền để cược." } };
          data.gameId = gameIds.clturbo;
          data.gameRoundId = phien;
          data.choiceId = betChoiceMapper.convertChanLe(select);
          data.cuoc = bet;
          var isUUSAccount = client.session
            && client.session.currency
            && client.session.currency.toUpperCase() === 'UUS';
          UserInfo.findOne({ id: client.UID }, red ? 'red name' : 'xu name', function (err, userInfo) {

            if (err) {
              logger.logError(err);
            }

            balanceApi.placeBet({ id: client.UID }, data, client, (user, { }, updateUserRed) => {

              ChanLeTurboCuocOne.findOne({ uid: client.UID, phien: phien, red: red }, function (isCuocErr, isCuoc) {

                if (isCuocErr) {
                  logger.logError(err);
                }

                try {
                  user.name = userInfo.name;
                  if (!!isCuoc) {
                    // update
                    if (isCuoc.select !== select) { client.red({ clturbo: { err: "Chỉ được cược 1 bên." } }); }
                    else if (isCuoc.bet + bet > configs.maxbet) {
                      client.red({ clturbo: { err: "Tiền cược tối đa là " + configs.maxbet } });
                    } else {
                      var io = client.redT;

                      io.clturboAdmin.list.unshift({
                        name: user.name,
                        select: select,
                        red: red,
                        bet: bet,
                        time: new Date()
                      });

                      updateUserRed((updatedUser) => {
                        ChanLeTurboCuocOne.updateOne({ uid: client.UID, phien: phien, red: red, select: select }, { $inc: { bet: bet } }).exec();
                        let create = { uid: client.UID, name: user.name, phien: phien, bet: bet, select: select, red: red, time: new Date() };
                        if (client.session) {
                          create.memberId = client.session.memberId;
                          create.siteId = client.session.siteId;
                        }
                        ChanLeTurboCuoc.create(create);

                        if (red && !isUUSAccount) {
                          if (select) {
                            io.clturbo.clturbo.red_chan += bet;
                            io.clturboAdmin.clturbo.red_chan += bet;
                          } else {
                            io.clturbo.clturbo.red_le += bet;
                            io.clturboAdmin.clturbo.red_le += bet;
                          }
                        }

                        var clturboVery = select ? { red_me_chan: isCuoc.bet * 1 + bet } : { red_me_le: isCuoc.bet * 1 + bet };

                        clturboVery = { clturbo: clturboVery };

                        if (!!client.redT.users[client.UID]) {
                          Promise.all(
                            client.redT.users[client.UID].map(function (obj) {
                              obj.red({
                                clturbo: clturboVery,
                                user: { red: updatedUser.red }
                              });
                            })
                          );
                        }
                      });

                    }
                  } else {
                    // cuoc
                    var io = client.redT;

                    io.clturboAdmin.list.unshift({ name: user.name, select: select, red: red, bet: bet, time: new Date() });

                    updateUserRed((updatedUser) => {
                      let cuocOneCreate = { uid: client.UID, phien: phien, select: select, red: red, bet: bet };
                      if (client.session) {
                        cuocOneCreate.memberId = client.session.memberId;
                        cuocOneCreate.siteId = client.session.siteId;
                      }

                      if (red && !isUUSAccount) {
                        if (select) {
                          io.clturbo.clturbo.red_chan += bet;
                          io.clturbo.clturbo.red_player_chan += 1;

                          io.clturboAdmin.clturbo.red_chan += bet;
                          io.clturboAdmin.clturbo.red_player_chan += 1;
                        } else {
                          io.clturbo.clturbo.red_le += bet;
                          io.clturbo.clturbo.red_player_le += 1;

                          io.clturboAdmin.clturbo.red_le += bet;
                          io.clturboAdmin.clturbo.red_player_le += 1;
                        }
                      }

                      ChanLeTurboCuocOne.create(cuocOneCreate);

                      let obj = { uid: client.UID, name: user.name, phien: phien, bet: bet, select: select, red: red, time: new Date() };
                      if (client.session) {
                        obj.memberId = client.session.memberId;
                        obj.siteId = client.session.siteId;
                      }
                      ChanLeTurboCuoc.create(obj);

                      var clturboVery = select ? { red_me_chan: bet } : { red_me_le: bet };

                      clturboVery = { clturbo: clturboVery };

                      if (!!client.redT.users[client.UID]) {
                        Promise.all(
                          client.redT.users[client.UID].map(function (obj) {
                            obj.red({ clturbo: clturboVery, user: { red: updatedUser.red } });
                          })
                        );
                      }
                    });

                  }
                } catch (ex) {
                  logger.logError(ex);
                }
              }
              );
            });
          });
        }
      }
    }
  } catch (ex) {
    logger.logError(ex);
  }
};

var get_phien = function (client, data) {
  try {

    if (!!data && !!data.phien) {
      var phien = data.phien >> 0;

      var getPhien = ChanLeTurboPhien.findOne({ id: phien }).exec();
      let uusUser = UserInfo.find({ currency: { $regex: /uus/, $options: 'i' } }).exec();
      var getCuoc = ChanLeTurboCuoc.find(
        { phien: phien },
        null,
        { sort: { _id: 1 } }
      ).exec();

      var tong_L = 0;
      var tong_R = 0;
      var tong_tralai_L = 0;
      var tong_tralai_R = 0;

      Promise.all([getPhien, getCuoc, uusUser]).then(values => {
        if (!!values[0]) {
          var infoPhienCuoc = values[0];
          var phienCuoc = values[1];
          let uusUsers = values[2];

          phienCuoc = phienCuoc.filter(function (obj) {
            return !uusUsers || uusUsers.filter((uusUser) => { return uusUser.id === obj.uid }).length == 0;
          });

          var dataT = {};
          dataT["phien"] = phien;
          dataT["time"] = infoPhienCuoc.time;
          dataT["dice"] = [
            infoPhienCuoc.dice1,
            infoPhienCuoc.dice2,
            infoPhienCuoc.dice3
          ];
          var dataL = new Promise((resolve, reject) => {
            Promise.all(
              phienCuoc.filter(function (obj) {
                if (obj.select) {
                  tong_L += obj.bet;
                  tong_tralai_L += obj.tralai;
                } else {
                  tong_R += obj.bet;
                  tong_tralai_R += obj.tralai;
                }
                return obj.select == 1;
              })
            ).then(function (arrayOfResults) {
              resolve(arrayOfResults);
            });
          });
          var dataR = new Promise((resolve, reject) => {
            Promise.all(
              phienCuoc.filter(function (obj) {
                return obj.select == 0;
              })
            ).then(function (arrayOfResults) {
              resolve(arrayOfResults);
            });
          });
          Promise.all([dataL, dataR]).then(result => {
            dataT["tong_L"] = tong_L;
            dataT["tong_R"] = tong_R;
            dataT["tong_tralai_L"] = tong_tralai_L;
            dataT["tong_tralai_R"] = tong_tralai_R;
            dataT["dataL"] = result[0];
            dataT["dataR"] = result[1];
            client.red({ clturbo: { get_phien: dataT } });
          });
        } else {
          client.red({
            notice: { title: "LỖI", text: "Phiên không tồn tại...", load: false }
          });
        }
      });
    }
  } catch (error) {
    logger.logError(error);
  }
};

var get_log = function (client, data) {
  if (!!data && !!data.page) {
    var page = data.page >> 0;
    var kmess = 9;
    if (page > 0) {
      ChanLeTurboCuoc.countDocuments({ uid: client.UID, thanhtoan: true }).exec(function (err, total) {
        var getCuoc = ChanLeTurboCuoc.find(
          { uid: client.UID, thanhtoan: true },
          {},
          { sort: { _id: -1 }, skip: (page - 1) * kmess, limit: kmess },
          function (error, result) {
            if (result.length) {
              Promise.all(
                result.map(function (obj) {
                  obj = obj._doc;
                  var getPhien = ChanLeTurboPhien.findOne({ id: obj.phien }).exec();
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
                  clturbo: {
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
                clturbo: {
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

var get_top = async function (client, data) {
  if (!!data) {
    var project = { uid: "$uid" };

    project.profit = { $subtract: ["$cWinRed", "$cLostRed"] };

    ChanLeTurbo_User.aggregate([
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
        client.red({ clturbo: { get_top: data } });
      });
    });
  }
};

module.exports = {
  getLogs: getLogs,
  cuoc: cuoc,
  get_phien: get_phien,
  get_log: get_log,
  get_top: get_top,
  getNew: getNew
};
