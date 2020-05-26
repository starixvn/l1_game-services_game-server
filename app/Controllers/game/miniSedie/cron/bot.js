let UserInfo = require('../../../../Models/UserInfo');
let Chance = require('chance');
const chance = new Chance();

let Helpers = require('../../../../Helpers/Helpers');
let logger = require('../../../../web/logger');
let ConfigHelper = require('../../../../Helpers/ConfigHelper');
const constants = require('./../constants');

const betChoiceRatio = {
    "MainOpts": 0.94, //odd | even
    "SubOpts": 0.05, //white3 | red3
    "RareOpts": 0.01, //red4 | white4
};

let configs = null;
let botList = [];
let totalBotBet = 0;
let dataBot = {
    'chan': 0,
    'le': 0,
    'red3': 0,
    'red4': 0,
    'white3': 0,
    'white4': 0,
}

const reset = async() => {

    console.log(`resetBots`);

    configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.MiniSedie);

    console.log(configs);

    if (!!configs && configs.botenabled) {
        let bots = await UserInfo.find({type: true}, 'id name red').exec();
        const maxBot = Math.floor(bots.length * ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.MiniSedie));

        botList = Helpers.shuffle(bots);
        botList = botList.slice(0, maxBot);

    } else {
        botList = [];
    }
}

const run = function (miniSedieData) {
    try {
        if (!!botList.length && miniSedieData.remainingTime > constants.lockingBetDuration) {
            const maxBotRandom = botList.length / miniSedieData.remainingTime;
            const botsToBet = chance.integer({ min: (maxBotRandom * 2 / 3), max: maxBotRandom });

            let botsToRemove = [];

            for (let i = 0; i < botsToBet; i++) {
                let bot = botList[i];

                if (!!bot) {
                    // botCount++;

                    botPlaceBet(bot, miniSedieData);
                    botsToRemove.push(i);
                    
                }
            }

            botsToRemove.forEach(index => {
                botList.splice(index, 1); 
            });
        }
    } catch (err) {
        console.log(err);
    }
}

const botPlaceBet = function (bot, miniSedieData) {
    const choice = getBetChoice();

    let maxBet = getMaxBet(constants.choices[choice]);
    let minBet = getMinBet();

    maxBet = Math.min(bot.red, maxBet);

    const betAmount = Helpers.getRandomNumberStep5(minBet, maxBet, true);

    if(miniSedieData.remainingTime  > constants.lockingBetDuration)
    {
        UserInfo.findOne({ id: bot.id }, "red", function (err, user) {
            if (err) {
                logger.logError(err);
                console.log(err);

                return;
            }
    
            try {
                if (user && user.red >= betAmount && (dragonRed > 0 || tigerRed > 0 || tieRed > 0)) {
    
                    user.red -= betAmount;
                    user.save();
    
                    miniSedieData.totalBets[choice] += betAmount;

                    totalBotBet += betAmount;
    
                    bot = null;
                }
            } catch (err) {
                logger.logError(err);
            }
        });
    }
}

const getMinBet = function () {
    const minBet = (!!configs && configs.minbet > 0) ? configs.minbet : 1;

    return minBet;
}

const getMaxBet = function (box) {
    const maxBetForChoice = configs.choices_maxbet[box];
    const maxBet = (!!configs && configs.bot_maxbet > 0) ? configs.bot_maxbet : 10;

    return Math.min(maxBetForChoice, maxBet);
}

const getBetChoice = function(){
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

    return box;
}

module.exports = {
    reset: reset,
    run: run
};