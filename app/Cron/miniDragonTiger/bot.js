let MiniDragonTiger_cuoc = require('./../../Models/MiniDragonTiger/MiniDragonTiger_cuoc');
let UserInfo = require('../../Models/UserInfo');
let Chance = require('chance');

let Helpers = require('../../Helpers/Helpers');
let logger = require('./../../web/logger');
let ConfigHelper = require('./../../Helpers/ConfigHelper');
let constants = require('./constants');

let configs = null;
let botList = [];
let totalBotBet = 0;
let maxBetOfTie = 50;

let betOptRatio = {
    0: 0.48, //dragon
    1: 0.48, //tiger
    2: 0.04 //tie
}

const chance = new Chance();

var resetBots = function () {
    configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.MiniDragonTiger);

    // console.log("initBots");
    // console.log(configs);

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
                        totalBots = result;

                        let maxBot = Math.floor(result.length * ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.MiniDragonTiger));
                        // console.log("DragonTiger max bot " + maxBot);

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
}

var randomAddBots = function (io) {  
    try
    {
        if (!!botList.length && io.miniDragonTiger.time > constants.lockBet) 
        {
            var maxBotRandom = botList.length / io.miniDragonTiger.time;
            let botsToBet = chance.integer({ min: 1, max: maxBotRandom });
    
            // console.log("DragonTiger randomAddBots " + botsToBet);
    
            for (let i = 0; i < botsToBet; i++) {
                let bot = botList[i];
    
                if (!!bot) {
                    botPlaceBet(bot, io);
                    botList.splice(i, 1); // Xoá bot đã đặt tránh trùng lặp
                }    
            }
        }
    }catch(err)
    {
        console.log(err);
    }    
}

var botPlaceBet = function (bot, io) {
    try {
        // console.log("botPlaceBet phien" + io.miniDragonTiger.phien);

        var maxBet = 10;
        if (!!configs && !!configs.bot_maxbet && !!configs.bot_maxbet > 0) {
            maxBet = configs.bot_maxbet;
        }
        maxBet = bot.red > maxBet ? maxBet : bot.red;

        let boxIndex = chance.integer({ min: 0, max: 2 });

        if(totalBotBet > 0 && boxIndex == 2) //tie opt
        {
            if(io.miniDragonTiger.data.tie / totalBotBet > betOptRatio[boxIndex])
            {
                boxIndex = chance.integer({ min: 0, max: 1 }); //reset choice to exclude opt which reach limit
            }else 
            {
                if( io.miniDragonTiger.data.tie + maxBetOfTie / totalBotBet > betOptRatio[boxIndex])
                {
                    maxBet = betOptRatio[boxIndex] * totalBotBet - io.miniDragonTiger.data.tie;
                }else{
                    maxBet = maxBetOfTie;
                }        
                
                // console.log("botPlaceBet tie maxBet " + maxBet );
            }
        }

        var totalCuoc = Helpers.getRandomNumberStep5(maxBet, true);
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

        // console.log("botPlaceBet " + bot.name + " opt " + boxIndex + " totalCuoc " + totalCuoc);

    } catch (err) {
        console.log(err);
    }

    UserInfo.findOne({ id: bot.id }, "red", function (err, user) {

        // console.log("bot " + bot.name + " dragonRed " + dragonRed + " tigerRed " + tigerRed + " tieRed " + tieRed);
        

        if (err) {
            logger.logError(err);
            console.log(err);
        }

        try {
            if (user && user.red >= totalCuoc && (dragonRed > 0 || tigerRed > 0 || tieRed > 0)) {

                user.red -= totalCuoc;
                user.save();

                totalBotBet += dragonRed + tigerRed + tieRed;
                // console.log("Total bot bet " + totalBotBet);

                io.miniDragonTiger.data.dragon += dragonRed;
                io.miniDragonTiger.data.tiger += tigerRed;
                io.miniDragonTiger.data.tie += tieRed;

                MiniDragonTiger_cuoc.create({
                    uid: bot.id,
                    name: bot.name,
                    phien: io.miniDragonTiger.phien,
                    bet: totalCuoc,
                    dragon: dragonRed,
                    tiger: tigerRed,
                    tie: tieRed,
                    red: true,
                    time: new Date()
                });

                bot = null;
                io = null;
            }
        } catch (err) {
            logger.logError(err);
            console.log(err);
        }
    });
}

module.exports = {
    resetBots: resetBots,
    botPlaceBet: botPlaceBet,
    randomAddBots: randomAddBots
};