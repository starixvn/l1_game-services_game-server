
let TXCuoc = require('../../Models/TaiXiu_cuoc');
let TXCuocOne = require('../../Models/TaiXiu_one');
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

	configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.TaiXiu);

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
			  let maxBot = Math.floor(result.length * ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.TaiXiu));
			  botList = Helper.shuffle(result); 
			  botList = botList.slice(0, maxBot);
  
			//   console.log("TaiXiu max bot " + botList.length);
  
			});
		  }
		});
  
	  } catch (error) {
		botList = [];		
  
		logger.logError(error);
		console.log(error);
  
	  }
	} else {
	  botList = [];
	}
  };

let botPlacesBets = function (io) {

  let maxBet = 10;
  let minBet = 1;
  if (!!configs) {
    if (!!configs.bot_maxbet && configs.bot_maxbet > 0) {
      maxBet = configs.bot_maxbet;
    }
    if (configs.minbet > 0) {
      minBet = configs.minbet;
    }
  }

  if (!!botList.length && io.TaiXiu_time > 5) {
    var maxBotRandom = botList.length / io.TaiXiu_time;
    let userCuoc = chance.integer({ min: (maxBotRandom * 2 / 3), max: maxBotRandom });

    // console.log("TaiXiu" + " added " + userCuoc + "/" + maxBotRandom + ".Total bots remains " + botList.length);    

    let iH = 0;
    for (iH = 0; iH < userCuoc; iH++) {
      let dataT = botList[iH];
      if (!!dataT) {
        tx(dataT, io, maxBet, minBet);
        botList.splice(iH, 1); 
      }
      dataT = null;
    }
  }
};

let tx = function (bot, io, maxBet, minBet) {	

	const isSmallTicket = totalBotTickets == 0 ? true : (totalSmallBotTickets * 100 / totalBotTickets) < ratioOfSmallTicket;

	if(isSmallTicket)
	{
		let maxBetOfSmallTicket = minBet * smallTicketScale;
		maxBet = Math.min(maxBetOfSmallTicket, maxBet);
	}

	const cuoc = Helper.getRandomNumberStep5(minBet, maxBet, false);
	const select = !!((Math.random() * 2) >> 0);

	// console.log(`TX bot ${bot.name} bet ${cuoc}`);

	if(io.TaiXiu_time > 5)
	{
		if (select) {
			io.taixiu.taixiu.red_tai += cuoc;
			io.taixiu.taixiu.red_player_tai += 1;
		} else {
			io.taixiu.taixiu.red_xiu += cuoc;
			io.taixiu.taixiu.red_player_xiu += 1;
		}
		
		TXCuoc.create({ uid: bot.id, name: bot.name, phien: io.TaiXiu_phien, bet: cuoc, taixiu: true, select: select, red: true, time: new Date() });

		var update = {bet : cuoc};
		let create = { uid: bot.id, phien: io.TaiXiu_phien, red: true, taixiu: true, select: select, time: new Date() };

		TXCuocOne.updateOne(
			{ uid: bot.id, phien: io.TaiXiu_phien, red: true },
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
