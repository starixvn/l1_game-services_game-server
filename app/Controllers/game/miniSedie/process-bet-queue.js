let MiniSedieCuoc = require('./models/MiniSedie_cuoc');
const balanceApi = require('../../../apis/balanceApi');
const gameIds = require('../../../../config/appConfigs').gameIds;
const betChoiceMapper = require('../../../apis/betChoiceMapper');
const logger = require('../../../web/logger');
const constants = require("./constants");

const processPlacingBet = (client, { cuoc, box }) => {
    try {
        if (client.redT == null || client.redT.miniSedie == null) {
            return;
        }

        let miniSedieData = client.redT.miniSedie;

        const placeBetSuccess = (user) => {
            MiniSedieCuoc.findOne({ uid: client.UID, phien: miniSedieData.roundId }, function (err, checkOne) {
                if (err) {
                    logger.logError(err);

                    return;
                }

                try {
                    if (checkOne) {
                        checkOne[box] += cuoc;
                        checkOne.save().then(() => {
                            notifyUsersAfterModifyCuoc(miniSedieData, client, user, box, cuoc);
                        }).catch((updateError) => {
                            logger.logError(updateError);
                            clearCurrentCuoc(miniSedieData, client);
                        });
                    } else {
                        let create = { uid: client.UID, name: client.profile.name, phien: miniSedieData.roundId, time: new Date() };
                        if (client.session) {
                            create.memberId = client.session.memberId;
                            create.siteId = client.session.siteId;
                        }
                        let update = { [box]: cuoc };
                        MiniSedieCuoc.updateOne(
                            { uid: client.UID, phien: miniSedieData.roundId },
                            { $inc: update, $setOnInsert: create },
                            { upsert: true, setDefaultsOnInsert: true },
                            function (err, doc) {
                                if (err) {
                                    logger.logError(err);

                                    return;
                                }
                                notifyUsersAfterModifyCuoc(miniSedieData, client, user, box, cuoc);
                            });
                    }
                }
                catch (ex) {
                    logger.logError(ex);
                    miniSedieData.ingame[client.profile.name].processRunning = null;
                }
            });
        };

        const clearCurrentCuoc = (miniSedieData, client) => {
            try {
                miniSedieData.ingame[client.profile.name].processRunning = null;
            } catch (error) {
                logger.logError(error);
            }
        };

        const notifyUsersAfterModifyCuoc = (miniSedieData, client, user, box, cuoc) => {
            try {
                miniSedieData.totalBets[box] += cuoc;
                miniSedieData.chips[box][cuoc] += 1;

                const betsOfThisUser = miniSedieData.ingame[client.profile.name];
                const ownBets = constants.choices.reduce((result, choice) => {
                    result[choice] = betsOfThisUser[choice];
                    return result;
                }, {});

                if (miniSedieData.players[client.UID]) {
                    miniSedieData.players[client.UID].red = user.red;
                }

                Object.values(miniSedieData.realPlayers).forEach(function (users) {
                    if (client.UID !== users.UID) {
                        users.red({ miniSedie: { playerChip: { playerId: client.UID, box: box, bet: cuoc, red: user.red } } });
                    }
                    else {
                        const successMessage = { miniSedie: { ownChip: { box: box, bet: data.cuoc }, ownBets: ownBets, endBet: cuoc }, user: { red: user.red } };
                        users.red(successMessage);
                    }
                });
            } catch (error) {
                logger.logError(error);
            } finally {
                clearCurrentCuoc(miniSedieData, client);
            }
        };

        const placeBetFailed = () => {
            try {
                let currentUser = miniSedieData.ingame[client.profile.name];
                currentUser[box] -= cuoc;

                currentUser.processRunning = null;
            }
            catch (ex) {
                logger.logError(ex);
                clearCurrentCuoc(miniSedieData, client);
            }
        };

        data.inSufficientBalance = { miniSedie: { notice: constants.notices.notEnoughMoney } };
        data.gameId = gameIds.min;
        data.gameRoundId = miniSedieData.roundId;
        data.choiceId = betChoiceMapper.convertXocXoc(box);
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