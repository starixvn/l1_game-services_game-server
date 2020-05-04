module.exports = (client) => {
  const baccarat = client.redT.game.baccarat;

  if (baccarat.clients[client.UID] === client) {
    delete baccarat.clients[client.UID];
    delete baccarat.players[client.UID];

    Object.values(baccarat.clients).forEach((user) => {
      if (client !== user) {
        user.red({ baccarat: { outgame: { playerId: client.UID } } });
      }
    });
  }
};
