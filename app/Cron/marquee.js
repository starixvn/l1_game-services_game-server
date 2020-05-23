const logger = require('./../web/logger');
const Notifications = require('./../Models/Notification');

let marqueeMessageConfig = require('./../../config/appConfigs').marqueeMessageConfig;

module.exports = (io) =>  {
    setInterval(() => {
        Notifications
        .find({"displayKind" : 1}, "message")
        .then(function(notifications){
            for (let index = 0; index < notifications.length; index++) {
                setTimeout(() => {
                    try {
                        console.log(`send message ${notifications[index].message}`);
                        io.sendInHome({ marqueeMsg: notifications[index].message });
                    } catch (err) {
                        logger.logError(err);
                        console.log(err);
                    };
                }, index * marqueeMessageConfig.delayTimeInMinute * 60 * 1000);
            };
        })
        .catch(function(err){
            logger.logError(err);
            console.log(err);
        });
        
    }, marqueeMessageConfig.intervalTimeInMinute * 60 * 1000);
}