
const User = require('./../Models/Users');
const UserSession = require('./../Models/UserSessions');
const UserInfo = require('./../Models/UserInfo');
const gameIds = require('./../../config/appConfigs');
const l1Client = require('./clients/l1Client');

function updateUserRed(userId, changeAmount) {
    UserInfo.updateOne(
        { id: userId },
        { $inc: { red: changeAmount } }
    ).exec();
}

const balanceApi = {
    getBalance: (user, session, cb) => {

        if (!!session.siteId) {
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
                .catch(error => { });
        }

    },
    placeBet: (user, sessionInfo, betInfo, client, cb) => {

        const placeBetParams = {
            "Seq": "df829722-9826-4540-8a58-1d1c0feada93",
            "SiteId": "4100200",
            "GameRoundId": 7222,
            "GameTypeId": 1,
            "ChoiceId": 1,
            "Amount": 225.25,
            "Currency": "usd",
            "ObCustId": 7784514,
            "Ip": "127.0.0.1"
        };
        const betAmount = betInfo.cuoc >> 0;
        getBalance(user, sessionInfo, (userInfo) => {
            // Check user balance is valid

            // call to API
            //apiClient.placeBet(placeBetParams);

            if (!userInfo || userInfo.red < betAmount) {
                //client.red({ xocxoc: { notice: 'Bạn không đủ tiền để cược.!!' } });
                client.red(inSufficientBalance);

                return;
            } else {
                if (betInfo.gameId != gameIds.taixiu) {
                    userInfo.red -= betAmount;
                    userInfo.save();
                }
            }

            cb(userInfo, betInfo, () => {
                updateUserRed(user.id, -betAmount);
            });
        });

    },
    endGame: (userId, sessionInfo, settleInfo, cb) => {
        // red, redWin, redLost, redPlay

        const endGameParams = {
            "Seq": "633b0a18-3cd8-4e59-8c1b-16fc301a5f53",
            "GameRoundId": 7222,
            "GameTypeId": 1,
            "ObCustId": 7784514,
            "TotalAmount": 200,
            "TotalWin": 200,
            "ValidBetAmount": 200
        }

        UserInfo.updateOne({ id: userId }, { $inc: settleInfo }).exec();

        //console.log(`EndGame ${userId} : ${JSON.stringify(settleInfo)}`);

        cb();
    }
}

module.exports = balanceApi;