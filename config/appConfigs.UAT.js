const appConfigs = {
    port: 7200,
    env: "UAT",
    prefixCharactorName: '@',
    apiUrl: "http://10.99.99.101:7300",
    corsUrls: [
        'http://localhost:7456',
        'http://minigame.luminetsoft.com',
        'http://games.lumigame.com',
        'http://sit.saba.vin',
        'http://uat.saba.vin',
        'https://uat.saba.vin',
        'https://sit.saba.vin'
    ],
    enabledLogs: true,
    enabledTelegramLogger: false,
    telegramToken: '1111366760:AAEbeCLZEFSM7-T0MOT9iv1dn01f3ZojFtE',
    telegramInfoGroup: '-479703667',
    telegramErrorGroup: '-453402700',
    disabledDirectLogin: true,
    redirectUrl: 'http://google.com',
    gameIds: {
        taixiu: 1,
        xocxoc: 2,
        baucua: 3
    },
    enabledApi: true,
    apiSettings:
    {
        apiUrl: "http://10.99.99.101:7300",
        authUrl: "http://10.99.99.101:7303",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&"
        },
        useAuthenticate: true,
        placeBetTimeout: 4500,
        requestTimeout: 10000 // 10s
    },
    enabledApiLog: true,
    sentryUrl: 'http://7ba626fc5eea40709545d4adf36975c6@10.40.40.16:803/29',
    mongoDBConfig: {
        url: "mongodb://lmn_backend:LmnBackend%4022027@10.3.189.53:27251/?replicaSet=SabaUAT",
        options: {
            user: 'lmn_backend',
            pass: 'LmnBackend@22027',
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true
            //'autoIndex':       false,
        }
    },
    adminSecretKey: 'asWDEerfOIdgsdqRTFabvmgh'
};

module.exports = appConfigs;
