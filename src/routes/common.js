const promClient = require("prom-client");

const logger = require("./../app/web/logger").getLogger();
const appConfigs = require("./../config/appConfigs");
const underMaintenance = require("./../app/Controllers/UnderMaintenance");
const { lowercaseFirstCharacter, useAuthenticate } = require("./util");
const cors = require("cors");
const corsOptions = {
  origin: function (origin, callback) {
    if (appConfigs.corsUrls.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS ${origin}`));
    }
  },
};
promClient.collectDefaultMetrics();
const User = require("./../app/Controllers/User");

const requestHandlers = {
  writeLogUM: (umInfo) => {
    try {
      logger.log(`UM Information: ${JSON.stringify(umInfo)}`, "error");
    } catch (ex) {
      logger.logError(ex);
    }
  },

  captureUM: (umInfo, redT) => {
    try {
      if (!redT.umInfo) {
        redT.umInfo = [];
      }

      if (umInfo.isPartnerUm) {
        umInfo.partners.forEach((partner) => {
          redT.umInfo.push({
            finish: !umInfo.isUM,
            partnerId: partner,
            start: umInfo.startTime,
            end: umInfo.endTime,
            isPartnerUm: true,
          });
        });
      } else {
        redT.umInfo.push({
          finish: !umInfo.isUM,
          start: umInfo.startTime,
          end: umInfo.endTime,
          isPartnerUm: false,
        });
      }
    } catch (ex) {
      logger.logError(ex);
    }
  },

  removeUM: (umInfo, redT) => {
    try {
      if (redT.umInfo) {
        redT.umInfo = redT.umInfo.filter(
          (um) =>
            um.startTime > Date.now() ||
            um.isPartnerUm != umInfo.isPartnerUm ||
            (umInfo.isPartnerUm && !umInfo.partners.includes(um.partnerId))
        );
      }
    } catch (ex) {
      logger.logError(ex);
    }
  },

  handleUM: (req, res, redT) => {
    try {
      let umInfo = req.body;
      if (umInfo && umInfo.isUM) {
        if (umInfo.startTime && umInfo.endTime) {
          umInfo.startTime = new Date(umInfo.startTime);
          umInfo.endTime = new Date(umInfo.endTime);
          umInfo.message = `Hệ thống đang được bảo trì. Thời gian từ ${umInfo.startTime} đến ${umInfo.endTime}. Xin hãy quay lại sau, cảm ơn Bạn.`;
        }
        requestHandlers.captureUM(umInfo, redT);

        underMaintenance.handleUnderMaintenance(umInfo);
      } else {
        requestHandlers.removeUM(umInfo, redT);
      }

      requestHandlers.writeLogUM(umInfo);
    } catch (ex) {
      logger.logError(ex);
    }

    res.send(req.body ? req.body : "Cannot parse request object");
  },
  reload: (req, res) => {
    try {
      underMaintenance.reload();
    } catch (ex) {
      logger.logError(ex);
    }

    res.send(req.body ? req.body : "Cannot parse request object");
  },
  onlineUsers: (req, res, redT) => {
    try {
      let testUsers = [];
      let realUsers = [];
      Object.values(redT.users).forEach(function (users) {
        users.forEach(function (cacheClient) {
          if (cacheClient && cacheClient.session) {
            const user = {
              name: cacheClient.session.memberName,
              id: cacheClient.session.memberId,
              currency: cacheClient.session.currencyName,
              character: cacheClient.session.characterName,
              partnerId: cacheClient.session.partnerId,
            };
            if (cacheClient.session.isTestCurrency) {
              testUsers.push(user);
            } else {
              realUsers.push(user);
            }
          }
        });
      });

      res.send({
        totalRealPlayer: realUsers.length,
        realUsers: realUsers,
        totalTestPlayer: testUsers.length,
        testUsers: testUsers,
      });
      return;
    } catch (ex) {
      logger.logError(ex);
    }

    res.send({ error: true });
  },
  getSettings: (req, res, redT) => {
    try {
      res.send({
        umInfo: redT.umInfo,
      });

      return;
    } catch (ex) {
      logger.logError(ex);
    }

    res.send({
      umInfo: {
        isUM: false,
      },
    });
  },
  getMetrics: (req, res) => {
    try {
      if (req.query?.auth === appConfigs.promethusSecretKey) {
        res.type("text");
        res.send(promClient.register.metrics());

        return;
      }
    } catch (ex) {
      logger.logError(ex);
    }

    res.send({ error: true });
  },

  refreshBalance: (req, res, redT) => {
    try {
      const { uid } = req.body;
      redT.users[uid] &&
        redT.users[uid].forEach((client) => {
          User.updateCoin(client);
        });
    } catch (ex) {
      logger.logError(ex);
    }

    res.send(req.body ? req.body : "Cannot parse request object");
  },
};

const authLogger = {
  error: logger.logError,
  warn: logger.logWarning,
};

function initRoutes(app, redT) {
  app.post("/api/um", lowercaseFirstCharacter, useAuthenticate({ logger: authLogger }), (req, res) =>
    requestHandlers.handleUM(req, res, redT)
  );
  app.post("/api/reload", useAuthenticate({ logger: authLogger }), (req, res) => requestHandlers.reload(req, res));
  app.get("/api/settings", cors(corsOptions), (req, res) => requestHandlers.getSettings(req, res, redT));
  app.get("/api/onlineUsers", useAuthenticate({ logger: authLogger }), (req, res) => requestHandlers.onlineUsers(req, res, redT));
  app.get("/api/metrics", (req, res) => requestHandlers.getMetrics(req, res));
  app.post("/api/refreshBalance", useAuthenticate({ logger: authLogger }), (req, res) => requestHandlers.refreshBalance(req, res, redT));
}

module.exports = initRoutes;
