const appConfigs = {
  port: 7200,
  env: "UAT",
  prefixCharactorName: "@",
  apiUrl: "http://10.99.99.101:7300",
  enableCorsWs: true,
  corsUrls: [
    "http://localhost:7456",
    "http://minigame.luminetsoft.com",
    "http://games.lumigame.com",
    "http://sit.saba.vin",
    "http://uat.saba.vin",
    "https://uat.saba.vin",
    "https://sit.saba.vin",
  ],
  enabledLogs: true,
  enabledTelegramLogger: false,
  telegramToken: "1111366760:AAEbeCLZEFSM7-T0MOT9iv1dn01f3ZojFtE",
  telegramInfoGroup: "-479703667",
  telegramErrorGroup: "-453402700",
  disabledDirectLogin: true,
  redirectUrl: "http://google.com",
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
    apiUrl: "http://10.99.99.101:7300",
    authUrl: "http://10.99.99.101:7303",
    client: {
      id: "game-server",
      secret: "gameserver@20luminet&",
    },
    useAuthenticate: true,
    placeBetTimeout: 4500,
    requestTimeout: 10000, // 10s
  },
  enabledApiLog: true,
  sentryUrl: "https://7ba626fc5eea40709545d4adf36975c6@sentry-uat.saba.vin/29",
  mongoDBConfig: {
    url: "mongodb://lmn_backend:LmnBackend%4022027@10.99.99.187:27201/?replicaSet=SabaUAT",
    options: {
      user: "lmn_backend",
      pass: "LmnBackend@22027",
      dbName: "minigame",
      useNewUrlParser: true,
      useUnifiedTopology: true,
      auto_reconnect: true,
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
