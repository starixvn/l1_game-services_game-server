module.exports = {
  checkGamePermission: function (client, gameConfigs, gameName) {
    if (gameConfigs.siteExclusions?.some((x) => x === client.session.siteName)) {
      client.red({
        notPermittedToPlay: true,
        message: `Tài khoản của bạn hiện đang bị giới hạn với trò ${gameName}. Vui lòng thử các trò chơi khác.`,
      });
      
      return false;
    }

    return true;
  },
};
