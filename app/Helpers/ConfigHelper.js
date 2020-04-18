let GameConfigs = require('../Models/GameConfig/GameConfigs');
const logger = require('../web/logger');

let GameTypes = {
    TaiXiu: "taixiu",
    XocXoc: "xocxoc",
    BauCua: "baucua",
    TXTurbo: "txturbo"
}

let configsDict = [];

var loadConfigs = function (configName) {
    GameConfigs.findOne({ name: configName }).exec()
        .then(function (data) {
            try {
                updateConfig(configName, data);

                // console.log("loaded " + configName);

                // console.log(data);
            }
            catch (err) {
                logger.logError(error);
            }
        })
        .catch(function (error) {
            logger.logError(error);
        });
};

var loadAllConfigs = function () {
    Promise
        .all([loadConfigs("taixiu"), loadConfigs("xocxoc"), loadConfigs("baucua"), loadConfigs("txturbo")])
        .catch(function (err) {
            if (err)
                console.log(err);
        });
}

var reloadConfigs = function (configName) {
    GameConfigs.findOne({ name: configName })
        .then(function (data) {
            updateConfig(configName, data);
        })
        .catch(function (error) {
            logger.logError(error);
        })
};

var getConfigs = function (configName) {
    if(!!configsDict && !!configsDict[configName])
    {
        return  configsDict[configName];
    }

    return null;
}

var updateConfig = function (configName, data) {
    if(!!configsDict)
    {
        configsDict[configName] = data;
    }
}

var getMaxBotForCurrentHour = function (configName) {
    var configs = getConfigs(configName);

    if(!!configs)
    {
        var currentHour = new Date().getUTCHours();

        if (!!configs.hour_maxbot && configs.hour_maxbot.length > 0) {
            return configs.hour_maxbot[currentHour];
        }
    
        return configs.maxbot;
    }

    return 0;
}

module.exports = {
    loadConfigs: loadConfigs,
    reloadConfigs: reloadConfigs,
    getConfigs: getConfigs,
    updateConfig: updateConfig,
    loadAllConfigs: loadAllConfigs,
    getMaxBotForCurrentHour: getMaxBotForCurrentHour
};