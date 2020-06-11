const settleBets = require("./settle-bets");
const Logger = require("./../../../../web/logger");

const settleRound = async (io, finish) => {    
    const kenoProVietData = io.kenoProViet;

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
    console.log(err);
});