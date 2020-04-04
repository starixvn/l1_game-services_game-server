const lowercaseFirstCharacter = (req, _, next) => {
  const newBody = Object.keys(req.body).reduce((result, key) => {
    const newKey = key[0].toLowerCase() + key.substr(1);
    result[newKey] = req.body[key];

    return result;
  }, {});

  const newQuery = Object.keys(req.query).reduce((result, key) => {
    const newKey = key[0].toLowerCase() + key.substr(1);
    result[newKey] = req.query[key];

    return result;
  }, {});

  req.body = newBody;
  req.query = newQuery;
  next();
};

const toFixed = (value, number) => {
  const d = Math.pow(10, number);
  return (Math.round(value * d)) / d;
}

const errors = {
  SB1000: {
    errorCode: "SB1000",
    errorDescription: "An Error has occurred."
  },
  SB1001: {
    errorCode: "SB1001",
    errorDescription: "The game round does not exist."
  },
  SB1002: {
    errorCode: "SB1002",
    errorDescription: "Game round id is required."
  },
  SB1003: {
    errorCode: "SB1003",
    errorDescription: "Site Id is required."
  },
  SB1004: {
    errorCode: "SB1004",
    errorDescription: "ObCustId is required."
  },
  SB1005: {
    errorCode: "SB1005",
    errorDescription: "ObCustId is required."
  }
};

module.exports = { lowercaseFirstCharacter, errors, toFixed };
