const appConfigs = {
    apiUrl: "http://api.lumigame.com/",
    corsUrls: ['http://localhost:7456', 'http://minigame.luminetsoft.com', 'http://games.lumigame.com'],
    enabledLogs: true,
    enabledTelegramLogger: false,
    telegramInfoGroup: '-458665883',
    telegramErrorGroup: '-229702876',
    disabledDirectLogin: false,
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
    sentryUrl: 'https://965d36e2b08144d69b468940a3064eb9@sentry.io/5172750'
};

module.exports = appConfigs;