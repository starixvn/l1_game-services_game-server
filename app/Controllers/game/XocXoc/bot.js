let XocXoc_cuoc = require('../../../Models/XocXoc/XocXoc_cuoc');
let UserInfo = require('../../../Models/UserInfo');
let Chance = require('chance');
const chance = new Chance();

let Helpers = require('../../../Helpers/Helpers');
let logger = require('../../../web/logger');
let ConfigHelper = require('../../../Helpers/ConfigHelper');

const modRoundToChangedTopBot = 6;

let configs = null;
let botList = [];
let botsInRoom = [];
let maxNumberOfBots = 0;
let currentBotRatio = 0;
let changedTopBots = false;

let betChoices = { 0: 'chan', 1: 'le', 2: 'red3', 3: 'white3', 4: 'red4', 5: 'white4' };
let chipList = [500, 200, 100, 50, 10, 5, 1];

let dataBot = {
    'chan': 0,
    'le': 0,
    'red3': 0,
    'red4': 0,
    'white3': 0,
    'white4': 0,
}

let totalBotTickets = 0;
let totalSmallBotTickets = 0;

let betChoiceRatio = {
    0: 0.46, //even
    1: 0.46, //odd
    2: 0.035, //3 white
    3: 0.035, //3 red
    4: 0.05, //4 white
    5: 0.05 //4 red
};

let MainOptPercentage = 94;
let SubOptPercentage = 5;

var resetBots = function()
{
    configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.XocXoc);
    try {
        if (configs.botenabled) {

            var botRatio = ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.XocXoc);
            if(currentBotRatio != botRatio)
            {
                currentBotRatio = botRatio;    

                // lấy danh sách tài khoản bot
                UserInfo.find({ type: true }, 'id name red avatarId', (err, blist) => {
                    if (err) {
                        logger.logError(err);
                    }
    
                    if (blist.length) {
                        Promise.all(blist.map(function (buser) {
                            buser = buser._doc;
                            delete buser._id;
    
                            return buser;
                        })).then(result => {                            
                            maxNumberOfBots = Math.floor(result.length * currentBotRatio);

                            botList = Helpers.shuffle(result);
                            botList = botList.slice(0, maxNumberOfBots);                                
                        }).catch(function (err) {
                            logger.logError(err);
                        });
                    }
                });
            }            
                           
            changedTopBots = false;

        } else {
            removeAllBots();
        }

        resetBotData();
    } catch (error) {       
        console.log(error);
        logger.logError(error);
        removeAllBots();
    }
}

var removeAllBots = function (){
    botsInRoom = [];
    botList = [];
     maxNumberOfBots = 0;
    currentBotRatio = 0;
}

var addBots = function(time, phien, clients, players){
    try{
        var bots = {
            in: [],
            out: []
        }
    
        if (!!botList.length && time > 5) {
            let activeBots = Object.keys(botsInRoom);
            let random = (Math.random() * 5) >> 0;
    
            if ((activeBots.length <= 20 || random == 3)
                && activeBots.length <= maxNumberOfBots) { //bot in		
                    bots.in = botIn(time);
            }
    
            if (activeBots.length > 20 && random == 4) { //bot out
                bots.out = botOut(activeBots, time, phien);
            }
    
            var maxBet = 10;
            var minBet = 1;
            if (!!configs) {
                if(!!configs.bot_maxbet && configs.bot_maxbet > 0)
                {
                    maxBet = configs.bot_maxbet;
                }
                if(configs.minbet > 0)
                {
                    minBet = configs.minbet;
                }
            }
    
            var maxTickets = Math.floor(activeBots.length / time) + 5;
            let userCuoc = Math.floor((Math.random() * maxTickets) + 5);
    
            // console.log("activeBots " + activeBots.length + " this.XocXocPlayTime " + this.XocXocPlayTime + " userCuoc " + userCuoc);
    
            let botsToBet = Object.values(botsInRoom).filter(function (t) { return t.totalBet < maxBet });
            botsToBet = Helpers.shuffle(botsToBet);
            for (let i = 0; i < userCuoc; i++) {
                let bot = botsToBet[i];
                
                if (!!bot) {
                    botPlaceBet(bot, maxBet, minBet, phien, clients, players);
                }

                bot = null; // why set it null?!?
            }
        }
    
        return bots;

    }
    catch(err)
    {
        console.log(err);
    }
}

var  botIn = function(time){
    let botsIn = [];
    var maxBotRandom = botList.length / time;
    let length = Math.floor((Math.random() * maxBotRandom) + 1);

    for (let i = 0; i < length; i++) {
        let dataT = botList[i];
        let botId = dataT.id;

        if (!!dataT) {          
            botsInRoom[botId] = dataT;
            resetBot(botsInRoom[botId]);
            botList.splice(i, 1);
            botsIn.push(dataT);
        }

        dataT = null;
    }

    return botsIn;
}

var  botOut = function(activeBots, time, phien){
    let botsOut = [];
    var maxBotRemoveRandom = activeBots.length / time;

    if (maxBotRemoveRandom < 4) {
        maxBotRemoveRandom = 4;
    }

    let length = (Math.random() * maxBotRemoveRandom) >> 0;

    for (let i = 0; i < length; i++) {
        let index = (Math.random() * activeBots.length >> 0);

        if (!changedTopBots && phien % modRoundToChangedTopBot == 0) {
            // change top of bots
            index = Math.random() * 8 >> 0;
            changedTopBots = true;
        }

        let playerId = activeBots[index];
        botsOut.push(botsInRoom[playerId]);

        delete botsInRoom[playerId];
    }

    return botsOut;
}

var  botPlaceBet = function(bot, maxBet, minBet, phien, clients, players){
    
    try {
		let box;
		let totalBotBet = dataBot.chan + dataBot.le + dataBot.red3 + dataBot.red4 + dataBot.white3 + dataBot.white4;
		let totalBotBetMain = dataBot.chan + dataBot.le;
		let maxBetOfSmallTicket = minBet * 50 > maxBet ? maxBet : minBet * 50;
		let maxBetOfFour = minBet * 10 > maxBet ? maxBet : minBet * 10;

		let isMain = totalBotBet == 0 ? Math.floor(Math.random() * 2) : (totalBotBetMain * 100 / totalBotBet) < MainOptPercentage;
		let isEvent = false

		if (isMain) {
			let betChoice = Math.floor(Math.random() * 2);
			box = betChoices[betChoice];
		} else {
			let totalBetSubEvent = dataBot.red3 + dataBot.white3;
			isEvent = totalBetSubEvent * 100 / totalBotBet < SubOptPercentage;
			let betChoice = isEvent ? (Math.floor(Math.random() * 2) + 2) : (Math.floor(Math.random() * 2) + 4);
			box = betChoices[betChoice];
		}

		// console.log("totalBotBetMain: " + totalBotBetMain + "  / totalBotBet: " +totalBotBet);

		let isSmallTicket = totalBotTickets == 0 ? Math.floor(Math.random() * 2) : (totalSmallBotTickets * 100 / totalBotTickets) < 70;
		let botBetTotal = isSmallTicket ? Helpers.getRandomNumberStep5(minBet, maxBetOfSmallTicket, true) : Helpers.getRandomNumberStep5(minBet, maxBet, true);

		if(isEvent && !isSmallTicket && ((dataBot.red3 + dataBot.white3) * 100 / totalBotBet > SubOptPercentage))
		{
			botBetTotal = Helpers.getRandomNumberStep5(minBet, maxBetOfSmallTicket, true); //reset bet amount if reach 7%
		}

		var betChips = Helpers.getRandomChips(botBetTotal);

		for (let index = 0; index < betChips.length; index++) {
			const chip = betChips[index];
			if (chip > 0) {
				botBetTotal = chipList[index];

				break;
			}
		}

		XocXoc_cuoc.findOne({ uid: bot.id, phien: phien, red: true }, function (err, checkOne) {
			if (err) {
				logger.logError(err);
			}

			try {
				if (!checkOne || (checkOne['chan'] + checkOne['le'] + checkOne['red3'] + checkOne['red4'] + checkOne['white3'] + checkOne['white4'] + botBetTotal) <= maxBet) {
					UserInfo.findOne({ id: bot.id }, "red", function (err, user) {
						if (err) {
							logger.logError(err);
						}

						try {

							if (box == "white4" || box == "red4") //stake for white4 and red4 should not >10
							{
								if (botBetTotal > maxBetOfFour) {
									botBetTotal = maxBetOfFour;
								}
							}

							if (!!botsInRoom[bot.id]) {
								//stake for white4 and red4 should not >10
								if ((box == "white4" || box == "red4") && botsInRoom[bot.id].totalBet + botBetTotal > maxBetOfFour) {
									botBetTotal = 0;
								}

								if (botsInRoom[bot.id].remainTickets == 0) //reach limit ticket
								{
									botBetTotal = 0;
								}
								else {
									//Check for bot choices: it should not contains both main options
									if (box == "chan" && botsInRoom[bot.id].choices.indexOf("le") != -1) {
										box = "le";
									}
									else if (box == "le" && botsInRoom[bot.id].choices.indexOf("chan") != -1) {
										box = "chan";
									}

									// console.log(self.botsInRoom[bot.id].choices.indexOf("chan"));
								}				
								
								// console.log("bot " + bot.name + " remain tickets " + self.botsInRoom[bot.id].remainTickets);
							}else{
								botBetTotal = 0;
							}							

							if (botBetTotal > 0 && user && user.red > botBetTotal) {
								user.red -= botBetTotal;
								user.save();

								if (checkOne) {
									checkOne[box] += botBetTotal;
									checkOne.save();
								} else {

									var update = {};
									update[box] = botBetTotal;

									let create = { uid: bot.id, name: bot.name, phien: phien, red: true, time: new Date() };

									XocXoc_cuoc.updateOne(
										{ uid: bot.id, phien: phien, red: true },
										{ $inc: update, $setOnInsert: create },
										{ upsert: true, setDefaultsOnInsert: true },
										function (err, doc) {
											if (err) {
												logger.logError(err);
											}
										});
								}

								// self.data.red[box] += botBetTotal;
								dataBot[box] += botBetTotal;

								if (!!botsInRoom[bot.id]) {
									botsInRoom[bot.id].totalBet += botBetTotal;
                                    botsInRoom[bot.id].choices.push(box);
                                    botsInRoom[bot.id].red = user.red;
                                    botsInRoom[bot.id].remainTickets--;
								}

								console.log("Bot " + bot.name + " bet for " + box + " total " + botsInRoom[bot.id].totalBet);

								if (players[bot.id]) {
									players[bot.id].red = user.red;
								}

								if (isSmallTicket) {
									totalSmallBotTickets += 1;
                                }
                                
								totalBotTickets += 1;

								Object.values(clients).forEach(function (client) {
									client.red({ xocxoc: { chip: { playerId: bot.id, box: box, cuoc: botBetTotal, red: user.red } } });
								});
							}

						} catch (err) {
							logger.logError(err);
						}

					});
				}
			}
			catch (err) {
                console.log(err);
				// logger.logError(err);
			}
		});

	} catch (err) {
        // logger.logError(err);
        console.log(err);
	}
}

var resetBotData = function(){

    Object.keys(botsInRoom).forEach(function (id) {
        resetBot(botsInRoom[id]);
	});

	totalBotTickets = 0;
	totalSmallBotTickets = 0;
}

var resetBot = function(bot){
    if(!!bot)
    {
        bot.totalBet = 0;
        bot.remainTickets = Math.floor((Math.random() * 3 + 1) + 1);
        bot.choices = [];
    }    
}

module.exports = {
    resetBots: resetBots,
    botPlaceBet: botPlaceBet,
    addBots: addBots
};