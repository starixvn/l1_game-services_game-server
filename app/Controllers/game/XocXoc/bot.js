let XocXoc_cuoc = require('../../../Models/XocXoc/XocXoc_cuoc');
let UserInfo = require('../../../Models/UserInfo');
let Chance = require('chance');
const chance = new Chance();

let Helpers = require('../../../Helpers/Helpers');
let logger = require('../../../web/logger');
let ConfigHelper = require('../../../Helpers/ConfigHelper');
let constants = require('./constants');
const appConstants = require("./../../../appConstants");

const modRoundToChangedTopBot = 6;

let configs = null;
let botsInRoom = [];
let maxNumberOfBots = 0;
let currentBotRatio = 0;
let changedTopBots = false;

let betChoices = { 0: 'chan', 1: 'le', 2: 'red3', 3: 'white3', 4: 'red4', 5: 'white4' };

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
    "MainOpts": 94, //odd | even
    "SubOpts": 5, //white3 | red3
    "RareOpts": 1, //red4 | white4
};

var resetBots = function(players, clients)
{
    configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.XocXoc);
    try {
        if (configs.botenabled) {

            var botRatio = ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.XocXoc);
            if(currentBotRatio != botRatio)
            {
                currentBotRatio = botRatio;    

                // lấy danh sách tài khoản bot
                UserInfo.countDocuments({ type: true }, (err, botCount) => {
                    if (err) {
                        logger.logError(err);
                    }

                    maxNumberOfBots = Math.floor(botCount * currentBotRatio);                    
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
        removeAllBots(players, clients);
    }
}

var removeAllBots = function (players, clients){

    if(!!players)
    {
        var bots = Object.values(players).filter(function(player){ return player.type });

        bots.forEach(bot => {
            removeBot(bot.id, players, clients);
        });
    }   

    botsInRoom = [];
    maxNumberOfBots = 0;
    currentBotRatio = 0;
}

var addBots = function(time, phien, clients, players, data){
    try{        
        if (!!configs && configs.botenabled && time > constants.settlementDuration) {
            let activeBots = Object.keys(botsInRoom);
            let random = (Math.random() * 5) >> 0;
    
            if ((activeBots.length <= 20 || random == 3)
                && activeBots.length <= maxNumberOfBots) { //bot in		
                botIn(time, players, clients);
            }
    
            if (activeBots.length > 20 && random == 4) { //bot out
                botOut(activeBots, time, phien, players, clients);
            }
    
            var maxTickets = Math.floor(activeBots.length / time) + 5;
            let userCuoc = Math.floor((Math.random() * maxTickets) + 5);
    
            let botsToBet = Object.values(botsInRoom).filter(function (t) { return t.totalBet < configs.bot_maxbet && t.remainTickets > 0});
            botsToBet = Helpers.shuffle(botsToBet);

            // console.log( "activeBots " + activeBots.length +" / botsToBet " + botsToBet.length + " phien " + phien);

            for (let i = 0; i < userCuoc; i++) {
                let bot = botsToBet[i];
                
                if (!!bot) {
                    botPlaceBet(bot, phien, clients, players, data, time);
                }
            }
        }
    }
    catch(err)
    {
        console.log(err);
    }
}

var  botIn = function(time, players, clients){
    let botsIn = [];
    var maxBotRandom = maxNumberOfBots / time;
    let length = Math.floor((Math.random() * maxBotRandom) + 1);

    UserInfo.find(
        { type: true, inRoom: false },
        "-_id id name red avatarId type",
        function(err, botUsers){
            if(err)
            {
                logger.log(err);
            }

            var botList = Helpers.shuffle(botUsers);
            botList = botList.slice(0, length);
        
            for (let i = 0; i < botList.length; i++) {
                let bot = botList[i];
        
                if (!!bot) {        

                    UserInfo.updateOne({ id: bot.id }, { inRoom: true }).catch(
                        (error) => {
                          logger.logError(error);
                        }
                    );

                    botsInRoom[bot.id] = bot;
                    resetBot(botsInRoom[bot.id]);
        
                    botList.splice(i, 1);        
                    botsIn.push(bot);
                }
        
                if (!players[bot.id]) {
                    Object.values(clients).forEach(function (user) {
                        user.red({ xocxoc: { ingame: { player: { id: bot.id, name: bot.name, red: bot.red, avatarId: bot.avatarId, type: bot.type } } } });
                    });
                }
    
                players[bot.id] = bot;
            }
        }
    );
}

var  botOut = function(activeBots, time, phien, players, clients){
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

        removeBot(playerId, players, clients);
        delete botsInRoom[playerId];
    }

    return botsOut;
}

var removeBot = function(botId, players, clients)
{
    // console.log("remove bot " + botId);
    UserInfo.updateOne({ id: botId }, { inRoom: false }).catch(
        (error) => {
          logger.logError(error);
        }
    );

    Object.values(clients).forEach(function (user) {
        user.red({ xocxoc: { outgame: { playerId: botId } } });
    });

    delete players[botId];
}

var  botPlaceBet = function(bot, phien, clients, players, data, time)
{    
    try {
        const box = getBetChoice(bot);
        const isSmallTicket = totalBotTickets == 0 ? Math.floor(Math.random() * 2) : (totalSmallBotTickets * 100 / totalBotTickets) < 70;
        const maxBet = getMaxBet(isSmallTicket, box, bot);
        const minBet = getMinBet();
		
        let botBetTotal = maxBet > 0 ?  Helpers.getRandomNumberStep5(minBet, maxBet, true) : 0;
        
        // console.log("botPlaceBet bot " + bot.name + " bet " + botBetTotal + " maxBet " + maxBet);

        if(botBetTotal > 0 && time > constants.settlementDuration)
        {
            var betChips = Helpers.getRandomChips(botBetTotal);

            for (let index = 0; index < betChips.length; index++) {
                const chip = betChips[index];
                if (chip > 0) {
                    botBetTotal = appConstants.chipList[index];
    
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
    
                            try 
                            {
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
    
                                    data.red[box] += botBetTotal;
                                    dataBot[box] += botBetTotal;
    
                                    if (!!botsInRoom[bot.id]) {
                                        botsInRoom[bot.id].totalBet += botBetTotal;
                                        botsInRoom[bot.id].choices.push(box);
                                        botsInRoom[bot.id].red = user.red;
                                        botsInRoom[bot.id].remainTickets--;
                                        botsInRoom[bot.id].betOnChoices[box] += botBetTotal;

                                        // console.log("Bot " + bot.name + " bet for " + box + " total " + botsInRoom[bot.id].totalBet + " phien " + phien);
                                        //console.log(botsInRoom[bot.id].betOnChoices);
                                    }
    
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
                    logger.logError(err);
                }
            });
        }
	} catch (err) {
        logger.logError(err);
        console.log(err);
	}
}

var getBetChoice = function(bot){
    let box;
    let betChoice = 0;
    const totalBotBet = dataBot.chan + dataBot.le + dataBot.red3 + dataBot.red4 + dataBot.white3 + dataBot.white4;
    const totalBotBetMain = dataBot.chan + dataBot.le;

    let isMain = totalBotBet == 0 ? true : (totalBotBetMain * 100 / totalBotBet) < betChoiceRatio.MainOpts;
    let isEvent = false;

    if (isMain) {
        betChoice = Math.floor(Math.random() * 2);
    } else {
        let totalBetSubEvent = dataBot.red3 + dataBot.white3;
        isEvent = totalBetSubEvent * 100 / totalBotBet < betChoiceRatio.SubOpts;
        betChoice = isEvent ? (Math.floor(Math.random() * 2) + 2) : (Math.floor(Math.random() * 2) + 4);
    }

    box = betChoices[betChoice];

    if(!!bot)
    {
        if (box == "chan" && bot.choices.indexOf("le") != -1) {
            box = "le";
        }
        else if (box == "le" && bot.choices.indexOf("chan") != -1) {
            box = "chan";
        }
    }

    return box;
}

var getMaxBet = function(isSmallTicket, box, bot){    
    const converted = Helpers.convertBetChoiceName(box);
    var maxBet = Math.min(configs.choices_maxbet[converted], configs.bot_maxbet);
    const minBet = getMinBet();   
    const maxBetOfSmallTicket = Math.min(minBet * 50, maxBet);
    const maxBetOfFour = Math.min( minBet * 10, maxBet );

    const totalBotBet = dataBot.chan + dataBot.le + dataBot.red3 + dataBot.white3 + dataBot.red4 + dataBot.white4;

    maxBet = isSmallTicket ? maxBetOfSmallTicket : maxBet;

    if(!isMainOpt){
        if (isRareOpt(box)) 
        {
            maxBet = maxBetOfFour; //stake for rareOpt should not >10
    
            if (!!bot && (bot.betOnChoices["red4"] + bot.betOnChoices["white4"]) > 0) {
                maxBet = maxBetOfFour - bot.betOnChoices["red4"] - bot.betOnChoices["white4"];
            }	
        }
    
        let totalBetOnSubOpt = (dataBot.red3 + dataBot.white3);
            
        if(isSubOpt(box) && !isSmallTicket && (totalBetOnSubOpt * 100 / totalBotBet > betChoiceRatio.SubOpts))
        {
            maxBet = totalBotBet * betChoiceRatio.SubOpts / 100 - totalBetOnSubOpt; //reset bet amount if reach ratio
        }
    }

    return Math.max(maxBet, minBet);
}

var getMinBet = function(){ 
    var defaultMinBet = 1;   

    return Math.max(defaultMinBet, configs.minbet);
}

var isSubOpt = function(box)
{
    return box == "white3" || box == "red3";
}

var isRareOpt = function(box)
{
    return box == "white4" || box == "red4";
}

var isMainOpt = function(box)
{
    return box == "chan" || box == "le";
}

var resetBotData = function(){

    Object.keys(botsInRoom).forEach(function (id) {
        resetBot(botsInRoom[id]);
	});

	totalBotTickets = 0;
    totalSmallBotTickets = 0;
    
    dataBot = {
        'chan': 0,
        'le': 0,
        'red3': 0,
        'red4': 0,
        'white3': 0,
        'white4': 0,
    };
}

var resetBot = function(bot){
    if(!!bot)
    {
        bot.totalBet = 0;
        bot.remainTickets = Math.floor((Math.random() * 3 + 1) + 1);
        bot.choices = [];
        bot.betOnChoices = {
            'chan': 0,
            'le': 0,
            'red3': 0,
            'red4': 0,
            'white3': 0,
            'white4': 0
        };
    }    
}

var updateBotBalance = function(botId, red)
{
    if (!!botsInRoom[botId]) {    
        botsInRoom[botId].red = red;
    }
}

module.exports = {
    resetBots: resetBots,
    botPlaceBet: botPlaceBet,
    addBots: addBots,
    updateBotBalance : updateBotBalance
};