let KenoProMaxCuoc = require('../../../Models/KenoProMax/KenoProMax_cuoc');
const balanceApi = require('../../../apis/balanceApi');
const gameIds = require('../../../../config/appConfigs').gameIds;
const betChoiceMapper = require('../../../apis/betChoiceMapper');
const logger = require('../../../web/logger');
const ConfigHelper = require('../../../Helpers/ConfigHelper');
const constants = require("./../../../Cron/KenoProMax/constants");

const notices = {
    placeBetNextRound: "Vui lòng đặt cược ở phiên sau.",
    minBet: (min) => `Tiền cược tối thiểu là ${min}`,
    maxBet: (max) => `Tiền cược tối đa là ${max}`,
    notEnoughMoney: "Bạn không có đủ tiền để cược.",
};

function validateBetRequest(client, kenoProMax, { cuoc, box }) {
    if (!cuoc || !box) {
        return false;
    }

    let configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.KenoProMax);
    const betsOfThisUser = kenoProMax.ingame[client.profile.name] || {};
    const totalBets = Object.values(betsOfThisUser).reduce((total, bet) => total + bet, 0);

    const metadata = [
        {
            condition: kenoProMax.remainingTime < constants.settlementDuration || kenoProMax.remainingTime > constants.placingBetDuration,
            notice: notices.placeBetNextRound,
        },
        {
            condition: cuoc < configs.minbet,
            notice: notices.minBet(configs.minbet),
        },
        {
            condition: cuoc > configs.maxbet,
            notice: notices.maxBet(configs.maxbet),
        },
        {
            condition: totalBets + cuoc > configs.maxbet,
            notice: notices.maxBet(configs.maxbet),
        },
    ];

    const result = metadata.filter((data) => data.condition);

    if (result.length > 0) {
        client.red({ kenoProMax: { notice: result[0].notice, endBet: -1 } });
        return false;
    }

    return true;
}

function kenoProMaxPlaceBet(client, data) {
    let kenoProMax = client.redT.kenoProMax;

    if (validateBetRequest(client, kenoProMax, data)) {
        let cuoc = data.cuoc >> 0;
        let box = data.box;

        if (kenoProMax.ingame[client.profile.name]) {
            kenoProMax.ingame[client.profile.name][box] += cuoc;
            kenoProMax.ingame[client.profile.name].betQueue.push({ data: data, client: client });
        } else {
            let newData = {
                name: client.profile.name,
                ...constants.resetTotalBets,
                betQueue: [{ data: data, client: client }]
            };
            newData[box] = cuoc;
            kenoProMax.ingame[client.profile.name] = newData;
        }
    }
};

function processPlacingBet(client, data) {
    try {
        if (client.redT == null || client.redT.kenoProMax == null) {
            return;
        }

        let cuoc = data.cuoc >> 0;
        let box = data.box;
        let kenoProMax = client.redT.kenoProMax;

        data.inSufficientBalance = { kenoProMax: { notice: notices.notEnoughMoney } };
        data.gameId = gameIds.kenopromax;
        data.gameRoundId = client.redT.kenoProMax.roundId;
        data.choiceId = betChoiceMapper.convertKenoProMax(box);

        let placeBetSuccess = (user) => {
            KenoProMaxCuoc.findOne({ uid: client.UID, phien: kenoProMax.roundId }, function (err, checkOne) {
                if (err) {
                    logger.logError(err);

                    return;
                }

                try {
                    if (checkOne) {
                        checkOne[box] += cuoc;
                        checkOne.save().then(() => {
                            notifyUsersAfterModifyCuoc(kenoProMax, client, user, box, cuoc);
                        }).catch((updateError) => {
                            logger.logError(updateError);
                            clearCurrentCuoc(kenoProMax, client);
                        });
                    } else {
                        let create = { uid: client.UID, name: client.profile.name, phien: kenoProMax.roundId, time: new Date() };
                        if (client.session) {
                            create.memberId = client.session.memberId;
                            create.siteId = client.session.siteId;
                        }
                        let update = { [box]: cuoc };
                        KenoProMaxCuoc.updateOne(
                            { uid: client.UID, phien: kenoProMax.roundId },
                            { $inc: update, $setOnInsert: create },
                            { upsert: true, setDefaultsOnInsert: true },
                            function (err, doc) {
                                if (err) {
                                    logger.logError(err);

                                    return;
                                }
                                notifyUsersAfterModifyCuoc(kenoProMax, client, user, box, cuoc);
                            });
                    }
                }
                catch (ex) {
                    logger.logError(ex);
                    kenoProMax.ingame[client.profile.name].processRunning = null;
                }
            });
        };

        let clearCurrentCuoc = function (kenoProMax, client) {
            try {
                kenoProMax.ingame[client.profile.name].kenoProMax = null;
            } catch (error) {
                logger.logError(error);
            }
        }

        let notifyUsersAfterModifyCuoc = function (kenoProMax, client, user, box, cuoc) {
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

                Object.values(kenoProMax.clients).forEach(function (users) {
                    if (client.UID !== users.UID) {
                        users.red({ kenoProMax: { chip: { playerId: client.UID, box: box, cuoc: cuoc, red: user.red } } });
                    }
                    else {
                        const successMessage = { kenoProMax: { ownChip: { box: box, cuoc: data.cuoc }, ownBet: ownBet }, user: { red: user.red } };
                        users.red(successMessage);
                    }
                });
            } catch (error) {
                logger.logError(error);
            } finally {
                clearCurrentCuoc(kenoProMax, client);
            }

        }

        let placeBetFailed = function () {
            try {
                let currentUser = kenoProMax.ingame[client.profile.name];
                currentUser[box] -= cuoc;

                currentUser.processRunning = null;
            }
            catch (ex) {
                logger.logError(ex);
                clearCurrentCuoc(kenoProMax, client);
            }
        }

        balanceApi.placeBet({ id: client.UID }, data, client, placeBetSuccess, placeBetFailed);
    } catch (error) {
        logger.logError(error);
    }
}

function processBetQueue(io) {
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
}

function initUserQueueProcessing(io) {
    const processTimeOut = 50;
    setTimeout(function processBets() {

        processBetQueue(io);

        setTimeout(processBets, processTimeOut);
    }, processTimeOut);
}


module.exports = { kenoProMaxPlaceBet, initUserQueueProcessing };