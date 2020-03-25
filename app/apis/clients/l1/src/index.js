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
    await this.updateToken();

    this.interval = setInterval(() => {
      (async () => {
        await this.updateToken();
      })();
    }, this.config.tokenExpired || tokenExpired);
  }

  async updateToken() {
    try {
      const token = await this.auth.getBearerToken();
      this.config.token = token;
      this.member = initMember(this.config);
      this.auth = initAuth(this.config);
    } catch (error) {
      console.log("Update bearer token error: " + error);
    }
  }
}

module.exports = config => {
  if (config) {
    global._gameClient = new GameClient(config);
  }

  return global._gameClient;
};
