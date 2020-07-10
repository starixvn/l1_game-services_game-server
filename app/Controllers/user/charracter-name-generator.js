const { uniqueNamesGenerator, colors, animals } = require("unique-names-generator");

let Chance = require("chance");
const chance = new Chance();

const generate = () => {
  const dictionaryArr = [colors, animals];

  const randomDictionaryIndex = chance.integer({ min: 0, max: 1 });
  const randomDictionary = dictionaryArr[randomDictionaryIndex];
  const randomNumber = chance.integer({ min: 0, max: 9999 });

  const shortName = uniqueNamesGenerator({
    dictionaries: [randomDictionary],
    separator: "",
    length: 1
  });

  return `${shortName}${randomNumber}`;
};

module.exports = generate;
