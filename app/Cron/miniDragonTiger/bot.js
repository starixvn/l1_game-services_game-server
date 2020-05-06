let UserInfo = require('../../Models/UserInfo');
let Chance = require('chance');

let Helpers = require('../../Helpers/Helpers');
let logger = require('./../../web/logger');
let ConfigHelper = require('./../../Helpers/ConfigHelper');
let constants = require('./constants');

let configs = null;
let botList = [];
let totalBotBet = 0;

let betOptRatio = {
    0: 0.495, //dragon
    1: 0.495, //tiger
    2: 0.01 //tie
}

const chance = new Chance();

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
                        // botCount = 0;
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
}

var randomAddBots = function (io) {
    try {
        if (!!botList.length && io.miniDragonTiger.time > constants.lockBet) {
            var maxBotRandom = botList.length / io.miniDragonTiger.time;
            let botsToBet = chance.integer({ min: (maxBotRandom * 2 / 3), max: maxBotRandom });

            for (let i = 0; i < botsToBet; i++) {
                let bot = botList[i];

                if (!!bot) {
                    // botCount++;

                    botPlaceBet(bot, io);
                    botList.splice(i, 1); // Xoá bot đã đặt tránh trùng lặp
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
}

const boxes = ["dragon", "tiger", "tie"];

var botPlaceBet = function (bot, io) {
    try {
        let boxIndex = 0;

        if(io.miniDragonTiger.time > constants.betTime - 5) // not bet on Tie opt at first 5 sec
        {
            boxIndex = chance.integer({ min: 0, max: 1 });
        }else{
            boxIndex = chance.integer({ min: 0, max: 2 });
        }

        // console.log("RH - time " + io.miniDragonTiger.time + " - bot " + bot.name + " boxIndex " + boxIndex);

        var maxBet = getMaxBet(boxes[boxIndex]);
        var minBet = getMinBet();

        maxBet = bot.red > maxBet ? maxBet : bot.red;

        if (totalBotBet > 0 && boxIndex == 2) //tie opt
        {
            if (io.miniDragonTiger.data.tie / totalBotBet > betOptRatio[boxIndex]) {
                boxIndex = chance.integer({ min: 0, max: 1 }); //reset choice to exclude opt which reach limit
            }
            else {
                if (io.miniDragonTiger.data.tie + maxBet / totalBotBet > betOptRatio[boxIndex]) {
                    maxBet = betOptRatio[boxIndex] * totalBotBet - io.miniDragonTiger.data.tie;
                }
            }
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

    UserInfo.findOne({ id: bot.id }, "red", function (err, user) {
        if (err) {
            logger.logError(err);
            console.log(err);
        }

        try {
            if (user && user.red >= totalCuoc && (dragonRed > 0 || tigerRed > 0 || tieRed > 0)) {

                user.red -= totalCuoc;
                user.save();

                totalBotBet += dragonRed + tigerRed + tieRed;
                io.miniDragonTiger.data.dragon += dragonRed;
                io.miniDragonTiger.data.tiger += tigerRed;
                io.miniDragonTiger.data.tie += tieRed;

                bot = null;
                io = null;
            }
        } catch (err) {
            logger.logError(err);
            console.log(err);
        }
    });
}

var getMinBet = function () {
    var minBet = (!!configs && configs.minbet > 0) ? configs.minbet : 1;

    return minBet;
}

var getMaxBet = function (box) {
    var maxBet = (!!configs && configs.bot_maxbet > 0) ? configs.bot_maxbet : 10;
    maxBet = constants.betChoices[box] < maxBet ? constants.betChoices[box] : maxBet;

    return maxBet;
}

module.exports = {
    resetBots: resetBots,
    botPlaceBet: botPlaceBet,
    randomAddBots: randomAddBots
};