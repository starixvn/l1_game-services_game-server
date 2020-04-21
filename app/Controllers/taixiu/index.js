var TXPhien = require("../../Models/TaiXiu_phien");
var TXCuoc = require("../../Models/TaiXiu_cuoc");
var TXChat = require("../../Models/TaiXiu_chat");
var TaiXiu_User = require("../../Models/TaiXiu_user");
var TXCuocOne = require("../../Models/TaiXiu_one");
var UserInfo = require("../../Models/UserInfo");
var validator = require("validator");

const balanceApi = require('./../../apis/balanceApi');
const gameIds = require('./../../../config/appConfigs').gameIds;
const betChoiceMapper = require('./../../apis/betChoiceMapper');
const logger = require('./../../web/logger');
const ConfigHelper = require('./../../Helpers/ConfigHelper');
const timeTX = 66;

let configs = null;

function getLogs(client) {
  var data = JSON.parse(JSON.stringify(client.redT.taixiu));

  data.taixiu.red_me_tai = 0;
  data.taixiu.red_me_xiu = 0;
  data.taixiu.xu_me_tai = 0;
  data.taixiu.xu_me_xiu = 0;
  // data.chanle.red_me_chan = 0;
  // data.chanle.red_me_le = 0;
  // data.chanle.xu_me_chan = 0;
  // data.chanle.xu_me_le = 0;

  var active1 = new Promise((resolve, reject) => {
    TXPhien.find({}, {}, { sort: { _id: -1 }, limit: 125 }, function (
      err,
      post
    ) {
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
    TaiXiu_User.findOne(
      { uid: client.UID },
      "tLineWinRed tLineLostRed tLineWinXu tLineLostXu cLineWinRed cLineLostRed cLineWinXu cLineLostXu tLineWinRedH tLineLostRedH tLineWinXuH tLineLostXuH cLineWinRedH cLineLostRedH cLineWinXuH cLineLostXuH",
      function (err, data) {
        try {
          if (data && data._doc) {
            data = data._doc;
            delete data._id;
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
    client.redT.taixiuAdmin.list.map(function (game) {
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
              } else {
                if (game.select) {
                  data.taixiu.xu_me_tai += game.bet;
                } else {
                  data.taixiu.xu_me_xiu += game.bet;
                }
              }
            } else {
              // if (game.red) {
              //   if (game.select) {
              //     data.chanle.red_me_chan += game.bet;
              //   } else {
              //     data.chanle.red_me_le += game.bet;
              //   }
              // } else {
              //   if (game.select) {
              //     data.chanle.xu_me_chan += game.bet;
              //   } else {
              //     data.chanle.xu_me_le += game.bet;
              //   }
              // }
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
    client.red({ taixiu: data });
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
    TaiXiu_User.findOne(
      { uid: client.UID },
      "tLineWinRed tLineLostRed tLineWinXu tLineLostXu cLineWinRed cLineLostRed cLineWinXu cLineLostXu tLineWinRedH tLineLostRedH tLineWinXuH tLineLostXuH cLineWinRedH cLineLostRedH cLineWinXuH cLineLostXuH",
      function (err, data) {
        if (err) return reject(err);
        resolve(data);
      }
    );
  });

  Promise.all([active1, active2]).then(values => {
    client.red({ user: values[0], taixiu: { du_day: values[1] } });
  });
}

var chat = function (client, str) {
  if (!!str) {
    UserInfo.findOne({ id: client.UID }, "red", function (err, user) {
      if (!user || user.red < 1) {
        client.red({
          taixiu: { err: "Tài khoản phải có ít nhất 1.000 Red để chat.!!" }
        });
      } else {
        if (!validator.isLength(str, { min: 1, max: 250 })) {
          client.red({ taixiu: { err: "Số lượng kí tự từ 1 - 250." } });
        } else {
          str = validator.trim(str);
          if (!validator.isLength(str, { min: 1, max: 250 })) {
            client.red({ taixiu: { err: "Số lượng kí tự từ 1 - 250." } });
          } else {
            TXChat.findOne({}, "uid value", { sort: { _id: -1 } }, function (
              err,
              post
            ) {
              if (
                !post ||
                post.uid != client.UID ||
                (post.uid == client.UID && post.value != str)
              ) {
                TXChat.create({
                  uid: client.UID,
                  name: client.profile.name,
                  value: str
                });
                var content = {
                  taixiu: {
                    chat: { message: { user: client.profile.name, value: str } }
                  }
                };
                Promise.all(
                  Object.values(client.redT.users).map(function (users) {
                    Promise.all(
                      users.map(function (member) {
                        if (member != client) {
                          member.red(content);
                        }
                      })
                    );
                  })
                );
              }
            });
          }
        }
      }
    });
  }
};

var cuoc = function (client, data) {
  try {
    if (!!data && !!data.bet) {

      configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.TaiXiu);

      if (client.redT.TaiXiu_time < 6 || client.redT.TaiXiu_time >= 50) {
        client.red({ taixiu: { err: "Vui lòng đặt cược ở phiên sau." } });
      } else {
        var bet = data.bet >> 0; // Số tiền
        var taixiu = !!data.taixiu; // Tài xỉu:true    Chẵn lẻ:false
        var red = !!data.red; // Loại tiền (Red:true, Xu:false)
        var select = !!data.select; // Cửa đặt (Tài:1, Xỉu:0)
        //console.log(bet);
        if (bet < configs.minbet) {
          client.red({ taixiu: { err: "Tiền cược tối thiểu là " + configs.minbet } });
        } else if (bet > configs.maxbet) {
          client.red({ taixiu: { err: "Tiền cược tối đa là " + configs.maxbet } });
        }
        else {
          var phien = client && client.redT ? client.redT.TaiXiu_phien : 0;
          data.inSufficientBalance = { taixiu: { err: "Bạn hiện không có đủ tiền để cược." } };
          data.gameId = gameIds.taixiu;
          data.gameRoundId = phien;
          data.choiceId = betChoiceMapper.convertTaiXiu(select);
          data.cuoc = bet;
          var isUUSAccount = client.session
            && client.session.currency
            && client.session.currency.toUpperCase() === 'UUS';
          UserInfo.findOne({ id: client.UID }, red ? 'red name' : 'xu name', function (err, userInfo) {

            if (err) {
              logger.logError(err);
            }

            balanceApi.placeBet({ id: client.UID }, data, client, (user, { }, updateUserRed) => {

              TXCuocOne.findOne({ uid: client.UID, phien: phien, taixiu: taixiu, red: red }, function (isCuocErr, isCuoc) {

                if (isCuocErr) {
                  logger.logError(err);
                }

                try {
                  user.name = userInfo.name;
                  if (!!isCuoc) {
                    // update
                    if (isCuoc.select !== select) { client.red({ taixiu: { err: "Chỉ được cược 1 bên." } }); }
                    else if (isCuoc.bet + bet > configs.maxbet) {
                      client.red({ taixiu: { err: "Tiền cược tối đa là " + configs.maxbet } });
                    } else {
                      var io = client.redT;

                      io.taixiuAdmin.list.unshift({
                        name: user.name,
                        taixiu: taixiu,
                        select: select,
                        red: red,
                        bet: bet,
                        time: new Date()
                      });

                      updateUserRed((updatedUser) => {
                        TXCuocOne.updateOne({ uid: client.UID, phien: phien, taixiu: taixiu, red: red, select: select }, { $inc: { bet: bet } }).exec();
                        let create = { uid: client.UID, name: user.name, phien: phien, bet: bet, taixiu: taixiu, select: select, red: red, time: new Date() };
                        if (client.session) {
                          create.memberId = client.session.memberId;
                          create.siteId = client.session.siteId;
                        }
                        TXCuoc.create(create);

                        if (taixiu) {
                          if (red && !isUUSAccount) {
                            if (select) {
                              io.taixiu.taixiu.red_tai += bet;
                              io.taixiuAdmin.taixiu.red_tai += bet;
                            } else {
                              io.taixiu.taixiu.red_xiu += bet;
                              io.taixiuAdmin.taixiu.red_xiu += bet;
                            }
                          }
                        } else {
                          // if (red) {
                          //   if (select) {
                          //     io.taixiu.chanle.red_chan += bet;
                          //     io.taixiuAdmin.chanle.red_chan += bet;
                          //   } else {
                          //     io.taixiu.chanle.red_le += bet;
                          //     io.taixiuAdmin.chanle.red_le += bet;
                          //   }
                          // }
                        }
                        var taixiuVery = select
                          ? taixiu
                            ? { red_me_tai: isCuoc.bet * 1 + bet }
                            : { red_me_chan: isCuoc.bet * 1 + bet }
                          : taixiu
                            ? { red_me_xiu: isCuoc.bet * 1 + bet }
                            : { red_me_le: isCuoc.bet * 1 + bet };
                        taixiuVery = taixiu
                          ? { taixiu: taixiuVery }
                          : { chanle: taixiuVery };

                        if (!!client.redT.users[client.UID]) {
                          Promise.all(
                            client.redT.users[client.UID].map(function (obj) {
                              obj.red({
                                taixiu: taixiuVery,
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

                    io.taixiuAdmin.list.unshift({ name: user.name, taixiu: taixiu, select: select, red: red, bet: bet, time: new Date() });

                    updateUserRed((updatedUser) => {
                      let cuocOneCreate = { uid: client.UID, phien: phien, taixiu: taixiu, select: select, red: red, bet: bet };
                      if (client.session) {
                        cuocOneCreate.memberId = client.session.memberId;
                        cuocOneCreate.siteId = client.session.siteId;
                      }

                      if (taixiu) {
                        if (red && !isUUSAccount) {
                          if (select) {
                            io.taixiu.taixiu.red_tai += bet;
                            io.taixiu.taixiu.red_player_tai += 1;

                            io.taixiuAdmin.taixiu.red_tai += bet;
                            io.taixiuAdmin.taixiu.red_player_tai += 1;
                          } else {
                            io.taixiu.taixiu.red_xiu += bet;
                            io.taixiu.taixiu.red_player_xiu += 1;

                            io.taixiuAdmin.taixiu.red_xiu += bet;
                            io.taixiuAdmin.taixiu.red_player_xiu += 1;
                          }
                        }
                      } else {
                        // if (red) {
                        //   if (select) {
                        //     io.taixiu.chanle.red_chan += bet;
                        //     io.taixiu.chanle.red_player_chan += 1;

                        //     io.taixiuAdmin.chanle.red_chan += bet;
                        //     io.taixiuAdmin.chanle.red_player_chan += 1;
                        //   } else {
                        //     io.taixiu.chanle.red_le += bet;
                        //     io.taixiu.chanle.red_player_le += 1;

                        //     io.taixiuAdmin.chanle.red_le += bet;
                        //     io.taixiuAdmin.chanle.red_player_le += 1;
                        //   }
                        // }
                      }

                      TXCuocOne.create(cuocOneCreate);

                      let obj = { uid: client.UID, name: user.name, phien: phien, bet: bet, taixiu: taixiu, select: select, red: red, time: new Date() };
                      if (client.session) {
                        obj.memberId = client.session.memberId;
                        obj.siteId = client.session.siteId;
                      }
                      TXCuoc.create(obj);

                      var taixiuVery = select
                        ? taixiu
                          ? { red_me_tai: bet }
                          : { red_me_chan: bet }
                        : taixiu
                          ? { red_me_xiu: bet }
                          : { red_me_le: bet };
                      taixiuVery = taixiu
                        ? { taixiu: taixiuVery }
                        : { chanle: taixiuVery };

                      if (!!client.redT.users[client.UID]) {
                        Promise.all(
                          client.redT.users[client.UID].map(function (obj) {
                            obj.red({ taixiu: taixiuVery, user: { red: updatedUser.red } });
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
      var taixiu = !!data.taixiu;
      var red = !!data.red;

      var getPhien = TXPhien.findOne({ id: phien }).exec();
      //var getCuoc  = TXCuoc.find({phien:phien, taixiu:taixiu, red:red}, null, {sort:{'_id':1}}).exec();
      let uusUser = UserInfo.find({ currency: { $regex: /uus/, $options: 'i' } }).exec();
      var getCuoc = TXCuoc.find(
        { phien: phien, taixiu: taixiu, red: red },
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
            client.red({ taixiu: { get_phien: dataT } });
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
      TXCuoc.countDocuments({ uid: client.UID, thanhtoan: true }).exec(function (
        err,
        total
      ) {
        var getCuoc = TXCuoc.find(
          { uid: client.UID, thanhtoan: true },
          {},
          { sort: { _id: -1 }, skip: (page - 1) * kmess, limit: kmess },
          function (error, result) {
            if (result.length) {
              Promise.all(
                result.map(function (obj) {
                  obj = obj._doc;
                  var getPhien = TXPhien.findOne({ id: obj.phien }).exec();
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
                  taixiu: {
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
                taixiu: {
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

    TaiXiu_User.aggregate([
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
        client.red({ taixiu: { get_top: data } });
      });
    });
  }
};

module.exports = {
  getLogs: getLogs,
  chat: chat,
  cuoc: cuoc,
  get_phien: get_phien,
  get_log: get_log,
  get_top: get_top,
  getNew: getNew
};
