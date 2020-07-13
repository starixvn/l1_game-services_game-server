const { uniqueNamesGenerator, colors } = require("unique-names-generator");
const animals = require("./name-dictionaries/animals");
const marvels = require("./name-dictionaries/marvels");
const fruits = require("./name-dictionaries/fruits");

let Chance = require("chance");
const chance = new Chance();

const generate = () => {
  const dictionaries = [colors, animals, marvels, fruits];

  const randomDictionaryIndex = chance.integer({ min: 0, max: 1 });
  const pickedDictionary = dictionaries[randomDictionaryIndex];
  const randomNumber = chance.integer({ min: 0, max: 9999 });

  const shortName = uniqueNamesGenerator({
    dictionaries: [pickedDictionary],
    separator: "",
    length: 1
  });

  return `${shortName}${randomNumber}`;
};

module.exports = generate;