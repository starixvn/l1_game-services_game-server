var MiniDragonTiger_cuoc = require('../../../Models/MiniDragonTiger/MiniDragonTiger_cuoc');
var balanceApi = require('./../../../apis/balanceApi');
const gameIds = require('./../../../../config/appConfigs').gameIds;
const betChoiceMapper = require('./../../../apis/betChoiceMapper');
const logger = require('../../../web/logger');
const ConfigHelper = require('../../../Helpers/ConfigHelper');
const constants = require('./constants');

function miniDragonTigerCuoc(client, data) {
    if (!!data.cuoc && !!data.box) {
        let cuoc = data.cuoc >> 0;
        let box = data.box;
        let configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.MiniDragonTiger);
        let miniDragon = client.redT.miniDragon;

        if (miniDragon.time < constants.minBetTime || miniDragon.time > constants.maxBetTime) {
            client.red({ miniDragonTiger: { notice: 'Vui lòng đặt cược ở phiên sau.' } });
            return;
        }

        if (!(constants.stakeValues.includes(cuoc)) || !(constants.choices.includes(box))) {
            client.red({ miniDragonTiger: { notice: 'Cược thất bại...' } });
            return;
        }

        if (cuoc < configs.minbet) {
            client.red({ miniDragonTiger: { notice: "Tiền cược tối thiểu là " + configs.minbet } });
            return;
        }

        if (cuoc > configs.maxbet) {
            client.red({ miniDragonTiger: { notice: "Tiền cược tối đa là " + configs.maxbet } });
            return;
        }

        let userCuoc = miniDragon.ingame[client.profile.name];
        if (userCuoc && (userCuoc['dragon'] + userCuoc['tiger'] + userCuoc['draw'] + cuoc) > configs.maxbet) {
            client.red({ miniDragonTiger: { notice: "Tiền cược tối đa là " + configs.maxbet } });
            return;
        }

        if (userCuoc) {
            miniDragon.ingame[client.profile.name][box] += cuoc;
            miniDragon.ingame[client.profile.name].cuocQueue.push({ data: data, client: client });
        } else {
            let newData = { name: client.profile.name, 'dragon': 0, 'tiger': 0, 'draw': 0, cuocQueue: [{ data: data, client: client }] };
            newData[box] = cuoc;
            miniDragon[client.profile.name] = newData;
        }
    }
};

function processPlacingBet(client, data) {
    try {
        if (client.redT == null || client.redT.game.miniDragonTiger == null) {
            return;
        }

        let cuoc = data.cuoc >> 0;
        let box = data.box;
        let miniDragonTiger = client.redT.miniDragonTiger;

        data.inSufficientBalance = { miniDragonTiger: { notice: 'Bạn hiện không có đủ tiền để cược.' } };
        data.gameId = gameIds.minidragontirger;
        data.gameRoundId = miniDragonTiger.phien;
        data.choiceId = betChoiceMapper.covertMiniDragonTiger(box);

        let placeBetSuccess = function (user) {
            MiniDragonTiger_cuoc.findOne({ uid: client.UID, phien: miniDragonTiger.phien, red: true }, function (err, checkOne) {
                if (err) {
                    logger.logError(err);

                    return;
                }

                try {
                    if (checkOne) {
                        checkOne[box] += cuoc;
                        checkOne.save().then(() => {
                            notifyUsersAfterModifyCuoc(miniDragonTiger, client, user, box, cuoc);
                        }).catch((updateError) => {
                            logger.logError(updateError);
                            clearCurrentCuoc(miniDragonTiger, client);
                        });
                    } else {
                        let create = { uid: client.UID, name: client.profile.name, phien: miniDragonTiger.phien, red: red, time: new Date() };
                        if (client.session) {
                            create.memberId = client.session.memberId;
                            create.siteId = client.session.siteId;
                        }
                        let update = {
                            [box]: cuoc
                        };
                        MiniDragonTiger_cuoc.updateOne(
                            { uid: client.UID, phien: miniDragonTiger.phien, red: true },
                            { $inc: update, $setOnInsert: create },
                            { upsert: true, setDefaultsOnInsert: true },
                            function (err, doc) {
                                if (err) {
                                    logger.logError(err);

                                    return;
                                }

                                notifyUsersAfterModifyCuoc(miniDragonTiger, client, user, box, cuoc);
                            });
                    }

                    let notifyUsersAfterModifyCuoc = function (miniDragonTiger, client, user, box, cuoc) {
                        try {
                            miniDragonTiger.data[box] += cuoc;

                            client.redT.users[client.UID].map(function (obj) {
                                obj.red({
                                    miniDragonTiger: { data: miniDragonTiger.data, endCuoc: cuoc },
                                    user: { red: user.red }
                                });
                            });
                        } catch (error) {
                            logger.logError(error);
                        } finally {
                            clearCurrentCuoc(miniDragonTiger, client);
                        }

                    }

                    let clearCurrentCuoc = function (miniDragonTiger, client) {
                        try {
                            miniDragonTiger.ingame[client.profile.name].currentCuoc = null;
                        } catch (error) {
                            logger.logError(error);
                        }
                    }
                }
                catch (ex) {
                    logger.logError(ex);
                    miniDragonTiger.ingame[client.profile.name].currentCuoc = null;
                }
            });
        };

        let placeBetFailed = function () {
            try {
                let currentUser = miniDragonTiger.ingame[client.profile.name];
                currentUser[box] -= cuoc;

                currentUser.currentCuoc = null;
            }
            catch (ex) {
                logger.logError(ex);
                clearCurrentCuoc(miniDragonTiger, client);
            }
        }

        balanceApi.placeBet({ id: client.UID }, data, client, placeBetSuccess, placeBetFailed);

    } catch (error) {
        logger.logError(error);
    }
}

function processBetQueue(io) {
    try {
        let miniDragonTiger = io.miniDragonTiger;
        if (miniDragonTiger && miniDragonTiger.ingame) {
            for (const userBetName in miniDragonTiger.ingame) {
                let userBet = miniDragonTiger.ingame[userBetName];
                if (userBet) {
                    if (userBet.cuocQueue && userBet.cuocQueue.length > 0 && userBet.currentCuoc == null) {
                        userBet.currentCuoc = userBet.cuocQueue.shift();

                        setTimeout(() => {
                            try {
                                processPlacingBet(userBet.currentCuoc.client, userBet.currentCuoc.data, io);
                            }
                            catch (ex) {
                                logger.logError(ex);
                                userBet.currentCuoc = null;
                            }
                        }, 0);
                    }
                }
            }
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

module.exports = {
    miniDragonTigerCuoc,
    processPlacingBet,
    initUserQueueProcessing
};