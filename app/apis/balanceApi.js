
const User = require('./../Models/Users');
const UserSession = require('./../Models/UserSessions');
const UserInfo = require('./../Models/UserInfo');
const apiClient = {
    getBalance: () => { },
    placeBet: () => { },
    endGame: () => { },
}

function getBalance(user, sessionInfo, cb) {

    // const response = apiClient.getBalance({
    //     Seq: sessionInfo.owSeq,
    //     ObCustId: user.memberId,
    //     SiteId: sessionInfo.siteId
    // });

    let promiseResult = UserInfo.findOne({ id: user.id }).exec().then((userInfo) => {
        cb(userInfo);
    });


    return promiseResult;
    // "Seq":"d8382c1d-6ce0-433d-9233-e7358b10a70b",
    //   "SiteId":"4100200",
    //   "ObCustId":7784514

    // User.findOne({ '_id': client.UID })
    //     .exec()
    //     .then((user) => {

    //     });

}



function placeBet(user, sessionInfo, betInfo, cb) {

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

    getBalance(user, sessionInfo, (userInfo) => {
        // Check user balance is valid

        // call to API
        //apiClient.placeBet(placeBetParams);


        cb(userInfo, betInfo);
    });

}

function endGame(userId, sessionInfo, settleInfo, cb) {
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

    UserInfo.updateOne({
        id: userId
    }, {
        $inc: settleInfo
    }).exec();

    cb();
}

module.exports = {
    getBalance,
    placeBet,
    endGame
}