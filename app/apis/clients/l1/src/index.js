const initAuth = require("./auth");
const initMember = require("./member");
const tokenExpired = 60000 * 5;

class GameClient {
  constructor(config) {
    this.config = config;
    this.auth = initAuth(this.config);
    this.member = initMember(this.config);
  }

  async autoUpdateToken() {
    const token = await this.auth.getBearerToken();
    this.config.token = token;
    this.member = initMember(this.config);
    this.auth = initAuth(this.config);

    this.interval = setInterval(() => {
      (async () => {
        const token = await this.auth.getBearerToken();
        this.config.token = token;
        this.member = initMember(this.config);
      })();
    }, this.config.tokenExpired || tokenExpired);
  }
}

module.exports = config => {
  if (config) {
    global._gameClient = new GameClient(config);
  }
  
  return global._gameClient;
};
