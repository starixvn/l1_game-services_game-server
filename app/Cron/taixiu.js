//let path        = require('path');
let fs = require("fs");

let Helpers = require("../Helpers/Helpers");

let UserInfo = require("../Models/UserInfo");
let TXPhien = require("../Models/TaiXiu_phien");
let TXCuoc = require("../Models/TaiXiu_cuoc");
let TaiXiu_User = require("../Models/TaiXiu_user");
let TXCuocOne = require("../Models/TaiXiu_one");
let GameConfigs = require('../Models/GameConfig/GameConfigs');

const appConfigs = require("../../config/appConfigs");
const balanceApi = require('./../apis/balanceApi');

// Hũ game
let HU_game = require("../Models/HU");

let bot = require("./taixiu/bot");
let botList = [];
let botListCl = [];

let botHu = require("./bot_hu");
let botTemp = [];

let io = null;
let gameLoop = null;
const timeTX = 66;
const timeCuoc = 50;
const minBetDuDay = 1;

let init = function (obj) {
  io = obj;

  io.taixiu = {
    chanle: {
      red_chan: 0,
      red_le: 0,
      red_player_chan: 0,
      red_player_le: 0,
      xu_chan: 0,
      xu_le: 0,
      xu_player_chan: 0,
      xu_player_le: 0
    },
    taixiu: {
      red_player_tai: 0,
      red_player_xiu: 0,
      red_tai: 0,
      red_xiu: 0,
      xu_player_tai: 0,
      xu_player_xiu: 0,
      xu_tai: 0,
      xu_xiu: 0
    }
  };

  io.taixiuAdmin = {
    chanle: {
      red_chan: 0,
      red_le: 0,
      red_player_chan: 0,
      red_player_le: 0,
      xu_chan: 0,
      xu_le: 0,
      xu_player_chan: 0,
      xu_player_le: 0
    },
    taixiu: {
      red_player_tai: 0,
      red_player_xiu: 0,
      red_tai: 0,
      red_xiu: 0,
      xu_player_tai: 0,
      xu_player_xiu: 0,
      xu_tai: 0,
      xu_xiu: 0
    },
    list: []
  };

  playGame();
};

TXPhien.findOne({}, "id", { sort: { id: -1 } }, function (err, last) {
  if (!!last) {
    io.TaiXiu_phien = last.id + 1;
  }
});

let truChietKhau = function (bet, phe) {
  var chietkhau = bet - (bet * phe) / 100;

  return chietkhau;
};

// Dữ liệu Hũ
let TopHu = function () {
  HU_game.find({}, "game type red bet toX balans x").exec(function (err, data) {
    if (data.length) {
      Promise.all(
        data.map(function (obj) {
          obj = obj._doc;
          delete obj._id;
          return obj;
        })
      ).then(result => {
        let temp_data = {
          TopHu: {
            mini_poker: result.filter(function (mini_poker) {
              return mini_poker.game === "minipoker";
            }),
            // big_babol: result.filter(function (big_babol) {
            //   return big_babol.game === "bigbabol";
            // }),
            // vq_red: result.filter(function (vq_red) {
            //   return vq_red.game === "vuongquocred";
            // }),
            mini3cay: result.filter(function (mini3cay) {
              return mini3cay.game === "mini3cay";
            }),
            caothap: result.filter(function (caothap) {
              return caothap.game === "caothap";
            }),
            // arb: result.filter(function (arb) {
            //   return arb.game === "arb";
            // }),
            // candy: result.filter(function (candy) {
            //   return candy.game === "candy";
            // }),
            long: result.filter(function (long) {
              return long.game === "long";
            }),
            megaj: result.filter(function (megaj) {
              return megaj.game === "megaj";
            })
          }
        };
        io.broadcast(temp_data);
      });
    }
  });
};

let setTaiXiu_user = function (phien, dice) {
  TXCuocOne.find({ phien: phien }, {}, function (err, list) {
    if (list.length) {
      Promise.all(
        list.map(function (obj) {
          let action = new Promise((resolve, reject) => {
            TaiXiu_User.findOne({ uid: obj.uid }, function (error, data) {
              let bet_thua = obj.bet - obj.tralai;
              let bet = obj.win ? obj.betwin + obj.bet : bet_thua;
              let update = {};
              if (
                obj.taixiu === true &&
                obj.red === true &&
                bet_thua >= minBetDuDay
              ) {
                // Red Tài Xỉu
                update = {
                  tLineWinRed:
                    obj.win && data.tLineWinRed < data.tLineWinRedH + 1
                      ? data.tLineWinRedH + 1
                      : data.tLineWinRed,
                  tLineLostRed:
                    !obj.win && data.tLineLostRed < data.tLineLostRedH + 1
                      ? data.tLineLostRedH + 1
                      : data.tLineLostRed,
                  tLineWinRedH: obj.win ? data.tLineWinRedH + 1 : 0,
                  tLineLostRedH: obj.win ? 0 : data.tLineLostRedH + 1,
                  last: phien
                };
                if (obj.win) {
                  if (data.tLineWinRedH == 0) {
                    update.first = phien;
                  }
                } else {
                  if (data.tLineLostRedH == 0) {
                    update.first = phien;
                  }
                }
              } else if (
                obj.taixiu === true &&
                obj.red === false &&
                bet_thua >= minBetDuDay
              ) {
                // Xu Tài Xỉu
                update = {
                  tLineWinXu:
                    obj.win && data.tLineWinXu < data.tLineWinXuH + 1
                      ? data.tLineWinXuH + 1
                      : data.tLineWinXu,
                  tLineLostXu:
                    !obj.win && data.tLineLostXu < data.tLineLostXuH + 1
                      ? data.tLineLostXuH + 1
                      : data.tLineLostXu,
                  tLineWinXuH: obj.win ? data.tLineWinXuH + 1 : 0,
                  tLineLostXuH: obj.win ? 0 : data.tLineLostXuH + 1
                };
              } else if (
                obj.taixiu === false &&
                obj.red === true &&
                bet_thua >= minBetDuDay
              ) {
                // Red Chẵn Lẻ
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
              } else if (
                obj.taixiu === false &&
                obj.red === false &&
                bet_thua >= minBetDuDay
              ) {
                // Xu Chẵn Lẻ
                update = {
                  cLineWinXu:
                    obj.win && data.cLineWinXu < data.cLineWinXuH + 1
                      ? data.cLineWinXuH + 1
                      : data.cLineWinXu,
                  cLineLostXu:
                    !obj.win && data.cLineLostXu < data.cLineLostXuH + 1
                      ? data.cLineLostXuH + 1
                      : data.cLineLostXu,
                  cLineWinXuH: obj.win ? data.cLineWinXuH + 1 : 0,
                  cLineLostXuH: obj.win ? 0 : data.cLineLostXuH + 1
                };
              }

              !!Object.entries(update).length &&
                TaiXiu_User.updateOne(
                  { uid: obj.uid },
                  { $set: update }
                ).exec();

              if (io.users[obj.uid]) {
                io.users[obj.uid].forEach(function (client) {
                  client.red({
                    taixiu: {
                      status: {
                        win: obj.win,
                        thuong: obj.thuong,
                        select: obj.select,
                        bet: bet
                      }
                    }
                  });
                });
              }
              resolve({
                uid: obj.uid,
                red: obj.red,
                taixiu: obj.taixiu,
                betwin: obj.betwin
              });
            });
          });
          return action;
        })
      ).then(values => {
        values = values.filter(function (obj) {
          return obj.red && obj.betwin > 0;
        });
        if (values.length) {
          let topTaiXiu = values.filter(function (objTopT) {
            return !!objTopT.taixiu;
          });
          let topChanLe = values.filter(function (objTopC) {
            return !objTopC.taixiu;
          });
          topTaiXiu.sort(function (a, b) {
            return b.betwin - a.betwin;
          });
          topChanLe.sort(function (a, b) {
            return b.betwin - a.betwin;
          });
          let top10TX = topTaiXiu.slice(0, 3);
          //let top10CL = topChanLe.slice(0, 10);
          values = [...top10TX];

          values = Helpers.shuffle(values);

          Promise.all(
            values.map(function (obj) {
              let action = new Promise((resolve, reject) => {
                UserInfo.findOne({ id: obj.uid }, "name", function (err, users) {
                  if (obj.taixiu) {
                    resolve({
                      users: users.name,
                      bet: obj.betwin,
                      game: "Tài Xỉu"
                    });
                  } else {
                    resolve({
                      users: users.name,
                      bet: obj.betwin,
                      game: "Chẵn Lẻ"
                    });
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

let memberPayout = function (dice, game_id, obj, sum) {
  let oneUpdate = {};
  if (
    obj.taixiu === true &&
    obj.red === true &&
    obj.select === true
  ) {
    // Tổng Red Tài
    let win = dice > 10 ? true : false;
    if (sum.TaiXiu_red_lech_tai && sum.TaiXiu_tong_red_lech > 0) {
      if (sum.TaiXiu_tong_red_lech >= obj.bet) {
        // Trả lại hoàn toàn
        sum.TaiXiu_tong_red_lech -= obj.bet;
        // trả lại hoàn toàn
        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = obj.bet;
        obj.save();

        balanceApi.endGame(obj.uid, null, { red: obj.bet }, () => {

        });

        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: true,
            select: true,
            red: true
          },
          { $set: { win: win }, $inc: { tralai: obj.bet } }
        ).exec();
      } else {
        // Trả lại 1 phần
        let betPlay = obj.bet - sum.TaiXiu_tong_red_lech;
        let betwinP = 0;

        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = sum.TaiXiu_tong_red_lech;
        sum.TaiXiu_tong_red_lech = 0;

        if (win) {
          // Thắng nhưng bị trừ tiền trả lại
          // cộng tiền thắng
          betwinP = truChietKhau(betPlay, 2);
          obj.betwin = betwinP;
          let redUpdate = obj.bet + betwinP;

          balanceApi.endGame(obj.uid, null, {
            red: redUpdate,
            redPlay: betPlay,
            redWin: betwinP
          }, () => {
            TaiXiu_User.updateOne(
              { uid: obj.uid },
              { $inc: { tWinRed: betwinP, tRedPlay: betPlay } }
            ).exec();
          });


        } else {

          balanceApi.endGame(obj.uid, null, {
            red: obj.tralai,
            redPlay: betPlay,
            redLost: betPlay
          }, () => {
            TaiXiu_User.updateOne(
              { uid: obj.uid },
              { $inc: { tLostRed: betPlay, tRedPlay: betPlay } }
            ).exec();
          });

        }
        obj.save();
        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: true,
            select: true,
            red: true
          },
          {
            $set: { win: win },
            $inc: { tralai: obj.tralai, betwin: betwinP }
          }
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

        balanceApi.endGame(obj.uid, null, { red: redUpdate, redWin: betwin, redPlay: obj.bet }, () => {
          TaiXiu_User.updateOne(
            { uid: obj.uid },
            { $inc: { tWinRed: betwin, tRedPlay: obj.bet } }
          ).exec();
        });


        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: true,
            select: true,
            red: true
          },
          { $set: { win: true }, $inc: { betwin: betwin } }
        ).exec();
      } else {
        obj.thanhtoan = true;
        obj.save();
        balanceApi.endGame(obj.uid, null, { redLost: obj.bet, redPlay: obj.bet }, () => {
          TaiXiu_User.updateOne(
            { uid: obj.uid },
            { $inc: { tLostRed: obj.bet, tRedPlay: obj.bet } }
          ).exec();
        });
      }
    }
  } else if (
    obj.taixiu === true &&
    obj.red === true &&
    obj.select === false
  ) {
    // Tổng Red Xỉu
    let win = dice > 10 ? false : true;
    if (!sum.TaiXiu_red_lech_tai && sum.TaiXiu_tong_red_lech > 0) {
      if (sum.TaiXiu_tong_red_lech >= obj.bet) {
        // Trả lại hoàn toàn
        sum.TaiXiu_tong_red_lech -= obj.bet;
        // trả lại hoàn toàn
        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = obj.bet;
        obj.save();

        balanceApi.endGame(obj.uid, null, { red: obj.bet }, () => {

        });

        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: true,
            select: false,
            red: true
          },
          { $set: { win: win }, $inc: { tralai: obj.bet } }
        ).exec();
      } else {
        // Trả lại 1 phần
        let betPlay = obj.bet - sum.TaiXiu_tong_red_lech;
        let betwinP = 0;

        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = sum.TaiXiu_tong_red_lech;
        sum.TaiXiu_tong_red_lech = 0;

        if (win) {
          // Thắng nhưng bị trừ tiền trả lại
          // cộng tiền thắng
          betwinP = truChietKhau(betPlay, 2);
          obj.betwin = betwinP;
          let redUpdate = obj.bet + betwinP;

          balanceApi.endGame(obj.uid, null, {
            red: redUpdate,
            redPlay: betPlay,
            redWin: betwinP
          }, () => {
            TaiXiu_User.updateOne(
              { uid: obj.uid },
              { $inc: { tWinRed: betwinP, tRedPlay: betPlay } }
            ).exec();
          });

        } else {
          balanceApi.endGame(obj.uid, null, {
            red: obj.tralai,
            redPlay: betPlay,
            redLost: betPlay
          }, () => {
            TaiXiu_User.updateOne(
              { uid: obj.uid },
              { $inc: { tLostRed: betPlay, tRedPlay: betPlay } }
            ).exec();
          });
        }
        obj.save();
        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: true,
            select: false,
            red: true
          },
          {
            $set: { win: win },
            $inc: { tralai: obj.tralai, betwin: betwinP }
          }
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

        balanceApi.endGame(obj.uid, null, { red: redUpdate, redWin: betwin, redPlay: obj.bet }, () => {
          TaiXiu_User.updateOne(
            { uid: obj.uid },
            { $inc: { tWinRed: betwin, tRedPlay: obj.bet } }
          ).exec();
        });

        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: true,
            select: false,
            red: true
          },
          { $set: { win: true }, $inc: { betwin: betwin } }
        ).exec();
      } else {
        obj.thanhtoan = true;
        obj.save();
        balanceApi.endGame(obj.uid, null, { redLost: obj.bet, redPlay: obj.bet }, () => {
          TaiXiu_User.updateOne(
            { uid: obj.uid },
            { $inc: { tLostRed: obj.bet, tRedPlay: obj.bet } }
          ).exec();
        });
      }
    }
  } else if (
    obj.taixiu === false &&
    obj.red === true &&
    obj.select === true
  ) {
    // Tổng Red Chẵn
    let win = dice % 2 ? false : true;
    if (sum.ChanLe_red_lech_chan && sum.ChanLe_tong_red_lech > 0) {
      if (sum.ChanLe_tong_red_lech >= obj.bet) {
        // Trả lại hoàn toàn
        sum.ChanLe_tong_red_lech -= obj.bet;
        // trả lại hoàn toàn
        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = obj.bet;
        obj.save();

        balanceApi.endGame(obj.uid, null, { redPlay: obj.bet }, () => {
        });

        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: false,
            select: true,
            red: true
          },
          { $set: { win: win }, $inc: { tralai: obj.bet } }
        ).exec();
      } else {
        // Trả lại 1 phần
        let betPlay = obj.bet - sum.ChanLe_tong_red_lech;
        let betwinP = 0;

        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = sum.ChanLe_tong_red_lech;
        sum.ChanLe_tong_red_lech = 0;

        if (win) {
          // Thắng nhưng bị trừ tiền trả lại
          // cộng tiền thắng
          betwinP = truChietKhau(betPlay, 2);
          obj.betwin = betwinP;
          let redUpdate = obj.bet + betwinP;
          balanceApi.endGame(obj.uid, null, {
            red: redUpdate,
            redWin: betwinP,
            redPlay: betPlay
          }, () => {
            TaiXiu_User.updateOne(
              { uid: obj.uid },
              { $inc: { cWinRed: betwinP, cRedPlay: betPlay } }
            ).exec();
          });


        } else {
          balanceApi.endGame(obj.uid, null, {
            red: obj.tralai,
            redLost: betPlay,
            redPlay: betPlay
          }, () => {
            TaiXiu_User.updateOne(
              { uid: obj.uid },
              { $inc: { cLostRed: betPlay, cRedPlay: betPlay } }
            ).exec();
          });
        }
        obj.save();
        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: false,
            select: true,
            red: true
          },
          {
            $set: { win: win },
            $inc: { tralai: obj.tralai, betwin: betwinP }
          }
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
        balanceApi.endGame(obj.uid, null, { red: redUpdate, redWin: betwin, redPlay: obj.bet }, () => {
          TaiXiu_User.updateOne(
            { uid: obj.uid },
            { $inc: { cWinRed: betwin, cRedPlay: obj.bet } }
          ).exec();
        });

        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: false,
            select: true,
            red: true
          },
          { $set: { win: true }, $inc: { betwin: betwin } }
        ).exec();
      } else {
        obj.thanhtoan = true;
        obj.save();

        balanceApi.endGame(obj.uid, null, { redPlay: obj.bet, redLost: obj.bet }, () => {
          TaiXiu_User.updateOne(
            { uid: obj.uid },
            { $inc: { cLostRed: obj.bet, cRedPlay: obj.bet } }
          ).exec();
        });

      }
    }
  } else if (
    obj.taixiu === false &&
    obj.red === true &&
    obj.select === false
  ) {
    // Tổng Red Lẻ
    let win = dice % 2 ? true : false;
    if (!sum.ChanLe_red_lech_chan && sum.ChanLe_tong_red_lech > 0) {
      if (sum.ChanLe_tong_red_lech >= obj.bet) {
        // Trả lại hoàn toàn
        sum.ChanLe_tong_red_lech -= obj.bet;
        // trả lại hoàn toàn
        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = obj.bet;
        obj.save();
        balanceApi.endGame(obj.uid, null, { redLost: obj.bet }, () => {
        });

        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: false,
            select: false,
            red: true
          },
          { $set: { win: win }, $inc: { tralai: obj.bet } }
        ).exec();
      } else {
        // Trả lại 1 phần
        let betPlay = obj.bet - sum.ChanLe_tong_red_lech;
        let betwinP = 0;

        obj.thanhtoan = true;
        obj.win = win;
        obj.tralai = sum.ChanLe_tong_red_lech;
        sum.ChanLe_tong_red_lech = 0;

        if (win) {
          // Thắng nhưng bị trừ tiền trả lại
          // cộng tiền thắng
          betwinP = truChietKhau(betPlay, 2);
          obj.betwin = betwinP;
          let redUpdate = obj.bet + betwinP;
          balanceApi.endGame(obj.uid, null, {
            red: redUpdate,
            redWin: betwinP,
            redPlay: betPlay
          }, () => {
            TaiXiu_User.updateOne(
              { uid: obj.uid },
              { $inc: { cWinRed: betwinP, cRedPlay: betPlay } }
            ).exec();
          });


        } else {
          balanceApi.endGame(obj.uid, null, {
            red: obj.tralai,
            redLost: betPlay,
            redPlay: betPlay
          }, () => {
            TaiXiu_User.updateOne(
              { uid: obj.uid },
              { $inc: { cLostRed: betPlay, cRedPlay: betPlay } }
            ).exec();
          });

        }
        obj.save();
        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: false,
            select: false,
            red: true
          },
          {
            $set: { win: win },
            $inc: { tralai: obj.tralai, betwin: betwinP }
          }
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
        balanceApi.endGame(obj.uid, null, { red: redUpdate, redWin: betwin, redPlay: obj.bet }, () => {
          TaiXiu_User.updateOne(
            { uid: obj.uid },
            { $inc: { cWinRed: betwin, cRedPlay: obj.bet } }
          ).exec();
        });

        return TXCuocOne.updateOne(
          {
            uid: obj.uid,
            phien: game_id,
            taixiu: false,
            select: false,
            red: true
          },
          { $set: { win: true }, $inc: { betwin: betwin } }
        ).exec();
      } else {
        obj.thanhtoan = true;
        obj.save();
        balanceApi.endGame(obj.uid, null, { redPlay: obj.bet, redLost: obj.bet }, () => {
          TaiXiu_User.updateOne(
            { uid: obj.uid },
            { $inc: { cLostRed: obj.bet, cRedPlay: obj.bet } }
          ).exec();
        });
      }
    }
  }
  return 1;
}

let sumTaiXiu = function (objL, sum) {
  if (
    objL.taixiu === true &&
    objL.red === true &&
    objL.select === true
  ) {
    // Tổng Red Tài
    sum.TaiXiu_red_tong_tai += objL.bet;
  } else if (
    objL.taixiu === true &&
    objL.red === true &&
    objL.select === false
  ) {
    // Tổng Red Xỉu
    sum.TaiXiu_red_tong_xiu += objL.bet;
  } else if (
    objL.taixiu === true &&
    objL.red === false &&
    objL.select === true
  ) {
    // Tổng Xu Tài
    sum.TaiXiu_xu_tong_tai += objL.bet;
  } else if (
    objL.taixiu === true &&
    objL.red === false &&
    objL.select === false
  ) {
    // Tổng Xu Xỉu
    sum.TaiXiu_xu_tong_xiu += objL.bet;
  } else if (
    objL.taixiu === false &&
    objL.red === true &&
    objL.select === true
  ) {
    // Tổng Red Chẵn
    sum.ChanLe_red_tong_chan += objL.bet;
  } else if (
    objL.taixiu === false &&
    objL.red === true &&
    objL.select === false
  ) {
    // Tổng Red Lẻ
    sum.ChanLe_red_tong_le += objL.bet;
  } else if (
    objL.taixiu === false &&
    objL.red === false &&
    objL.select === true
  ) {
    // Tổng xu Chẵn
    sum.ChanLe_xu_tong_chan += objL.bet;
  } else if (
    objL.taixiu === false &&
    objL.red === false &&
    objL.select === false
  ) {
    // Tổng xu Lẻ
    sum.ChanLe_xu_tong_le += objL.bet;
  }
}

let processSumTaiXiu = function (sum) {
  sum.TaiXiu_tong_red_lech = Math.abs(
    sum.TaiXiu_red_tong_tai - sum.TaiXiu_red_tong_xiu
  );
  sum.TaiXiu_tong_xu_lech = Math.abs(
    sum.TaiXiu_xu_tong_tai - sum.TaiXiu_xu_tong_xiu
  );
  sum.ChanLe_tong_red_lech = Math.abs(
    sum.ChanLe_red_tong_chan - sum.ChanLe_red_tong_le
  );
  sum.ChanLe_tong_xu_lech = Math.abs(
    sum.ChanLe_xu_tong_chan - sum.ChanLe_xu_tong_le
  );

  sum.TaiXiu_red_lech_tai = sum.TaiXiu_red_tong_tai > sum.TaiXiu_red_tong_xiu ? true : false;
  sum.TaiXiu_xu_lech_tai = sum.TaiXiu_xu_tong_tai > sum.TaiXiu_xu_tong_xiu ? true : false;
  sum.ChanLe_red_lech_chan = sum.ChanLe_red_tong_chan > sum.ChanLe_red_tong_le ? true : false;
  sum.ChanLe_xu_lech_chan = sum.ChanLe_xu_tong_chan > sum.ChanLe_xu_tong_le ? true : false;

  sum.TaiXiu_red_tong_tai = null;
  sum.TaiXiu_red_tong_xiu = null;

  sum.TaiXiu_xu_tong_tai = null;
  sum.TaiXiu_xu_tong_xiu = null;

  sum.ChanLe_red_tong_chan = null;
  sum.ChanLe_red_tong_le = null;

  sum.ChanLe_xu_tong_chan = null;
  sum.ChanLe_xu_tong_le = null;
}

let initSumTaiXiu = function () {
  let sum = {};

  sum.TaiXiu_red_tong_tai = 0;
  sum.TaiXiu_red_tong_xiu = 0;

  sum.TaiXiu_xu_tong_tai = 0;
  sum.TaiXiu_xu_tong_xiu = 0;

  sum.ChanLe_red_tong_chan = 0;
  sum.ChanLe_red_tong_le = 0;

  sum.ChanLe_xu_tong_chan = 0;
  sum.ChanLe_xu_tong_le = 0;

  return sum;
}

let settleTaiXiuByGroup = function (dice, game_id, bets) {
  if (!bets || bets.length === 0) {
    return [];
  }

  let sum = initSumTaiXiu();

  bets.forEach(function (bet) {
    sumTaiXiu(bet, sum);
  });

  processSumTaiXiu(sum);

  return bets.map(function (bet) {
    return memberPayout(dice, game_id, bet, sum);
  });
}

let settleTaiXiu = function (dice, game_id, bets, uusUserIds) {

  if (bets.length) {

    let normalBets = bets.filter(bet => !uusUserIds.includes(bet.uid));
    // console.log('Normal Bets');
    // console.log(normalBets);
    let processNormalBets = settleTaiXiuByGroup(dice, game_id, normalBets);

    let uusBets = bets.filter(bet => uusUserIds.includes(bet.uid));
    // console.log('UUS Bets');
    // console.log(uusBets);
    let processUUSBets = settleTaiXiuByGroup(dice, game_id, uusBets);

    Promise
      .all(processNormalBets.concat(processUUSBets))
      .then(function (resultUpdate) {
        playGame();
        setTaiXiu_user(game_id, dice);
      });
  } else if (dice) {
    playGame();
  }
}

let thongtin_thanhtoan = function (game_id, dice = false) {
  if (dice) {

    UserInfo.find({ currency: { $regex: /uus/, $options: 'i' } }, function (err, userInfoList) {
      let uusUserIds = userInfoList.map(function (user) {
        return user.id;
      });

      TXCuoc.find({ phien: game_id }, null, { sort: { _id: -1 } },
        function (err, list) {
          settleTaiXiu(dice, game_id, list, uusUserIds);
        });

    });

  } else {
    // Users
    let home = {
      taixiu: {
        taixiu: {
          red_tai: io.taixiu.taixiu.red_tai,
          red_xiu: io.taixiu.taixiu.red_xiu
        }
      }
    };

    Object.values(io.users).forEach(function (users) {
      users.forEach(function (client) {
        if (
          client.gameEvent !== void 0 &&
          client.gameEvent.viewTaiXiu !== void 0 &&
          client.gameEvent.viewTaiXiu
        ) {
          client.red({ taixiu: io.taixiu });
        } else if (client.scene == "home") {
          client.red(home);
        }
      });
    });

    // Admin
    Object.values(io.admins).forEach(function (admin) {
      admin.forEach(function (client) {
        if (
          client.gameEvent !== void 0 &&
          client.gameEvent.viewTaiXiu !== void 0 &&
          client.gameEvent.viewTaiXiu
        ) {
          client.red({ taixiu: io.taixiuAdmin });
        }
      });
    });

    // Khách
    if (!(io.TaiXiu_time % 10)) {
      io.sendAllClient(home);
    }
  }
};

let resetTaiXiuClientAndAdmin = function (io) {
  io.taixiu = {
    chanle: {
      red_chan: 0,
      red_le: 0,
      red_player_chan: 0,
      red_player_le: 0,
      xu_chan: 0,
      xu_le: 0,
      xu_player_chan: 0,
      xu_player_le: 0
    },
    taixiu: {
      red_player_tai: 0,
      red_player_xiu: 0,
      red_tai: 0,
      red_xiu: 0,
      xu_player_tai: 0,
      xu_player_xiu: 0,
      xu_tai: 0,
      xu_xiu: 0
    }
  };

  io.taixiuAdmin = {
    chanle: {
      red_chan: 0,
      red_le: 0,
      red_player_chan: 0,
      red_player_le: 0,
      xu_chan: 0,
      xu_le: 0,
      xu_player_chan: 0,
      xu_player_le: 0
    },
    taixiu: {
      red_player_tai: 0,
      red_player_xiu: 0,
      red_tai: 0,
      red_xiu: 0,
      xu_player_tai: 0,
      xu_player_xiu: 0,
      xu_tai: 0,
      xu_xiu: 0
    },
    list: []
  };
}

let resetBots = function () {
  fs.readFile("./config/taixiu.json", "utf8", (errcf, taixiucf) => {
    try {
      taixiucf = JSON.parse(taixiucf);
      //TODO: Bop implementation
      if (taixiucf.bot) {
        // lấy danh sách tài khoản bot
        //console.log("run get bot");
        //let name = "testbotnv02";
        UserInfo.find({ type: true }, "id name", function (err, list) {
          //UserInfo.find({ "name" : { $regex: /testbotnv/, $options: 'i' } }, 'id name', function(err, list){
          //console.log(`Total bot: ${list.length}`);
          if (list.length) {
            Promise.all(
              list.map(function (user) {
                user = user._doc;
                delete user._id;
                return user;
              })
            ).then(result => {
              botTemp = [...result];
              let maxBot = ((result.length * 70) / 100) >> 0;
              botList = Helpers.shuffle(result); // tráo bot;
              botList = botList.slice(0, maxBot);

              maxBot = ((result.length * 50) / 100) >> 0;
              botListCl = Helpers.shuffle(result); // tráo bot;
              botListCl = botListCl.slice(0, maxBot);
            });
          }
        });
      } else {
        botTemp = [];
        botList = [];
        botListCl = [];
      }
    } catch (error) {
      botTemp = [];
      botList = [];
      botListCl = [];
    }
  });
}

let throwDiceAndInsertNewPhien = function () {
  fs.readFile("./data/taixiu.json", "utf8", (errjs, taixiujs) => {
    try {
      taixiujs = JSON.parse(taixiujs);

      let dice1 = parseInt(
        taixiujs.dice1 == 0
          ? Math.floor(Math.random() * 6) + 1
          : taixiujs.dice1
      );
      let dice2 = parseInt(
        taixiujs.dice2 == 0
          ? Math.floor(Math.random() * 6) + 1
          : taixiujs.dice2
      );
      let dice3 = parseInt(
        taixiujs.dice3 == 0
          ? Math.floor(Math.random() * 6) + 1
          : taixiujs.dice3
      );

      taixiujs.dice1 = 0;
      taixiujs.dice2 = 0;
      taixiujs.dice3 = 0;
      taixiujs.uid = "";
      taixiujs.rights = 2;

      fs.writeFile(
        "./data/taixiu.json",
        JSON.stringify(taixiujs),
        function (err) { }
      );

      TXPhien.create(
        { dice1: dice1, dice2: dice2, dice3: dice3, time: new Date() },
        function (err, create) {
          if (!!create) {
            io.TaiXiu_phien = create.id + 1;
            thongtin_thanhtoan(create.id, dice1 + dice2 + dice3);
            io.sendAllUser({
              taixiu: {
                finish: {
                  dices: [create.dice1, create.dice2, create.dice3],
                  phien: create.id
                }
              }
            });

            Object.values(io.admins).forEach(function (admin) {
              admin.forEach(function (client) {
                client.red({
                  taixiu: {
                    finish: {
                      dices: [create.dice1, create.dice2, create.dice3],
                      phien: create.id
                    }
                  }
                });
              });
            });
            dice1 = null;
            dice2 = null;
            dice3 = null;
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  });
}

let configTimeBot = function () {
  // let timeBot = (Math.floor(Math.random() * (6 - 2 + 1)) + 2) >> 0;
  // if (!(io.TaiXiu_time % timeBot)) {
  //   let userCuoc = (Math.random() * 7) >> 0;
  //   let iH = 0;
  //   for (iH = 0; iH < userCuoc; iH++) {
  //     let dataT = botList[iH];
  //     if (!!dataT) {
  //       bot.tx(dataT, io);
  //       botList.splice(iH, 1); // Xoá bot đã đặt tránh trùng lặp
  //     }
  //     dataT = null;
  //   }
  // }
  // timeBot = (Math.floor(Math.random() * (6 - 2 + 1)) + 2) >> 0;
  // if (!(io.TaiXiu_time % timeBot)) {
  //   let userCuocCL = (Math.random() * 7) >> 0;
  //   let iHCL = 0;
  //   for (iHCL = 0; iHCL < userCuocCL; iHCL++) {
  //     let dataT = botListCl[iHCL];
  //     if (!!dataT) {
  //       bot.cl(dataT, io);
  //       botListCl.splice(iHCL, 1); // Xoá bot đã đặt tránh trùng lặp
  //     }
  //     dataT = null;
  //   }
  // }
}

let botPlacesBets = function () {
  if (!!botList.length && io.TaiXiu_time > 5) {
    let userCuoc = (Math.random() * 7) >> 0;
    let iH = 0;
    for (iH = 0; iH < userCuoc; iH++) {
      let dataT = botList[iH];
      if (!!dataT) {
        bot.tx(dataT, io);
        botList.splice(iH, 1); // Xoá bot đã đặt tránh trùng lặp
      }
      dataT = null;
    }
    // configTimeBot();
  }
};

let playGame = function () {
  io.TaiXiu_time = timeTX;
  this.disabled = false;

  gameLoop = setInterval(function () {
    var self = this;
    if (!(io.TaiXiu_time % 30)) {
      TopHu();
    }

    if (io.TaiXiu_time == timeTX) {
      CheckUM(self);
    }

    if (!self.disabled) {
      io.TaiXiu_time--;
      
      if (io.TaiXiu_time < timeCuoc) {
        if (io.TaiXiu_time < 1) {
          clearInterval(gameLoop);

          try {
            // Kết thúc phiên
            io.TaiXiu_time = 1;

            throwDiceAndInsertNewPhien();
            resetTaiXiuClientAndAdmin(io);
            resetBots();

          } catch (ex) {
            console.log(ex);
          }
        } else {
          try {
            thongtin_thanhtoan(io.TaiXiu_phien);
            botPlacesBets();
          } catch (ex) {
            console.log(ex);
          }
        }
      }
    }
  }, 1000);

  setInterval(function () {
    botHu(io, botTemp);
  }, 300000);

  return gameLoop;
};

function CheckUM(self) {
  GameConfigs.findOne({ name: "taixiu" }, function (err, data) {
    if (err) {
      console.log("error to get config for taixiu");
    }

    self.disabled = (data == null || !data.enabled);

    if (self.disabled) {
      io.sendAllUser({
        taixiu: { um: true }
      });

      console.log("taixiu: { um: true }");
      GameConfigs.updateOne({ name: "taixiu" }, { disabledround: io.TaiXiu_phien }, function (err, data) {
        if (err) {
          console.log("update game config error");
        }
      });
      io.TaiXiu_time = timeTX;
      return;
    }

    io.sendAllUser({
      taixiu: { time_remain: timeTX }
    });
  });
}

module.exports = init;



