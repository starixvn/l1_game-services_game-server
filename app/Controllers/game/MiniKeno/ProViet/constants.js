module.exports = {
  durations: {
    wholeRound: 10 * 60,
    placingBets: 7 * 60,
    lockingBets: 3 * 60,
  },
  choices: ["big", "small", "odd", "even", "gold", "wood", "water", "fire", "earth"],
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
  maxRoundsToBet: 30,
};
