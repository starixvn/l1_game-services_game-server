const appConfigs = {
  port: 6200,
  env: "SIT",
  apiUrl: "http://10.2.189.64:6300",
  enableCorsWs: true,
  corsUrls: [
    "http://localhost:7456",
    "http://minigame.luminetsoft.com",
    "http://games.lumigame.com",
    "http://sit.saba.vin",
    "https://sit.saba.vin",
    "https://sit-admg.saba.vin/",
  ],
  enabledLogs: true,
  enabledTelegramLogger: false,
  telegramToken: "1082730409:AAHZ8CjSM1YzGJF5NnVPg0oDdhqDNHV4rjI",
  telegramInfoGroup: "-392274638",
  telegramErrorGroup: "-1001281558099",
  disabledDirectLogin: true,
  redirectUrl: "http://m.playthefun.com:6046",
  gameIds: {
    taixiu: 1,
    xocxoc: 2,
    baucua: 3,
    txturbo: 4,
    chanle: 5,
    clturbo: 6,
    minidragontiger: 7,
    kenopromax: 8,
    minisedie: 9,
    baccarat: 10,
    kenoproviet: 11,
    kenomax: 12,
    kenomax2: 13,
    kenomini: 14,
    kenomini2: 15,
    kenoeast: 16,
    kenowest: 17,
    kenosouth: 18,
    kenonorth: 19,
  },
  enabledApi: true,
  apiSettings: {
    apiUrl: "http://10.99.99.101:6300",
    authUrl: "http://10.99.99.101:6303",
    client: {
      id: "game-server",
      secret: "gameserver@20luminet&",
    },
    useAuthenticate: true,
    requestTimeout: 10000,
    placeBetTimeout: 4500,
  },
  enabledApiLog: true,
  sentryUrl: "https://52368c4019044019885440599c180bda@sentry-uat.saba.vin/24",
  mongoDBConfig: {
    url: "mongodb://lmn_backend:LmnBackend%40517@10.2.189.65:27201/?replicaSet=SabaSIT",
    options: {
      user: "lmn_backend",
      pass: "LmnBackend%40517",
      dbName: "minigame",
      useNewUrlParser: true,
      useUnifiedTopology: true,
      //auto_reconnect: true
      //'autoIndex':       false,
    },
  },
  adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
  marqueeMessageConfig: {
    intervalTimeInMinute: 10,
    delayTimeInMinute: 2,
  },
  authenticateSettings: {
    audiences: ["api", "admin-api"],
  },
  rateLimit: {
    enabled: false,
    requestPerSecond: 1000
  }
};

module.exports = appConfigs;
