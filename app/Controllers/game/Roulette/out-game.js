module.exports = (realPlayer) => {
  const rouletteData = realPlayer.redT.roulette;

  if (rouletteData.realPlayers[realPlayer.UID] === realPlayer) {
    delete rouletteData.realPlayers[realPlayer.UID];
    delete rouletteData.players[realPlayer.UID];

    Object.values(rouletteData.realPlayers).forEach((joinedPlayer) => {
      if (realPlayer !== joinedPlayer) {
        joinedPlayer.red({ roulette: { outgame: { playerId: realPlayer.UID } } });
      }
    });
  }
};
