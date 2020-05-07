const logger = require("./../../../web/logger");

module.exports = (client) => {
  const kenoProMax = client.redT.kenoProMax;

  if (kenoProMax.clients[client.UID] === client) {
    delete kenoProMax.clients[client.UID];
    delete kenoProMax.players[client.UID];

    Object.values(kenoProMax.clients).forEach((joinedClient) => {
      if (client !== joinedClient) {
        joinedClient.red({ kenoProMax: { outgame: { playerId: client.UID } } });
      }
    });
  }
};
