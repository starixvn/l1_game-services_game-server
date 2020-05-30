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

const notices = {
  title: 'Thông báo',
  cannotPlaceBet: 'Không thể đặt cược vào lúc này.',
  placeBetNextRound: 'Vui lòng đặt cược ở phiên sau.',
  placeBetFailure: 'Cược thất bại...',
  minBet: (min) => `Tiền cược tối thiểu là ${min}.`,
  maxBet: (max) => `Tiền cược tối đa là ${max}.`,
  notEnoughMonney: 'Bạn không có đủ tiền để cược.',
  maxBetOfThisChoice: (max) => `Tiền cược tối đa ở cửa này là ${max}.`,
  youOrOtherLoggedInToThisAccount: 'Bạn hoặc ai đó đang chơi Baccarat bằng tài khoản này.',
  umMessage: 'Game đang được bảo trì, vui lòng quay lại sau 10 phút.'
};

const userHistoryPagination = {
  limit: 20
}

const chips = [1, 5, 10, 50, 100, 200, 500];

const boxes = ['player', 'banker', 'big', 'small', 'tie', 'playerPair', 'bankerPair'];

const getMaxBetPerChoice = (choices, max) => choices.reduce((result, box) => {
  result[box] = max;

  return result;
}, {});

const maxBetPerChoice = {
  ...getMaxBetPerChoice(['player', 'banker', 'big', 'small'], 500),
  ...getMaxBetPerChoice(['tie', 'playerPair', 'bankerPair'], 200)
}

const queueProcessing = {
  timeout: 50
};

module.exports = {
  chips,
  boxes,
  constants,
  notices,
  queueProcessing,
  userHistoryPagination,
  maxBetPerChoice,
  oddsInfo
};
