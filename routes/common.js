

const logger = require('./../app/web/logger').getLogger();
const appConfigs = require('./../config/appConfigs');
const underMaintenance = require('./../app/Controllers/UnderMaintenance');
const Keno = require('./../app/Cron/KenoProMax/runGame');
const { lowercaseFirstCharacter, useAuthenticate } = require('./util');
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
    writeLogUM: (umInfo) => {
        try {
            logger.log(`UM Information: ${JSON.stringify(umInfo)}`, 'error');
        }
        catch (ex) {
            logger.logError(ex);
        }
    },
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
                if (redT.umInfo) {
                    redT.umInfo.isUM = false;
                }
            }

            requestHandlers.writeLogUM(umInfo);
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
    },
    kenoUsers: (res, redT) => {
        try{
            let realPlayers = Object.values(redT.kenoProMax.realPlayers);
            let bots = Object.values(redT.kenoProMax.players).filter((player) => {return player.type});

            res.send({
                totalRealPlayer: realPlayers.length,
                realPlayers: realPlayers,
                totalBots: bots.length,
                bots: bots
            })

            return;
        }catch(err){
            console.log(err);
            logger.logError(err);
        }
    },
    xocdiaUsers: (res, redT) => {
        try{            
            let realPlayers = Object.values(redT.game.xocxoc.clients);
            let bots = Object.values(redT.game.xocxoc.players).filter((player) => {return player.type});

            res.send({
                totalRealPlayer: realPlayers.length,
                realPlayers: realPlayers,
                totalBots: bots.length,
                bots: bots
            })

            return;
        }catch(err){
            console.log(err);
            logger.logError(err);
        }
    },
}

const authLogger = {
    error: logger.logError,
    warn: logger.logWarning
};

function initRoutes(app, redT) {
    app.post("/api/um", lowercaseFirstCharacter, (req, res) => requestHandlers.handleUM(req, res, redT));
    app.post("/api/reload", useAuthenticate({ logger: authLogger }), (req, res) => requestHandlers.reload(req, res));
    app.get("/api/uminfo", (req, res) => requestHandlers.umInfo(req, res, redT));
    app.get("/api/settings", cors(corsOptions), (req, res) => requestHandlers.getSettings(req, res, redT));
    app.get("/api/onlineUsers", useAuthenticate({ logger: authLogger }), (req, res) => requestHandlers.onlineUsers(req, res, redT));
    app.get("/api/testDice", (req, res) => requestHandlers.testDice(req, res, redT));
    app.get("/api/testBC", (req, res) => requestHandlers.testBC(req, res, redT));
    app.get("/api/keno/users", (req, res) => requestHandlers.kenoUsers(res, redT));
    app.get("/api/xocdia/users", (req, res) => requestHandlers.xocdiaUsers(res, redT));
}

module.exports = initRoutes;