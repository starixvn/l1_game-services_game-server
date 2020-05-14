const logger = require('./../app/web/logger').getLogger();
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

const requestHandlers = {    
    kenoUsers: (res, redT) => {
        try{            
            let realPlayers = Object.values(redT.kenoProMax.players)
                .filter((player) => {return !player.type})
                .map((player) => { return { name: player.name} });

            let bots = Object.values(redT.kenoProMax.players)
                .filter((player) => {return player.type})
                .map((bot) => { return { name: bot.name, red: bot.red} });

            res.send({
                totalRealPlayer: realPlayers.length,
                realPlayers: realPlayers,
                totalBots: bots.length,
                bots: bots
            })

            return;
        }catch(err){            
            logger.logError(err);
        }
    },
    shakeThePlateUsers: (res, redT) => {
        try{            
            let realPlayers = Object.values(redT.game.xocxoc.players)
                .filter((player) => {return !player.type})
                .map((player) => { return { name: player.name} });

            let bots = Object.values(redT.game.xocxoc.players)
                .filter((player) => {return player.type})
                .map((bot) => { return { name: bot.name, red: bot.red} });

            res.send({
                totalRealPlayer: realPlayers.length,
                realPlayers: realPlayers,
                totalBots: bots.length,
                bots: bots
            })

            return;
        }catch(err){
            logger.logError(err);
        }
    },
}

const authLogger = {
    error: logger.logError,
    warn: logger.logWarning
};

function initRoutes(app, redT) {
    app.get("/api/game/keno/onlineusers", (req, res) => requestHandlers.kenoUsers(res, redT));
    app.get("/api/game/stp/onlineusers", (req, res) => requestHandlers.shakeThePlateUsers(res, redT));
}

module.exports = initRoutes;