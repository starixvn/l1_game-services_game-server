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
    placeBetFailed: { errorCode: 'SB1900', errorMessage: 'Đặt cược không thành công.' },
    endGameFailed: { errorCode: 'SB1901', errorMessage: 'Phiên chơi bị lỗi. Vui lòng liên hệ bộ phận CSKH để được hỗ trợ.' },
    getBalanceFailed: { errorCode: 'SB1902', errorMessage: 'Không thể cập nhật số tiền trong tài khoản.' },
    enterPortalFailed: { errorCode: `SB1903`, errorMessage: 'Đã xảy ra lỗi. Vui lòng liên hệ bộ phận CSKH để đươc hỗ trợ.' },
    accountClosed: { errorCode: '2002', errorMessage: 'Tài khoản của bạn đã bị khoá.' }
}

const apiClient = {
    isError: (response) => {
        return response && response.result && response.result.errorCode != 0;
    },
    getBalance: (getBalanceParams, cb, beforeMessage) => {

        l1Client
            .member
            .balance(getBalanceParams)
            .then(response => {
                if (apiClient.isError(response)) {
                    logger.logAfterSendToApi('Get Balance', getBalanceParams, response, beforeMessage, apiClient.isError(response));
                }

                let result = response.result;
                result.red = result.balance;

                cb && cb(result);
            })
            .catch(error => {
                logger.logAfterSendToApi('Error Get Balance', getBalanceParams, error, beforeMessage, true);
                logger.logError(error);
                cb && cb(errors.getBalanceFailed);
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
                cb && cb(errors.placeBetFailed);
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
                cb && cb(errors.endGameFailed);
            });
    },
    notifyLogin: (notifyLoginParams, cb, beforeMessage) => {
        l1Client
            .member
            .notifyLogin(notifyLoginParams)
            .then(response => {
                logger.logAfterSendToApi('Notify Login', notifyLoginParams, response, beforeMessage, apiClient.isError(response));

                cb && cb(response.result);
            })
            .catch(error => {
                logger.logAfterSendToApi('Error Notify Login', notifyLoginParams, error, beforeMessage, true);
                logger.logError(error);
                cb && cb(errors.enterPortalFailed);
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