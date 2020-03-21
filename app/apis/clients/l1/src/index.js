const initAuth = require("./auth");
const initMember = require("./member");

const GameClient = config => {
  if(GameClient.config) {
    delete GameClient.config;
  }

  if(GameClient.instance) {
    delete GameClient.instance;
  }

  GameClient.config = config;
  GameClient.instance = {
    auth: initAuth(config),
    member: initMember(config)
  };

  return GameClient.instance;
};

module.exports = config => {
  if (config) {
    return GameClient(config);
  }

  return GameClient.instance;
};
