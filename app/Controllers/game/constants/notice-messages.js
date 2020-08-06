const Helpers = require("./../../../Helpers/Helpers");

module.exports = {
  cannotPlaceBet: "Không thể đặt cược vào lúc này.",
  placeBetNextRound: "Vui lòng đặt cược ở phiên sau.",
  minBet: (min) => `Tiền cược tối thiểu là ${Helpers.formatNumberWithComma(min)}`,
  maxBet: (max) => `Tổng tiền cược tối đa ở phiên này là ${Helpers.formatNumberWithComma(max)}`,
  notEnoughMoney: "Bạn hiện không có đủ tiền để cược.",
  maxBetForChoice: (maxBetForChoice) => `Tiền cược tối đa ở cửa này là ${Helpers.formatNumberWithComma(maxBetForChoice)}`,
  maxBetOfAnyChoiceReached: "Tiền cược tối đa của một trong các lựa chọn vượt mức quy định.",
  invalidBetChoice: "Cửa cược không hợp lệ.",
  notice: "Thông báo",
  youOrOtherLoggedInToThisAccount: (game) => `Bạn hoặc ai đó đang chơi ${game} bằng tài khoản này.`,
  baccarat: "Baccarat",
};
