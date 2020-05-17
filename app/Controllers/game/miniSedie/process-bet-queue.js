let MiniSedieCuoc = require('./models/MiniSedie_cuoc');
const balanceApi = require('../../../apis/balanceApi');
const gameIds = require('../../../../config/appConfigs').gameIds;
const betChoiceMapper = require('../../../apis/betChoiceMapper');
const logger = require('../../../web/logger');
const constants = require("./constants");
const noticeMessages = require("../constants/notice-messages");

const processPlacingBet = (client, data) => {
    try {
        if (client.redT == null || client.redT.miniSedie == null) {
            return;
        }

        let amount = data.amount >> 0;
        let box = data.box;
        let miniSedieData = client.redT.miniSedie;

        const placeBetSuccess = (user) => {
            MiniSedieCuoc.findOne({ uid: client.UID, phien: miniSedieData.roundId }, function (err, checkOne) {
                if (err) {
                    logger.logError(err);

                    return;
                }

                try {
                    if (checkOne) {
                        checkOne[box] += amount;
                        checkOne.save().then(() => {
                            notifyUsersAfterModifyBet(miniSedieData, client, user, box, amount);
                        }).catch((updateError) => {
                            logger.logError(updateError);
                            clearCurrentBet(miniSedieData, client);
                        });
                    } else {
                        let create = { uid: client.UID, name: client.profile.name, phien: miniSedieData.roundId, time: new Date() };
                        if (client.session) {
                            create.memberId = client.session.memberId;
                            create.siteId = client.session.siteId;
                        }
                        let update = { [box]: amount };
                        MiniSedieCuoc.updateOne(
                            { uid: client.UID, phien: miniSedieData.roundId },
                            { $inc: update, $setOnInsert: create },
                            { upsert: true, setDefaultsOnInsert: true },
                            function (err, doc) {
                                if (err) {
                                    logger.logError(err);

                                    return;
                                }
                                notifyUsersAfterModifyBet(miniSedieData, client, user, box, amount);
                            });
                    }
                }
                catch (ex) {
                    logger.logError(ex);
                    miniSedieData.ingame[client.profile.name].processRunning = null;
                }
            });
        };

        const clearCurrentBet = (miniSedieData, client) => {
            try {
                miniSedieData.ingame[client.profile.name].processRunning = null;
            } catch (error) {
                logger.logError(error);
            }
        };

        const notifyUsersAfterModifyBet = (miniSedieData, client, user, box, amount) => {
            try {
                miniSedieData.totalBets[box] += amount;

                const betsOfThisUser = miniSedieData.ingame[client.profile.name];
                const ownBets = constants.choices.reduce((result, choice) => {
                    result[choice] = betsOfThisUser[choice];
                    return result;
                }, {});


                if (client.redT && client.redT.users) {
                    client.redT.users[client.UID].map(function (obj) {
                        obj.red({
                            miniSedie: { totalBets: miniSedieData.totalBets, endBet: amount, ownBets: ownBets },
                            user: { red: user.red }
                        });
                    });
                }

            } catch (error) {
                logger.logError(error);
            } finally {
                clearCurrentBet(miniSedieData, client);
            }
        };

        const placeBetFailed = () => {
            try {
                let currentUser = miniSedieData.ingame[client.profile.name];
                currentUser[box] -= amount;

                currentUser.processRunning = null;
            }
            catch (ex) {
                logger.logError(ex);
                clearCurrentBet(miniSedieData, client);
            }
        };

        data.inSufficientBalance = { miniSedie: { notice: noticeMessages.notEnoughMoney } };
        data.gameId = gameIds.min;
        data.gameRoundId = miniSedieData.roundId;
        data.choiceId = betChoiceMapper.convertXocXoc(box);
        data.cuoc = amount;
        balanceApi.placeBet({ id: client.UID }, data, client, placeBetSuccess, placeBetFailed);
    } catch (error) {
        logger.logError(error);
    }
};

const processBetQueue = (io) => {
    try {
        if (io.miniSedie.ingame) {
            Object.values(io.miniSedie.ingame).reduce((promise, userBet) => {
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