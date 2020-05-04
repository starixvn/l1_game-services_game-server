const notices = {
  cannotPlaceBet: "Không thể đặt cược vào lúc này.",
  placeBetNextRound: "Vui lòng đặt cược ở phiên sau.",
  placeBetFailure: "Cược thất bại...",
  minBet: (min) => `Tiền cược tối thiểu là ${min}`,
  maxBet: (max) => `Tiền cược tối đa là ${max}`,
  notEnoughMonney: "Bạn không có đủ tiền để cược.",
};

const historyPagination = {
  limit: 20
}

module.exports = {
  notices,
  historyPagination
};
