const { uniqueNamesGenerator, colors } = require("unique-names-generator");
const animals = require("./name-dictionaries/animals");
const marvels = require("./name-dictionaries/marvels");
const fruits = require("./name-dictionaries/fruits");

let Chance = require("chance");
const chance = new Chance();

const generate = () => {
  const dictionaryArr = [colors, animals, marvels, fruits];

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