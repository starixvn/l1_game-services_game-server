module.exports = {
  checkGamePermission: function (client, gameConfigs, gameId) {
    if (gameConfigs.siteExclusions?.some((x) => x === client.session.siteName)) {
      client.red({
        notPermittedToPlay: true,
        gameId
      });
      
      return false;
    }

    return true;
  },
};
