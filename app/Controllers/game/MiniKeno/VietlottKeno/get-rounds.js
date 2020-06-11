const Logger = require("./../../../../web/logger");
//const KenoVietlottPhien = require("./models/KenoProViet_phien");

module.exports = async () => {
/*     try {
        const latestRound = await KenoVietlottPhien.findOne({}, {
            sort: { id: -1 },
            lean: true
        }).exec();

        const rounds = [];
        let id = latestRound.id;
        let time =  latestRound.time;
        
        if(latestRound.result) {
            time.setMinutes(time.getMinutes() + 10);
            id++;
        }
    
        for(let i = 0; i <30; i++){
            rounds.push({id, time});
            time.setMinutes(time.getMinutes() + 10);
            id++;
        }
    
        return rounds;
    }
    catch(exception){
        Logger.logError(exception);
    } */
}
  