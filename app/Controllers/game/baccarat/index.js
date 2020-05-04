const joinRoom = require('./join-room');
const leaveRoom = require('./leave-room');
const placeBet = require('./place-bet');
const userHistory = require('./user-history');
const logger = require('./../../../web/logger');

module.exports = (client, data) => {
  try {
    if (!!data.ingame) {
      joinRoom(client);
    }
  
    if (!!data.outgame) {
      leaveRoom(client);
    }
  
    if (!!data.cuoc) {
      placeBet(client, data.cuoc);
    }
  
    if (!!data.log) {
      userHistory(client, data.log);
    }
  } catch (error) {
    logger.logError(error);
  }
}