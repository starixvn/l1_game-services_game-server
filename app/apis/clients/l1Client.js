const l1Client = require('l1.client.node-js')({
    apiUrl: "http://api.lumigame.com",
    authUrl: "http://auth.lumigame.com",
    client: {
        id: "licensee1",
        secret: "123licensee1%^&sit"
    }
});

const apiClient = {
    getBalance: (getBalanceParams, cb) => {
        console.log(`Get Balance Before: ${JSON.stringify(getBalanceParams)}`);

        l1Client
            .member
            .balance(getBalanceParams)
            .then(response => {
                console.log(`Get Balance result: ${JSON.stringify(response.result)}`);

                const result = { red: response.result.balance }

                cb && cb(result);
            })
            .catch(error => {
                console.log(`Get Balance Error: ${error}`);
            });
    },
    placeBet: (placeBetParams, cb) => {
        console.log(`Place Bet Before: ${JSON.stringify(placeBetParams)}`);

        l1Client
            .member
            .placeBet(placeBetParams)
            .then(response => {
                console.log(`Place Bet: ${JSON.stringify(response)}`);
                // "Result": {
                //     "Balance": 24250,
                //     "ErrorCode":0,
                //     "ErrorDescription":"Success",
                //     "ObTransId": 1763178465,
                //     "ObCustId": "7784514"

                cb && cb(response.result);
            })
            .catch(error => {
                console.log(`Place Bet Error: ${error}`);
            });
    },
    endGame: (endGameParams, cb) => {
        // {
        //     "Seq": "633b0a18-3cd8-4e59-8c1b-16fc301a5f53",
        //     "SiteId": "licensee1",
        //     "GameRoundId": 7222,
        //     "GameTypeId": 1,
        //     "ObCustId": 7784514,
        //     "TotalAmount": 200,
        //     "TotalWin": 200,
        //     "ValidBetAmount": 200
        // }
        console.log(`End Game Before: ${JSON.stringify(endGameParams)}`);

        l1Client
            .member
            .endGame(endGameParams)
            .then(response => {
                console.log(`End Game: ${JSON.stringify(response)}`);
                // "Seq":"633b0a18-3cd8-4e59-8c1b-16fc301a5f53",
                // "ObCustId":7784514,
                // "ErrorCode":0,
                // "ErrorDescription":"Success"

                cb && cb(response.result);
            })
            .catch(error => {
                console.log(`End Game Error: ${error}`);
            });
    },
    notifyLogin: (notifyLoginParams, cb) => {

        //console.log(`Notify Login Before: ${JSON.stringify(notifyLoginParams)}`);

        l1Client
            .member
            .notifyLogin(notifyLoginParams)
            .then(result => {
                //console.log(`Notify Login After: ${JSON.stringify(result)}`);

                cb && cb(result);
            })
            .catch(error => {
                console.log(`Notify Login Error: ${error}`);
            });;
    },
    verifyToken: async (verifyTokenParams) => {
        const result = await l1Client.auth.verifyToken(verifyTokenParams);

        return result;
    }
}

module.exports = apiClient;