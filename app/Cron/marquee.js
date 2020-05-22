const logger = require('./../web/logger');
let marqueeMessageConfig = require('./../../config/appConfigs').marqueeMessageConfig;

module.exports = function (io) {
    const marqueeMessages = [
        "Chào mừng bạn đến SABA.CLUB, cổng game thuần Việt với các game dân gian quen thuộc, thú vị.",
        "SABA.CLUB đang cố gắng hoàn thiện để bổ sung thêm những game mới trong thời gian sớm nhất.",
        "SABA.CLUB chúc quý khách hàng có những giây phút chơi game vui vẻ!"
    ];

    setInterval(() => {
        for (let index = 0; index < marqueeMessages.length; index++) {
            setTimeout(() => {
                try {
                    io.sendInHome({ marqueeMsg: marqueeMessages[index] });
                } catch (err) {
                    logger.logError(err);
                };
            }, index * marqueeMessageConfig.delayTimeInMinute * 60 * 1000);
        };
    }, marqueeMessageConfig.intervalTimeInMinute * 60 * 1000);
}