const appConfigs = {
    port: 8200,
    apiUrl: "http://10.99.99.101:8300/",
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
        'https://www.sabagame.com'
    ],
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
        apiUrl: "http://10.99.99.101:8300/",
        authUrl: "http://10.99.99.101:8303/",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&"
        },
        tokenExpired: 1000
    },
    enabledApiLog: true,
    sentryUrl: 'https://4f4c1a463f084a27849ee58c601dbdf2@sentry.io/5176902',
    mongoDBConfig: {
        url: "mongodb://lmn_backend:M7K4ttH*tZ3ml?)|A]jN4?LBhwF&6IO<@10.3.189.54:27101/?replicaSet=SabaMain",
        options: {
            user: 'lmn_backend',
            pass: 'M7K4ttH*tZ3ml?)|A]jN4?LBhwF&6IO<',
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true
            //'autoIndex':       false,
        }
    }
};

module.exports = appConfigs;