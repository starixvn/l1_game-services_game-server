let fs = require("fs");
let GameConfigs = require('../../Models/GameConfig/GameConfigs');
let Config = require("../../../config/taixiu.json");

var reloadConfigs = function () 
{
    GameConfigs.findOne({ name: "taixiu" })
    .then(function(data){
        Config.minBet = data.minbet;
        Config.maxBet = data.maxbet;

        fs.writeFile(
            "./config/taixiu.json",
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
    reloadConfigs: reloadConfigs
};