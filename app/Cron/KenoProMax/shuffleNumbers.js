const Chance = require("chance");

const chance = new Chance();
const seeds = [...Array(81).keys()].slice(1);

const shuffleThenPickOut20 = () => {
  return chance.pickset(seeds, 20);
};

const random20UniqueNumbers = () => {
  return chance.unique(chance.natural, 20, { min: 1, max: 80 });
};

const algorithms = [shuffleThenPickOut20, random20UniqueNumbers];

module.exports = () => {
  const randomSelection = chance.natural({
    min: 0,
    max: algorithms.length - 1,
  });
  let result = algorithms[randomSelection]();

  result.sort((pre, next) => pre - next);

  return result;
};
