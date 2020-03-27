const appConfigs = {
    apiUrl: "http://sit-api.saba.vin/",
    corsUrls: ['http://localhost:7456', 'http://minigame.luminetsoft.com', 'http://games.lumigame.com', 'http://sit.saba.vin'],
    enabledLogs: true,
    enabledTelegramLogger: false,
    telegramInfoGroup: '-458665883',
    telegramErrorGroup: '-229702876',
    gameIds: {
        taixiu: 1,
        xocxoc: 2,
        baucua: 3
    },
    enabledApi: true,
    apiSettings:
    {
        apiUrl: "http://sit-api.saba.vin/",
        authUrl: "http://localhost:6503",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&"
        },
        tokenExpired: 1000
    },
    enabledApiLog: true,
    sentryUrl: 'https://ba65d3f5a79a43009c0dc566638b531b@sentry.io/5176900',
    mongoDBConfig: {
        url: "mongodb://lmn_backend:LmnBackend%40517@10.3.189.53:27201",
        options: {
            user: 'lmn_backend',
            pass: 'LmnBackend%40517',
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true
            //'autoIndex':       false,
        }
    }
};

module.exports = appConfigs;