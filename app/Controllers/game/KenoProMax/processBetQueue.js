let KenoProMaxCuoc = require('../../../Models/KenoProMax/KenoProMax_cuoc');
const balanceApi = require('../../../apis/balanceApi');
const gameIds = require('../../../../config/appConfigs').gameIds;
const betChoiceMapper = require('../../../apis/betChoiceMapper');
const logger = require('../../../web/logger');
const constants = require("./../../../Cron/KenoProMax/constants");

const processPlacingBet = (realPlayer, data) => new Promise((resolve, reject) => {

    if (realPlayer.redT == null || realPlayer.redT.kenoProMax == null) {
        return;
    }

    let amount = data.amount >> 0;
    let box = data.box;
    let kenoProMax = realPlayer.redT.kenoProMax;

    const placeBetSuccess = (user) => {
        KenoProMaxCuoc.findOne({ uid: realPlayer.UID, phien: kenoProMax.roundId })
            .exec()
            .then((userBet) => {
                if (userBet) {
                    userBet[box] += amount;
                    return userBet.save();
                } else {
                    let newBet = { uid: realPlayer.UID, name: realPlayer.profile.name, phien: kenoProMax.roundId, time: new Date() };
                    if (realPlayer.session) {
                        newBet.memberId = realPlayer.session.memberId;
                        newBet.siteId = realPlayer.session.siteId;
                    }
                    let update = { [box]: amount };
                    return KenoProMaxCuoc.updateOne(
                        { uid: realPlayer.UID, phien: kenoProMax.roundId },
                        { $inc: update, $setOnInsert: newBet },
                        { upsert: true, setDefaultsOnInsert: true });
                }
            })
            .then(() => {
                kenoProMax.totalBets[box] += amount;
                kenoProMax.chips[box][amount] += 1;

                const betsOfThisUser = kenoProMax.ingame[realPlayer.profile.name];
                const ownBets = constants.choices.reduce((result, choice) => {
                    result[choice] = betsOfThisUser[choice];
                    return result;
                }, {});

                if (kenoProMax.players[realPlayer.UID]) {
                    kenoProMax.players[realPlayer.UID].red = user.red;
                }

                Object.values(kenoProMax.realPlayers).forEach(function (users) {
                    if (realPlayer.UID !== users.UID) {
                        users.red({ kenoProMax: { playerChip: { playerId: realPlayer.UID, box: box, bet: amount, red: user.red } } });
                    }
                    else {
                        const successMessage = { kenoProMax: { ownChip: { box: box, bet: amount }, ownBets: ownBets, endBet: amount }, user: { red: user.red } };
                        users.red(successMessage);
                    }
                });
            })
            .then(() => resolve())
            .catch(error => reject(error));
    };

    const placeBetFailed = () => {
        let currentUser = kenoProMax.ingame[realPlayer.profile.name];
        currentUser[box] -= amount;

        realPlayer.red({ kenoProMax: { endBet: -1 } })

        resolve();
    };

    data.inSufficientBalance = { kenoProMax: { notice: constants.notices.notEnoughMoney, endBet: -1 } };
    data.gameId = gameIds.kenopromax;
    data.gameRoundId = realPlayer.redT.kenoProMax.roundId;
    data.choiceId = betChoiceMapper.convertKenoProMax(box);
    data.cuoc = amount;
    balanceApi.placeBet({ id: realPlayer.UID }, data, realPlayer, placeBetSuccess, placeBetFailed);
});

const processBetQueue = (io) => {
    if (io.kenoProMax.ingame) {
        Object.values(io.kenoProMax.ingame).reduce((promise, userBet) => {
            if (userBet.processRunning == null && userBet.betQueue && userBet.betQueue.length > 0) {
                userBet.processRunning = true;
                const { data, realPlayer } = userBet.betQueue.shift();

                return promise
                    .then(() => processPlacingBet(realPlayer, data))
                    .catch(error => logger.logError(error))
                    .then(() => {
                        userBet.processRunning = null;
                    })
            } else {
                return promise;
            }
        }, Promise.resolve());
    }
};

module.exports = (io) => {
    const processTimeOut = 50;
    const processFunc = () => {
        processBetQueue(io);

        setTimeout(processFunc, processTimeOut);
    };

    setTimeout(processFunc, processTimeOut);
};