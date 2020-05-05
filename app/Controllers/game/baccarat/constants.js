const notices = {
  cannotPlaceBet: "Không thể đặt cược vào lúc này.",
  placeBetNextRound: "Vui lòng đặt cược ở phiên sau.",
  placeBetFailure: "Cược thất bại...",
  minBet: (min) => `Tiền cược tối thiểu là ${min}`,
  maxBet: (max) => `Tiền cược tối đa là ${max}`,
  notEnoughMonney: "Bạn không có đủ tiền để cược.",
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

const boxes = ['player', 'banker', 'big', 'small', 'tie'];

const queueProcessing = {
  timeout: 50
};

module.exports = {
  chips,
  boxes,
  times,
  notices,
  queueProcessing,
  userHistoryPagination
};
