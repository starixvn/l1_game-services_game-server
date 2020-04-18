
const UserInfo = require('./../Models/UserInfo');
const gameIds = require('./../../config/appConfigs').gameIds;
const appConfigs = require('./../../config/appConfigs');
const l1Client = require('./clients/l1Client');
const logger = require('./../web/logger').getLogger();
const moment = require('moment');

const taixiuGameTypes = [gameIds.taixiu, gameIds.txturbo];

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
    isDisabledAccountResult: (result) => {
        return result.errorCode == 2002;
    },
    updateUserBalanceToDatabase: (userId, red) => {
        try {
            if (userId && red >= 0) {
                setUserRed(userId, red);
            }
        }
        catch (ex) {
            logger.logError(ex);
        }
    },
    notifyUser: (result, client, extraInfo, isKickedout) => {
        if (result && client && balanceApi.isError(result)) {
            if (isKickedout) {
                client.red({ kickedOut: { message: 'Tài khoản đã bị đóng. Phiên đăng nhập sẽ hết hạn sau 10 giây. Vui lòng liên hệ với cấp trên để biết thêm chi tiết.', isDisabledAccount: true } });
            }
            else {
                client.red({ apiError: { message: `${result.errorMessage} (${result.errorCode})`, ...extraInfo } })
            }
        }
    },
    isError: (result) => {
        return result.errorCode != 0;
    },
    getBalance: (user, client, cb, isUpdateUserBalance) => {
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
                    balanceApi.notifyUser(result, client, {}, balanceApi.isDisabledAccountResult(result));

                    return;
                }

                if (isUpdateUserBalance) {
                    balanceApi.updateUserBalanceToDatabase(session.userId, result.red);
                }

                cb & cb(result);
            }, beforeMessage);
        }
        else {
            return UserInfo
                .findOne({ id: user.id }).exec()
                .then((userInfo) => { cb(userInfo); })
                .catch(error => { logger.logError(error) });
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

                if (!taixiuGameTypes.includes(betInfo.gameId)) {
                    balanceApi.placeBetWithValidAmount(user, client, betInfo, placeBetParams, userInfo, cb, failedcb);
                }

                if (taixiuGameTypes.includes(betInfo.gameId)) {
                    cb(userInfo, betInfo, (cb2) => {
                        if (taixiuGameTypes.includes(betInfo.gameId)) {
                            balanceApi.placeBetWithValidAmount(user, client, betInfo, placeBetParams, userInfo, cb2, failedcb);
                        }
                    });
                }
            }
        });

    },
    placeBetWithValidAmount: (user, client, betInfo, placeBetParams, userInfo, cb, failedcb) => {
        let session = client.session;
        if (isSSOAccount(session) && appConfigs.enabledApi) {
            const beforeMessage = logger.composeBeforeCallMessage(session, placeBetParams);

            l1Client.placeBet(placeBetParams, (placeBetResult) => {
                if (balanceApi.isError(placeBetResult)) {
                    try {
                        balanceApi.notifyUser(
                            placeBetResult,
                            client,
                            { gameTypeId: placeBetParams.GameTypeId, isPlaceBetFailed: true, gameRoundId: placeBetParams.GameRoundId },
                            balanceApi.isDisabledAccountResult(placeBetResult));
                    } catch (error) {
                        logger.logError(error);
                    }

                    failedcb && failedcb();
                    return;
                }

                if (!taixiuGameTypes.includes(betInfo.gameId)) {
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
            try {
                userInfo.red -= betInfo.cuoc;
                userInfo.save();
                cb && cb(userInfo);
            }
            catch (ex) {
                logger.logError(ex);
                failedcb && failedcb();
            }
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
                            if (users) {
                                users.forEach(function (client) {
                                    if (client.UID == userId) {
                                        balanceApi.notifyUser(result, client, { gameTypeId: endGameParams.GameTypeId, gameRoundId: endGameParams.GameRoundId });
                                    }
                                });
                            }
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