//let path        = require('path');
let fs = require("fs");

let Helpers = require("../../Helpers/Helpers");

let UserInfo = require("../../Models/UserInfo");
let ChanLeTurboPhien = require("../../Models/ChanLeTurbo/ChanLeTurbo_phien");
let ChanLeTurboCuoc = require("../../Models/ChanLeTurbo/ChanLeTurbo_cuoc");
let ChanLeTurbo_User = require("../../Models/ChanLeTurbo/ChanLeTurbo_user");
let ChanLeTurboCuocOne = require("../../Models/ChanLeTurbo/ChanLeTurbo_one");
let GameConfigs = require('../../Models/GameConfig/GameConfigs');

const gameIds = require("../../../config/appConfigs").gameIds;
const balanceApi = require('../../apis/balanceApi');
const logger = require('../../web/logger');
const ConfigHelper = require('../../Helpers/ConfigHelper');
const bot = require('./botchanle');

let botList = [];

let io = null;
let gameLoop = null;
const timeCL = 36;
const timeCuoc = 30;
const minBetDuDay = 1;
let configs = null;

let init = function (obj) {
  io = obj;

  io.clturbo = {
    clturbo: {
      red_chan: 0,
      red_le: 0,
      red_player_chan: 0,
      red_player_le: 0
    }
  };

  io.clturboAdmin = {
    clturbo: {
      red_chan: 0,
      red_le: 0,
      red_player_chan: 0,
      red_player_le: 0
    },
    list: []
  };

  ConfigHelper.reloadConfigs(ConfigHelper.GameTypes.CLTurbo);

  playGame();
};

ChanLeTurboPhien.findOne({}, "id", { sort: { id: -1 } }, function (err, last) {
  if (!!last) {
    io.ChanLeTurbo_phien = last.id + 1;
  }
});

let truChietKhau = function (bet, phe) {
  var chietkhau = bet - (bet * phe) / 100;

  return chietkhau;
};


let setChanLeTurbo_User = function (phien, dice, userSettlements) {
  ChanLeTurboCuocOne.find({ phien: phien }, {}, function (err, list) {
    if (list.length) {
      Promise.all(
        list.map(function (obj) {
          let action = new Promise((resolve, reject) => {
            ChanLeTurbo_User.findOne({ uid: obj.uid }, function (error, data) {
              try {
                let bet_thua = obj.bet - obj.tralai;
                let bet = obj.win ? obj.betwin + obj.bet : bet_thua;
                let update = {};

                if (bet_thua >= minBetDuDay) {
                  update = {
                    cLineWinRed:
                      obj.win && data.cLineWinRed < data.cLineWinRedH + 1
                        ? data.cLineWinRedH + 1
                        : data.cLineWinRed,
                    cLineLostRed:
                      !obj.win && data.cLineLostRed < data.cLineLostRedH + 1
                        ? data.cLineLostRedH + 1
                        : data.cLineLostRed,
                    cLineWinRedH: obj.win ? data.cLineWinRedH + 1 : 0,
                    cLineLostRedH: obj.win ? 0 : data.cLineLostRedH + 1
                  };
                }

                !!Object.entries(update).length && ChanLeTurbo_User.updateOne({ uid: obj.uid }, { $set: update }).exec();

                const gameInfo = {
                  gameId: gameIds.clturbo,
                  gameRoundId: phien,
                  memberId: obj.memberId,
                  siteId: obj.siteId
                };

                const settleInfo = {
                  red: obj.win ? obj.betwin + obj.bet : obj.tralai,
                  redPlay: obj.bet,
                }

                try {
                  balanceApi.endGame(obj.uid, gameInfo, settleInfo, io.users, () => {
                    if (io.users[obj.uid]) {
                      io.users[obj.uid].forEach(function (client) {
                        client.red({
                          clturbo: {
                            status: { win: obj.win, thuong: obj.thuong, select: obj.select, bet: bet }
                          }
                        });
                      });
                    }

                    resolve({ uid: obj.uid, red: obj.red, clturbo: obj.taixiu, betwin: obj.betwin });
                  });
                }
                catch (ex) {
                  logger.logError(ex);
                  resolve({ uid: obj.uid, red: obj.red, clturbo: obj.taixiu, betwin: obj.betwin });
                }

              }
              catch (ex) {
                logger.log(ex);
                resolve({ uid: obj.uid, red: obj.red, clturbo: obj.taixiu, betwin: obj.betwin });
              }
            });
          });
          return action;
        })
      ).then(values => {
        values = values.filter(function (obj) { return obj.red && obj.betwin > 0; });
        if (values.length) {
          let topChanLeTurbo = values.filter(function (objTopT) { return !!objTopT.clturbo; });
          //let topChanLeTurbo = values.filter(function (objTopC) { return !objTopC.taixiu; });
          topChanLeTurbo.sort(function (a, b) { return b.betwin - a.betwin; });
          //topChanLeTurbo.sort(function (a, b) { return b.betwin - a.betwin; });
          let top10CL = topChanLeTurbo.slice(0, 3);
          //let top10CL = topChanLeTurbo.slice(0, 10);
          values = [...top10CL];

          values = Helpers.shuffle(values);

          Promise.all(
            values.map(function (obj) {
              let action = new Promise((resolve, reject) => {
                UserInfo.findOne({ id: obj.uid }, "name", function (err, users) {
                  if (obj.taixiu) {
                    resolve({ users: users.name, bet: obj.betwin, game: "Tài Xỉu" });
                  } else {
                    resolve({ users: users.name, bet: obj.betwin, game: "Chẵn Lẻ" });
                  }
                });
              });
              return action;
            })
          ).then(result => {
            io.sendInHome({ news: { a: result } });
          });
        }
      });
    }
  });
};

let memberPayout = function (dice, game_id, obj, sum, userSettlements) {
  if (!userSettlements[obj.uid]) {
    userSettlements[obj.uid] = { red: 0, redWin: 0, redLost: 0, redPlay: 0 };
  }

  if (obj.select === true) {
    // Tổng Red Tài
    let win = dice % 2 == 0;
    if (sum.ChanLeTurbo_red_lech_chan && sum.ChanLeTurbo_tong_red_lech > 0) {
      if (sum.ChanLeTurbo_tong_red_lech >= obj.bet) {
        // Trả lại hoàn toàn
        sum.ChanLeTurbo_tong_red_lech -= obj.bet;
        // trả lại hoàn toàn
        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = obj.bet;
        obj.save();

        userSettlements[obj.uid].redPlay = obj.bet;
        userSettlements[obj.uid].red += obj.bet;

        return ChanLeTurboCuocOne.updateOne(
          { uid: obj.uid, phien: game_id, select: true, red: true },
          { $set: { win: win, thanhtoan: true }, $inc: { tralai: obj.bet } }
        ).exec();
      } else {
        // Trả lại 1 phần
        let betPlay = obj.bet - sum.ChanLeTurbo_tong_red_lech;
        let betwinP = 0;

        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = sum.ChanLeTurbo_tong_red_lech;
        sum.ChanLeTurbo_tong_red_lech = 0;

        if (win) {
          // Thắng nhưng bị trừ tiền trả lại
          // cộng tiền thắng
          betwinP = truChietKhau(betPlay, 2);
          obj.betwin = betwinP;
          let redUpdate = obj.bet + betwinP;

          userSettlements[obj.uid].red += redUpdate;
          userSettlements[obj.uid].redPlay += obj.bet;
          userSettlements[obj.uid].redWin += betwinP;

          ChanLeTurbo_User.updateOne({ uid: obj.uid }, { $inc: { cWinRed: betwinP, cRedPlay: betPlay } }).exec();

        } else {

          userSettlements[obj.uid].red += obj.tralai;
          userSettlements[obj.uid].redPlay += obj.bet;
          userSettlements[obj.uid].redLost += betPlay;

          ChanLeTurbo_User.updateOne(
            { uid: obj.uid },
            { $inc: { cWinRed: betwinP, cRedPlay: betPlay } }
          ).exec();

        }
        obj.save();
        return ChanLeTurboCuocOne.updateOne(
          { uid: obj.uid, phien: game_id, select: true, red: true },
          { $set: { win: win, thanhtoan: true }, $inc: { tralai: obj.tralai, betwin: betwinP } }
        ).exec();
      }
    } else {
      if (win) {
        // cộng tiền thắng hoàn toàn
        let betwin = truChietKhau(obj.bet, 2);
        obj.thanhtoan = true;
        obj.win = true;
        obj.betwin = betwin;
        obj.save();

        let redUpdate = obj.bet + betwin;

        userSettlements[obj.uid].red += redUpdate;
        userSettlements[obj.uid].redWin += betwin;
        userSettlements[obj.uid].redPlay += obj.bet;

        ChanLeTurbo_User.updateOne(
          { uid: obj.uid },
          { $inc: { cWinRed: betwin, cRedPlay: obj.bet } }
        ).exec();

        return ChanLeTurboCuocOne.updateOne(
          { uid: obj.uid, phien: game_id, select: true, red: true },
          { $set: { win: true, thanhtoan: true }, $inc: { betwin: betwin } }
        ).exec();
      } else {
        obj.thanhtoan = true;
        obj.save();

        userSettlements[obj.uid].redPlay += obj.bet;
        userSettlements[obj.uid].redLost += obj.bet;

        ChanLeTurbo_User.updateOne(
          { uid: obj.uid },
          { $inc: { cLostRed: obj.bet, cRedPlay: obj.bet } }
        ).exec();
      }
    }
  } else {
    let win = dice % 2 != 0;
    if (!sum.ChanLeTurbo_red_lech_chan && sum.ChanLeTurbo_tong_red_lech > 0) {
      if (sum.ChanLeTurbo_tong_red_lech >= obj.bet) {
        // Trả lại hoàn toàn
        sum.ChanLeTurbo_tong_red_lech -= obj.bet;
        // trả lại hoàn toàn
        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = obj.bet;
        obj.save();

        userSettlements[obj.uid].red += obj.bet;
        userSettlements[obj.uid].redPlay += obj.bet;
        //balanceApi.endGame(obj.uid, gameInfo, { red: obj.bet });

        return ChanLeTurboCuocOne.updateOne(
          { uid: obj.uid, phien: game_id, select: false, red: true },
          { $set: { win: win, thanhtoan: true }, $inc: { tralai: obj.bet } }
        ).exec();
      } else {
        // Trả lại 1 phần
        let betPlay = obj.bet - sum.ChanLeTurbo_tong_red_lech;
        let betwinP = 0;

        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = sum.ChanLeTurbo_tong_red_lech;
        sum.ChanLeTurbo_tong_red_lech = 0;

        if (win) {
          // Thắng nhưng bị trừ tiền trả lại
          // cộng tiền thắng
          betwinP = truChietKhau(betPlay, 2);
          obj.betwin = betwinP;
          let redUpdate = obj.bet + betwinP;

          userSettlements[obj.uid].red += redUpdate;
          userSettlements[obj.uid].redPlay += obj.bet;
          userSettlements[obj.uid].redWin += betwinP;


          ChanLeTurbo_User.updateOne(
            { uid: obj.uid },
            { $inc: { cWinRed: betwinP, cRedPlay: betPlay } }
          ).exec();

        } else {
          userSettlements[obj.uid].red += obj.tralai;
          userSettlements[obj.uid].redPlay += obj.bet;
          userSettlements[obj.uid].redLost += betPlay;

          ChanLeTurbo_User.updateOne(
            { uid: obj.uid },
            { $inc: { cLostRed: betPlay, cRedPlay: betPlay } }
          ).exec();
        }
        obj.save();
        return ChanLeTurboCuocOne.updateOne(
          { uid: obj.uid, phien: game_id, select: false, red: true },
          { $set: { win: win, thanhtoan: true }, $inc: { tralai: obj.tralai, betwin: betwinP } }
        ).exec();
      }
    } else {
      if (win) {
        // cộng tiền thắng hoàn toàn
        let betwin = truChietKhau(obj.bet, 2);
        obj.thanhtoan = true;
        obj.win = true;
        obj.betwin = betwin;
        obj.save();

        let redUpdate = obj.bet + betwin;
        userSettlements[obj.uid].red += redUpdate;
        userSettlements[obj.uid].redWin += betwin;
        userSettlements[obj.uid].redPlay += obj.bet;

        ChanLeTurbo_User.updateOne(
          { uid: obj.uid },
          { $inc: { cWinRed: betwin, cRedPlay: obj.bet } }
        ).exec();

        return ChanLeTurboCuocOne.updateOne(
          { uid: obj.uid, phien: game_id, select: false, red: true },
          { $set: { win: true, thanhtoan: true }, $inc: { betwin: betwin } }
        ).exec();
      } else {
        obj.thanhtoan = true;
        obj.save();

        userSettlements[obj.uid].redLost += obj.bet;
        userSettlements[obj.uid].redPlay += obj.bet;

        ChanLeTurbo_User.updateOne(
          { uid: obj.uid },
          { $inc: { cLostRed: obj.bet, cRedPlay: obj.bet } }
        ).exec();

      }
    }
  }
  return 1;
}

let sumTaiXiu = function (objL, sum) {
  if (objL.select === true) {
    // Tổng Red Chẵn
    sum.ChanLeTurbo_red_tong_chan += objL.bet;
  } else {
    // Tổng Red Lẻ
    sum.ChanLeTurbo_red_tong_le += objL.bet;
  }
}

let processSumTaiXiu = function (sum) {
  sum.ChanLeTurbo_tong_red_lech = Math.abs(
    sum.ChanLeTurbo_red_tong_chan - sum.ChanLeTurbo_red_tong_le
  );

  sum.ChanLeTurbo_red_lech_chan = sum.ChanLeTurbo_red_tong_chan > sum.ChanLeTurbo_red_tong_le ? true : false;

  sum.ChanLeTurbo_red_tong_chan = null;
  sum.ChanLeTurbo_red_tong_le = null;
}

let initSumTaiXiu = function () {
  let sum = {};

  sum.ChanLeTurbo_red_tong_chan = 0;
  sum.ChanLeTurbo_red_tong_le = 0;

  return sum;
}

let settleChanLeTurboByGroup = function (dice, game_id, bets, userSettlements) {
  if (!bets || bets.length === 0) {
    return [];
  }

  let sum = initSumTaiXiu();

  bets.forEach(function (bet) {
    sumTaiXiu(bet, sum);
  });

  processSumTaiXiu(sum);

  return bets.map(function (bet) {
    return memberPayout(dice, game_id, bet, sum, userSettlements);
  });
}

let settleChanLeTurbo = function (dice, game_id, bets, uusUserIds) {

  if (bets.length) {
    let userSettlements = {};
    let normalBets = bets.filter(bet => !uusUserIds.includes(bet.uid));

    let processNormalBets = settleChanLeTurboByGroup(dice, game_id, normalBets, userSettlements);

    let uusBets = bets.filter(bet => uusUserIds.includes(bet.uid));

    let processUUSBets = settleChanLeTurboByGroup(dice, game_id, uusBets, userSettlements);

    Promise
      .all(processNormalBets.concat(processUUSBets))
      .then(function (resultUpdate) {
        playGame();
        setChanLeTurbo_User(game_id, dice, userSettlements);
      });
  } else if (dice) {
    playGame();
  }
}

let thongtin_thanhtoan = function (game_id, dice = false) {
  try {

    if (dice) {

      UserInfo.find({ currency: { $regex: /uus/, $options: 'i' } }, function (err, userInfoList) {
        if (err) {
          logger.logError(err);
        }

        let uusUserIds = userInfoList.map(function (user) {
          return user.id;
        });

        ChanLeTurboCuoc.find({ phien: game_id }, null, { sort: { _id: -1 } },
          function (err, list) {
            if (err) {
              logger.logError(err);
            }

            settleChanLeTurbo(dice, game_id, list, uusUserIds);
          });

      });

    } else {
      // Users
      let home = {
        clturbo: {
          clturbo: {
            red_chan: io.clturbo.clturbo.red_chan,
            red_le: io.clturbo.clturbo.red_le
          }
        }
      };

      Object.values(io.users).forEach(function (users) {
        users.forEach(function (client) {
          if (client.gameEvent !== void 0 && client.gameEvent.viewChanLeTurbo !== void 0 && client.gameEvent.viewChanLeTurbo) {
            client.red({ clturbo: io.clturbo });
          } else if (client.scene == "home") {
            // client.red(home);
          }
        });
      });

      // Admin
      Object.values(io.admins).forEach(function (admin) {
        admin.forEach(function (client) {
          if (client.gameEvent !== void 0 && client.gameEvent.viewChanLeTurbo !== void 0 && client.gameEvent.viewChanLeTurbo) {
            client.red({ clturbo: io.clturboAdmin });
          }
        });
      });

    }
  } catch (error) {
    logger.logError(error);
  }
};

let resetChanLeTurboClientAndAdmin = function (io) {
  io.clturbo = {
    clturbo: {
      red_chan: 0,
      red_le: 0,
      red_player_chan: 0,
      red_player_le: 0
    }
  };

  io.clturboAdmin = {
    clturbo: {
      red_chan: 0,
      red_le: 0,
      red_player_chan: 0,
      red_player_le: 0
    },
    list: []
  };
}

let resetBots = function () {
  if (configs.botenabled) {
    try {
      //TODO: Bop implementation

      // lấy danh sách tài khoản bot
      //let name = "testbotnv02";
      UserInfo.find({ type: true }, "id name", function (err, list) {

        if (list.length) {
          Promise.all(
            list.map(function (user) {
              user = user._doc;
              delete user._id;
              return user;
            })
          ).then(result => {
            botTemp = [...result];
            let maxBot = Math.floor(result.length * ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.CLTurbo));
            // console.log("CLTurbo max bot " + maxBot);
            botList = Helpers.shuffle(result); // tráo bot;
            botList = botList.slice(0, maxBot);

          });
        }
      });

    } catch (error) {
      botTemp = [];
      botList = [];
      botListCl = [];

      logger.logError(error);

    }
  } else {
    botTemp = [];
    botList = [];
    botListCl = [];
  }
}


let throwDiceAndInsertNewPhien = function () {

  let dice1 = Math.floor(Math.random() * 6) + 1;
  let dice2 = Math.floor(Math.random() * 6) + 1;
  let dice3 = Math.floor(Math.random() * 6) + 1;

  ChanLeTurboPhien.create(
    { dice1: dice1, dice2: dice2, dice3: dice3, time: new Date() },
    function (err, create) {
      if (err) {
        logger.logError(err);
      }

      if (!!create) {
        io.ChanLeTurbo_phien = create.id + 1;
        thongtin_thanhtoan(create.id, dice1 + dice2 + dice3);
        var { ...clturboInfo } = io.clturbo.clturbo;
        io.sendAllUser({
          clturbo: {
            clturbo: clturboInfo,
            finish: { dices: [create.dice1, create.dice2, create.dice3], phien: create.id }
          }
        });

        Object.values(io.admins).forEach(function (admin) {
          admin.forEach(function (client) {
            client.red({
              clturbo: { finish: { dices: [create.dice1, create.dice2, create.dice3], phien: create.id } }
            });
          });
        });
        dice1 = null;
        dice2 = null;
        dice3 = null;
      }
    });
}


let botPlacesBets = function () {
  var maxBet = 10;

  if (!!configs && !!configs.bot_maxbet && configs.bot_maxbet > 0) {
    maxBet = configs.bot_maxbet;
  }

  if (!!botList.length && io.ChanLeTurbo_time > 5) {
    var maxBotRandom = botList.length / timeCuoc;
    let userCuoc = Math.floor((Math.random() * maxBotRandom) + 1);
    let iH = 0;
    for (iH = 0; iH < userCuoc; iH++) {
      let dataT = botList[iH];
      if (!!dataT) {
        bot.cl(dataT, io, maxBet);
        botList.splice(iH, 1); // Xoá bot đã đặt tránh trùng lặp
      }
      dataT = null;
    }
  }
};

let playGame = function () {
  io.ChanLeTurbo_time = timeCL;
  this.disabled = false;


  gameLoop = setInterval(function () {
    var self = this;
    try {

      if (io.ChanLeTurbo_time == timeCL) {
        CheckUM(self);
      }

      if (!self.disabled) {
        io.ChanLeTurbo_time--;

        if (io.ChanLeTurbo_time === timeCuoc) {
          resetChanLeTurboClientAndAdmin(io);
        } else if (io.ChanLeTurbo_time < timeCuoc) {
          if (io.ChanLeTurbo_time < 1) {
            clearInterval(gameLoop);

            try {
              // Kết thúc phiên
              io.ChanLeTurbo_time = 1;

              throwDiceAndInsertNewPhien();
              resetBots();

            } catch (ex) {
              logger.logError(ex);
            }
          } else {
            try {
              thongtin_thanhtoan(io.ChanLeTurbo_phien);
              botPlacesBets();
            } catch (ex) {
              logger.logError(ex);
            }
          }
        }
      }
    } catch (error) {
      logger.logError(error);
    }
  }, 1000);

  return gameLoop;
};

function CheckUM(self) {
  GameConfigs.findOne({ name: ConfigHelper.GameTypes.CLTurbo }, function (err, data) {
    if (err) {
      logger.logError(err);
    }

    configs = data;

    ConfigHelper.updateConfig(ConfigHelper.GameTypes.CLTurbo, data);

    self.disabled = (data == null || !data.enabled);

    if (self.disabled) {
      io.sendAllUser({
        clturbo: { um: true }
      });

      GameConfigs.updateOne({ name: ConfigHelper.GameTypes.CLTurbo }, { disabledround: io.ChanLeTurbo_phien }, function (err, data) {
        if (err) {
          // console.log("update game config error");
          logger.logError(err);
        }
      });

      io.ChanLeTurbo_time = timeCL;

      return;
    }

    io.sendAllUser({
      taixiu: { time_remain: timeCL }
    });
  });
}

module.exports = init;



