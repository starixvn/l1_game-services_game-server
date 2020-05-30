const constants = {
  betTime: 30,
  lockBet: 5,
  resetDataTime: 34,
  startCountDownTime: 45,
  getGameConfigTime: 44
};

const oddsInfo = {
  player: 2,
  banker: 1.95,
  tie: 9,
  big: 1.54,
  small: 2.5,
  playerPair: 12,
  bankerPair: 12
}

const userHistoryPagination = {
  limit: 20
}

const chips = [1, 5, 10, 50, 100, 200, 500];

const boxes = ['player', 'banker', 'big', 'small', 'tie', 'playerPair', 'bankerPair'];

const queueProcessing = {
  timeout: 50
};

module.exports = {
  chips,
  boxes,
  constants,
  queueProcessing,
  userHistoryPagination,
  oddsInfo,
};
