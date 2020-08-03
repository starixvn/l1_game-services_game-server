const Constants = require("./constants");

const standardizeBetChoice = (betChoice) => `-${betChoice}-`;

const matchExactly = (generatedNumber, betChoice) => generatedNumber.toString() === betChoice;

const checkIncluding = (generatedNumber, betChoice) => {
  const formattedGeneratedNumber = standardizeBetChoice(generatedNumber);
  const formattedBetChoice = standardizeBetChoice(betChoice);

  return formattedBetChoice.includes(formattedGeneratedNumber);
};

const checkBelongingColumn = (generatedNumber, betChoice) => {
  if (generatedNumber === 0) {
    return false;
  }

  const allColumns = ["first", "second", "third"];
  const belongingColumn = allColumns[generatedNumber % 3];

  return belongingColumn === betChoice.toLowerCase();
};

const checkBelongingDozen = (generatedNumber, betChoice) => {
  if (generatedNumber === 0) {
    return false;
  }

  const allDozens = ["first", "second", "third"];
  const belongingDozen = allDozens[~~((generatedNumber - 1) / 12)];

  return belongingDozen === betChoice.toLowerCase();
};

const checkRedBlack = (generatedNumber, betChoice) => {
  let correctBetChoice = "";

  if (Constants.numberWheel.red.indexOf(generatedNumber) !== -1) {
    correctBetChoice = "red";
  }

  if (Constants.numberWheel.black.indexOf(generatedNumber) !== -1) {
    correctBetChoice = "black";
  }

  return correctBetChoice === betChoice.toLowerCase();
};

const checkOddEven = (generatedNumber, betChoice) => {
  let correctBetChoice = "";

  if (generatedNumber !== 0) {
    correctBetChoice = generatedNumber % 2 === 0 ? "even" : "odd";
  }

  return correctBetChoice === betChoice.toLowerCase();
};

const checkBigSmall = (generatedNumber, betChoice) => {
  let correctBetChoice = "";

  if (generatedNumber !== 0) {
    correctBetChoice = generatedNumber > 18 ? "big" : "small";
  }

  return correctBetChoice === betChoice.toLowerCase();
};

module.exports = {
  straightUp: matchExactly,
  split: checkIncluding,
  street: checkIncluding,
  triangle: checkIncluding,
  corner: checkIncluding,
  fourNumbers: checkIncluding,
  line: checkIncluding,
  column: checkBelongingColumn,
  dozen: checkBelongingDozen,
  redBlack: checkRedBlack,
  oddEven: checkOddEven,
  bigSmall: checkBigSmall,
};
