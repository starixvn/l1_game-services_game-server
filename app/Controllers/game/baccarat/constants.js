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

const times = {
  betTime: 30,
  resetDataTime: 34,
  lockBetTime: 5
}

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
  times,
  notices,
  queueProcessing,
  userHistoryPagination,
  maxBetPerChoice
};
