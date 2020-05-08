let KenoProMax_tmpcuoc = require('./../../Models/KenoProMax/KenoProMax_tmpcuoc');
let UserInfo = require('./../../Models/UserInfo');
let Chance = require('chance');
const chance = new Chance();

let Helpers = require('./../../Helpers/Helpers');
let logger = require('./../../web/logger');
let ConfigHelper = require('./../../Helpers/ConfigHelper');
let constants = require('./constants');

const modRoundToChangedTopBot = 6;
const maxSmallTicketScale = 50;
const smallTicketRatio = 80;
const maxRareChoiceScale = 10;

const uniqueBetChoices = ['big', 'small', 'even' , 'odd'];
const mainBetChoices = ['big', 'small'];
const rareBetChoices = ['gold', 'earth'];// highest payout choices
const betChoiceRatio = {
    'big': 44,
    'small': 44,
    'even': 4,
    'odd': 4,
    'earth': 1.5,
    'fire': 1,
    'gold': 0.5,
    'water': 0.5,
    'wood': 0.5,
};

const choices = ['big', 'small', 'even', 'odd', 'earth', 'fire', 'gold', 'water', 'wood'];
const chipList = [500, 200, 100, 50, 10, 5, 1];

let configs = null;
let botList = [];
let botsInRoom = [];
let maxNumberOfBots = 0;
let currentBotRatio = 0;
let changedTopBots = false;

let amountOnChoices = {
    'big': 0,
    'small': 0,
    'even': 0,
    'odd': 0,
    'earth': 0,
    'fire': 0,
    'gold': 0,
    'water': 0,
    'wood': 0,
};

let totalBotTickets = 0;
let totalSmallBotTickets = 0;

var resetBots = function()
{
    configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.KenoProMax);
    try {
        if (configs.botenabled) {

            var botRatio = ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.KenoProMax);
            if(currentBotRatio != botRatio || botList.length == 0)
            {
                currentBotRatio = botRatio;    

                // lấy danh sách tài khoản bot
                UserInfo.find({ type: true }, 'id name red avatarId type', (err, blist) => {
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

        // writeLogAllChoiceAmount();

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

var addBots = function(time, round, clients, players, data){
    const addBotValue = 3;
    const removeBotValue = 4;
    const minBots = 20;

    try{
        var bots = {
            in: [],
            out: []
        }    
        
        if (!!configs && configs.botenabled && time > constants.lockingBetDuration) {
            let activeBots = Object.keys(botsInRoom);
            let random = chance.integer({min: 0, max: 5});
    
            if ((activeBots.length <= minBots || random == addBotValue)
                && activeBots.length <= maxNumberOfBots) { //bot in		
                    bots.in = botIn(time);
            }
    
            if (activeBots.length > minBots && random == removeBotValue) { //bot out
                bots.out = botOut(activeBots, time, round);
            }
    
            var maxTickets = Math.floor(activeBots.length / time) + 5;
            let userCuoc = Math.floor((Math.random() * maxTickets) + 5);
    
            let botsToBet = Object.values(botsInRoom).filter(function (t) { return t.totalBet < configs.bot_maxbet && t.remainTickets > 0});
            botsToBet = Helpers.shuffle(botsToBet);

            // console.log( "activeBots " + activeBots.length +" / botsToBet " + botsToBet.length + " round " + round);

            for (let i = 0; i < userCuoc; i++) {
                let bot = botsToBet[i];
                
                if (!!bot) {                    
                    botPlaceBet(bot, round, clients, players, data);
                }
            }
        }
    
        //TODO return red[box] data, bot red
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
        let bot = botList[i];

        if (!!bot) {          
            botsInRoom[bot.id] = bot;
            resetBot(botsInRoom[bot.id]);

            botList.splice(i, 1);

            botsIn.push(bot);
        }

        bot = null;
    }

    return botsIn;
}

var  botOut = function(activeBots, time, round){
    let botsOut = [];
    var maxBotRemoveRandom = activeBots.length / time;

    if (maxBotRemoveRandom < 4) {
        maxBotRemoveRandom = 4;
    }

    let length = (Math.random() * maxBotRemoveRandom) >> 0;

    for (let i = 0; i < length; i++) {
        let index = (Math.random() * activeBots.length >> 0);

        if (!changedTopBots && round % modRoundToChangedTopBot == 0) {
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

var  botPlaceBet = function(bot, round, clients, players, data){
    
    try {
        let box = getBetChoice(bot);
        let isSmallTicket = totalBotTickets == 0 ? Math.floor(Math.random() * 2) : (totalSmallBotTickets * 100 / totalBotTickets) < smallTicketRatio;
        var maxBet = getMaxBet(isSmallTicket, box);
        var minBet = getMinBet();
		
        let betAmount = getBetAmount(minBet, maxBet);

        KenoProMax_tmpcuoc.findOne({ uid: bot.id, phien: round, red: true }, function (err, currentBet) {
            if (err) {
                logger.logError(err);                    
            }

            try {
                var currentTotalBet = 0;

                if(!!currentBet)
                {
                    choices.forEach(choice => {
                        currentTotalBet += currentBet[choice];
                    });
                }

                if (!currentBet || (currentTotalBet + betAmount) <= maxBet) {
                    UserInfo.findOne({ id: bot.id }, "red", function (err, user) {
                        if (err) {
                            logger.logError(err);
                        }

                        try 
                        {
                            if (betAmount > 0 && user && user.red > betAmount) {
                                user.red -= betAmount;
                                user.save();

                                if (currentBet) {
                                    currentBet[box] += betAmount;
                                    currentBet.save();
                                } else {

                                    var update = {};
                                    update[box] = betAmount;

                                    let create = { uid: bot.id, name: bot.name, phien: round, red: true, time: new Date() };

                                    KenoProMax_tmpcuoc.updateOne(
                                        { uid: bot.id, phien: round, red: true },
                                        { $inc: update, $setOnInsert: create },
                                        { upsert: true, setDefaultsOnInsert: true },
                                        function (err, doc) {
                                            if (err) {
                                                logger.logError(err);
                                            }
                                        });
                                }

                                data[box] += betAmount;
                                amountOnChoices[box] += betAmount;

                                if (!!botsInRoom[bot.id]) {
                                    botsInRoom[bot.id].totalBet += betAmount;
                                    botsInRoom[bot.id].choices.push(box);
                                    botsInRoom[bot.id].red = user.red;
                                    botsInRoom[bot.id].remainTickets--;
                                    botsInRoom[bot.id].betOnChoices[box] += betAmount;

                                    // console.log("Bot " + bot.name + " bet for " + box + " total " + botsInRoom[bot.id].totalBet + " round " + round);
                                    // console.log(botsInRoom[bot.id].betOnChoices);
                                }

                                if (players[bot.id]) {
                                    players[bot.id].red = user.red;
                                }    
                               
                                totalSmallBotTickets += (isSmallTicket) ? 1 : 0;
                                totalBotTickets += 1;

                                Object.values(clients).forEach(function (client) {
                                    client.red({ kenoProMax: { chip: { playerId: bot.id, box: box, cuoc: betAmount, red: user.red } } });
                                });
                            }

                        } catch (err) {
                            logger.logError(err);
                            console.log(err);
                        }

                    });
                }
            }
            catch (err) {
                logger.logError(err);
                console.log(err);
            }
        });        
	} catch (err) {
        logger.logError(err);
        console.log(err);
	}
}

var getBetChoice = function(bot){
    let box;
    let betChoice = 0;

    let totalBotBet = getTotalBetAmount();
    let totalBotBetMain = getTotalOnMainBetChoices();
    let mainChoiceRatio = getMainChoiceRatio();

    let isMain = totalBotBet == 0 ? chance.integer({min: 0, max: 1}) : (totalBotBetMain * 100 / totalBotBet) < mainChoiceRatio;

    if (isMain) {
        betChoice = chance.integer({min: 0, max: (mainBetChoices.length - 1)});

        box = mainBetChoices[betChoice];
    }else{
        var subChoices = choices.filter(choice => amountOnChoices[choice] / totalBotBetMain < betChoiceRatio[choice]);
        subChoices = Helpers.shuffle(subChoices);

        if(subChoices.length == 0)
        {
            subChoices = mainBetChoices;
        }

        betChoice = chance.integer({min: 0, max: (subChoices.length - 1)}); // split from main opts
        box = subChoices[betChoice];
    }

    if(!!bot && bot.choices.length > 0 && uniqueBetChoices.includes(box))
    {
        var previousUniqueBox = bot.choices.filter(choice => uniqueBetChoices.includes(choice));    
        
        if(!!previousUniqueBox && previousUniqueBox.length > 0)
        {
            box = previousUniqueBox[0];
        }
    }

    return box;
}

var getTotalBetAmount = function(){
    var total = 0;

    choices.forEach(choice => {
        total += amountOnChoices[choice];
    });

    return total;
}

var getTotalOnMainBetChoices = function(){
    var total = 0;

    mainBetChoices.forEach(choice => {
        total += amountOnChoices[choice];
    });

    return total;
}

var getMainChoiceRatio = function(){
    var total = 0;

    mainBetChoices.forEach(choice => {
        total += betChoiceRatio[choice];
    });

    return total;
}


var getMaxBet = function(isSmallTicket, box){    
    let minBet = getMinBet();
    let maxBetOfSmallTicket = minBet * maxSmallTicketScale > maxBet ? maxBet : minBet * maxSmallTicketScale;

    var remainingBetAmountOnChoice = getTotalBetAmount() * betChoiceRatio[box] / 100 - amountOnChoices[box];
    var maxBet = constants.maxBetChoices[box] > remainingBetAmountOnChoice ? remainingBetAmountOnChoice : constants.maxBetChoices[box];

    if (!!configs && configs.bot_maxbet > 0 && maxBet > configs.bot_maxbet) {        
        maxBet = configs.bot_maxbet;
    }

    maxBet = isSmallTicket ? maxBetOfSmallTicket : maxBet;   

    if(rareBetChoices.includes(box))
    {
        maxBet = minBet * maxRareChoiceScale;
    }

    return (maxBet >= minBet) ? maxBet : minBet;
}

var getMinBet = function(){
    var minBet = 1;

    if (!!configs && configs.minbet > 0) {
        
        minBet = configs.minbet;
    }

    return minBet;
}

var resetBotData = function(){

    Object.keys(botsInRoom).forEach(function (id) {
        resetBot(botsInRoom[id]);
	});

	totalBotTickets = 0;
    totalSmallBotTickets = 0;
    
    amountOnChoices = {
        'big': 0,
        'small': 0,
        'even': 0,
        'odd': 0,
        'earth': 0,
        'fire': 0,
        'gold': 0,
        'water': 0,
        'wood': 0,
    };
}

var resetBot = function(bot){
    if(!!bot)
    {
        bot.totalBet = 0;
        bot.remainTickets = chance.integer({min: 1, max: 3});
        bot.choices = [];
        bot.betOnChoices = {
            'big': 0,
            'small': 0,
            'even': 0,
            'odd': 0,
            'earth': 0,
            'fire': 0,
            'gold': 0,
            'water': 0,
            'wood': 0,
        };
    }    
}

var updateBotBalance = function(botId, red)
{
    if (!!botsInRoom[botId]) {    
        botsInRoom[botId].red = red;
    }
}

var getBetAmount = function(minBet, maxBet){
    let betAmount = Helpers.getRandomNumberStep5(minBet, maxBet, true);
    var betChips = Helpers.getRandomChips(betAmount);

    for (let index = 0; index < betChips.length; index++) {
        const chip = betChips[index];
        if (chip > 0) {
            betAmount = chipList[index];

            break;
        }
    }

    return betAmount;
}

var writeLogAllChoiceAmount = function(){
    console.log("---------------------");
    console.log("Total bot bet amount: " + getTotalBetAmount());
    choices.forEach(choice => {
        console.log("Total bet on " + choice + ": " + amountOnChoices[choice] + ". Ratio: " + amountOnChoices[choice] * 100 / getTotalBetAmount());
    });
}

module.exports = {
    resetBots: resetBots,
    botPlaceBet: botPlaceBet,
    addBots: addBots,
    updateBotBalance : updateBotBalance
};