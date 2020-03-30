
const UserInfo = require('./../Models/UserInfo');
const gameIds = require('./../../config/appConfigs').gameIds;
const appConfigs = require('./../../config/appConfigs');
const l1Client = require('./clients/l1Client');
const logger = require('./../web/logger').getLogger();
const moment = require('moment');

function setUserRed(userId, red) {
    UserInfo.updateOne(
        { id: userId },
        { $set: { red: red } }
    ).exec();
}

function isSSOAccount(session) {
    return !!session.siteId;
}

const balanceApi = {
    notifyUser: (result, client) => {
        if (result && client && balanceApi.isError(result)) {
            client.red({ apiError: { message: `${result.errorMessage} (${result.errorCode})` } })
        }
    },
    isError: (result) => {
        return result.errorCode != 0;
    },
    getBalance: (user, client, cb) => {
        let session = client.session;
        if (isSSOAccount(session) && appConfigs.enabledApi) {

            const balanceParams = {
                Seq: session.owSeq,
                SiteId: session.siteId,
                ObCustId: session.memberId,
                Language: session.language
            };

            const beforeMessage = logger.composeBeforeCallMessage(session, balanceParams);

            l1Client.getBalance(balanceParams, (result) => {
                if (balanceApi.isError(result)) {
                    balanceApi.notifyUser(result, client);

                    return;
                }

                cb & cb(result);
            }, beforeMessage);
        }
        else {
            return UserInfo
                .findOne({ id: user.id }).exec()
                .then((userInfo) => { cb(userInfo); })
                .catch(error => { logger.enabledApi(error) });
        }

    },
    placeBet: (user, betInfo, client, cb, failedcb) => {
        const session = client.session;
        const betAmount = betInfo.cuoc >> 0;

        balanceApi.getBalance(user, client, (userInfo) => {
            // if balance is not enough
            if (!userInfo || userInfo.red < betAmount) {
                client.red(betInfo.inSufficientBalance);
                failedcb && failedcb();
            } else {
                const placeBetParams = {
                    SiteId: session.siteId,
                    GameRoundId: betInfo.gameRoundId,
                    GameTypeId: betInfo.gameId,
                    ChoiceId: betInfo.choiceId,
                    Amount: betAmount,
                    Currency: session.currency,
                    ObCustId: session.memberId,
                    Ip: session.ip,
                    Language: session.language
                };

                if (betInfo.gameId != gameIds.taixiu) {
                    balanceApi.placeBetWithValidAmount(user, client, betInfo, placeBetParams, userInfo, cb);
                }

                if (betInfo.gameId == gameIds.taixiu) {
                    cb(userInfo, betInfo, (cb2) => {
                        if (betInfo.gameId == gameIds.taixiu) {
                            balanceApi.placeBetWithValidAmount(user, client, betInfo, placeBetParams, userInfo, cb2);
                        }
                    });
                }
            }
        });

    },
    placeBetWithValidAmount: (user, client, betInfo, placeBetParams, userInfo, cb) => {
        let session = client.session;
        if (isSSOAccount(session) && appConfigs.enabledApi) {
            const beforeMessage = logger.composeBeforeCallMessage(session, placeBetParams);

            l1Client.placeBet(placeBetParams, (placeBetResult) => {
                if (balanceApi.isError(placeBetResult)) {
                    balanceApi.notifyUser(placeBetResult, client);

                    return;
                }

                if (betInfo.gameId != gameIds.taixiu) {
                    setUserRed(user.id, placeBetResult.balance);
                }

                cb && cb({
                    id: user.id,
                    red: placeBetResult.balance
                });
            }, beforeMessage);
        }
        else {
            // Internal Account
            userInfo.red -= betInfo.cuoc;
            userInfo.save();
            cb && cb(userInfo);
        }
    },
    endGame: (userId, gameInfo, settleInfo, clients, cb) => {
        // red, redWin, redLost, redPlay
        if (appConfigs.enabledApi
            && gameInfo.siteId
            && gameInfo.memberId > 0) {

            const endGameParams = {
                GameRoundId: gameInfo.gameRoundId,
                GameTypeId: gameInfo.gameId,
                ObCustId: gameInfo.memberId,
                SiteId: gameInfo.siteId,
                TotalAmount: settleInfo.redPlay,
                TotalWin: settleInfo.red,
                // Currently not support
                ValidBetAmount: settleInfo.redPlay,
                EndTime: moment.utc()
            };

            const beforeMessage = logger.composeBeforeCallMessage({ userId: userId }, endGameParams);

            l1Client.endGame(endGameParams, (result) => {

                if (result.errorCode == 0) {
                    UserInfo.updateOne({ id: userId }, { $inc: settleInfo }, (err, userInfo) => {
                        cb && cb(result);
                    });
                }
                else {
                    try {
                        Object.values(clients).forEach(function (users) {
                            users.forEach(function (client) {
                                if (client.UID == userId) {
                                    balanceApi.notifyUser(result, client);
                                }
                            });
                        });
                    }
                    catch (ex) {
                        logger.logError(ex);

                    }

                    cb && cb(result);
                }
            }, beforeMessage);
        }
        else {
            UserInfo.updateOne({ id: userId }, { $inc: settleInfo }).exec();

            cb && cb();
        }
    }
}

module.exports = balanceApi;