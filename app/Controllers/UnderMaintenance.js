const logger = require('./../web/logger').getLogger();

let redT = null;

function assignRedT(globalRedT) {
    redT = globalRedT;
};

function handleUnderMaintenance(umInfo) {
    try {
        if (umInfo && redT) {
            if (redT.users && umInfo.isUM) {
                Object.values(redT.users).forEach(function (users) {
                    users.forEach(function (cacheClient) {
                        cacheClient.red({ kickedOut: { message: 'Game đang được bảo trì, vui lòng quay lại sau 10 phút.', isUM: true } });
                        cacheClient.close();
                    });
                });
            }

            redT.umInfo = umInfo;
        }
    }
    catch (ex) {
        logger.logError(ex);
    }
}

module.exports = {
    assignRedT,
    handleUnderMaintenance
}