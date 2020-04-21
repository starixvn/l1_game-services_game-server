

const logger = require('./../app/web/logger').getLogger();
const appConfigs = require('./../config/appConfigs');
const underMaintenance = require('./../app/Controllers/UnderMaintenance');
const lowercaseFirstCharacter = require('./util').lowercaseFirstCharacter;
const cors = require('cors');
const corsOptions = {
    origin: function (origin, callback) {
        if (appConfigs.corsUrls.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS ${origin}`))
        }
    }
}
const diceRandom = require('./../app/Controllers/diceRandom');

const requestHandlers = {
    handleUM: (req, res, redT) => {
        try {
            var umInfo = req.body;
            if (umInfo && umInfo.isUM) {
                redT.umInfo = umInfo;
                if (umInfo.startTime && umInfo.endTime) {
                    umInfo.startTime = new Date(umInfo.startTime);
                    umInfo.endTime = new Date(umInfo.endTime);
                    umInfo.message = `Hệ thống đang được bảo trì. Thời gian từ ${umInfo.startTime} đến ${umInfo.endTime}. Xin hãy quay lại sau, cảm ơn Bạn.`;
                }

                underMaintenance.handleUnderMaintenance(umInfo);
            }
            else {
                redT.umInfo.isUM = false;
            }
        }
        catch (ex) {
            logger.logError(ex);
        }

        res.send(req.body ? req.body : "Cannot parse request object");
    },
    reload: (req, res) => {
        try {
            underMaintenance.reload();
        }
        catch (ex) {
            logger.logError(ex);
        }

        res.send(req.body ? req.body : "Cannot parse request object");
    },
    umInfo: (req, res, redT) => {
        res.send({
            isUM: redT.umInfo
        });
    },
    onlineUsers: (req, res, redT) => {
        try {
            let uusUsers = [];
            let realUsers = []
            Object.values(redT.users).forEach(function (users) {
                users.forEach(function (cacheClient) {
                    if (cacheClient && cacheClient.session) {
                        const user = {
                            name: cacheClient.session.memberName,
                            id: cacheClient.session.memberId,
                            currency: cacheClient.session.currency,
                            character: cacheClient.session.characterName
                        };
                        if (cacheClient.session.currency && cacheClient.session.currency.toUpperCase() === 'UUS') {
                            uusUsers.push(user);
                        }
                        else {
                            realUsers.push(user);
                        }
                    }
                });
            });

            res.send({
                totalReal: realUsers.length,
                realUsers: realUsers,
                totalUUS: uusUsers.length,
                uusUsers: uusUsers
            })
            return;
        }
        catch (ex) {
            logger.logError(ex);
        }

        res.send({ error: true });
    },
    getSettings: (req, res, redT) => {
        try {
            res.send({
                disabledDirectLogin: appConfigs.disabledDirectLogin,
                umInfo: redT.umInfo
            });

            return;
        }
        catch (ex) {
            logger.logError(ex);
        }

        res.send({
            disabledDirectLogin: false,
            umInfo: {
                isUM: false
            }
        })
    },
    testDice: (req, res, redT) => {
        if (appConfigs.env != 'PRO') {
            res.send(diceRandom.test(req.query.taixiu));
        }
        else {
            res.send("Not Found");
        }
    },
    testBC: (req, res, redT) => {
        if (appConfigs.env != 'PRO') {
            res.send(diceRandom.testBC());
        }
        else {
            res.send("Not Found");
        }
    }
}

function initRoutes(app, redT) {
    app.post("/api/um", lowercaseFirstCharacter, (req, res) => requestHandlers.handleUM(req, res, redT));
    app.post("/api/reload", (req, res) => requestHandlers.reload(req, res));
    app.get("/api/uminfo", (req, res) => requestHandlers.umInfo(req, res, redT));
    app.get("/api/settings", cors(corsOptions), (req, res) => requestHandlers.getSettings(req, res, redT));
    app.get("/api/onlineUsers", (req, res) => requestHandlers.onlineUsers(req, res, redT));
    app.get("/api/testDice", (req, res) => requestHandlers.testDice(req, res, redT));
    app.get("/api/testBC", (req, res) => requestHandlers.testBC(req, res, redT));
}

module.exports = initRoutes;