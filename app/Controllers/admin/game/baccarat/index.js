const config = require('../../../../../config/appConfigs');

module.exports = (client, data) => {
  if (data.view != null) {
    client.gameEvent.viewBaccarat = data.view;
  }

  if (data.sync != null) {
    const baccarat = client.redT.game.baccarat;
    const { remainingTime, roundId } = baccarat;

    client.red({ baccarat: { remainingTime, roundId } });
  }

  if (data.setResult != null && config.env !== 'PRO') {
    client.redT.game.baccarat.settlementResultFromAdmin = data.setResult;
  }
}