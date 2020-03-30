const appConfigs = {
    port: 8200,
    apiUrl: "http://10.4.189.62:8300/",
    corsUrls: ['http://localhost:7456', 'http://minigame.luminetsoft.com', 'http://games.lumigame.com'],
    enabledLogs: true,
    enabledTelegramLogger: false,
    telegramToken: '997354179:AAEDUUPpS-Vzm5FX0S4fo3EvZ9dK-Ebv1k0',
    telegramInfoGroup: '-471548574',
    telegramErrorGroup: '-482423146',
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
        apiUrl: "http://10.4.189.62:8300/",
        authUrl: "http://auth.lumigame.com",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&"
        },
        tokenExpired: 1000
    },
    enabledApiLog: true,
    sentryUrl: 'https://4f4c1a463f084a27849ee58c601dbdf2@sentry.io/5176902',
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