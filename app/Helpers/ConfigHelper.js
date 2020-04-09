let fs = require("fs");
let GameConfigs = require('../Models/GameConfig/GameConfigs');
const logger = require('../web/logger');

let txConfigs = null;

var loadConfigs = function (configName) 
{
    var Config = require("../../config/" + configName+  ".json");

    GameConfigs.findOne({ name: configName })
    .then(function(data){

        Config.minBet = data.minbet;
        Config.maxBet = data.maxbet;
        Config.bot = data.botenabled;
        Config.maxBotPercentage = data.maxbot;
        Config.botMaxBet = data.bot_maxbet;
        
        fs.writeFile(
            "./config/" + configName + ".json",
            JSON.stringify(Config),
            function (err) {
                if(err)
                {
                    logger.logError(err);
                }                
             }
          );
          
    })
    .catch(function(error){
        logger.logError(error);
    })
};

var loadTXConfigs = function() 
{
    GameConfigs.findOne({ name: "taixiu" })
    .then(function(data){

        txConfigs = data;
          
    })
    .catch(function(error){
        logger.logError(error);
    })
};

var getTXConfigs = function()
{
    return txConfigs;
}

var updateTXConfig = function(data)
{
    txConfigs = data;
}

module.exports = {
    loadConfigs: loadConfigs,
    loadTXConfigs: loadTXConfigs,
    getTXConfigs : getTXConfigs,
    updateTXConfig: updateTXConfig
};