const numberOfRows = 3;
const rowTopEdge = 2;
const rowBottomEdge = 0;
const columnLeftEdge = 0;
const columnRightEdge = 11;

const getPosition = (number) => ({
  x: ~~((number - 1) / numberOfRows),
  y: (number - 1) % numberOfRows,
});

const getNeighbors = (number) => {
  const position = getPosition(number);
  const neighbors = {};

  if (position.y < rowTopEdge) {
    neighbors.top = number + 1;

    if (position.x < columnRightEdge) {
      neighbors.topRight = number + 4;
    }
  }

  if (position.x < columnRightEdge) {
    neighbors.right = number + 3;
  }

  if (position.y > rowBottomEdge) {
    neighbors.bottom = number - 1;

    if (position.x < columnRightEdge) {
      neighbors.bottomRight = number + 2;
    }
  }

  if (position.x !== columnLeftEdge) {
    neighbors.left = number - 3;

    if (position.y < rowTopEdge) {
      neighbors.topLeft = number - 2;
    }

    if (position.y > rowBottomEdge) {
      neighbors.bottomLeft = number - 4;
    }
  }

  return neighbors;
};

const listWinningChoicesOfStraightUp = (number) => [number.toString()];

const listWinningChoicesOfSplit = (number, neighbors) => {
  if (neighbors) {
    const winningChoices = [];

    if (neighbors.left !== undefined) {
      winningChoices.push(`${neighbors.left}-${number}`);
    }

    if (neighbors.bottom !== undefined) {
      winningChoices.push(`${neighbors.bottom}-${number}`);
    }

    if (neighbors.top !== undefined) {
      winningChoices.push(`${number}-${neighbors.top}`);
    }

    if (neighbors.right !== undefined) {
      winningChoices.push(`${number}-${neighbors.right}`);
    }

    return winningChoices;
  }

  return ["0-1", "0-2", "0-3"];
};

const listWinningChoicesOfStreet = (number) => {
  if (number !== 0) {
    const position = getPosition(number);
    const firstNumberInStreet = number - position.y;
    const secondNumberInStreet = firstNumberInStreet + 1;
    const thirdNumberInStreet = secondNumberInStreet + 1;

    return [
      `${firstNumberInStreet}-${secondNumberInStreet}-${thirdNumberInStreet}`,
    ];
  }

  return [];
};

const listWinningChoicesOfTriangle = (number) => {
  if (number === 0) {
    return ["0-1-2", "0-2-3"];
  }

  return [];
};

const listWinningChoicesOfCorner = (number, neighbors) => {
  if (neighbors) {
    const winningChoices = [];

    if (neighbors.bottomLeft !== undefined && neighbors.bottomLeft !== 0) {
      winningChoices.push(
        `${neighbors.bottomLeft}-${neighbors.left}-${neighbors.bottom}-${number}`
      );
    }

    if (neighbors.topLeft !== undefined) {
      winningChoices.push(
        `${neighbors.left}-${neighbors.topLeft}-${number}-${neighbors.top}`
      );
    }

    if (neighbors.topRight !== undefined) {
      winningChoices.push(
        `${number}-${neighbors.top}-${neighbors.right}-${neighbors.topRight}`
      );
    }

    if (neighbors.bottomRight !== undefined) {
      winningChoices.push(
        `${neighbors.bottom}-${number}-${neighbors.bottomRight}-${neighbors.right}`
      );
    }

    return winningChoices;
  }

  return [];
};

const listWinningChoicesOfFourNumbers = (number) => {
  const availableNumbers = [0, 1, 2, 3];
  if (availableNumbers.includes(number)) {
    return [availableNumbers.join("-")];
  }

  return [];
};

const listWinningChoicesOfLine = (number, neighbors) => {
  if (number !== 0) {
    const street = listWinningChoicesOfStreet(number);
    let leftStreet = [];
    let rightStreet = [];
    const result = [];

    if (neighbors.left) {
      leftStreet = listWinningChoicesOfStreet(neighbors.left);
      result.push(`${leftStreet.join("-")}-${street.join("-")}`);
    }

    if (neighbors.right) {
      rightStreet = listWinningChoicesOfStreet(neighbors.right);
      result.push(`${street.join("-")}-${rightStreet.join("-")}`);
    }

    return result;
  }

  return [];
};

const listWinningChoicesOfColumn = (number) => {
  if (number !== 0) {
    const position = getPosition(number);
    const firstNumber = number - 3 * position.x;
    if (position.y == 0) {
      return ["1"];
    }
    if (position.y == 1) {
      return ["2"];
    }
    if (position.y == 2) {
      return ["3"];
    }
  }

  return [];
};

const listWinningChoicesOfDozen = (number) => {
  if (number !== 0) {
    if (number >= 1 && number <= 12) {
      return ["1"];
    }
    if (number >= 13 && number <= 24) {
      return ["2"];
    }
    if (number >= 25 && number <= 36) {
      return ["3"];
    }
  }

  return [];
};

const listWinningChoicesOfRedBlack = (number) => {
  if (number !== 0) {
    const redNumbers = [
      1,
      3,
      5,
      7,
      9,
      12,
      14,
      16,
      18,
      19,
      21,
      23,
      25,
      27,
      30,
      32,
      34,
      36,
    ];

    if (redNumbers.includes(number)) {
      return ["red"];
    }
    return ["black"];
  }

  return [];
};

const listWinningChoicesOfOddEven = (number) => {
  if (number % 2 === 0) {
    return ["even"];
  }

  return ["odd"];
};

const listWinningChoicesOfBigSmall = (number) => {
  if (number <= 18) {
    return ["small"];
  }

  return ["big"];
};

module.exports = (number) => {
  const neighbors = number > 0 ? getNeighbors(number) : null;

  return {
    straightUp: listWinningChoicesOfStraightUp(number),
    split: listWinningChoicesOfSplit(number, neighbors),
    street: listWinningChoicesOfStreet(number),
    triangle: listWinningChoicesOfTriangle(number),
    corner: listWinningChoicesOfCorner(number, neighbors),
    fourNumbers: listWinningChoicesOfFourNumbers(number),
    line: listWinningChoicesOfLine(number, neighbors),
    column: listWinningChoicesOfColumn(number),
    dozen: listWinningChoicesOfDozen(number),
    redBlack: listWinningChoicesOfRedBlack(number),
    oddEven: listWinningChoicesOfOddEven(number),
    bigSmall: listWinningChoicesOfBigSmall(number)
  };
};
