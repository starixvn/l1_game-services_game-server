
let KenoProMaxCuoc = require('../../../Models/KenoProMax/KenoProMax_cuoc');
const balanceApi = require('../../../apis/balanceApi');
const gameIds = require('../../../../config/appConfigs').gameIds;
const betChoiceMapper = require('../../../apis/betChoiceMapper');
const logger = require('../../../web/logger');
const ConfigHelper = require('../../../Helpers/ConfigHelper');
const constants = require('./constants');

function kenoProMaxPlaceBet(client, data) {
    if (!!data.cuoc && !!data.box) {
        let cuoc = data.cuoc >> 0;
        let box = data.box;
        let kenoProMax = client.redT.kenoProMax;
        let configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.KenoProMax);

        if (kenoProMax.time > 31 && kenoProMax.time <= 33) {
            client.red({ kenoProMax: { notice: 'Không thể đặt cược vào lúc này.' } });
            return;
        }

        if (kenoProMax.time < 6 || kenoProMax.time > 33) {
            client.red({ kenoProMax: { notice: 'Vui lòng đặt cược ở phiên sau.' } });
            return;
        }

        if (cuoc < configs.minbet) {
            client.red({ kenoProMax: { notice: "Tiền cược tối thiểu là " + configs.minbet } });
            return;
        }

        if (cuoc > configs.maxbet) {
            client.red({ kenoProMax: { notice: "Tiền cược tối đa là " + configs.maxbet } });
            return;
        }

        let userCuoc = kenoProMax.ingame[client.profile.name];
        if (userCuoc &&
            (userCuoc['big'] + userCuoc['small'] + userCuoc['odd'] + userCuoc['even'] + userCuoc['metal'] + userCuoc['wood'] + userCuoc['water'] + userCuoc['fire'] + userCuoc['earth'] + cuoc) > configs.maxbet) {
            client.red({ kenoProMax: { notice: "Tiền cược tối đa là " + configs.maxbet } });
            return;
        }

        if (userCuoc) {
            kenoProMax.ingame[client.profile.name][box] += cuoc;
            kenoProMax.ingame[client.profile.name].cuocQueue.push({ data: data, client: client });
        } else {
            let newData = { name: client.profile.name, ...constants.resetData, cuocQueue: [{ data: data, client: client }] };
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

        data.inSufficientBalance = { kenoProMax: { notice: 'Bạn hiện không có đủ tiền để cược.' } };
        data.gameId = gameIds.kenopromax;
        data.gameRoundId = client.redT.kenoProMax.phien;
        data.choiceId = betChoiceMapper.convertKenoProMax(box);

        let placeBetSuccess = function (user) {
            KenoProMaxCuoc.findOne({ uid: client.UID, phien: kenoProMax.phien, red: true }, function (err, checkOne) {
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
                        let create = { uid: client.UID, name: client.profile.name, phien: kenoProMax.phien, red: red, time: new Date() };
                        if (client.session) {
                            create.memberId = client.session.memberId;
                            create.siteId = client.session.siteId;
                        }
                        let update = {
                            [box]: cuoc
                        };
                        KenoProMaxCuoc.updateOne(
                            { uid: client.UID, phien: kenoProMax.phien, red: red },
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
                    kenoProMax.ingame[client.profile.name].currentCuoc = null;
                }
            });
        };

        let clearCurrentCuoc = function (kenoProMax, client) {
            try {
                kenoProMax.ingame[client.profile.name].currentCuoc = null;
            } catch (error) {
                logger.logError(error);
            }
        }

        let notifyUsersAfterModifyCuoc = function (kenoProMax, client, user, box, cuoc) {
            try {
                kenoProMax.data[box] += cuoc;
                kenoProMax.dataAdmin[box] += cuoc;

                let currentMeCuoc = kenoProMax.ingame[client.profile.name];
                let me_cuoc = {
                    'big': currentMeCuoc.big,
                    'small': currentMeCuoc.small,
                    'odd': currentMeCuoc.odd,
                    'even': currentMeCuoc.even,
                    'metal': currentMeCuoc.metal,
                    'wood': currentMeCuoc.wood,
                    'water': currentMeCuoc.water,
                    'fire': currentMeCuoc.fire,
                    'earth': currentMeCuoc.earth
                };

                if (kenoProMax.players[client.UID]) {
                    kenoProMax.players[client.UID].red = user.red;
                }

                Object.values(kenoProMax.clients).forEach(function (users) {
                    if (client.UID !== users.UID) {
                        users.red({ kenoProMax: { chip: { playerId: client.UID, box: box, cuoc: cuoc, red: user.red } } });
                    }
                    else {
                        const successMessage = { kenoProMax: { mechip: { box: box, cuoc: data.cuoc }, me: { red: me_cuoc } }, user: { red: user.red } };
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

                currentUser.currentCuoc = null;
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
            for (const userBetName in io.kenoProMax.ingame) {
                let userBet = io.kenoProMax.ingame[userBetName];
                if (userBet) {
                    if (userBet.cuocQueue && userBet.cuocQueue.length > 0 && userBet.currentCuoc == null) {
                        userBet.currentCuoc = userBet.cuocQueue.shift();

                        setTimeout(() => {
                            try {
                                processPlacingBet(userBet.currentCuoc.client, userBet.currentCuoc.data);
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


module.exports = { kenoProMaxPlaceBet, initUserQueueProcessing };