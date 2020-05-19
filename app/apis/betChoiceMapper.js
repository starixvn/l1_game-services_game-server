function convertBauCua(linhVat) {
  return linhVat + 1;
}

function convertTaiXiu(isTai) {
  return isTai ? 1 : 2;
}

function convertChanLe(isChan) {
  return isChan ? 1 : 2;
}

function convertXocXoc(choiceName) {
  if (choiceName == "chan") {
    return 1;
  }

  if (choiceName == "le") {
    return 2;
  }

  if (choiceName == "red3") {
    return 3;
  }

  if (choiceName == "red4") {
    return 4;
  }

  if (choiceName == "white3") {
    return 5;
  }

  if (choiceName == "white4") {
    return 6;
  }

  return 0;
}

function convertMiniDragonTiger(choiceName) {
  if (choiceName == "dragon") {
    return 1;
  }

  if (choiceName == "tiger") {
    return 2;
  }

  if (choiceName == "tie") {
    return 3;
  }

  return 0;
}

function convertKenoProMax(choiceName) {
  switch (choiceName) {
    case "big":
      return 1;
    case "small":
      return 2;
    case "odd":
      return 3;
    case "even":
      return 4;
    case "gold":
      return 5;
    case "wood":
      return 6;
    case "water":
      return 7;
    case "fire":
      return 8;
    case "earth":
      return 9;
    default:
      return 0;
  }
}

function convertMiniSedie(choiceName) {
  switch (choiceName) {
    case "even":
      return 1;
    case "odd":
      return 2;
    case "red3":
      return 3;
    case "red3":
      return 4;
    case "red2":
      return 5;
    case "white3":
      return 6;
    case "white4":
      return 7;
    default:
      return 0;
  }
}

module.exports = {
  convertBauCua,
  convertTaiXiu,
  convertXocXoc,
  convertChanLe,
  convertMiniDragonTiger,
  convertKenoProMax,
  convertMiniSedie,
};
