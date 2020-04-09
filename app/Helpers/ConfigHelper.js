let fs = require("fs");
let GameConfigs = require('../Models/GameConfig/GameConfigs');
const logger = require('../web/logger');

let configs = {
    taixiu: {},
    xocxoc: {},
    baucua: {}
};

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

var reloadConfigs = function(configName) 
{
    GameConfigs.findOne({ name: configName })
    .then(function(data){

        configs.taixiu = data;
          
    })
    .catch(function(error){
        logger.logError(error);
    })
};

var getConfigs = function(configName)
{
    switch (configName) {
        case "taixiu":
            return configs.taixiu;
        case "xocxoc":
            return configs.xocxoc;
        case "baucua":
            return configs.baucua;        
    }  
}

var updateConfig = function(configName, data)
{
    switch (configName) {
        case "taixiu":
            configs.taixiu = data;
            break;
        case "xocxoc":
            configs.xocxoc = data;
            break;
        case "baucua":
            configs.baucua = data;
            break;
    }
}

module.exports = {
    loadConfigs: loadConfigs,
    reloadConfigs: reloadConfigs,
    getConfigs : getConfigs,
    updateConfig: updateConfig
};