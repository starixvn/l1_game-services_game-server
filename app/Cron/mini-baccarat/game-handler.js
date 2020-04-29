const constants = require("./constant");
const BaccaratGame = require("./baccarat-game");
const ConfigHelper = require('./../../Helpers/ConfigHelper');

const onBetTime = (io) => {
    if (io.miniBaccarat.time < constants.betTime) {
        
    }
}

module.exports = (io) => {
    const { betTime, waitTime, extraTime } = constants;
    const groundTime = betTime + waitTime + extraTime + 1;
    const gameConfig = ConfigHelper.getConfigs(ConfigHelper.GameTypes.MiniBaccarat);
    io.miniBaccarat.time = groundTime;


};