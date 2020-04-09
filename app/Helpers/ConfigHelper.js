let GameConfigs = require('../Models/GameConfig/GameConfigs');
const logger = require('../web/logger');

let configs = {
    taixiu: {},
    xocxoc: {},
    baucua: {}
};

var loadConfigs = function (configName) 
{
    GameConfigs.findOne({ name: configName }).exec()
    .then(function(data){
        try{
            updateConfig(configName, data);    
        
            console.log("loaded " + configName);

            console.log(data);
        }   
        catch(err)
        {
            logger.logError(error);
        }             
    })
    .catch(function(error){
        logger.logError(error);
    });
};

var loadAllConfigs = function(){
    Promise
    .all([loadConfigs("taixiu"), loadConfigs("xocxoc"), loadConfigs("baucua")])    
    .catch(function (err){
        if(err)
        console.log(err);
    });
}

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

var getMaxBotForCurrentHour = function(configName)
{
    var configs = getConfigs(configName);
    
    var currentHour = new Date().getUTCHours();
    console.log("get config for hour " + currentHour);

    if(!!configs.hour_maxbot && configs.hour_maxbot.length > 0)
    {
        return configs.hour_maxbot[currentHour];
    }

    return configs.maxbot;
}

module.exports = {
    loadConfigs: loadConfigs,
    reloadConfigs: reloadConfigs,
    getConfigs : getConfigs,
    updateConfig: updateConfig,
    loadAllConfigs: loadAllConfigs,
    getMaxBotForCurrentHour: getMaxBotForCurrentHour
};