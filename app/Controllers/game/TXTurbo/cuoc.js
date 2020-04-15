var TXTurboCuoc = require("../../../Models/TXTurbo/TXTurbo_cuoc");
var TXTurboCuocOne = require("../../../Models/TXTurbo/TXTurbo_one");
var UserInfo = require("../../../Models/UserInfo");

const balanceApi = require('./../../../apis/balanceApi');
const gameIds = require('./../../../../config/appConfigs').gameIds;
const betChoiceMapper = require('./../../../apis/betChoiceMapper');
const logger = require('./../../../web/logger');
const ConfigHelper = require('./../../../Helpers/ConfigHelper');
let configs = null;

module.exports = function (client, data) {
    try {
        if (!!data && !!data.bet) {

            configs = ConfigHelper.getConfigs("taixiu");

            if (client.redT.TXTurbo_time < 6 || client.redT.TXTurbo_time > 50) {
                client.red({ taixiu_turbo: { err: "Vui lòng đặt cược ở phiên sau." } });
            } else {
                var bet = data.bet >> 0; // Số tiền
                var taixiu = !!data.taixiu; // Tài xỉu:true    Chẵn lẻ:false
                var red = !!data.red; // Loại tiền (Red:true, Xu:false)
                var select = !!data.select; // Cửa đặt (Tài:1, Xỉu:0)
                if (bet < configs.minbet) {
                    client.red({ taixiu_turbo: { err: "Tiền cược tối thiểu là " + configs.minbet } });
                } else if (bet > configs.maxbet) {
                    client.red({ taixiu_turbo: { err: "Tiền cược tối đa là " + configs.maxbet } });
                }
                else {
                    var phien = client && client.redT ? client.redT.TXTurbo_phien : 0;
                    data.inSufficientBalance = { taixiu_turbo: { err: "Bạn hiện không có đủ tiền để cược." } };
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

                            TXTurboCuocOne.findOne({ uid: client.UID, phien: phien, taixiu: taixiu, red: red }, function (isCuocErr, isCuoc) {

                                if (isCuocErr) {
                                    logger.logError(err);
                                }

                                try {
                                    user.name = userInfo.name;
                                    if (!!isCuoc) {
                                        // update
                                        if (isCuoc.select !== select) { client.red({ taixiu_turbo: { err: "Chỉ được cược 1 bên." } }); }
                                        else if (isCuoc.bet + bet > configs.maxbet) {
                                            client.red({ taixiu_turbo: { err: "Tiền cược tối đa là " + configs.maxbet } });
                                        } else {
                                            var io = client.redT;

                                            io.taixiuTurboAdmin.list.unshift({
                                                name: user.name,
                                                taixiu: taixiu,
                                                select: select,
                                                red: red,
                                                bet: bet,
                                                time: new Date()
                                            });

                                            updateUserRed((updatedUser) => {
                                                TXTurboCuocOne.updateOne({ uid: client.UID, phien: phien, taixiu: taixiu, red: red, select: select }, { $inc: { bet: bet } }).exec();
                                                let create = { uid: client.UID, name: user.name, phien: phien, bet: bet, taixiu: taixiu, select: select, red: red, time: new Date() };
                                                if (client.session) {
                                                    create.memberId = client.session.memberId;
                                                    create.siteId = client.session.siteId;
                                                }
                                                TXTurboCuoc.create(create);

                                                if (taixiu) {
                                                    if (red && !isUUSAccount) {
                                                        if (select) {
                                                            io.taixiu_turbo.taixiu.red_tai += bet;
                                                            io.taixiuTurboAdmin.taixiu.red_tai += bet;
                                                        } else {
                                                            io.taixiu_turbo.taixiu.red_xiu += bet;
                                                            io.taixiuTurboAdmin.taixiu.red_xiu += bet;
                                                        }
                                                    }
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
                                                                taixiu_turbo: taixiuVery,
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

                                        io.taixiuTurboAdmin.list.unshift({ name: user.name, taixiu: taixiu, select: select, red: red, bet: bet, time: new Date() });

                                        updateUserRed((updatedUser) => {
                                            let cuocOneCreate = { uid: client.UID, phien: phien, taixiu: taixiu, select: select, red: red, bet: bet };
                                            if (client.session) {
                                                cuocOneCreate.memberId = client.session.memberId;
                                                cuocOneCreate.siteId = client.session.siteId;
                                            }

                                            if (taixiu) {
                                                if (red && !isUUSAccount) {
                                                    if (select) {
                                                        io.taixiu_turbo.taixiu.red_tai += bet;
                                                        io.taixiu_turbo.taixiu.red_player_tai += 1;

                                                        io.taixiuTurboAdmin.taixiu.red_tai += bet;
                                                        io.taixiuTurboAdmin.taixiu.red_player_tai += 1;
                                                    } else {
                                                        io.taixiu_turbo.taixiu.red_xiu += bet;
                                                        io.taixiu_turbo.taixiu.red_player_xiu += 1;

                                                        io.taixiuTurboAdmin.taixiu.red_xiu += bet;
                                                        io.taixiuTurboAdmin.taixiu.red_player_xiu += 1;
                                                    }
                                                }
                                            }

                                            TXTurboCuocOne.create(cuocOneCreate);

                                            let obj = { uid: client.UID, name: user.name, phien: phien, bet: bet, taixiu: taixiu, select: select, red: red, time: new Date() };
                                            if (client.session) {
                                                obj.memberId = client.session.memberId;
                                                obj.siteId = client.session.siteId;
                                            }
                                            TXTurboCuoc.create(obj);

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
                                                        obj.red({ taixiu_turbo: taixiuVery, user: { red: updatedUser.red } });
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