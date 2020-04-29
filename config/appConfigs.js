const appConfigs = {
    port: 8080,
    env: "LOCAL",
    apiUrl: "http://api.lumigame.com/",
    corsUrls: ['http://localhost:7456', 'http://minigame.luminetsoft.com', 'http://games.lumigame.com'],
    enabledLogs: false,
    enabledTelegramLogger: false,
    telegramToken: '997354179:AAEDUUPpS-Vzm5FX0S4fo3EvZ9dK-Ebv1k0',
    telegramInfoGroup: '-471548574',
    telegramErrorGroup: '-482423146',
    disabledDirectLogin: false,
    gameIds: {
        taixiu: 1,
        xocxoc: 2,
        baucua: 3,
        txturbo: 4,
        chanle: 5,
        clturbo: 6,
        minidragontiger: 7
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
        useAuthenticate: true,
        requestTimeout: 10000,
        placeBetTimeout: 4500
    },
    enabledApiLog: true,
    sentryUrl: 'https://bfcba2ed6dbc4d4193bba01981b2812d@sentry.saba.vin/19',
    mongoDBConfig: {
        url: "mongodb://127.0.0.1:27017",
        options: {
            user: 'lmn_backend',
            pass: 'LmnBackend',
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true
            //'autoIndex':       false,
        }
    },
    adminSecretKey: 'asWDEerfOIdgsdqRTFabvmgh',
    marqueeMessageConfig: {
        intervalTimeInMinute: 2,
        delayTimeInMinute: 0.5
    },
    authenticateSettings: {
        audiences: ['api', 'admin-api']
    }
};

module.exports = appConfigs;