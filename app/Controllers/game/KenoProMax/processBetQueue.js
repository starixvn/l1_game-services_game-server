let KenoProMaxCuoc = require('../../../Models/KenoProMax/KenoProMax_cuoc');
const balanceApi = require('../../../apis/balanceApi');
const gameIds = require('../../../../config/appConfigs').gameIds;
const betChoiceMapper = require('../../../apis/betChoiceMapper');
const logger = require('../../../web/logger');
const constants = require("./../../../Cron/KenoProMax/constants");

const processPlacingBet = (realPlayer, data) => {
    try {
        if (realPlayer.redT == null || realPlayer.redT.kenoProMax == null) {
            return;
        }

        let cuoc = data.cuoc >> 0;
        let box = data.box;
        let kenoProMax = realPlayer.redT.kenoProMax;

        const placeBetSuccess = (user) => {
            KenoProMaxCuoc.findOne({ uid: realPlayer.UID, phien: kenoProMax.roundId }, function (err, checkOne) {
                if (err) {
                    logger.logError(err);

                    return;
                }

                try {
                    if (checkOne) {
                        checkOne[box] += cuoc;
                        checkOne.save().then(() => {
                            notifyUsersAfterModifyCuoc(kenoProMax, realPlayer, user, box, cuoc);
                        }).catch((updateError) => {
                            logger.logError(updateError);
                            clearCurrentCuoc(kenoProMax, realPlayer);
                        });
                    } else {
                        let create = { uid: realPlayer.UID, name: realPlayer.profile.name, phien: kenoProMax.roundId, time: new Date() };
                        if (realPlayer.session) {
                            create.memberId = realPlayer.session.memberId;
                            create.siteId = realPlayer.session.siteId;
                        }
                        let update = { [box]: cuoc };
                        KenoProMaxCuoc.updateOne(
                            { uid: realPlayer.UID, phien: kenoProMax.roundId },
                            { $inc: update, $setOnInsert: create },
                            { upsert: true, setDefaultsOnInsert: true },
                            function (err, doc) {
                                if (err) {
                                    logger.logError(err);

                                    return;
                                }
                                notifyUsersAfterModifyCuoc(kenoProMax, realPlayer, user, box, cuoc);
                            });
                    }
                }
                catch (ex) {
                    logger.logError(ex);
                    kenoProMax.ingame[realPlayer.profile.name].processRunning = null;
                }
            });
        };

        const clearCurrentCuoc = (kenoProMax, client) => {
            try {
                kenoProMax.ingame[client.profile.name].kenoProMax = null;
            } catch (error) {
                logger.logError(error);
            }
        };

        const notifyUsersAfterModifyCuoc = (kenoProMax, client, user, box, cuoc) => {
            try {
                kenoProMax.totalBets[box] += cuoc;

                const betsOfThisUser = kenoProMax.ingame[client.profile.name];
                const ownBet = constants.choices.reduce((result, choice) => {
                    result[choice] = betsOfThisUser[choice];
                    return result;
                }, {});

                if (kenoProMax.players[client.UID]) {
                    kenoProMax.players[client.UID].red = user.red;
                }

                Object.values(kenoProMax.realPlayers).forEach(function (users) {
                    if (client.UID !== users.UID) {
                        users.red({ kenoProMax: { chip: { playerId: client.UID, box: box, bet: cuoc, red: user.red } } });
                    }
                    else {
                        const successMessage = { kenoProMax: { ownChip: { box: box, bet: data.cuoc }, ownBet: ownBet }, user: { red: user.red } };
                        users.red(successMessage);
                    }
                });
            } catch (error) {
                logger.logError(error);
            } finally {
                clearCurrentCuoc(kenoProMax, client);
            }

        };

        const placeBetFailed = () => {
            try {
                let currentUser = kenoProMax.ingame[realPlayer.profile.name];
                currentUser[box] -= cuoc;

                currentUser.processRunning = null;
            }
            catch (ex) {
                logger.logError(ex);
                clearCurrentCuoc(kenoProMax, realPlayer);
            }
        };

        data.inSufficientBalance = { kenoProMax: { notice: constants.notices.notEnoughMoney } };
        data.gameId = gameIds.kenopromax;
        data.gameRoundId = realPlayer.redT.kenoProMax.roundId;
        data.choiceId = betChoiceMapper.convertKenoProMax(box);
        balanceApi.placeBet({ id: realPlayer.UID }, data, realPlayer, placeBetSuccess, placeBetFailed);
    } catch (error) {
        logger.logError(error);
    }
};

const processBetQueue = (io) => {
    try {
        if (io.kenoProMax.ingame) {
            Object.values(io.kenoProMax.ingame).reduce((promise, userBet) => {
                if (userBet.processRunning == null && userBet.betQueue && userBet.betQueue.length > 0) {
                    userBet.processRunning = true;
                    const { data, client } = userBet.betQueue.shift();

                    return promise
                        .then(() => processPlacingBet(client, data))
                        .catch(error => logger.logError(error))
                        .then(() => {
                            userBet.processRunning = null;
                        })
                } else {
                    return promise;
                }
            }, Promise.resolve());
        }
    }
    catch (ex) {
        logger.logError(ex);

        console.log(JSON.stringify({ message: ex.message, stack: ex.stack }));
    }
};

module.exports = (io) => {
    const processTimeOut = 50;
    setTimeout(function processBets() {

        processBetQueue(io);

        setTimeout(processBets, processTimeOut);
    }, processTimeOut);
};