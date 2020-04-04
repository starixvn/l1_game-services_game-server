const appConfigs = {
    port: 6200,
    env: "SIT",
    apiUrl: "http://10.2.189.64:6300",
    corsUrls: ['http://localhost:7456', 'http://minigame.luminetsoft.com', 'http://games.lumigame.com', 'http://sit.saba.vin', 'https://sit.saba.vin'],
    enabledLogs: true,
    enabledTelegramLogger: false,
    telegramToken: '1082730409:AAHZ8CjSM1YzGJF5NnVPg0oDdhqDNHV4rjI',
    telegramInfoGroup: '-392274638',
    telegramErrorGroup: '-1001281558099',
    disabledDirectLogin: true,
    redirectUrl: 'http://m.playthefun.com:6046',
    gameIds: {
        taixiu: 1,
        xocxoc: 2,
        baucua: 3
    },
    enabledApi: true,
    apiSettings:
    {
        apiUrl: "http://10.2.189.64:6300",
        authUrl: "http://10.2.189.64:6303",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&"
        },
        useAuthenticate: false,
        requestTimeout: 10000,
        placeBetTimeout: 4500
    },
    enabledApiLog: true,
    sentryUrl: 'https://52368c4019044019885440599c180bda@sentry.saba.vin/24',
    mongoDBConfig: {
        url: "mongodb://lmn_backend:LmnBackend%40517@10.3.189.53:27201,10.3.189.54:27202,10.3.189.54:27203",
        options: {
            user: 'lmn_backend',
            pass: 'LmnBackend%40517',
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            //auto_reconnect: true
            //'autoIndex':       false,
        }
    },
    adminSecretKey: 'asWDEerfOIdgsdqRTFabvmgh'
};

module.exports = appConfigs;
