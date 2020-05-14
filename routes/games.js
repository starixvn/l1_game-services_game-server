const logger = require('./../app/web/logger').getLogger();
const { useAuthenticate } = require('./util');

const requestHandlers = {    
    kenoUsers: (res, redT) => {
        try{                        
            const users = mapRealUsers(Object.values(redT.kenoProMax.realPlayers));

            let bots = Object.values(redT.kenoProMax.players)
                .filter((player) => {return player.type})
                .map((bot) => { return { name: bot.name, red: bot.red} });

            res.send({
                totalRealPlayer: users.realUsers.length,
                realUsers: users.realUsers,
                totalUusPlayer: users.uusUsers.length,
                uusUsers: users.uusUsers,
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
            const users = mapRealUsers(Object.values(redT.game.xocxoc.clients));           

            let bots = Object.values(redT.game.xocxoc.players)
                .filter((player) => {return player.type})
                .map((bot) => { return { name: bot.name, red: bot.red} });

            res.send({
                totalRealPlayer: users.realUsers.length,
                realUsers: users.realUsers,
                totalUusPlayer: users.uusUsers.length,
                uusUsers: users.uusUsers,
                totalBots: bots.length,
                bots: bots
            })

            return;
        }catch(err){
            logger.logError(err);
        }
    },    
};

const authLogger = {
    error: logger.logError,
    warn: logger.logWarning
};

function mapRealUsers(clients) {
    let uusUsers = [];
    let realUsers = [];

    clients.forEach(function (cacheClient) {        
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

    return {uusUsers: uusUsers, realUsers: realUsers};
}

function initRoutes(app, redT) {
    app.get("/api/game/keno/onlineusers", useAuthenticate({ logger: authLogger }), (req, res) => requestHandlers.kenoUsers(res, redT));
    app.get("/api/game/stp/onlineusers", useAuthenticate({ logger: authLogger }), (req, res) => requestHandlers.shakeThePlateUsers(res, redT));
}

module.exports = initRoutes;