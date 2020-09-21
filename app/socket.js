let first = require("./Controllers/User.js").first;
let onPost = require("./Controllers/onPost.js");
const baccaratPlayerHandler = require("./Controllers/game/baccarat/player-handler");
const removeRoulettePlayerOutOfRoom = require("./Controllers/game/Roulette/out-game");

let auth = async (client) => {
  client.gameEvent = {};
  client.scene = "home";
  await first(client);
};

let signMethod = function (client) {
  client.TTClear = function () {
    if (!!this.caothap) {
      clearTimeout(this.caothap.time);
      this.caothap.time = null;
      this.caothap = null;
    }

    if (this.redT) {
      let kenoProMax = this.redT.kenoProMax;
      if (kenoProMax.realPlayers[this.UID] || kenoProMax.players[this.UID]) {
        delete kenoProMax.realPlayers[this.UID];
        delete kenoProMax.players[this.UID];

        Object.values(kenoProMax.realPlayers).forEach((user) => {
          if (this !== user) {
            user.red({ kenoProMax: { outgame: { playerId: this.UID } } });
          }
        });
      }

      baccaratPlayerHandler.removeOutRoomUser(this, this.UID);
      removeRoulettePlayerOutOfRoom(this, true);

      delete this.redT;
    }

    this.TTClear = null;
  };
};

module.exports = {
  auth: auth,
  message: onPost,
  signMethod: signMethod,
};
