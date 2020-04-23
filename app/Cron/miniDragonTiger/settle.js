let MiniDragonTiger_cuoc = require('./../../Models/MiniDragonTiger/MiniDragonTiger_cuoc');
const logger = require('./../../web/logger');
const gameIds = require('./../../../config/appConfigs').gameIds;
const balanceApi = require('../../../apis/balanceApi');
let MiniDragonTiger_user = require('../../Models/MiniDragonTiger/MiniDragonTiger_user');

module.exports = function (roundId, result) {
    try {
        if (result && result.length) {
            const dragon = result[0];
            const tiger = result[1];

            MiniDragonTiger_cuoc.find({ phien: roundId }, {}, (err, list) => {
                if (err) {
                    logger.logError(err);
                }

                Promise.all(list.map((bet) => {
                    const totalBet = bet.dragon + bet.tiger + bet.draw;
                    let redWin = 0;
                    let redLost = 0;
                    let totalWin = 0;

                    if (bet.dragon > 0) {
                        if (dragon.card > tiger.card) {
                            totalWin += bet.dragon * 2;
                            redWin += bet.dragon;
                        } else {
                            redLost += bet.dragon;
                        }
                    }

                    if (bet.tiger > 0) {
                        if (tiger.card > dragon.card) {
                            totalWin += bet.tiger * 2;
                            redWin += bet.tiger;
                        } else {
                            redLost += bet.tiger;
                        }
                    }

                    if (bet.draw > 0) {
                        if (dragon.card == tiger.card) {
                            let win = dragon.card * 10
                            totalWin += win;
                            redWin += (win - dragon.draw);
                        } else {
                            redLost += bet.draw;
                        }
                    }

                    bet.thanhtoan = true;
                    bet.betwin = totalWin;
                    bet.save();

                    let update = {};
                    let updateGame = {};
                    if (totalWin > 0) {
                        update['red'] = totalWin;
                    }
                    if (redWin > 0) {
                        update['redWin'] = updateGame['red'] = redWin;
                    }
                    if (redLost > 0) {
                        update['redLost'] = updateGame['red_lost'] = redLost;
                    }

                    update['redPlay'] = updateGame['redPlay'] = totalBet;

                    let gameInfo = {
                        gameId: gameIds.minidragontiger,
                        gameRoundId: roundId,
                        memberId: bet.memberId,
                        siteId: bet.siteId
                    }

                    return new Promise((resolve) => {
                        try {
                            balanceApi.endGame(cuoc.uid, gameInfo, update, self.io.users, () => {
                                MiniDragonTiger_user.updateOne({ uid: cuoc.uid }, { $inc: updateGame });
                            });
                        } catch (ex) {
                            logger.logError(ex);
                        }
                    });
                }));
            });
        }
    } catch (error) {
        logger.logError(error);
    }
};