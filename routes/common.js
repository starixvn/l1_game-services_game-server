

const logger = require('./../app/web/logger').getLogger();
const appConfigs = require('./../config/appConfigs');
const globalConfig = require('./../app/Models/GlobalConfig');
const underMaintenance = require('./../app/Controllers/UnderMaintenance');
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

const requestHandlers = {
    handleUM: (req, res, redT) => {
        try {
            var umInfo = req.body;
            if (umInfo && umInfo.isUM) {
                redT.isUM = umInfo.isUM;
                underMaintenance.handleUnderMaintenance(umInfo);
            }
            else {
                redT.isUM = false;
            }
        }
        catch (ex) {
            logger.logError(ex);
        }

        res.send(req.body ? req.body : "Cannot parse request object");
    },
    umInfo: (req, res, redT) => {
        res.send({
            isUM: redT.isUM
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
                            name: cacheClient.session.username,
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
                redirectDomain: appConfigs.redirectUrl,
                disabledDirectLogin: appConfigs.disabledDirectLogin,
                um: redT.isUM
            });

            return;
        }
        catch (ex) {
            logger.logError(ex);
        }

        res.send({
            redirectDomain: 'http://demo.com',
            disabledDirectLogin: false,
            um: false
        })
    }
}

function initRoutes(app, redT) {
    app.post("/api/um", (req, res) => requestHandlers.handleUM(req, res, redT));
    app.get("/api/uminfo", (req, res) => requestHandlers.umInfo(req, res, redT));
    app.get("/api/settings", cors(corsOptions), (req, res) => requestHandlers.getSettings(req, res, redT));
    app.get("/api/onlineUsers", (req, res) => requestHandlers.onlineUsers(req, res, redT));
}

module.exports = initRoutes;