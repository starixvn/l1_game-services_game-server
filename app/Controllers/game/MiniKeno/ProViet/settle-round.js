const settleBets = require("./settle-bets");
const Logger = require("./../../../../web/logger");

const settleRound = async (io, finish) => {    
    const kenoProVietData = io.kenoProViet;

    Logger.log(`received vietlott round ${finish.roundId} - current round ${kenoProVietData.roundId}`);

    if(finish.roundId == kenoProVietData.roundId)
    {
        io.kenoProViet.finished = true;
        io.kenoProViet.finishedRound = finish;
    }else{        
        await settleBets(io, finish);
    }
};

module.exports = (io, finish) => settleRound(io, finish).catch((err) => {
    Logger.logError(err);
});