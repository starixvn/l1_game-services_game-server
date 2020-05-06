const logger = require("./../../../web/logger");

module.exports = (client) => {
  const kenoProMax = client.redT.kenoProMax;

  if (kenoProMax.clients[client.UID] === client) {
    delete kenoProMax.clients[client.UID];
    delete kenoProMax.players[client.UID];

    Object.values(kenoProMax.clients).forEach((users) => {
      if (client !== users) {
        users.red({ kenoProMax: { outgame: { playerId: client.UID } } });
      }
    });
  }
};
