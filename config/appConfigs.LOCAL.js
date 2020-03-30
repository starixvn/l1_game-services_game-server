const appConfigs = {
    port: 8080,
    apiUrl: "http://api.lumigame.com/",
    corsUrls: ['http://localhost:7456', 'http://minigame.luminetsoft.com', 'http://games.lumigame.com'],
    enabledLogs: true,
    enabledTelegramLogger: true,
    telegramToken: '997354179:AAEDUUPpS-Vzm5FX0S4fo3EvZ9dK-Ebv1k0',
    telegramInfoGroup: '-482423146',
    telegramErrorGroup: '-471548574',
    disabledDirectLogin: false,
    redirectUrl: 'http://google.com',
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
    sentryUrl: 'https://965d36e2b08144d69b468940a3064eb9@sentry.io/5172750',
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