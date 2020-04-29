const appConfigs = {
    port: 8200,
    env: "PRO",
    apiUrl: "http://10.99.99.51:8300/",
    corsUrls: [
        'http://localhost:7456',
        'http://minigame.luminetsoft.com',
        'http://games.lumigame.com',
        'http://saba.club',
        'http://saba.win',
        'http://sabagame.com',
        'http://www.saba.club',
        'http://www.saba.win',
        'http://www.sabagame.com',
        'https://saba.club',
        'https://saba.win',
        'https://sabagame.com',
        'https://www.saba.club',
        'https://www.saba.win',
        'https://www.sabagame.com',
        'https://www.gamesaba.com',
        'https://gamesaba.com',
        'http://www.gamesaba.com',
        'http://gamesaba.com'
    ],
    enabledLogs: true,
    enabledTelegramLogger: false,
    telegramToken: '997354179:AAEDUUPpS-Vzm5FX0S4fo3EvZ9dK-Ebv1k0',
    telegramInfoGroup: '-471548574',
    telegramErrorGroup: '-482423146',
    disabledDirectLogin: true,
    redirectUrl: 'http://google.com',
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
        apiUrl: "http://10.99.99.51:8300",
        authUrl: "http://10.99.99.51:8303",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&"
        },
        useAuthenticate: true,
        requestTimeout: 10000,
        placeBetTimeout: 4500
    },
    enabledApiLog: true,
    sentryUrl: 'http://58fc00e79ab34a3bab04a79038760cb8@10.40.40.16:803/8',
    mongoDBConfig: {
        url: "mongodb://lmn_backend:M7K4ttH%2AtZ3ml%3F%29%7CA%5DjN4%3FLBhwF%266IO%3C@10.3.189.54:27101,10.3.189.53:27102,10.3.189.53:27103/?replicaSet=SabaMain",
        options: {
            user: 'lmn_backend',
            pass: 'M7K4ttH*tZ3ml?)|A]jN4?LBhwF&6IO<',
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true
        }
    },
    adminSecretKey: 'asWDEer4yGdgsdqR4uqmKQZgh',
    marqueeMessageConfig: {
        intervalTimeInMinute: 10,
        delayTimeInMinute: 2
    },
    authenticateSettings: {
        audiences: ['api', 'admin-api']
    }
};

module.exports = appConfigs;