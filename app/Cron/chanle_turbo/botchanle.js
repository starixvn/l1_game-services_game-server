
let ChanLeTurboCuoc = require('../../Models/ChanLeTurbo/ChanLeTurbo_cuoc');
let ChanLeTurboOne = require('../../Models/ChanLeTurbo/ChanLeTurbo_one');
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
    configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.CLTurbo);

    if (!!configs && configs.botenabled) {
      try {    
        UserInfo.find({ type: true, disabled : false }, "id name", function (err, list) {
  
          if (list.length) {
            Promise.all(
              list.map(function (user) {
                user = user._doc;
                delete user._id;
                return user;
              })
            ).then(result => {
              botTemp = [...result];
              maxBot = Math.floor(result.length * ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.CLTurbo));
              
              // console.log("CLTurbo max bot " + maxBot);
  
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

  if (!!botList.length && io.ChanLeTurbo_time > 5) {
    var maxBotRandom = botList.length / io.ChanLeTurbo_time;
    let userCuoc = chance.integer({ min: (maxBotRandom * 2 / 3), max: maxBotRandom });

    // console.log(`CL bot ${userCuoc} maxBotRandom ${maxBotRandom} botList.length ${botList.length} time ${io.ChanLeTurbo_time}`);

    let iH = 0;
    for (iH = 0; iH < userCuoc; iH++) {
      let dataT = botList[iH];
      if (!!dataT) {
        cl(dataT, io, maxBet, minBet);
        botList.splice(iH, 1); // Xoá bot đã đặt tránh trùng lặp
      }
      dataT = null;
    }
  }
};
  
let cl = function (bot, io, maxBet, minBet) {
    const isSmallTicket = totalBotTickets == 0 ? true : (totalSmallBotTickets * 100 / totalBotTickets) < ratioOfSmallTicket;

	if(isSmallTicket)
	{
		let maxBetOfSmallTicket = minBet * smallTicketScale;
		maxBet = Math.min(maxBetOfSmallTicket, maxBet);
    }
    
    const cuoc = Helper.getRandomNumberStep5(minBet, maxBet, false);
    const select = !!((Math.random() * 2) >> 0);

    if(io.ChanLeTurbo_time > 5)
    {
        // console.log(`OddEven Turbo bot ${bot.name} bet ${cuoc}`);

        if (select) {
            io.clturbo.clturbo.red_chan += cuoc;
            io.clturbo.clturbo.red_player_chan += 1;
        } else {
            io.clturbo.clturbo.red_le += cuoc;
            io.clturbo.clturbo.red_player_le += 1;
        }
        
        ChanLeTurboCuoc.create({ uid: bot.id, name: bot.name, phien: io.ChanLeTurbo_phien, bet: cuoc, select: select, red: true, time: new Date() });       

        var update = {bet : cuoc};

        let create = { uid: bot.id, phien: io.ChanLeTurbo_phien, red: true, select: select, time: new Date() };
        
        ChanLeTurboOne.updateOne(
			{ uid: bot.id, phien: io.ChanLeTurbo_phien, red: true },
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
    
    bot = null;
    io = null;
};

module.exports = {
    botPlacesBets : botPlacesBets,
	resetBots: resetBots
}
