const helpers = require("./../../Helpers/Helpers");

const chipsCount = {
  "1": 0,
  "5": 0,
  "10": 0,
  "50": 0,
  "100": 0,
  "200": 0,
  "500": 0,
  "1000": 0,
};

module.exports = {
  lockingBetDuration: 5,
  placingBetDuration: 30,
  roundDuration: 39,
  choices: [
    "big",
    "small",
    "odd",
    "even",
    "gold",
    "wood",
    "water",
    "fire",
    "earth",
  ],
  resetTotalBets: {
    big: 0,
    small: 0,
    odd: 0,
    even: 0,
    gold: 0,
    wood: 0,
    water: 0,
    fire: 0,
    earth: 0,
  },
  odds: {
    big: 1.97,
    small: 1.97,
    odd: 1.97,
    even: 1.97,
    gold: 9.2,
    wood: 4.6,
    water: 2.4,
    fire: 4.6,
    earth: 9.2,
  },
  notices: {
    placeBetNextRound: "Vui lòng đặt cược ở phiên sau.",
    minBet: (min) =>
      `Tiền cược tối thiểu là ${helpers.formatNumberWithComma(min)}`,
    maxBet: (max) =>
      `Tổng tiền cược tối đa ở phiên này là ${helpers.formatNumberWithComma(
        max
      )}`,
    notEnoughMoney: "Bạn không có đủ tiền để cược.",
    maxBetForChoice: (maxBetForChoice) =>
      `Tiền cược tối đa ở cửa này là ${helpers.formatNumberWithComma(
        maxBetForChoice
      )}`,
  },
  resetChips: {
    big: chipsCount,
    small: chipsCount,
    odd: chipsCount,
    even: chipsCount,
    gold: chipsCount,
    wood: chipsCount,
    water: chipsCount,
    fire: chipsCount,
    earth: chipsCount,
  },
};
