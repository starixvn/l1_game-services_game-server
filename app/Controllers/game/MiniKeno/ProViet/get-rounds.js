const Logger = require("./../../../../web/logger");
const moment = require('moment');
const KenoProVietPhien = require("./models/KenoProViet_phien");

function calculateNextRoundTime(time) {
    var endOfDayTime = moment.utc(time).hours(14).minutes(55).seconds(0).milliseconds(0);
    var startOfDayTime = moment.utc(time).hours(23).minutes(0).seconds(0).milliseconds(0);

    var nextRoundTime = moment.utc(time).add(10, "minutes");

    if(nextRoundTime.isAfter(endOfDayTime) && nextRoundTime.isBefore(startOfDayTime)) {
        nextRoundTime.hours(23).minutes(0).seconds(0).milliseconds(0);
    }

    return nextRoundTime;
}

module.exports = async () => {
    try {
        const latestRound = await KenoProVietPhien.findOne({}, {
            sort: { id: -1 },
            lean: true
        }).exec();

        const rounds = [];
        let id = latestRound.id;
        let time =  moment.utc(latestRound.time);
        
        if(latestRound.result) {
            time = calculateNextRoundTime(time);
            id++;
        }
    
        for(let i = 0; i <30; i++){
            rounds.push({id, time});
            time = calculateNextRoundTime(time);
            id++;
        }
    
        return rounds;
    }
    catch(exception){
        Logger.logError(exception);
    }
}
  