let UserInfo = require('../../Models/UserInfo');
let Chance = require('chance');

let Helpers = require('../../Helpers/Helpers');
let logger = require('./../../web/logger');
let ConfigHelper = require('./../../Helpers/ConfigHelper');
let constants = require('./constants');

let configs = null;
let botList = [];
let totalBotBet = 0;

const resetAmountOnChoice =  {
    dragon : 0,
    tiger: 0,
    tie: 0
};

let betAmountOnChoice = {
    dragon : 0,
    tiger: 0,
    tie: 0
}

const betChoiceRatio = {
    MainOpts: 99,
    RareOpts: 1
}

const chance = new Chance();
const betChoices = ["dragon", "tiger", "tie"];

var resetBots = function () {
    configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.MiniDragonTiger);

    if (!!configs && configs.botenabled) {
        UserInfo.find({
            type: true
        }, 'id name red', function (err, blist) {
            if (err) {
                logger.logError(err);
            }

            if (blist.length) {
                Promise.all(blist.map(function (buser) {
                    buser = buser._doc;
                    delete buser._id;

                    return buser;
                }))
                    .then(result => {
                        let maxBot = Math.floor(result.length * ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.MiniDragonTiger));

                        botList = Helpers.shuffle(result);
                        botList = botList.slice(0, maxBot);
                        totalBotBet = 0;
                    })
                    .catch(promiseErr => {
                        logger.logError(promiseErr);
                        console.log(promiseErr);
                    });
            }
        });
    } else {
        botList = [];
    }

    betAmountOnChoice = { ...resetAmountOnChoice };
}

const randomAddBots =  (io) => {
    try {
        if (!!botList.length && io.miniDragonTiger.time > constants.lockBet) {
            var maxBotRandom = botList.length / io.miniDragonTiger.time;
            let botsToBet = chance.integer({ min: (maxBotRandom * 2 / 3), max: maxBotRandom });
            let botsToRemove = [];

            for (let i = 0; i < botsToBet; i++) {
                let bot = botList[i];
                botsToRemove.push(i);

                if (!!bot) {
                    botPlaceBet(bot, io);
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

const botPlaceBet = (bot, io) => {
    try {
        let boxIndex = 0;
        let randomTimeForTieOpt = chance.integer({ min: 5, max: 10 });
        const amountOnMainOpts = getBetAmountOnMainOpt();
        let isMain = totalBotBet == 0 ? true : (amountOnMainOpts * 100 / totalBotBet) < betChoiceRatio.MainOpts;

        if(isMain || io.miniDragonTiger.time > constants.betTime - randomTimeForTieOpt) // not bet on Tie opt at first random seconds
        {
            boxIndex = chance.integer({ min: 0, max: 1 });
        }else{
            boxIndex = chance.integer({ min: 0, max: 2 });
        }

        // console.log("RH - time " + io.miniDragonTiger.time + " - bot " + bot.name + " boxIndex " + boxIndex);

        let maxBet = getMaxBet(betChoices[boxIndex]);
        const minBet = getMinBet();

        maxBet = Math.min(bot.red, maxBet);

        if (boxIndex == 2 && (getBetAmountOnRareOpt() + maxBet) * 100 / totalBotBet > betChoiceRatio.RareOpts) //tie opt
        {
            maxBet = (betChoiceRatio.RareOpts * totalBotBet - getBetAmountOnRareOpt()) / 100;
        }

        var totalCuoc = Helpers.getRandomNumberStep5(minBet, maxBet, true);
        var dragonRed = 0, tigerRed = 0, tieRed = 0;

        switch (boxIndex) {
            case 0:
                dragonRed = totalCuoc;
                break;
            case 1:
                tigerRed = totalCuoc;
                break;
            case 2:
                tieRed = totalCuoc;
                break;
        }
    } catch (err) {
        console.log(err);
    }

    if(io.miniDragonTiger.time > constants.lockBet)
    {
        UserInfo.findOne({ id: bot.id }, "red", function (err, user) {
            if (err) {
                logger.logError(err);
                console.log(err);

                return;
            }
    
            try {
                if (user && user.red >= totalCuoc && (dragonRed > 0 || tigerRed > 0 || tieRed > 0)) {
    
                    user.red -= totalCuoc;
                    user.save();
    
                    totalBotBet += dragonRed + tigerRed + tieRed;
                    io.miniDragonTiger.data.dragon += dragonRed;
                    io.miniDragonTiger.data.tiger += tigerRed;
                    io.miniDragonTiger.data.tie += tieRed;

                    betAmountOnChoice.dragon += dragonRed;
                    betAmountOnChoice.tiger += tigerRed;
                    betAmountOnChoice.tie += tieRed;

                    // console.log(`--- bot ${bot.name} totalCuoc ${totalCuoc}`);
                    // console.log(betAmountOnChoice);

                    bot = null;
                    io = null;
                }
            } catch (err) {
                logger.logError(err);
                console.log(err);
            }
        });
    }
}

const getMinBet = () => {
    var minBet = (!!configs && configs.minbet > 0) ? configs.minbet : 1;

    return minBet;
}

const getMaxBet = (choice) => {
    const maxBetForChoice = configs.choices_maxbet[choice];
    const maxBet = (!!configs && configs.bot_maxbet > 0) ? configs.bot_maxbet : 10;    

    return Math.min(maxBet, maxBetForChoice);
}

const getBetAmountOnMainOpt = () => {
    return betAmountOnChoice.dragon + betAmountOnChoice.tiger;
}

const getBetAmountOnRareOpt = () => {
    return betAmountOnChoice.tie;
}

module.exports = {
    resetBots: resetBots,
    botPlaceBet: botPlaceBet,
    randomAddBots: randomAddBots
};