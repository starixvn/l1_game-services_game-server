const { uniqueNamesGenerator, colors, animals, NumberDictionary } = require("unique-names-generator");

const generate = () => {
  const numberDictionary = NumberDictionary.generate({ min: 10, max: 999 });

  const shortName = uniqueNamesGenerator({
    dictionaries: [colors, animals, numberDictionary],
    separator: ""
  });

  return shortName; // big-donkey
};

module.exports = generate;
