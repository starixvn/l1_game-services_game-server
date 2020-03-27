const appConfigs = {
    apiUrl: "http://10.4.189.62:7300/",
    corsUrls: ['http://localhost:7456', 'http://minigame.luminetsoft.com', 'http://games.lumigame.com'],
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
        apiUrl: "http://api.lumigame.com",
        authUrl: "http://auth.lumigame.com",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&"
        },
        tokenExpired: 1000
    },
    enabledApiLog: true,
    sentryUrl: 'https://1e3af30bbed84766be71a912c341930c@sentry.io/5176901',
    mongoDBConfig: {
        url: "mongodb://127.0.0.1:27017",
        options: {
            user: 'lmn_backend',
            pass: 'LmnBackend',
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true
            //'autoIndex':       false,
        }
    }
};

module.exports = appConfigs;