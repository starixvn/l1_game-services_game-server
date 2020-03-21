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
        l1Client
            .member
            .balance(getBalanceParams)
            .then(response => {
                console.log(`Get Balance: ${JSON.stringify(response.result)}`);

                const result = {
                    red: response.result.balance
                }

                cb && cb(result);
            })
            .catch(error => {
                console.log(`Get Balance Error: ${error}`);
            });
    },
    placeBet: (placeBetParams, cb) => {
        placeBetParams = placeBetParams
            ? placeBetParams
            : {
                "Seq": "df829722-9826-4540-8a58-1d1c0feada93",
                "SiteId": "licensee1",
                "GameRoundId": 7222,
                "GameTypeId": 1,
                "ChoiceId": 1,
                "Amount": 225.25,
                "Currency": "usd",
                "ObCustId": 7784514,
                "Ip": "127.0.0.1"
            };

        l1Client
            .member
            .placeBet(placeBetParams)
            .then(result => {
                console.log(`Place Bet: ${JSON.stringify(result)}`);

                cb && cb(result);
            })
            .catch(error => {
                console.log(`Place Bet Error: ${error}`);
            });
    },
    endGame: (endGameParams, cb) => {
        endGameParams = endGameParams
            ? endGameParams
            : {
                "Seq": "633b0a18-3cd8-4e59-8c1b-16fc301a5f53",
                "SiteId": "licensee1",
                "GameRoundId": 7222,
                "GameTypeId": 1,
                "ObCustId": 7784514,
                "TotalAmount": 200,
                "TotalWin": 200,
                "ValidBetAmount": 200
            };

        l1Client
            .member
            .endGame(endGameParams)
            .then(result => {
                console.log(`End Game: ${JSON.stringify(result)}`);

                cb && cb(result);
            })
            .catch(error => {
                console.log(`End Game Error: ${error}`);
            });
    },
    notifyLogin: (notifyLoginParams, cb) => {
        notifyLoginParams = notifyLoginParams
            ? notifyLoginParams
            : {
                memberId: (Math.random() * 10000000) >> 0,
                characterName: 'characterName',
                seq: "d8382c1d-6ce0-433d-9233-e7358b10a70b",
                siteId: "licensee1",
                firstLogin: false,
                result: null
            };

        l1Client
            .member
            .notifyLogin(notifyLoginParams)
            .then(result => {
                console.log(`Notify Login: ${JSON.stringify(result)}`);

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

//apiClient.notifyLogin();

module.exports = apiClient;