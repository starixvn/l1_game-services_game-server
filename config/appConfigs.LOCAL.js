const appConfigs = {
    port: 8080,
    env: "LOCAL",
    prefixCharactorName: '@',
    apiUrl: "http://api.lumigame.com/",
    corsUrls: ['http://localhost:7456', 'http://minigame.luminetsoft.com', 'http://games.lumigame.com'],
    enabledLogs: true,
    enabledTelegramLogger: false,
    telegramToken: '1101106175:AAHzGWn8q66xr7ZZN8QzdjGi7HqlDSW4Vec',
    telegramInfoGroup: '-462367295',
    telegramErrorGroup: '-402369225',
    disabledDirectLogin: false,
    redirectUrl: 'http://google.com',
    gameIds: {
        taixiu: 1,
        xocxoc: 2,
        baucua: 3,
        txturbo: 4,
        chanle: 5,
        clturbo: 6,
        minidragontiger: 7,
        kenopromax: 8
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
        url: "mongodb://lmn_backend:LmnBackend@10.10.50.13:27111/?replicaSet=L1Local",
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