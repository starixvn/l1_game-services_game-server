
let TXTurboCuoc = require('../../Models/TXTurbo/TXTurbo_cuoc');
let TXTurboCuocOne = require('../../Models/TXTurbo/TXTurbo_one');
let UserInfo = require("../../Models/UserInfo");
let Chance = require('chance');

const Helper = require('../../Helpers/Helpers');
const ConfigHelper = require('../../Helpers/ConfigHelper');
const chance = new Chance();
const logger = require('../../web/logger');


let botList = [];
let configs = null;

let totalBotTickets = 0;
let totalSmallBotTickets = 0;

const ratioOfSmallTicket = 70;
const smallTicketScale = 50;

let resetBots = function () {
    configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.TXTurbo);

    if (!!configs && configs.botenabled) {
        try {
            UserInfo.find({ type: true , disabled : false}, "id name", function (err, list) {
                if (list.length) {
                    Promise.all(
                        list.map(function (user) {
                            user = user._doc;
                            delete user._id;
                            return user;
                        })
                    ).then(result => {
                        let maxBot = Math.floor(result.length * ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.TXTurbo));

                        botList = Helper.shuffle(result);
                        botList = botList.slice(0, maxBot);
                    });
                }
            });

        } catch (error) {           
            botList = [];
            logger.logError(error);

        }
    } else {
        botList = [];
    }
}

let botPlacesBets = function (io) {
    var maxBet = 10;
    var minBet = 1;
    if (!!configs) {
        if (!!configs.bot_maxbet && configs.bot_maxbet > 0) {
            maxBet = configs.bot_maxbet;
        }
        if (configs.minbet > 0) {
            minBet = configs.minbet;
        }
    }

    if (!!botList.length && io.TXTurbo_time > 5) {
        var maxBotRandom = botList.length / io.TXTurbo_time;
        let userCuoc = chance.integer({ min: (maxBotRandom * 2 / 3), max: maxBotRandom });

        let iH = 0;
        for (iH = 0; iH < userCuoc; iH++) {
            let dataT = botList[iH];
            if (!!dataT) {
                botTxTurbo(dataT, io, maxBet, minBet);

                botList.splice(iH, 1); 
            }
            dataT = null;
        }
    }
};

let botTxTurbo = function (bot, io, maxBet, minBet) {

    const isSmallTicket = totalBotTickets == 0 ? true : (totalSmallBotTickets * 100 / totalBotTickets) < ratioOfSmallTicket;

	if(isSmallTicket)
	{
		let maxBetOfSmallTicket = Math.min(minBet * smallTicketScale, maxBet * 0.3);
		maxBet = Math.min(maxBetOfSmallTicket, maxBet);
	}

    const cuoc = Helper.getRandomNumberStep5(minBet, maxBet, false);
    const select = !!((Math.random() * 2) >> 0);

    if(io.TXTurbo_time > 5){
        // console.log(`TX Turbo bot ${bot.name} bet ${cuoc}`);

        if (select) {
            io.taixiu_turbo.taixiu.red_tai += cuoc;
            io.taixiu_turbo.taixiu.red_player_tai += 1;
        } else {
            io.taixiu_turbo.taixiu.red_xiu += cuoc;
            io.taixiu_turbo.taixiu.red_player_xiu += 1;
        }
    
        TXTurboCuoc.create({ uid: bot.id, name: bot.name, phien: io.TXTurbo_phien, bet: cuoc, taixiu: true, select: select, red: true, time: new Date() });

        var update = {bet : cuoc};

        let create = { uid: bot.id, phien: io.TXTurbo_phien, red: true, taixiu: true, select: select, time: new Date() };
        
        TXTurboCuocOne.updateOne(
			{ uid: bot.id, phien: io.TXTurbo_phien, red: true },
			{ $inc: update, $setOnInsert: create },
			{ upsert: true, setDefaultsOnInsert: true },
			function (err, doc) {
				if (err) {
					logger.logError(err);
					console.log(err);
				}
            });
            
        totalBotTickets++;

        if(isSmallTicket)
        {
            totalSmallBotTickets++;
        }
    }
};

module.exports = {
	botPlacesBets : botPlacesBets,
	resetBots: resetBots
}