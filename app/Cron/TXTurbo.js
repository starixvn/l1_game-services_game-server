let Helpers = require("../Helpers/Helpers");

let UserInfo = require("../Models/UserInfo");
let TXTurboPhien = require("../Models/TXTurbo/TXTurbo_phien");
let TXTurboCuoc = require("../Models/TXTurbo/TXTurbo_cuoc");
let TXTurbo_User = require("../Models/TXTurbo/TXTurbo_user");
let TXTurboCuocOne = require("../Models/TXTurbo/TXTurbo_one");
let GameConfigs = require('../Models/GameConfig/GameConfigs');
let Chance = require('chance');

const chance = new Chance();
const gameIds = require("../../config/appConfigs").gameIds;
const balanceApi = require('./../apis/balanceApi');
const logger = require('./../web/logger');
const ConfigHelper = require('../Helpers/ConfigHelper');
const random = require('./../Controllers/diceRandom').random;
let bot = require("./TXTurbo/bot");
let botList = [];
let botListCl = [];

let botTemp = [];

let io = null;
let gameLoop = null;
const timeTX = 36;
const timeCuoc = 30;
const minBetDuDay = 1;
let configs = null;

let init = function (obj) {
    io = obj;

    io.taixiu_turbo = {
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

    io.taixiuTurboAdmin = {
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

    ConfigHelper.reloadConfigs(ConfigHelper.GameTypes.TXTurbo);

    playGame();
};

TXTurboPhien.findOne({}, "id", { sort: { id: -1 } }, function (err, last) {
    if (!!last) {
        io.TXTurbo_phien = last.id + 1;
    }
});

let truChietKhau = function (bet, phe) {
    var chietkhau = bet - (bet * phe) / 100;

    return chietkhau;
};

let setTaiXiu_user = function (phien, settlementTime) {
    TXTurboCuocOne.find({ phien: phien, thanhtoan: true }, {}, function (err, list) {
        if (list.length) {
            Promise.all(
                list.map(function (obj) {
                    let action = new Promise((resolve, reject) => {
                        TXTurbo_User.findOne({ uid: obj.uid }, function (error, data) {
                            try {
                                if (error) {
                                    logger.logError(error);
                                    resolve({ uid: obj.uid, red: obj.red, taixiu: obj.taixiu, betwin: obj.betwin });
                                    return;
                                }

                                if (data == null) {
                                    resolve({ uid: obj.uid, red: obj.red, taixiu: obj.taixiu, betwin: obj.betwin });
                                    return;
                                }

                                let bet_thua = obj.bet - obj.tralai;
                                let bet = obj.win ? obj.betwin + obj.bet : bet_thua;
                                let update = {};

                                if (obj.taixiu === true && obj.red === true && bet_thua >= minBetDuDay) {
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
                                } else if (obj.taixiu === false && obj.red === true && bet_thua >= minBetDuDay) {
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
                                }

                                !!Object.entries(update).length && TXTurbo_User.updateOne({ uid: obj.uid }, { $set: update }).exec();

                                const gameInfo = {
                                    gameId: gameIds.txturbo,
                                    gameRoundId: phien,
                                    memberId: obj.memberId,
                                    siteId: obj.siteId,
                                    time: settlementTime
                                };


                                const settleInfo = {
                                    red: obj.win ? obj.betwin + obj.bet : obj.tralai,
                                    redPlay: obj.bet,
                                }

                                balanceApi.endGame(obj.uid, gameInfo, settleInfo, io.users, () => {
                                    if (io.users[obj.uid]) {
                                        io.users[obj.uid].forEach(function (client) {
                                            client.red({
                                                taixiu_turbo: {
                                                    status: { win: obj.win, thuong: obj.thuong, select: obj.select, bet: bet }
                                                }
                                            });
                                        });
                                    }

                                    resolve({ uid: obj.uid, red: obj.red, taixiu: obj.taixiu, betwin: obj.betwin });
                                });
                            }
                            catch (ex) {
                                logger.log(ex);
                                resolve({ uid: obj.uid, red: obj.red, taixiu: obj.taixiu, betwin: obj.betwin });
                            }
                        });
                    });
                    return action;
                })
            )
        }
    });
};

let memberPayout = function (dice, game_id, obj, sum, userSettlements) {
    if (!userSettlements[obj.uid]) {
        userSettlements[obj.uid] = { red: 0, redWin: 0, redLost: 0, redPlay: 0 };
    }

    if (obj.taixiu === true && obj.red === true && obj.select === true) {
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

                userSettlements[obj.uid].redPlay = obj.bet;
                userSettlements[obj.uid].red += obj.bet;

                return TXTurboCuocOne.updateOne(
                    { uid: obj.uid, phien: game_id, taixiu: true, select: true, red: true },
                    { $set: { win: win, thanhtoan: true, time: new Date() }, $inc: { tralai: obj.bet } }
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
                    betwinP = truChietKhau(betPlay, 3);
                    obj.betwin = betwinP;
                    let redUpdate = obj.bet + betwinP;

                    userSettlements[obj.uid].red += redUpdate;
                    userSettlements[obj.uid].redPlay += obj.bet;
                    userSettlements[obj.uid].redWin += betwinP;
                    TXTurbo_User.updateOne({ uid: obj.uid }, { $inc: { tWinRed: betwinP, tRedPlay: betPlay } }).exec();
                } else {

                    userSettlements[obj.uid].red += obj.tralai;
                    userSettlements[obj.uid].redPlay += obj.bet;
                    userSettlements[obj.uid].redLost += betPlay;
                    TXTurbo_User.updateOne({ uid: obj.uid }, { $inc: { tLostRed: betPlay, tRedPlay: betPlay } }).exec();

                }
                obj.save();
                return TXTurboCuocOne.updateOne(
                    { uid: obj.uid, phien: game_id, taixiu: true, select: true, red: true },
                    { $set: { win: win, thanhtoan: true, time: new Date() }, $inc: { tralai: obj.tralai, betwin: betwinP } }
                ).exec();
            }
        } else {
            if (win) {
                // cộng tiền thắng hoàn toàn
                let betwin = truChietKhau(obj.bet, 3);
                obj.thanhtoan = true;
                obj.win = true;
                obj.betwin = betwin;
                obj.save();

                let redUpdate = obj.bet + betwin;

                userSettlements[obj.uid].red += redUpdate;
                userSettlements[obj.uid].redWin += betwin;
                userSettlements[obj.uid].redPlay += obj.bet;
                TXTurbo_User.updateOne({ uid: obj.uid }, { $inc: { tWinRed: betwin, tRedPlay: obj.bet } }).exec();

                return TXTurboCuocOne.updateOne(
                    { uid: obj.uid, phien: game_id, taixiu: true, select: true, red: true },
                    { $set: { win: true, thanhtoan: true, time: new Date() }, $inc: { betwin: betwin } }
                ).exec();
            } else {
                obj.thanhtoan = true;
                obj.save();

                userSettlements[obj.uid].redPlay += obj.bet;
                userSettlements[obj.uid].redLost += obj.bet;
                TXTurbo_User.updateOne({ uid: obj.uid }, { $inc: { tLostRed: obj.bet, tRedPlay: obj.bet } }).exec();

                return TXTurboCuocOne.updateOne(
                    { uid: obj.uid, phien: game_id, taixiu: true, select: true, red: true },
                    { $set: { thanhtoan: true, time: new Date() } }
                ).exec();
            }
        }
    } else if (obj.taixiu === true && obj.red === true && obj.select === false) {
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

                userSettlements[obj.uid].red += obj.bet;
                userSettlements[obj.uid].redPlay += obj.bet;

                return TXTurboCuocOne.updateOne(
                    { uid: obj.uid, phien: game_id, taixiu: true, select: false, red: true },
                    { $set: { win: win, thanhtoan: true, time: new Date() }, $inc: { tralai: obj.bet } }
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
                    betwinP = truChietKhau(betPlay, 3);
                    obj.betwin = betwinP;
                    let redUpdate = obj.bet + betwinP;

                    userSettlements[obj.uid].red += redUpdate;
                    userSettlements[obj.uid].redPlay += obj.bet;
                    userSettlements[obj.uid].redWin += betwinP;
                    TXTurbo_User.updateOne({ uid: obj.uid }, { $inc: { tWinRed: betwinP, tRedPlay: betPlay } }).exec();

                } else {
                    userSettlements[obj.uid].red += obj.tralai;
                    userSettlements[obj.uid].redPlay += obj.bet;
                    userSettlements[obj.uid].redLost += betPlay;
                    TXTurbo_User.updateOne({ uid: obj.uid }, { $inc: { tLostRed: betPlay, tRedPlay: betPlay } }).exec();
                }
                obj.save();
                return TXTurboCuocOne.updateOne(
                    { uid: obj.uid, phien: game_id, taixiu: true, select: false, red: true },
                    { $set: { win: win, thanhtoan: true, time: new Date() }, $inc: { tralai: obj.tralai, betwin: betwinP } }
                ).exec();
            }
        } else {
            if (win) {
                // cộng tiền thắng hoàn toàn
                let betwin = truChietKhau(obj.bet, 3);
                obj.thanhtoan = true;
                obj.win = true;
                obj.betwin = betwin;
                obj.save();

                let redUpdate = obj.bet + betwin;
                userSettlements[obj.uid].red += redUpdate;
                userSettlements[obj.uid].redWin += betwin;
                userSettlements[obj.uid].redPlay += obj.bet;
                TXTurbo_User.updateOne(
                    { uid: obj.uid },
                    { $inc: { tWinRed: betwin, tRedPlay: obj.bet } }
                ).exec();

                return TXTurboCuocOne.updateOne(
                    { uid: obj.uid, phien: game_id, taixiu: true, select: false, red: true },
                    { $set: { win: true, thanhtoan: true, time: new Date() }, $inc: { betwin: betwin } }
                ).exec();
            } else {
                obj.thanhtoan = true;
                obj.save();

                userSettlements[obj.uid].redLost += obj.bet;
                userSettlements[obj.uid].redPlay += obj.bet;
                TXTurbo_User.updateOne({ uid: obj.uid }, { $inc: { tLostRed: obj.bet, tRedPlay: obj.bet } }).exec();

                return TXTurboCuocOne.updateOne(
                    { uid: obj.uid, phien: game_id, taixiu: true, select: false, red: true },
                    { $set: { thanhtoan: true, time: new Date() } }
                ).exec();
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

let settleTaiXiuByGroup = function (dice, game_id, bets, userSettlements) {
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

let settleTaiXiu = function (dice, game_id, bets, uusUserIds, settlementTime) {
    if (bets.length) {
        let userSettlements = {};
        let normalBets = bets.filter(bet => !uusUserIds.includes(bet.uid));
        let processNormalBets = settleTaiXiuByGroup(dice, game_id, normalBets, userSettlements);

        let uusBets = bets.filter(bet => uusUserIds.includes(bet.uid));
        let processUUSBets = settleTaiXiuByGroup(dice, game_id, uusBets, userSettlements);

        Promise
            .all(processNormalBets.concat(processUUSBets))
            .then(function (resultUpdate) {
                playGame();
                setTaiXiu_user(game_id, settlementTime);
            });
    } else if (dice) {
        playGame();
    }
}

let thongtin_thanhtoan = function (game_id, dice = false, settlementTime = null) {
    try {
        if (dice) {
            UserInfo.find({ currency: { $regex: /uus/, $options: 'i' } }, function (err, userInfoList) {
                if (err) { logger.logError(err); }

                let uusUserIds = userInfoList.map(function (user) { return user.id; });

                TXTurboCuoc.find({ phien: game_id }, null, { sort: { _id: -1 } },
                    function (err, list) {
                        if (err) {
                            logger.logError(err);
                        }

                        settleTaiXiu(dice, game_id, list, uusUserIds, settlementTime);
                    });

            });

        } else {
            // Users
            let home = {
                taixiu_turbo: {
                    taixiu: {
                        red_tai: io.taixiu_turbo.taixiu.red_tai,
                        red_xiu: io.taixiu_turbo.taixiu.red_xiu
                    }
                }
            };

            Object.values(io.users).forEach(function (users) {
                users.forEach(function (client) {
                    if (
                        client.gameEvent !== void 0 &&
                        client.gameEvent.viewTaiXiuTurbo !== void 0 &&
                        client.gameEvent.viewTaiXiuTurbo
                    ) {
                        client.red({ taixiu_turbo: io.taixiu_turbo });
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
                        client.gameEvent.viewTaiXiuTurbo !== void 0 &&
                        client.gameEvent.viewTaiXiuTurbo
                    ) {
                        client.red({ taixiu_turbo: io.taixiuTurboAdmin });
                    }
                });
            });

            // Khách
            if (!(io.TXTurbo_time % 10)) {
                io.sendAllClient(home);
            }
        }
    } catch (error) {
        logger.logError(error);
    }
};

let resetTaiXiuClientAndAdmin = function (io) {
    io.taixiu_turbo = {
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

    io.taixiuTurboAdmin = {
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
    bot.resetBots();
}

let throwDiceAndInsertNewPhien = function () {
    let dice1 = random();
    let dice2 = random();
    let dice3 = random();

    TXTurboPhien.create(
        { dice1: dice1, dice2: dice2, dice3: dice3, time: new Date() },
        function (err, create) {
            if (err) {
                logger.logError(err);
            }

            if (!!create) {
                io.TXTurbo_phien = create.id + 1;
                thongtin_thanhtoan(create.id, dice1 + dice2 + dice3, create.time);
                var { red_me_tai, red_me_xiu, xu_me_tai, xu_me_xiu, ...taixiuInfo } = io.taixiu_turbo.taixiu;
                io.sendAllUser({
                    taixiu_turbo: {
                        taixiu: taixiuInfo,
                        finish: { dices: [create.dice1, create.dice2, create.dice3], phien: create.id }
                    }
                });

                Object.values(io.admins).forEach(function (admin) {
                    admin.forEach(function (client) {
                        client.red({
                            taixiu_turbo: { finish: { dices: [create.dice1, create.dice2, create.dice3], phien: create.id } }
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
    bot.botPlacesBets(io);
};

let playGame = function () {
    io.TXTurbo_time = timeTX;
    this.disabled = false;

    gameLoop = setInterval(function () {
        var self = this;
        try {
            if (io.TXTurbo_time == timeTX) {
                CheckUM(self);
            }

            if (!self.disabled) {
                io.TXTurbo_time--;

                if (io.TXTurbo_time === timeCuoc) {
                    resetTaiXiuClientAndAdmin(io);
                } else if (io.TXTurbo_time < timeCuoc) {
                    if (io.TXTurbo_time < 1) {
                        clearInterval(gameLoop);

                        try {
                            // Kết thúc phiên
                            io.TXTurbo_time = 1;

                            throwDiceAndInsertNewPhien();
                            resetBots();

                        } catch (ex) {
                            logger.logError(ex);
                        }
                    } else {
                        try {
                            thongtin_thanhtoan(io.TXTurbo_phien);
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
    GameConfigs.findOne({ name: ConfigHelper.GameTypes.TXTurbo }, function (err, data) {
        if (err) {
            logger.logError(err);
        }

        try {

            configs = data;

            ConfigHelper.updateConfig(ConfigHelper.GameTypes.TXTurbo, data);

            self.disabled = (data == null || !data.enabled);
            var disabledMessage = data == null ? "" : data.disabled_message;

            if (self.disabled) {
                io.sendAllUser({ taixiu_turbo: { um: true, um_message: disabledMessage } });

                GameConfigs.updateOne({ name: ConfigHelper.GameTypes.TXTurbo }, { disabledround: io.TXTurbo_phien }, function (err, data) {
                    if (err) {
                        logger.logError(err);
                    }
                });

                io.TXTurbo_time = timeTX;

                return;
            }

            io.sendAllUser({ taixiu_turbo: { time_remain: timeTX } });
        }
        catch (err) {
            logger.logError(err);
        }
    });
}

module.exports = init;



