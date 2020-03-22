
const UserInfo = require('./../Models/UserInfo');
const gameIds = require('./../../config/appConfigs').gameIds;
const l1Client = require('./clients/l1Client');

function updateUserRed(userId, changeAmount) {
    UserInfo.updateOne(
        { id: userId },
        { $inc: { red: changeAmount } }
    ).exec();
}

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
    getBalance: (user, session, cb) => {

        if (isSSOAccount(session)) {
            const balanceParams = {
                Seq: session.owSeq,
                SiteId: session.siteId,
                ObCustId: session.memberId
            };

            l1Client.getBalance(balanceParams, cb);
        }
        else {
            return UserInfo
                .findOne({ id: user.id }).exec()
                .then((userInfo) => { cb(userInfo); })
                .catch(error => { console.log(`${error.message}\n${error.stack}`); });
        }

    },
    placeBet: (user, betInfo, client, cb) => {
        const session = client.session;
        const betAmount = betInfo.cuoc >> 0;

        balanceApi.getBalance(user, session, (userInfo) => {
            // if balance is not enough
            if (!userInfo || userInfo.red < betAmount) {
                client.red(inSufficientBalance);
            } else {
                const placeBetParams = {
                    SiteId: session.siteId,
                    GameRoundId: betInfo.gameRoundId,
                    GameTypeId: betInfo.gameId,
                    ChoiceId: betInfo.choiceId,
                    Amount: betAmount,
                    Currency: session.currency,
                    ObCustId: session.memberId,
                    Ip: session.ip
                };

                if (betInfo.gameId != gameIds.taixiu) {
                    balanceApi.placeBetWithValidAmount(user, session, betInfo, placeBetParams, userInfo);
                }

                cb(userInfo, betInfo, () => {
                    if (betInfo.gameId == gameIds.taixiu) {
                        balanceApi.placeBetWithValidAmount(user, session, betInfo, placeBetParams, userInfo);
                    }
                });
            }
        });

    },
    placeBetWithValidAmount: (user, session, betInfo, placeBetParams, userInfo) => {
        if (isSSOAccount(session)) {
            l1Client.placeBet(placeBetParams, (placeBetResult) => {
                if (betInfo.gameId != gameIds.taixiu) {
                    setUserRed(user.id, placeBetResult.balance);
                }
            });
        }
        else {
            // Internal Account
            //updateUserRed(user.id, -betInfo.cuoc);
            userInfo.red -= betInfo.cuoc;
            userInfo.save();
        }
    },
    endGame: (userId, gameInfo, settleInfo, cb) => {
        // red, redWin, redLost, redPlay

        if (gameInfo.siteId && gameInfo.memberId > 0 && gameInfo.gameId != gameIds.taixiu) {
            const endGameParams = {
                GameRoundId: gameInfo.gameRoundId,
                GameTypeId: gameInfo.gameId,
                ObCustId: gameInfo.memberId,
                SiteId: gameInfo.siteId,
                TotalAmount: settleInfo.redPlay,
                TotalWin: settleInfo.red,
                // Currently not support
                ValidBetAmount: settleInfo.redPlay
            };

            l1Client.endGame(endGameParams, (result) => {
                if (result.errorCode == 0) {
                    UserInfo.updateOne({ id: userId }, { $inc: settleInfo }).exec();
                }

                cb && cb(result);
            })
        }
        else {
            //if (gameInfo.gameId != gameIds.taixiu) {
            UserInfo.updateOne({ id: userId }, { $inc: settleInfo }).exec();
            //}
        }

        //console.log(`EndGame ${userId} : ${JSON.stringify(settleInfo)}`);

        cb();
    }
}

module.exports = balanceApi;