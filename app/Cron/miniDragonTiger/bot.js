let MiniDragonTiger_cuoc = require('./../../Models/MiniDragonTiger/MiniDragonTiger_cuoc');
let UserInfo = require('../../Models/UserInfo');
let Chance = require('chance');

let Helpers = require('../../Helpers/Helpers');
let logger = require('./../../web/logger');
let ConfigHelper = require('./../../Helpers/ConfigHelper');

let configs = null;
let botList = [];
let betOptions = {
    0: "Dragon",
    1: "Tiger",
    2: "Draw"
};
const chance = new Chance();

var resetBots = function () {
    configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.MiniDragonTiger);

    // console.log("initBots");

    if(!!configs && configs.botenabled)
    {
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
                    })
                    .catch(promiseErr =>{
                        logger.logError(promiseErr);
                        console.log(promiseErr);
                    });
            }
        });
    }else{
        botList = [];
    }
}

var randomAddBots = function(io){
    var stopBetTime = 5; //TODO get from config

    if (!!botList.length && io.miniDragonTiger.time > stopBetTime) 
    {
        var maxBotRandom = botList.length / io.miniDragonTiger.time;
        let botsToBet = chance.integer({ min: 1, max: maxBotRandom });
        // console.log("DragonTiger maxBotRandom " + maxBotRandom);

        for (let i = 0; i < botsToBet; i++) {
            let bot = botList[i];

            if (!!bot) {
                botPlaceBet(bot, io);
                botList.splice(i, 1); // Xoá bot đã đặt tránh trùng lặp
            }

            bot = null;
        }
    }
}

var botPlaceBet = function (bot, io) {   
    try{
        // console.log("botPlaceBet phien" + io.miniDragonTiger.phien);

        let boxIndex = chance.integer({ min: 0, max: 2 });

        var maxBet = 10;
        if (!!configs && !!configs.bot_maxbet && !!configs.bot_maxbet > 0) {
            maxBet = configs.bot_maxbet;
        }
        maxBet = bot.red > maxBet ? maxBet : bot.red;
    
        var totalCuoc =  Helpers.getRandomNumberStep5(maxBet, true);
        var dragonRed = 0, tigerRed = 0, drawRed = 0;
        
        switch(boxIndex)
        {
            case 0: 
                dragonRed = totalCuoc;
                break;
            case 1: 
                tigerRed = totalCuoc;
                break;
            case 2: 
                drawRed = totalCuoc;
                break;
        }
    
        // console.log("botPlaceBet " + bot.name + " opt " + boxIndex + " totalCuoc " + totalCuoc);
        
    }catch(err)
    {
        console.log(err);
    }

    UserInfo.findOne({ id: bot.id }, "red", function (err, user) {

        // console.log("bot " + bot.name + " red " + bot.red);

        if(err)
        {
            logger.logError(err);
            console.log(err);
        }

        try
        {
            if (user && user.red >= totalCuoc) {
                
                user.red -= totalCuoc;
                user.save();
               
                io.miniDragonTiger.data.dragon += dragonRed;
                io.miniDragonTiger.data.tiger += tigerRed;
                io.miniDragonTiger.data.draw += drawRed;    
                
                // console.log("dragon " + io.miniDragonTiger.data.dragon + " - tiger " + io.miniDragonTiger.data.tiger + " - draw " + io.miniDragonTiger.data.draw);
            
                MiniDragonTiger_cuoc.create({ 
                    uid: bot.id, 
                    name: bot.name, 
                    phien: io.miniDragonTiger.phien, 
                    bet: totalCuoc, 
                    Dragon: dragonRed, 
                    Tiger: tigerRed, 
                    Draw: drawRed, 
                    red: true, 
                    time: new Date() });
            
                bot = null;
                io = null;
            }            
        }catch(err)
        {
            logger.logError(err);
            console.log(err);
        }
    });	
}

module.exports = {
    resetBots: resetBots,
    botPlaceBet: botPlaceBet,
    randomAddBots : randomAddBots
};