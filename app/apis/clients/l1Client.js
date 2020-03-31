const apiSettings = require('./../../../config/appConfigs').apiSettings;
const l1Client = require('l1.client.node-js')(apiSettings);
const logger = require('./../../web/logger').getLogger();

l1Client.autoUpdateToken((error, result) => {
    if (error) {
        logger.logError(error);
    } else {
        logger.log(result);
    }
});

const errors = {
    underMaintenanceCode: 5003,
    placeBetFailedCode: 19000
}

const apiClient = {
    handleMantenance: (result) => {
        if (result && result.errorCode == errors.underMaintenanceCode) {

        }
    },
    isError: (response) => {
        return response && response.result && response.result.errorCode != 0;
    },
    getBalance: (getBalanceParams, cb, beforeMessage) => {

        l1Client
            .member
            .balance(getBalanceParams)
            .then(response => {
                logger.logAfterSendToApi('Get Balance', getBalanceParams, response, beforeMessage, apiClient.isError(response));

                let result = response.result;
                result.red = result.balance;

                cb && cb(result);
            })
            .catch(error => {
                logger.logAfterSendToApi('Error Get Balance', getBalanceParams, error, beforeMessage, true);
                logger.logError(error);
                cb && cb({ errorCode: errors.placeBetFailedCode });
            });
    },
    placeBet: (placeBetParams, cb, beforeMessage) => {

        l1Client
            .member
            .placeBet(placeBetParams, { requestTimeout: apiSettings.placeBetTimeout })
            .then(response => {
                logger.logAfterSendToApi('Place Bet', placeBetParams, response, beforeMessage, apiClient.isError(response));

                cb && cb(response.result);
            })
            .catch(error => {
                logger.logAfterSendToApi('Error Place Bet', placeBetParams, error, beforeMessage, true);
                logger.logError(error);
            });
    },
    endGame: (endGameParams, cb, beforeMessage) => {

        l1Client
            .member
            .endGame(endGameParams)
            .then(response => {
                logger.logAfterSendToApi('End Game', endGameParams, response, beforeMessage, apiClient.isError(response));

                cb && cb(response.result);
            })
            .catch(error => {
                logger.logAfterSendToApi('Error End Game', endGameParams, error, beforeMessage, true);
                logger.logError(error);
            });
    },
    notifyLogin: (notifyLoginParams, cb, beforeMessage) => {
        l1Client
            .member
            .notifyLogin(notifyLoginParams)
            .then(result => {
                logger.logAfterSendToApi('Notify Login', notifyLoginParams, result, beforeMessage, apiClient.isError(result));

                cb && cb(result);
            })
            .catch(error => {
                logger.logAfterSendToApi('Error Notify Login', notifyLoginParams, error, beforeMessage, true);
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