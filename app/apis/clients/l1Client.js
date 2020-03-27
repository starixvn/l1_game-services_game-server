const apiSettings = require('./../../../config/appConfigs').apiSettings;
const l1Client = require('l1.client.node-js')(apiSettings);
const logger = require('./../../web/logger').getLogger();

l1Client.autoUpdateToken();

const errors = {
    underMaintenanceCode: 5003
}

const apiClient = {
    handleMantenance: (result) => {
        if (result && result.errorCode == errors.underMaintenanceCode) {

        }
    },
    getBalance: (getBalanceParams, cb, beforeMessage) => {

        l1Client
            .member
            .balance(getBalanceParams)
            .then(response => {
                logger.logAfterSendToApi('Get Balance', getBalanceParams, response, beforeMessage);

                let result = response.result;
                result.red = result.balance;

                cb && cb(result);
            })
            .catch(error => {
                logger.logError(error);
            });
    },
    placeBet: (placeBetParams, cb, beforeMessage) => {

        l1Client
            .member
            .placeBet(placeBetParams)
            .then(response => {
                logger.logAfterSendToApi('Place Bet', placeBetParams, response, beforeMessage);

                cb && cb(response.result);
            })
            .catch(error => {
                logger.logError(error);
            });
    },
    endGame: (endGameParams, cb, beforeMessage) => {

        l1Client
            .member
            .endGame(endGameParams)
            .then(response => {
                logger.logAfterSendToApi('End Game', endGameParams, response, beforeMessage);

                cb && cb(response.result);
            })
            .catch(error => {
                logger.logError(error);
            });
    },
    notifyLogin: (notifyLoginParams, cb, beforeMessage) => {
        l1Client
            .member
            .notifyLogin(notifyLoginParams)
            .then(result => {
                logger.logAfterSendToApi('Notify Login', notifyLoginParams, result, beforeMessage);

                cb && cb(result);
            })
            .catch(error => {
                logger.logError(error);
            });;
    },
    verifyToken: async (verifyTokenParams) => {
        try {
            const result = await l1Client.auth.verifyToken(verifyTokenParams);

            return result;
        }
        catch (ex) {
            logger.logError(ex);
            return null;
        }
    }
}

module.exports = apiClient;