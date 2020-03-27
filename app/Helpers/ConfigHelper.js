let fs = require("fs");
let GameConfigs = require('../Models/GameConfig/GameConfigs');

var loadConfigs = function (configName) 
{
    var Config = require("../../config/" + configName+  ".json");

    GameConfigs.findOne({ name: configName })
    .then(function(data){
        Config.minBet = data.minbet;
        Config.maxBet = data.maxbet;
        Config.bot = data.botenabled;
        Config.maxBotPercentage = data.maxbot;

        fs.writeFile(
            "./config/" + configName + ".json",
            JSON.stringify(Config),
            function (err) {
                if(err)
                {
                    console.log("writeTxConfigs error " + err);
                }                
             }
          );
          
    })
    .catch(function(error){
        console.log("getTXConfigs error " + error);
    })
};

module.exports = {
    loadConfigs: loadConfigs
};